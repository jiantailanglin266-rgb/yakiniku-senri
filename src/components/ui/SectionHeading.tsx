import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  /** 英字見出し（装飾。スクリーンリーダーからは読み上げます） */
  en: string;
  /** 日本語見出し。改行は \n で指定します */
  ja: string;
  lead?: string;
  align?: "left" | "center";
  as?: "h1" | "h2" | "h3";
  className?: string;
  /** aria-labelledby から参照するための見出しID */
  id?: string;
};

export function SectionHeading({
  en,
  ja,
  lead,
  align = "left",
  as: Tag = "h2",
  className,
  id,
}: SectionHeadingProps) {
  return (
    <div className={cn(align === "center" && "text-center", className)}>
      <Reveal>
        <p className="font-display text-gold text-[0.72rem] tracking-[0.44em] uppercase sm:text-sm">
          {en}
        </p>
      </Reveal>
      <Reveal delay={90}>
        <span
          aria-hidden="true"
          className={cn("rule-gold mt-5 block w-16", align === "center" && "mx-auto")}
        />
      </Reveal>
      <Reveal delay={140}>
        <Tag
          id={id}
          className="text-ivory mt-6 text-[1.6rem] leading-[1.65] whitespace-pre-line sm:text-[2.1rem] lg:text-[2.5rem]"
        >
          {ja}
        </Tag>
      </Reveal>
      {lead ? (
        <Reveal delay={220}>
          <p
            className={cn(
              "text-gray mt-6 max-w-2xl text-sm leading-[2.1] sm:text-[0.95rem]",
              align === "center" && "mx-auto",
            )}
          >
            {lead}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}
