import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/Button";
import { ReservationButton } from "@/components/ui/ReservationButton";
import { SmokeLayer } from "@/components/effects/SmokeLayer";
import { SenriShell } from "@/components/layout/SenriShell";
import { mainNav } from "@/data/navigation";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ページが見つかりません",
  description: "お探しのページは移動または削除された可能性があります。",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  // ルート直下の 404 は `(senri)` のレイアウトを通らないため、外枠を明示的に付けます
  return (
    <SenriShell>
      <NotFoundBody />
    </SenriShell>
  );
}

function NotFoundBody() {
  return (
    <section className="relative flex min-h-[80svh] items-center overflow-hidden py-28">
      <SmokeLayer className="opacity-60" />

      <div className="relative mx-auto max-w-2xl px-5 text-center sm:px-8">
        <p className="font-display text-gold/70 text-[3.5rem] leading-none tracking-[0.14em] sm:text-[5rem]">
          404
        </p>
        <span aria-hidden="true" className="rule-gold mx-auto mt-8 block w-16" />
        <h1 className="text-ivory mt-8 text-[1.4rem] leading-[1.7] sm:text-[1.8rem]">
          お探しのページが
          <br />
          見つかりませんでした。
        </h1>
        <p className="text-gray mt-7 text-[0.85rem] leading-[2.1]">
          ページが移動または削除された可能性があります。
          <br />
          下のリンクから、お目当ての情報をお探しください。
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <LinkButton href="/" variant="gold">
            トップページへ戻る
          </LinkButton>
          <ReservationButton />
        </div>

        <nav aria-label="主要ページ" className="mt-12">
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2.5">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-gray hover:text-gold text-[0.78rem] transition-colors duration-500"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
