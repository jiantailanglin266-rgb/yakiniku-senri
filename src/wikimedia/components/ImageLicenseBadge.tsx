/**
 * ライセンスの短い表示。
 *
 * ■ これは「クレジット」ではありません
 *   バッジだけでは作者も出典も分かりません。
 *   ImageAttribution の代わりに使ってはいけません（併記のための補助表示です）。
 *   そのため、このコンポーネントは WikimediaImage の内部からは呼びません。
 */
import type { LicenseCode } from "../types";
import { licensePolicies } from "../licenses";

const tone: Partial<Record<LicenseCode, string>> = {
  PD: "text-emerald border-emerald/40",
  CC0: "text-emerald border-emerald/40",
};

export function ImageLicenseBadge({
  code,
  className = "",
}: {
  code: LicenseCode;
  className?: string;
}) {
  const policy = licensePolicies[code] ?? licensePolicies.UNKNOWN;
  const color = tone[code] ?? "text-cyan border-cyan/40";

  return (
    <span
      className={`sp-mono inline-block rounded border px-1.5 py-0.5 text-[0.625rem] ${color} ${className}`}
      // ライセンス名は原文のまま表示します
      translate="no"
      title={policy.name}
    >
      {code}
    </span>
  );
}
