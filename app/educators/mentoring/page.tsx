import type { Metadata } from "next";
import { EducatorFunctionLayout } from "@/components/EducatorFunctionLayout";

export const metadata: Metadata = { title: "Mentor moves" };

export default function MentorMovesPage() {
  return (
    <EducatorFunctionLayout
      functionKey="mentor"
      functionLabel="Mentor"
      title="The mentor&rsquo;s moves"
      intro="Small, named, repeatable things a good mentor does. A mentor is generally responsible for a learner's academic progress and their wellbeing — but the exact remit is set by each partner. These moves are a menu to adopt from, organised by the five parts of the mentor role, not a fixed mandate."
      notice={
        <p className="rounded-lg border-l-4 border-terracotta bg-terracotta/5 p-4 text-sm text-dark-navy/90">
          <span className="font-semibold text-terracotta">On safeguarding:</span> the safeguarding
          moves here are about how to build the relationship, notice concerns and respond well. They
          never replace your setting&rsquo;s own safeguarding policy and referral pathways &mdash;
          know those first, and always follow them.
        </p>
      }
    />
  );
}
