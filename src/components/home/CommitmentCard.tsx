import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Figure } from "@/components/ui/Figure";
import type { Commitment } from "@/data/content";

export function CommitmentCard({ commitment }: { commitment: Commitment }) {
  return (
    <article className="group relative h-full">
      <Link
        href={commitment.href}
        className="border-ivory/10 hover:border-gold/55 flex h-full flex-col border transition-colors duration-700 ease-[cubic-bezier(.22,1,.36,1)]"
      >
        <Figure
          media={commitment.image}
          className="aspect-[4/3] w-full"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          imageClassName="transition-transform duration-[1400ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.06]"
          label={commitment.headingEn}
        />

        <div className="group-hover:bg-gold/4 relative flex flex-1 flex-col p-6 transition-colors duration-700 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="font-display text-gold text-[0.72rem] tracking-[0.2em]">
              {commitment.number}
            </span>
            <span aria-hidden="true" className="rule-gold w-8" />
            <span className="font-display text-gold/70 text-[0.6rem] tracking-[0.3em] uppercase">
              {commitment.headingEn}
            </span>
          </div>

          <h3 className="text-ivory mt-4 text-base leading-[1.8] sm:text-lg">
            {commitment.heading}
          </h3>
          <p className="text-gray mt-4 flex-1 text-[0.8rem] leading-[2.05]">{commitment.body}</p>

          <span className="text-gold group-hover:text-gold-light mt-6 inline-flex items-center gap-2 text-[0.72rem] tracking-[0.16em] transition-colors duration-500">
            詳しく見る
            <ArrowRight
              aria-hidden="true"
              className="size-3.5 transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-x-1"
            />
          </span>
        </div>
      </Link>
    </article>
  );
}
