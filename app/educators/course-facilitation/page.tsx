import type { Metadata } from "next";
import { EducatorFunctionLayout } from "@/components/EducatorFunctionLayout";

export const metadata: Metadata = { title: "Course facilitation moves" };

export default function CourseFacilitationPage() {
  return (
    <EducatorFunctionLayout
      functionKey="course-facilitator"
      functionLabel="Course facilitator"
      title="The course facilitator&rsquo;s moves"
      intro="Small, named, repeatable things a good facilitator does. Designing learning worth doing, running the room so thinking is visible and difficulty is handled with care, and getting better at both over time. Many moves apply both when you design and when you facilitate, the card explains each. Filter by purpose to plan a focus (say, checking for understanding)."
    />
  );
}
