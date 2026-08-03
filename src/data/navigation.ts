export type NavItem = {
  href: string;
  label: string;
  labelEn: string;
};

/** ヘッダー／フッターの主要ナビゲーション */
export const mainNav: NavItem[] = [
  { href: "/about", label: "当店について", labelEn: "ABOUT" },
  { href: "/commitment", label: "こだわり", labelEn: "CRAFT" },
  { href: "/menu", label: "お品書き", labelEn: "MENU" },
  { href: "/takeout", label: "テイクアウト", labelEn: "TAKEOUT" },
  { href: "/owner", label: "オーナー紹介", labelEn: "OWNER" },
  { href: "/news", label: "お知らせ", labelEn: "NEWS" },
  { href: "/access", label: "アクセス", labelEn: "ACCESS" },
];

/** フッター下段のユーティリティリンク */
export const utilityNav: NavItem[] = [
  { href: "/contact", label: "お問い合わせ", labelEn: "CONTACT" },
  { href: "/privacy", label: "プライバシーポリシー", labelEn: "PRIVACY POLICY" },
  { href: "/cookie", label: "Cookieポリシー", labelEn: "COOKIE POLICY" },
  { href: "/terms", label: "利用規約", labelEn: "TERMS" },
  { href: "/notes", label: "サイト利用上の注意", labelEn: "NOTES" },
  { href: "/legal", label: "特定商取引法に基づく表記", labelEn: "LEGAL" },
  { href: "/sitemap", label: "サイトマップ", labelEn: "SITEMAP" },
];
