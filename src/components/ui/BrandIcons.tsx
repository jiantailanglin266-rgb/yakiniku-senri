import type { HTMLAttributes, SVGProps } from "react";
import { cn } from "@/lib/utils";

/**
 * SNSのブランドアイコン（ブランドカラー）。
 * lucide-react v1 からブランドアイコンが除外されたため、軽量なインラインSVGで実装しています。
 *
 * 色は各社のブランドカラーを内部で直接指定しているため、
 * 親要素の text-* （currentColor）の影響を受けません。
 */
type IconProps = SVGProps<SVGSVGElement>;

/**
 * Instagram。
 * 公式ロゴのグラデーションは CSS（.icon-instagram）で描き、カメラの輪郭を mask で抜いています。
 * SVG の <linearGradient id> を使うと、ヘッダー・フッター・モバイルナビのように
 * 同一ページへ複数置いたときに id が重複するため、この方式にしています。
 */
export function InstagramIcon({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span {...props} className={cn("icon-instagram", className)} />;
}

/** Facebook。ブランドブルーの円に白抜きの f。 */
export function FacebookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path
        fill="#ffffff"
        transform="translate(5.76 4) scale(0.039)"
        d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"
      />
    </svg>
  );
}

/**
 * X（旧Twitter）。
 * ブランドカラーは黒ですが、本サイトは黒地のため、
 * 公式ガイドラインどおり暗い背景用の白ロゴを使用します。
 */
export function XIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="#ffffff"
        transform="scale(0.0469)"
        d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"
      />
    </svg>
  );
}
