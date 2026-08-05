import { createElement, type AnchorHTMLAttributes, type ReactNode } from "react";
import { vi } from "vitest";

/**
 * Next.js 固有モジュールのテスト用モック。
 *
 * vi.mock のファクトリはホイストされ、外側のスコープを参照できないため、
 * 各テストファイルでは次のように動的 import 経由で読み込みます。
 *
 *   vi.mock("next/image", async () => (await import("./helpers/next-mocks")).imageMock());
 */

export function imageMock() {
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => {
      const { src, alt, fill, priority, loading, sizes, className, style } = props;
      return createElement("img", {
        src: typeof src === "string" ? src : "",
        alt,
        className,
        style,
        "data-fill": fill ? "true" : undefined,
        "data-priority": priority ? "true" : undefined,
        "data-sizes": sizes,
        loading,
      });
    },
  };
}

export function linkMock() {
  return {
    __esModule: true,
    default: ({
      href,
      children,
      ...rest
    }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) =>
      createElement("a", { href, ...rest }, children),
  };
}

export function navigationMock(pathname = "/") {
  return {
    usePathname: () => pathname,
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
    notFound: () => {
      throw new Error("NEXT_NOT_FOUND");
    },
  };
}

/** next/font/google はビルド時にのみ動作するため、テストではスタブに置き換えます */
export function fontMock() {
  const font = () => ({ variable: "--font-stub", className: "font-stub", style: {} });
  return {
    __esModule: true,
    Noto_Serif_JP: font,
    Noto_Sans_JP: font,
    Cormorant_Garamond: font,
  };
}

/** prefers-reduced-motion: reduce を有効にします */
export function enableReducedMotion() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}
