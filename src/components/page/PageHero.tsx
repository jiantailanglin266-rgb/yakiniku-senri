import { Figure } from "@/components/ui/Figure";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Reveal } from "@/components/ui/Reveal";
import { SmokeLayer } from "@/components/effects/SmokeLayer";
import type { Media } from "@/data/media";
import type { Crumb } from "@/lib/structured-data";

type Props = {
  en: string;
  ja: string;
  lead?: string;
  image?: Media;
  crumbs: Crumb[];
};

/**
 * 下層ページ共通のヒーロー。
 * 暗い画像 + 金色の線 + 薄い煙で、トップページと同じ世界観を保ちます。
 */
export function PageHero({ en, ja, lead, image, crumbs }: Props) {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-20">
      {image ? (
        <div aria-hidden="true" className="absolute inset-0">
          <Figure media={image} className="h-full w-full" sizes="100vw" priority plain />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(8,8,8,0.94) 0%, rgba(8,8,8,0.78) 45%, rgba(8,8,8,0.96) 100%)",
            }}
          />
        </div>
      ) : null}
      <SmokeLayer className="opacity-60" />

      <div className="relative mx-auto max-w-[100rem] px-5 sm:px-8">
        <Breadcrumbs crumbs={crumbs} />

        <Reveal delay={60}>
          <p className="font-display text-gold mt-9 text-[0.7rem] tracking-[0.46em] uppercase sm:text-xs">
            {en}
          </p>
        </Reveal>
        <Reveal delay={120}>
          <span aria-hidden="true" className="rule-gold mt-5 block w-16" />
        </Reveal>
        <Reveal delay={180}>
          <h1 className="text-ivory mt-6 text-[1.75rem] leading-[1.6] whitespace-pre-line sm:text-[2.4rem] lg:text-[2.9rem]">
            {ja}
          </h1>
        </Reveal>
        {lead ? (
          <Reveal delay={260}>
            <p className="text-gray mt-7 max-w-2xl text-[0.87rem] leading-[2.15]">{lead}</p>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
