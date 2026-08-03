"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { googleMapsEmbedUrl } from "@/data/site";
import { store } from "@/data/store";

/**
 * Google Maps の埋め込み。
 * ビューポートに入るまで iframe を読み込まないことで、初期表示のコストを避けます。
 */
export function GoogleMap({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={ref} className={className}>
      {visible ? (
        <iframe
          src={googleMapsEmbedUrl}
          title={`${store.name}の地図`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-full w-full border-0 contrast-[1.05] grayscale-[0.35]"
        />
      ) : (
        <div className="media-placeholder" aria-hidden="true">
          <MapPin className="text-gold/45 size-6" />
        </div>
      )}
    </div>
  );
}
