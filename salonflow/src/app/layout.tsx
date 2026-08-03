import type { Metadata, Viewport } from "next";

import { productName } from "@/config/product";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: productName(),
    template: `%s | ${productName()}`,
  },
  description: "サロン向け統合業務管理システム。予約・顧客・カルテ・会計・分析をひとつに。",
  // The admin surface and demo booking pages must never be indexed.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
