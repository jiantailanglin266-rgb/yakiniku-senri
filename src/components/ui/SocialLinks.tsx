import type { ComponentType, SVGProps } from "react";
import { Utensils, MapPin, Music2 } from "lucide-react";
import { FacebookIcon, InstagramIcon, XIcon } from "./BrandIcons";
import { socialLinks } from "@/data/site";
import { cn } from "@/lib/utils";

const icons: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  twitter: XIcon,
  utensils: Utensils,
  map: MapPin,
  music: Music2,
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
                "text-gray hover:text-gold grid place-items-center rounded-full transition-colors duration-500",
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
