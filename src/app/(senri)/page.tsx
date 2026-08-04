import { JsonLd } from "@/components/ui/JsonLd";
import { videoJsonLd } from "@/lib/structured-data";
import { GradientDivider } from "@/components/ui/GradientDivider";
import { VideoBand } from "@/components/ui/VideoBand";
import { HeroSection } from "@/components/home/HeroSection";
import { BrandMovie } from "@/components/home/BrandMovie";
import { StorySection } from "@/components/home/StorySection";
import { CommitmentGrid } from "@/components/home/CommitmentGrid";
import { SignatureMenu } from "@/components/home/SignatureMenu";
import { MenuPreview } from "@/components/home/MenuPreview";
import { EmberSection } from "@/components/home/EmberSection";
import { OwnerProfile } from "@/components/home/OwnerProfile";
import { TakeoutSection } from "@/components/home/TakeoutSection";
import { GalleryGrid } from "@/components/home/GalleryGrid";
import { NewsSection } from "@/components/home/NewsSection";
import { AccessSection } from "@/components/home/AccessSection";
import { ReservationCTA } from "@/components/home/ReservationCTA";

export default function HomePage() {
  return (
    <>
      {videoJsonLd ? <JsonLd data={videoJsonLd} /> : null}

      <HeroSection />
      {/* ブランドムービーはファーストビューの直下に置きます（間に何も挟みません） */}
      <BrandMovie />
      <VideoBand priority />
      <StorySection />
      <GradientDivider tone="gold" />
      <CommitmentGrid />
      <SignatureMenu />
      <EmberSection />
      <VideoBand />
      <MenuPreview />
      <OwnerProfile />
      <TakeoutSection />
      <GalleryGrid />
      <NewsSection />
      <AccessSection />
      <ReservationCTA />
    </>
  );
}
