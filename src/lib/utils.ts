export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** 外部リンク判定 */
export function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}
