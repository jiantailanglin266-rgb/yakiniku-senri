/** 動画サイトマップ */
import { buildVideoSitemapXml } from "@/cardport/lib/feeds";

export const dynamic = "force-static";

export function GET() {
  return new Response(buildVideoSitemapXml(), {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
