import type { ComponentType } from "react";
import { Utensils, MapPin, Music2 } from "lucide-react";
import { FacebookIcon, InstagramIcon, XIcon } from "./BrandIcons";
import { socialLinks } from "@/data/site";
import { cn } from "@/lib/utils";

type IconComponentProps = {
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
};

const icons: Record<string, ComponentType<IconComponentProps>> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  twitter: XIcon,
  utensils: Utensils,
  map: MapPin,
  music: Music2,
};

/**
 * currentColor で描く lucide アイコンのブランドカラー。
 * ブランドアイコン（Instagram / Facebook / X）は自身で色を持つため、ここには含めません。
 */
const iconColors: Record<string, string> = {
  utensils: "text-[#ff8a00]", // 食べログ（近似色）
  map: "text-[#34a853]", // Google マップ
  music: "text-gold",
};

type Props = {
  className?: string;
  size?: "sm" | "md";
  /** 表示するリンクのID（省略時はすべて） */
  only?: string[];
};

export function SocialLinks({ className, size = "sm", only }: Props) {
  const links = only ? socialLinks.filter((l) => only.includes(l.id)) : socialLinks;

  return (
    <ul className={cn("flex items-center gap-1", className)}>
      {links.map((link) => {
        const Icon = icons[link.icon] ?? InstagramIcon;
        return (
          <li key={link.id}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${link.label}（外部サイトを新しいタブで開きます）`}
              title={link.description}
              className={cn(
                "grid place-items-center rounded-full opacity-90 transition duration-500 hover:opacity-100",
                iconColors[link.icon],
                size === "sm" ? "size-11" : "size-12",
              )}
            >
              <Icon aria-hidden="true" className={size === "sm" ? "size-[1.05rem]" : "size-5"} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
