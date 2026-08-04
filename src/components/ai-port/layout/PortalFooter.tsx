import Link from "next/link";
import { aiMainNav, aiSecondaryNav, aiUtilityNav } from "@/data/ai-port/navigation";
import {
  aiPortDescription,
  aiPortDisclaimer,
  aiPortName,
  aiPortPath,
  aiPortSocials,
  aiPortTagline,
} from "@/data/ai-port/site";
import { topicGroups, topics } from "@/data/ai-port/taxonomy";
import { PortalLogo } from "./PortalLogo";

/**
 * AI PORT のフッター。
 *
 * ■ フッターは内部リンクの主戦場
 *   すべてのトピックハブへの導線をここに置きます。
 *   クローラーがどのページからでも全カテゴリーへ到達でき、
 *   生成AIがサイト構造を把握しやすくなります（LLMO）。
 */
export function PortalFooter() {
  return (
    <footer className="relative mt-24 border-t border-white/8 pt-16 pb-28 lg:pb-16">
      <div className="mx-auto max-w-[88rem] px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <div>
            <div className="flex items-center gap-2.5">
              <PortalLogo className="h-9" />
              <div>
                <p className="font-ai-display text-ai-white text-[1.05rem] leading-none font-semibold tracking-[0.14em]">
                  AI PORT
                </p>
                <p className="text-ai-dim mt-1.5 text-[0.68rem]">{aiPortTagline}</p>
              </div>
            </div>

            <p className="text-ai-haze mt-6 max-w-md text-[0.8rem] leading-[1.95]">
              {aiPortDescription}
            </p>

            {aiPortSocials.length > 0 ? (
              <ul className="mt-6 flex flex-wrap gap-2">
                {aiPortSocials.map((social) => (
                  <li key={social.id}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ai-mist hover:text-ai-cyan inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[0.75rem] transition-colors hover:border-white/25"
                    >
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <FooterColumn title="コンテンツ" items={aiMainNav} />
            <FooterColumn title="その他" items={[...aiSecondaryNav, ...aiUtilityNav]} />

            <div>
              <h2 className="font-ai-mono text-ai-dim text-[0.62rem] tracking-[0.24em] uppercase">
                Topics
              </h2>
              <div className="mt-4 space-y-4">
                {topicGroups.map((group) => (
                  <div key={group.id}>
                    <p className="text-ai-haze text-[0.7rem]">{group.label}</p>
                    <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1.5">
                      {topics
                        .filter((topic) => topic.group === group.id)
                        .map((topic) => (
                          <li key={topic.slug}>
                            <Link
                              href={aiPortPath(`/topics/${topic.slug}`)}
                              className="text-ai-mist hover:text-ai-cyan text-[0.76rem] transition-colors"
                            >
                              {topic.name}
                            </Link>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-white/8 pt-7">
          <p className="text-ai-dim text-[0.72rem] leading-[1.95]">{aiPortDisclaimer}</p>
          <p className="text-ai-dim mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.7rem]">
            <span>
              © {new Date().getFullYear()} {aiPortName}
            </span>
            <Link href="/" className="hover:text-ai-mist transition-colors">
              運営元サイトへ
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: { href: string; label: string }[];
}) {
  return (
    <div>
      <h2 className="font-ai-mono text-ai-dim text-[0.62rem] tracking-[0.24em] uppercase">
        {title}
      </h2>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="text-ai-mist hover:text-ai-cyan text-[0.8rem] transition-colors"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
