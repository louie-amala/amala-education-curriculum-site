import type { Metadata } from "next";
import { EducatorFunctionLayout, bucketise } from "@/components/EducatorFunctionLayout";
import { educatorMoves } from "@/lib/content";
import { ASSESSMENT_AREA_META } from "@/lib/ui";

export const metadata: Metadata = { title: "Assessment moves" };

export default function AssessmentPage() {
  const buckets = bucketise(educatorMoves, "assessmentArea", ASSESSMENT_AREA_META);

  return (
    <EducatorFunctionLayout
      functionLabel="Assessor of competencies"
      title="The assessor&rsquo;s moves"
      intro="The competency lives in the person, not the artefact. Assessing well means building the fullest possible picture of what a learner can really do, then judging it fairly against the proficiency scale. These moves are the assessor's craft — how to seek evidence, how to make the judgement, and the tools that draw evidence out."
      notice={
        <p className="rounded-lg border-l-4 border-plum bg-plum/5 p-4 text-sm text-dark-navy/90">
          <span className="font-semibold text-plum">The principle underneath these moves:</span> a
          competency is something a person can do, not a property of any single piece of work. No one
          artefact is decisive &mdash; triangulate several sources so you judge the learner, not the
          polish.
        </p>
      }
      buckets={buckets}
      emptyLabel="No assessment moves authored yet."
    />
  );
}
