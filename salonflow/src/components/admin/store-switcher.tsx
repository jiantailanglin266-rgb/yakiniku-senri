"use client";

import { usePathname } from "next/navigation";

import { switchStoreAction } from "@/server/auth/actions";
import { Select } from "@/components/ui/primitives";

/**
 * Store selector.
 *
 * The chosen store is stored on the session server-side, not in a client-held
 * value, so it cannot be changed by editing a request — and so it survives a
 * page reload on the reception tablet.
 */
export function StoreSwitcher({
  stores,
  activeStoreId,
}: {
  stores: Array<{ id: string; name: string }>;
  activeStoreId: string | null;
}) {
  const pathname = usePathname();

  if (stores.length === 0) {
    return <p className="text-xs text-[--color-ink-muted]">利用できる店舗がありません</p>;
  }

  if (stores.length === 1) {
    return <p className="text-sm font-medium text-[--color-ink]">{stores[0]?.name}</p>;
  }

  return (
    <form action={switchStoreAction} className="flex items-center gap-2">
      <label htmlFor="store-switcher" className="text-xs text-[--color-ink-muted]">
        店舗
      </label>
      <input type="hidden" name="redirectTo" value={pathname} />
      <Select
        id="store-switcher"
        name="storeId"
        defaultValue={activeStoreId ?? ""}
        className="h-8 w-auto py-1 text-xs"
        // Submitting on change avoids a second click for what is a navigation.
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        {stores.map((store) => (
          <option key={store.id} value={store.id}>
            {store.name}
          </option>
        ))}
      </Select>
      <noscript>
        <button type="submit" className="text-xs underline">
          切り替え
        </button>
      </noscript>
    </form>
  );
}
