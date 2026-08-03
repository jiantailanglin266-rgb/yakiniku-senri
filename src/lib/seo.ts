import type { Metadata } from "next";
import { siteName, siteUrl } from "@/data/site";
import { store } from "@/data/store";

export const defaultDescription = `${store.founded}年創業、東京都世田谷区上馬の老舗焼肉店「${store.name}」。先代より受け継いだ門外不出の秘伝のタレをもみ込んだ名物「もみシリーズ」をはじめ、当店でしか味わえない逸品をご用意しています。ご予約はお電話にて承ります。`;

type PageMetaInput = {
  title: string;
  description: string;
  /** 先頭スラッシュ付きのパス（例: /menu） */
  path: string;
  /** OGP画像（省略時は共通OGP） */
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
};

export function pageMetadata({
  title,
  description,
  path,
  image = "/images/common/ogp.png",
  type = "website",
  publishedTime,
}: PageMetaInput): Metadata {
  const url = `${siteUrl}${path === "/" ? "" : path}`;
  const fullTitle = path === "/" ? title : `${title} | ${siteName}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type,
      url,
      siteName,
      title: fullTitle,
      description,
      locale: "ja_JP",
      images: [{ url: image, width: 1200, height: 630, alt: siteName }],
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
  };
}
