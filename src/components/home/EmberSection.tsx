import { FireParticleLayer } from "@/components/effects/FireParticleLayer";
import { SmokeLayer } from "@/components/effects/SmokeLayer";
import { Reveal } from "@/components/ui/Reveal";
import { store } from "@/data/store";

/**
 * 炎・煙の演出セクション（ページ中盤の1箇所のみ）。
 * 黒 → 赤黒 → 金へ変化するグラデーションの上に、火の粉と薄い煙を重ねます。
 * 抽象的・上品な範囲に留め、常時派手に動かさないよう配置を限定しています。
 */
export function EmberSection() {
  return (
    <section
      aria-labelledby="ember-heading"
      className="section-bleed relative overflow-hidden py-28 sm:py-36"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,8,8,0) 0%, rgba(26,10,7,0.72) 26%, rgba(95,11,11,0.34) 52%, rgba(143,107,40,0.18) 76%, rgba(8,8,8,0) 100%)",
        }}
      />
      <SmokeLayer from="bottom" />
      <FireParticleLayer />

      <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
        <Reveal>
          <p className="font-display text-gold text-[0.66rem] tracking-[0.46em] uppercase">
            Charcoal Fire
          </p>
        </Reveal>
        <Reveal delay={120}>
          <h2
            id="ember-heading"
            className="font-serif-jp text-ivory mt-7 text-[1.5rem] leading-[1.9] tracking-[0.1em] sm:text-[2rem]"
          >
            炭に火を入れ、
            <br />
            肉を焼き、囲んで食べる。
          </h2>
        </Reveal>
        <Reveal delay={220}>
          <p className="text-gray mt-8 text-[0.85rem] leading-[2.2]">
            {store.founded}年から、変わらない時間がここにあります。
            <br className="hidden sm:block" />
            炭火の熱と、立ちのぼる香り。世田谷の夜に、六十余年重ねてきた景色です。
          </p>
        </Reveal>
      </div>
    </section>
  );
}
