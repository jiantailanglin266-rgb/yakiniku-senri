/**
 * Turns a requested basket of services into the exact blocks of staff time and
 * resource time an appointment will consume.
 *
 * The reason this is its own module: a salon service is not one continuous
 * block. A colour service typically runs
 *
 *     apply (staff + chair) -> process (chair only) -> finish (staff + chair)
 *
 * so the stylist is free during processing and can serve another customer,
 * while the chair stays occupied. Modelling that correctly is what lets a
 * salon book at realistic density instead of blocking a stylist for 90
 * minutes they are not actually working.
 *
 * All offsets are minutes relative to the customer-facing start time.
 * Everything here is pure arithmetic — no dates, no I/O.
 */

export interface ServiceSpec {
  serviceId: string;
  name: string;
  price: number;
  durationMinutes: number;
  prepMinutes: number;
  cleanupMinutes: number;
  /** Offset within the service where staff attention is not required. */
  unattendedStartMinute?: number | null;
  unattendedMinutes?: number | null;
  resources: ReadonlyArray<{
    resourceTypeId: string;
    quantity: number;
    holdsDuringUnattended: boolean;
  }>;
  options?: ReadonlyArray<{
    serviceOptionId: string;
    name: string;
    price: number;
    durationMinutes: number;
  }>;
}

export interface OffsetSegment {
  /** Minutes from the appointment's customer-facing start. May be negative. */
  startOffset: number;
  endOffset: number;
  serviceId: string;
  sequence: number;
}

export interface ResourceSegment extends OffsetSegment {
  resourceTypeId: string;
  quantity: number;
}

export interface ServiceWindow {
  serviceId: string;
  sequence: number;
  startOffset: number;
  endOffset: number;
  name: string;
  price: number;
  durationMinutes: number;
}

export interface OccupancyPlan {
  /** Customer-facing length: from arrival to leaving. */
  customerMinutes: number;
  /** Blocks during which the assigned staff member is unavailable to others. */
  staffSegments: OffsetSegment[];
  /** Blocks during which each resource type is held. */
  resourceSegments: ResourceSegment[];
  /** Per-service windows, used to write AppointmentService rows. */
  serviceWindows: ServiceWindow[];
  /** Earliest offset touched, i.e. `-prepMinutes` of the first service. */
  minOffset: number;
  /** Latest offset touched, including cleanup and the trailing buffer. */
  maxOffset: number;
  /** Sum of list prices, before discounts. */
  subtotal: number;
}

export interface OccupancyOptions {
  /**
   * Per-staff speed multiplier in basis points. 10000 = standard duration,
   * 12000 = this staff member takes 20% longer (e.g. a trainee).
   */
  durationFactorBps?: number;
  /** Store-wide gap enforced after every appointment. */
  bufferMinutes?: number;
}

/**
 * Scale a duration by a basis-point factor, rounding up so a slower staff
 * member is never under-booked.
 */
function scaleDuration(minutes: number, factorBps: number): number {
  if (factorBps === 10_000) return minutes;
  return Math.ceil((minutes * factorBps) / 10_000);
}

export function buildOccupancyPlan(
  services: readonly ServiceSpec[],
  options: OccupancyOptions = {},
): OccupancyPlan {
  const factorBps = options.durationFactorBps ?? 10_000;
  const bufferMinutes = options.bufferMinutes ?? 0;

  const staffSegments: OffsetSegment[] = [];
  const resourceSegments: ResourceSegment[] = [];
  const serviceWindows: ServiceWindow[] = [];

  let cursor = 0;
  let subtotal = 0;
  let minOffset = 0;
  let maxOffset = 0;

  services.forEach((service, index) => {
    const optionMinutes = (service.options ?? []).reduce(
      (total, option) => total + option.durationMinutes,
      0,
    );
    const optionPrice = (service.options ?? []).reduce((total, option) => total + option.price, 0);

    const duration = scaleDuration(service.durationMinutes + optionMinutes, factorBps);
    const prep = scaleDuration(service.prepMinutes, factorBps);
    const cleanup = scaleDuration(service.cleanupMinutes, factorBps);

    const serviceStart = cursor;
    const serviceEnd = cursor + duration;

    subtotal += service.price + optionPrice;

    serviceWindows.push({
      serviceId: service.serviceId,
      sequence: index,
      startOffset: serviceStart,
      endOffset: serviceEnd,
      name: service.name,
      price: service.price + optionPrice,
      durationMinutes: duration,
    });

    // --- Staff occupancy ---------------------------------------------------
    const staffFrom = serviceStart - prep;
    const staffTo = serviceEnd + cleanup;

    const unattended = resolveUnattended(service, duration, factorBps);

    if (unattended) {
      const gapStart = serviceStart + unattended.start;
      const gapEnd = gapStart + unattended.length;
      pushSegment(staffSegments, staffFrom, gapStart, service.serviceId, index);
      pushSegment(staffSegments, gapEnd, staffTo, service.serviceId, index);
    } else {
      pushSegment(staffSegments, staffFrom, staffTo, service.serviceId, index);
    }

    // --- Resource occupancy ------------------------------------------------
    for (const requirement of service.resources) {
      if (requirement.quantity <= 0) continue;

      if (unattended && !requirement.holdsDuringUnattended) {
        const gapStart = serviceStart + unattended.start;
        const gapEnd = gapStart + unattended.length;
        pushResourceSegment(
          resourceSegments,
          serviceStart,
          gapStart,
          service.serviceId,
          index,
          requirement.resourceTypeId,
          requirement.quantity,
        );
        pushResourceSegment(
          resourceSegments,
          gapEnd,
          serviceEnd,
          service.serviceId,
          index,
          requirement.resourceTypeId,
          requirement.quantity,
        );
      } else {
        // The chair is still occupied while the customer waits.
        pushResourceSegment(
          resourceSegments,
          serviceStart,
          serviceEnd,
          service.serviceId,
          index,
          requirement.resourceTypeId,
          requirement.quantity,
        );
      }
    }

    minOffset = Math.min(minOffset, staffFrom);
    maxOffset = Math.max(maxOffset, staffTo);
    cursor = serviceEnd;
  });

  // The buffer extends the staff member's unavailability, not the customer's
  // appointment: the customer leaves on time, the stylist gets a gap.
  if (bufferMinutes > 0 && staffSegments.length > 0) {
    const last = staffSegments[staffSegments.length - 1];
    if (last) {
      last.endOffset += bufferMinutes;
      maxOffset = Math.max(maxOffset, last.endOffset);
    }
  }

  return {
    customerMinutes: cursor,
    staffSegments,
    resourceSegments,
    serviceWindows,
    minOffset,
    maxOffset,
    subtotal,
  };
}

function resolveUnattended(
  service: ServiceSpec,
  scaledDuration: number,
  factorBps: number,
): { start: number; length: number } | null {
  const rawStart = service.unattendedStartMinute;
  const rawLength = service.unattendedMinutes;
  if (rawStart === null || rawStart === undefined) return null;
  if (rawLength === null || rawLength === undefined || rawLength <= 0) return null;

  const start = scaleDuration(rawStart, factorBps);
  const length = scaleDuration(rawLength, factorBps);

  // An unattended window that would run past the end of the service is not
  // meaningful; treat the service as fully attended rather than guessing.
  if (start <= 0 || start + length >= scaledDuration) return null;

  return { start, length };
}

function pushSegment(
  target: OffsetSegment[],
  startOffset: number,
  endOffset: number,
  serviceId: string,
  sequence: number,
): void {
  if (endOffset <= startOffset) return;
  target.push({ startOffset, endOffset, serviceId, sequence });
}

function pushResourceSegment(
  target: ResourceSegment[],
  startOffset: number,
  endOffset: number,
  serviceId: string,
  sequence: number,
  resourceTypeId: string,
  quantity: number,
): void {
  if (endOffset <= startOffset) return;
  target.push({ startOffset, endOffset, serviceId, sequence, resourceTypeId, quantity });
}

/**
 * Merge adjacent staff segments that touch, so a two-service booking with no
 * unattended window produces one row rather than two abutting ones.
 */
export function compactSegments(segments: readonly OffsetSegment[]): OffsetSegment[] {
  const sorted = [...segments].sort((a, b) => a.startOffset - b.startOffset);
  const result: OffsetSegment[] = [];

  for (const segment of sorted) {
    const last = result[result.length - 1];
    if (last && segment.startOffset <= last.endOffset) {
      last.endOffset = Math.max(last.endOffset, segment.endOffset);
    } else {
      result.push({ ...segment });
    }
  }

  return result;
}
