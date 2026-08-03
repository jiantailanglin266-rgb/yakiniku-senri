import Link from "next/link";
import { redirect } from "next/navigation";

import { productName } from "@/config/product";
import { getRequestContext } from "@/server/auth/context";
import { prisma } from "@/server/db/client";
import { Button, Card, CardBody } from "@/components/ui/primitives";

export default async function HomePage() {
  const context = await getRequestContext();
  if (context) redirect("/admin");

  // Only demo stores exist in a fresh install; listing them makes the public
  // booking flow reachable without hunting for a slug.
  const stores = await prisma.store.findMany({
    where: { deletedAt: null, isPubliclyListed: true, status: "active" },
    select: { slug: true, name: true, city: true, industry: true },
    orderBy: { name: "asc" },
    take: 10,
  });

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <div>
        <p className="text-xs font-medium tracking-widest text-[--color-ink-subtle] uppercase">
          Salon management SaaS
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[--color-ink]">{productName()}</h1>
        <p className="mt-3 max-w-xl text-sm text-[--color-ink-muted]">
          予約・顧客・電子カルテ・会計・分析をひとつにまとめた、サロン向けの業務管理システムです。
          このインスタンスに登録されているデータはすべて架空のデモデータです。
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/signin">
          <Button size="lg">管理画面にログイン</Button>
        </Link>
      </div>

      {stores.length > 0 ? (
        <Card>
          <CardBody className="space-y-3">
            <h2 className="text-sm font-semibold text-[--color-ink]">公開予約ページ（デモ）</h2>
            <ul className="space-y-2">
              {stores.map((store) => (
                <li key={store.slug}>
                  <Link
                    href={`/booking/${store.slug}`}
                    className="flex items-baseline justify-between gap-3 rounded-md border border-[--color-border] px-3 py-2 text-sm hover:bg-[--color-surface-muted]"
                  >
                    <span className="font-medium text-[--color-ink]">{store.name}</span>
                    <span className="text-xs text-[--color-ink-subtle]">/booking/{store.slug}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-xs text-[--color-ink-subtle]">
              これらは架空の店舗です。実在の店舗ではありません。
            </p>
          </CardBody>
        </Card>
      ) : null}
    </main>
  );
}
