import type { SVGProps } from "react";

/**
 * SNSのブランドアイコン。
 * lucide-react v1 からブランドアイコンが除外されたため、軽量なインラインSVGで実装しています。
 */
type IconProps = SVGProps<SVGSVGElement>;

export function InstagramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M15.5 3.5h-2A3.5 3.5 0 0 0 10 7v2.5H7.5v3H10V21h3v-8.5h2.5l.5-3H13V7a.5.5 0 0 1 .5-.5h2z" />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M4 4l7.2 9.4L4.4 20" />
      <path d="M20 20l-7.2-9.4L19.6 4" />
    </svg>
  );
}
