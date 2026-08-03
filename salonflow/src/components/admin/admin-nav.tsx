"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookUser,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  ScrollText,
  Store,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { getTranslator } from "@/i18n";
import { PERMISSIONS, type PermissionKey } from "@/server/permissions/catalog";

export interface NavPermissions {
  globals: string[];
  stores: Record<string, string[]>;
}

interface NavItem {
  href: string;
  labelKey: string;
  Icon: typeof LayoutDashboard;
  permission: PermissionKey;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/admin",
    labelKey: "nav.dashboard",
    Icon: LayoutDashboard,
    permission: PERMISSIONS.RESERVATION_READ,
  },
  {
    href: "/admin/schedule",
    labelKey: "nav.schedule",
    Icon: CalendarDays,
    permission: PERMISSIONS.RESERVATION_READ,
  },
  {
    href: "/admin/appointments",
    labelKey: "nav.appointments",
    Icon: ListChecks,
    permission: PERMISSIONS.RESERVATION_READ,
  },
  {
    href: "/admin/customers",
    labelKey: "nav.customers",
    Icon: BookUser,
    permission: PERMISSIONS.CUSTOMER_READ,
  },
  {
    href: "/admin/services",
    labelKey: "nav.services",
    Icon: ClipboardList,
    permission: PERMISSIONS.RESERVATION_READ,
  },
  {
    href: "/admin/staff",
    labelKey: "nav.staff",
    Icon: Users,
    permission: PERMISSIONS.RESERVATION_READ,
  },
  {
    href: "/admin/stores",
    labelKey: "nav.stores",
    Icon: Store,
    permission: PERMISSIONS.STORE_MANAGE,
  },
  {
    href: "/admin/audit-log",
    labelKey: "nav.auditLog",
    Icon: ScrollText,
    permission: PERMISSIONS.AUDIT_LOG_READ,
  },
];

function holds(
  navPermissions: NavPermissions,
  permission: PermissionKey,
  activeStoreId: string | null,
): boolean {
  if (navPermissions.globals.includes(permission)) return true;
  if (activeStoreId) {
    return navPermissions.stores[activeStoreId]?.includes(permission) ?? false;
  }
  return Object.values(navPermissions.stores).some((keys) => keys.includes(permission));
}

export function AdminNav({
  navPermissions,
  activeStoreId,
  productName,
  locale,
}: {
  navPermissions: NavPermissions;
  activeStoreId: string | null;
  productName: string;
  locale: "ja" | "en";
}) {
  const pathname = usePathname();
  const t = getTranslator("admin", locale);

  const visible = NAV_ITEMS.filter((item) => holds(navPermissions, item.permission, activeStoreId));

  return (
    <nav
      aria-label={t("nav.dashboard")}
      className="no-print border-b border-[--color-border] bg-[--color-surface] lg:w-52 lg:shrink-0 lg:border-r lg:border-b-0"
    >
      <p className="hidden px-4 py-3 text-sm font-semibold text-[--color-ink] lg:block">
        {productName}
      </p>

      <ul className="flex gap-1 overflow-x-auto px-2 py-2 lg:flex-col lg:overflow-visible lg:px-2">
        {visible.map((item) => {
          // `/admin` would otherwise light up on every child route.
          const isActive =
            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-[--color-accent-soft] font-medium text-[--color-accent]"
                    : "text-[--color-ink-muted] hover:bg-[--color-surface-muted] hover:text-[--color-ink]",
                )}
              >
                <item.Icon aria-hidden="true" className="size-4 shrink-0" />
                <span>{t(item.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
