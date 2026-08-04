/** ニュースサイトマップ（Google News の仕様に合わせ、直近2日分のみ） */
import { brand } from "@/cardport/config/site";
import { buildNewsSitemapXml } from "@/cardport/lib/feeds";

export const dynamic = "force-static";

export function GET() {
  return new Response(buildNewsSitemapXml(brand.name), {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
