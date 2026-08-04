import { Reveal } from "@/components/ui/Reveal";
import { faqs } from "@/data/content";

/**
 * よくあるご質問。
 * ここに表示している内容と FAQPage 構造化データは一致させています。
 */
export function FaqList() {
  return (
    <section aria-labelledby="faq-heading" className="py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <Reveal>
          <h2
            id="faq-heading"
            className="font-display text-gold text-[0.66rem] tracking-[0.42em] uppercase"
          >
            FAQ
          </h2>
        </Reveal>
        <Reveal delay={90}>
          <p className="text-ivory mt-5 text-[1.3rem] sm:text-[1.6rem]">よくあるご質問。</p>
        </Reveal>

        <dl className="mt-10">
          {faqs.map((faq, index) => (
            <Reveal key={faq.question} delay={Math.min(index, 5) * 70}>
              <div className="border-ivory/10 border-b py-7">
                <dt className="faq-question text-ivory flex gap-3 text-[0.92rem] leading-[1.9]">
                  <span aria-hidden="true" className="font-display text-gold">
                    Q.
                  </span>
                  {faq.question}
                </dt>
                <dd className="faq-answer text-gray mt-3 flex gap-3 text-[0.83rem] leading-[2.1]">
                  <span aria-hidden="true" className="font-display text-gold/60">
                    A.
                  </span>
                  {faq.answer}
                </dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
