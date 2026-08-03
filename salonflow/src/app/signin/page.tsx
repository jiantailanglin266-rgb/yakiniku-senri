import { redirect } from "next/navigation";

import { env } from "@/config/env";
import { productName } from "@/config/product";
import { getRequestContext } from "@/server/auth/context";
import { SignInForm } from "./sign-in-form";

export const metadata = { title: "ログイン" };

export default async function SignInPage() {
  const context = await getRequestContext();
  if (context) redirect("/admin");

  const demoMode = env().DEMO_MODE;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-[--color-ink]">{productName()}</h1>
          <p className="mt-1 text-xs text-[--color-ink-muted]">管理画面へのログイン</p>
        </div>

        <SignInForm />

        {demoMode ? (
          <div className="rounded-md border border-[--color-border] bg-[--color-surface] p-3 text-xs text-[--color-ink-muted]">
            <p className="font-medium text-[--color-ink]">デモ用アカウント</p>
            <p className="mt-1">すべて架空のアカウントです。役割ごとの権限差を確認できます。</p>
            <ul className="mt-2 space-y-0.5 font-mono text-[11px]">
              <li>owner@demo.example.invalid（法人オーナー）</li>
              <li>manager@demo.example.invalid（店長）</li>
              <li>reception@demo.example.invalid（受付）</li>
              <li>stylist@demo.example.invalid（スタッフ）</li>
              <li>viewer@demo.example.invalid（閲覧専用）</li>
            </ul>
            <p className="mt-2">パスワードは README の記載を参照してください。</p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
