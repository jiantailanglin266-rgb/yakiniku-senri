import { CommitmentCard } from "./CommitmentCard";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { commitments } from "@/data/content";

export function CommitmentGrid() {
  return (
    <section aria-labelledby="commitment-heading" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-[100rem] px-5 sm:px-8">
        <SectionHeading
          id="commitment-heading"
          en="OUR CRAFT"
          ja="千里が守り続ける、四つのこだわり。"
          align="center"
        />

        <ul className="mt-16 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {commitments.map((commitment, index) => (
            <Reveal as="li" key={commitment.id} delay={index * 80} className="h-full">
              <CommitmentCard commitment={commitment} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
