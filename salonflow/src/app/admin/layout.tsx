import { redirect } from "next/navigation";

import { env } from "@/config/env";
import { productName } from "@/config/product";
import { getRequestContext } from "@/server/auth/context";
import { AdminNav } from "@/components/admin/admin-nav";
import { StoreSwitcher } from "@/components/admin/store-switcher";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { getTranslator } from "@/i18n";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const context = await getRequestContext();
  if (!context) redirect("/signin");

  const t = getTranslator("admin", context.user.locale === "en" ? "en" : "ja");

  // The nav is built from permissions, so an entry never appears for a screen
  // the server would refuse to render.
  const navPermissions = {
    globals: [...context.globalPermissions],
    stores: Object.fromEntries(
      [...context.storePermissions.entries()].map(([storeId, permissions]) => [
        storeId,
        [...permissions],
      ]),
    ),
  };

  return (
    <div className="flex min-h-dvh flex-col">
      {env().DEMO_MODE ? (
        <p className="bg-[--color-warning-soft] px-4 py-1.5 text-center text-xs text-[--color-warning]">
          {t("demo.banner")}
        </p>
      ) : null}

      <div className="flex flex-1 flex-col lg:flex-row">
        <AdminNav
          navPermissions={navPermissions}
          activeStoreId={context.activeStoreId}
          productName={productName()}
          locale={context.user.locale === "en" ? "en" : "ja"}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-[--color-border] bg-[--color-surface] px-4 py-2">
            <StoreSwitcher
              stores={context.accessibleStores}
              activeStoreId={context.activeStoreId}
            />
            <div className="flex items-center gap-3 text-xs text-[--color-ink-muted]">
              <span className="hidden sm:inline">
                {context.user.name}（{context.organization.name}）
              </span>
              <SignOutButton label={t("nav.signOut")} />
            </div>
          </header>

          <main className="flex-1 space-y-4 p-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
