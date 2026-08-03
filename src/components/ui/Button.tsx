import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ExternalLink as ExternalIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const base =
  "group inline-flex min-h-11 items-center justify-center gap-2.5 px-6 py-3 text-[0.8rem] tracking-[0.18em] transition-colors duration-500 ease-[cubic-bezier(.22,1,.36,1)]";

const variants = {
  /** 金背景（最重要CTA） */
  gold: "bg-gold text-black hover:bg-gold-light font-medium",
  /** 金枠（標準CTA） */
  outline:
    "border border-gold/55 text-gold hover:border-gold hover:bg-gold/10 hover:text-gold-light",
  /** 控えめ */
  ghost: "border border-ivory/20 text-ivory/85 hover:border-ivory/50 hover:text-white",
} as const;

export type ButtonVariant = keyof typeof variants;

type CommonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  icon?: ReactNode;
};

export function LinkButton({
  href,
  children,
  variant = "outline",
  className,
  icon,
  external = false,
  ...rest
}: CommonProps & { href: string; external?: boolean } & Omit<
    ComponentProps<typeof Link>,
    "href" | "className" | "children"
  >) {
  const classes = cn(base, variants[variant], className);

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {icon}
        <span>{children}</span>
        <ExternalIcon aria-hidden="true" className="size-3.5 opacity-70" />
        <span className="sr-only">（外部サイトを新しいタブで開きます）</span>
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...rest}>
      {icon}
      <span>{children}</span>
    </Link>
  );
}

export function ActionButton({
  children,
  variant = "outline",
  className,
  icon,
  ...rest
}: CommonProps & ComponentProps<"button">) {
  return (
    <button className={cn(base, variants[variant], className)} {...rest}>
      {icon}
      <span>{children}</span>
    </button>
  );
}
