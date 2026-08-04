import { SenriShell } from "@/components/layout/SenriShell";

/**
 * 焼肉 千里 のレイアウト。
 * ルートグループ `(senri)` はURLに現れないため、既存のURLは変わりません。
 */
export default function SenriLayout({ children }: { children: React.ReactNode }) {
  return <SenriShell>{children}</SenriShell>;
}
