/**
 * ライセンスバッジ。
 * 一覧・管理画面で、ライセンスの性質をひと目で判別するために使います。
 */
import { getLicense } from "../lib/license";
import type { LicenseCode } from "../types";

const toneByCode = (code: LicenseCode): string => {
  const license = getLicense(code);
  if (license.isPublicDomain)
    return "border-media-emerald/45 bg-media-emerald/12 text-media-emerald";
  if (!license.autoUsable) return "border-media-danger/45 bg-media-danger/12 text-media-danger";
  if (license.shareAlikeRequired) return "border-media-amber/45 bg-media-amber/12 text-media-amber";
  return "border-media-cyan/45 bg-media-cyan/12 text-media-cyan";
};

export function ImageLicenseBadge({ code, className }: { code: LicenseCode; className?: string }) {
  const license = getLicense(code);
  return (
    <span
      className={[
        "inline-flex items-center rounded border px-1.5 py-px text-[0.64rem] font-medium",
        toneByCode(code),
        className ?? "",
      ].join(" ")}
      // ライセンスの正式名称は翻訳しません
      translate="no"
      title={license.url || undefined}
    >
      {license.name}
    </span>
  );
}
