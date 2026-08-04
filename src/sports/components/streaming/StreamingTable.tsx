/**
 * 配信サービス比較表。
 *
 * 「情報確認日」を各行に必ず出します。
 * 料金・放映権・配信対象は変わるため、確認日のない比較表は判断材料になりません。
 */
import type { StreamingService } from "../../types";
import { getDictionary, text } from "../../i18n";
import { formatPriceJpy } from "../../lib/format";
import { getSport } from "../../data/sports";
import { getLeague } from "../../data/leagues";
import { resolveAffiliateUrl } from "../../data/content";
import { Badge, OutboundLink } from "../ui/primitives";

const deviceLabel: Record<string, { ja: string; en: string }> = {
  phone: { ja: "スマホ", en: "Phone" },
  pc: { ja: "PC", en: "PC" },
  tv: { ja: "テレビ", en: "TV" },
  console: { ja: "ゲーム機", en: "Console" },
};

export function StreamingTable({
  services,
  locale,
  placement = "streaming-compare",
}: {
  services: StreamingService[];
  locale: string;
  placement?: string;
}) {
  const dict = getDictionary(locale);

  return (
    <div className="space-y-4">
      <p className="border-caution/40 bg-caution/10 text-caution rounded-lg border p-3 text-xs leading-relaxed">
        {dict.streamingNote}
      </p>

      <div className="sp-scroll-x border-edge rounded-xl border">
        <table className="w-full min-w-[62rem] text-sm">
          <caption className="sr-only">{dict.sectionStreaming}</caption>
          <thead>
            <tr className="border-edge text-ink-faint border-b text-[0.6875rem]">
              <th scope="col" className="px-3 py-3 text-left font-normal">
                {locale === "ja" ? "サービス" : "Service"}
              </th>
              <th scope="col" className="px-3 py-3 text-left font-normal">
                {locale === "ja" ? "対象競技・リーグ" : "Covers"}
              </th>
              <th scope="col" className="px-3 py-3 text-right font-normal">
                {dict.monthlyPrice}
              </th>
              <th scope="col" className="px-3 py-3 text-right font-normal">
                {dict.yearlyPrice}
              </th>
              <th scope="col" className="px-3 py-3 text-right font-normal">
                {dict.freeTrial}
              </th>
              <th scope="col" className="px-3 py-3 text-left font-normal">
                {dict.quality}
              </th>
              <th scope="col" className="px-3 py-3 text-left font-normal">
                {dict.devices}
              </th>
              <th scope="col" className="px-3 py-3 text-right font-normal">
                {dict.simultaneous}
              </th>
              <th scope="col" className="px-3 py-3 text-center font-normal">
                {dict.japaneseCommentary}
              </th>
              <th scope="col" className="px-3 py-3 text-center font-normal">
                {dict.overseasViewing}
              </th>
              <th scope="col" className="px-3 py-3 text-left font-normal">
                {dict.verifiedAt}
              </th>
              <th scope="col" className="px-3 py-3 text-left font-normal">
                <span className="sr-only">{dict.ctaOfficialSite}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => {
              const url = resolveAffiliateUrl(service.affiliateId, locale) ?? service.officialUrl;
              const sponsored = Boolean(service.affiliateId);
              return (
                <tr
                  key={service.id}
                  id={service.slug}
                  className="border-edge/60 hover:bg-edge/20 border-b align-top last:border-0"
                >
                  <th scope="row" className="text-ink px-3 py-3 text-left font-semibold">
                    {service.name}
                    <span className="text-ink-faint mt-1 block text-[0.6875rem] font-normal">
                      {text(service.notes, locale)}
                    </span>
                  </th>
                  <td className="px-3 py-3">
                    <span className="flex flex-wrap gap-1">
                      {service.sportIds.slice(0, 4).map((id) => {
                        const sport = getSport(id);
                        return sport ? (
                          <span
                            key={id}
                            className="sp-mono text-[0.625rem]"
                            style={{ color: sport.accent }}
                          >
                            {sport.glyph}
                          </span>
                        ) : null;
                      })}
                    </span>
                    <span className="text-ink-dim mt-1 block text-[0.6875rem]">
                      {service.leagueIds
                        .slice(0, 4)
                        .map((id) => getLeague(id)?.shortName)
                        .filter(Boolean)
                        .join(" / ")}
                    </span>
                  </td>
                  <td className="sp-mono text-ink px-3 py-3 text-right">
                    {formatPriceJpy(service.monthlyPriceJpy, locale)}
                  </td>
                  <td className="sp-mono text-ink-soft px-3 py-3 text-right">
                    {formatPriceJpy(service.yearlyPriceJpy, locale)}
                  </td>
                  <td className="sp-mono text-ink-soft px-3 py-3 text-right">
                    {service.freeTrialDays
                      ? `${service.freeTrialDays}${locale === "ja" ? "日" : "d"}`
                      : "—"}
                  </td>
                  <td className="sp-mono text-ink-soft px-3 py-3">{service.maxQuality}</td>
                  <td className="text-ink-soft px-3 py-3 text-[0.6875rem]">
                    {service.devices.map((device) => text(deviceLabel[device], locale)).join(" / ")}
                  </td>
                  <td className="sp-mono text-ink-soft px-3 py-3 text-right">
                    {service.simultaneousStreams ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {service.japaneseCommentary ? (
                      <span className="text-neon">✓</span>
                    ) : (
                      <span className="text-ink-faint">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center text-[0.6875rem]">
                    {service.overseasViewing === "yes" ? (
                      <span className="text-neon">{locale === "ja" ? "可" : "Yes"}</span>
                    ) : service.overseasViewing === "no" ? (
                      <span className="text-ink-faint">{locale === "ja" ? "不可" : "No"}</span>
                    ) : (
                      <span className="text-caution">{locale === "ja" ? "要確認" : "Check"}</span>
                    )}
                  </td>
                  <td className="sp-mono text-ink-faint px-3 py-3 text-[0.6875rem]">
                    {service.verifiedAt}
                  </td>
                  <td className="px-3 py-3">
                    <OutboundLink
                      url={url}
                      sponsored={sponsored}
                      campaign="streaming-compare"
                      placement={placement}
                      locale={locale}
                      className="border-edge text-ink-soft hover:border-cyan/60 hover:text-cyan border whitespace-nowrap"
                    >
                      {dict.ctaOfficialSite}
                    </OutboundLink>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-ink-faint text-[0.6875rem]">
        {dict.affiliateDisclosure}
        {orderingNote(locale)}
      </p>
    </div>
  );
}

function orderingNote(locale: string): string {
  return locale === "ja"
    ? "　掲載順は編集部の判断によるもので、報酬額では決めていません。"
    : " Ordering is editorial and not determined by commission.";
}

/** 試合ページなどで使う、コンパクトな視聴導線 */
export function WatchOptions({
  services,
  locale,
  placement,
}: {
  services: StreamingService[];
  locale: string;
  placement: string;
}) {
  const dict = getDictionary(locale);

  if (services.length === 0) {
    return <p className="text-ink-dim text-sm">{dict.noBroadcast}</p>;
  }

  return (
    <ul className="space-y-2">
      {services.map((service) => {
        const url = resolveAffiliateUrl(service.affiliateId, locale) ?? service.officialUrl;
        return (
          <li
            key={service.id}
            className="border-edge flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2.5"
          >
            <span className="min-w-0">
              <span className="text-ink block truncate text-sm">{service.name}</span>
              <span className="sp-mono text-ink-faint block text-[0.625rem]">
                {formatPriceJpy(service.monthlyPriceJpy, locale)}
                {service.freeTrialDays
                  ? ` · ${dict.freeTrial} ${service.freeTrialDays}${locale === "ja" ? "日" : "d"}`
                  : ""}
                {` · ${dict.verifiedAt} ${service.verifiedAt}`}
              </span>
            </span>
            <span className="flex items-center gap-2">
              {service.live ? <Badge tone="accent">LIVE</Badge> : null}
              <OutboundLink
                url={url}
                sponsored={Boolean(service.affiliateId)}
                campaign="match-watch"
                placement={placement}
                locale={locale}
                className="border-edge text-ink-soft hover:border-cyan/60 hover:text-cyan border text-xs whitespace-nowrap"
              >
                {dict.ctaOfficialSite}
              </OutboundLink>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
