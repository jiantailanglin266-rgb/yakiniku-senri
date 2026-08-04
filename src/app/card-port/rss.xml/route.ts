/** RSS（日本語のニュース） */
import { brand } from "@/cardport/config/site";
import { buildRssXml } from "@/cardport/lib/feeds";
import { ja } from "@/cardport/i18n";

export const dynamic = "force-static";

export function GET() {
  return new Response(buildRssXml(brand.name, ja.hero.subtitle, "ja"), {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
