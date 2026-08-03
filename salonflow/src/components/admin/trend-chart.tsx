"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * 30-day booking and sales trend.
 *
 * Sales are omitted entirely — not merely hidden — when the viewer lacks
 * `sales.read`, so the figures never reach the browser.
 */
export function TrendChart({
  data,
  showSales,
}: {
  data: Array<{ dateISO: string; appointments: number; sales: number | null }>;
  showSales: boolean;
}) {
  const series = data.map((entry) => ({
    label: entry.dateISO.slice(5),
    appointments: entry.appointments,
    sales: entry.sales ?? 0,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="appointmentsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "var(--color-ink-subtle)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--color-border)" }}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--color-ink-subtle)" }}
            tickLine={false}
            axisLine={false}
            width={40}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--color-ink)",
            }}
          />
          <Area
            type="monotone"
            dataKey="appointments"
            name="予約件数"
            stroke="var(--color-accent)"
            strokeWidth={2}
            fill="url(#appointmentsFill)"
          />
          {showSales ? (
            <Line
              type="monotone"
              dataKey="sales"
              name="売上"
              stroke="var(--color-positive)"
              strokeWidth={1.5}
              dot={false}
              yAxisId={0}
            />
          ) : null}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
