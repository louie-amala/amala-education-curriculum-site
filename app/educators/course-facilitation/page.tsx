import type { Metadata } from "next";
import { EducatorFunctionLayout, bucketise } from "@/components/EducatorFunctionLayout";
import { educatorMoves } from "@/lib/content";
import { FACILITATION_AREA_META } from "@/lib/ui";

export const metadata: Metadata = { title: "Course facilitation moves" };

export default function CourseFacilitationPage() {
  const buckets = bucketise(educatorMoves, "facilitationArea", FACILITATION_AREA_META);

  return (
    <EducatorFunctionLayout
      functionLabel="Course facilitator"
      title="The course facilitator&rsquo;s moves"
      intro="Small, named, repeatable things a good facilitator does — designing learning worth doing, running the room so thinking is visible and difficulty is handled with care, and getting better at both over time. Adapt them to your subject and setting; the moves are written to work in any programme."
      buckets={buckets}
      emptyLabel="No course facilitation moves authored yet."
    />
  );
}
