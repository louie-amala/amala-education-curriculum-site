import { z } from "zod";

// Zod schemas mirroring the content-source YAML (Build Specification §4, §12).
// These are the runtime source of truth: the loader validates every file against
// them at build time, so a malformed or mis-shaped entity fails the build.

export const AccessSchema = z.enum(["public", "staff", "partner"]).default("public");

// ---- Framework ----
export const AreaSchema = z.object({
  id: z.string(),
  title: z.string(),
  gloss: z.string().nullable().optional(),
  description: z.string(),
  competencyIds: z.array(z.string()),
});

export const CreditLevelSchema = z.enum(["Foundational", "Advanced"]);

export const CompetencySchema = z.object({
  id: z.string(),
  code: z.string(),
  areaId: z.string(),
  creditLevel: CreditLevelSchema,
  title: z.string(),
  goal: z.string().nullable().optional(),
});

export const ProficiencyLevelSchema = z.object({
  id: z.enum(["none", "theorist", "practitioner", "reflective", "expert"]),
  title: z.string(),
  gpa: z.number(),
  creditAwarded: z.boolean(),
  genericDescriptor: z.string(),
});

export const ProficiencyScaleSchema = z.object({
  progressionAxes: z.string(),
  levels: z.array(ProficiencyLevelSchema),
});

// ---- Foundations ----
export const PrincipleSchema = z.object({
  id: z.string(),
  number: z.number(),
  statement: z.string(),
  gloss: z.string(),
  note: z.string().optional(),
  designLooksLike: z.array(z.string()),
  workingWhen: z.array(z.string()),
});

export const AgencySchema = z.object({
  definition: z.string(),
  transformativeStatement: z.string(),
  indicators: z.array(z.object({ id: z.string(), label: z.string() })),
  why: z.string(),
  placement: z.string(),
});

// ---- Courses ----
export const CompetencyEvidenceSchema = z.object({
  code: z.string(),
  citedTitle: z.string().nullable().optional(),
  condition: z.string(),
});

export const ObjectiveSchema = z.object({
  statement: z.string(),
  supportedTo: z.array(z.string()).default([]),
  // For competency-anchored courses: how THIS objective develops and demonstrates the anchor
  // competency. Optional so non-anchored (GSD) objectives are unaffected.
  anchorContribution: z
    .object({ develops: z.string(), demonstrates: z.string() })
    .optional(),
  furtherDetails: z
    .object({
      concepts: z.array(z.string()).default([]),
      activities: z.array(z.string()).default([]),
    })
    .partial()
    .optional(),
  competencyEvidence: z.array(CompetencyEvidenceSchema).default([]),
});

export const PrincipleMappingSchema = z.object({
  principle: z.string(),
  inThisCourse: z.array(z.string()).default([]),
});

export const CourseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  access: AccessSchema.optional(),
  title: z.string(),
  strapline: z.string().nullable().optional(),
  programmes: z.array(z.string()).default([]),
  testimonial: z
    .object({ quote: z.string(), attribution: z.string() })
    .nullable()
    .optional(),
  purpose: z.string(),
  requirements: z
    .object({
      structuredHours: z.number().nullable().optional(),
      durationWeeks: z.number().nullable().optional(),
      cadence: z.string().nullable().optional(),
      liveIndependentSplit: z.string().nullable().optional(),
      notes: z.string().nullable().optional(),
    })
    .partial()
    .optional(),
  // Optional narrative spine for competency-anchored courses (e.g. Research Project). Reads as:
  // agency for positive change → anchorCompetency → the objectives that develop/demonstrate it.
  throughline: z
    .object({
      anchorCompetency: z.string(), // competency code, validated in validateGraph()
      fromAgency: z.string(), // why this competency builds agency for positive change
      toObjectives: z.string(), // how the objectives develop and demonstrate it
      develops: z.string().optional(), // course-level: how the course develops the competency
      demonstrates: z.string().optional(), // course-level: how learners evidence it
    })
    .optional(),
  objectives: z.array(ObjectiveSchema).default([]),
  principleMappings: z.array(PrincipleMappingSchema).default([]),
  designChecklist: z.array(z.string()).default([]),
  sourceIssues: z
    .array(z.object({ type: z.string(), detail: z.string() }))
    .default([]),
});

// ---- Programme ----
export const ProgrammeSchema = z.object({
  id: z.string(),
  slug: z.string(),
  access: AccessSchema.optional(),
  title: z.string(),
  shortName: z.string().optional(),
  tagline: z.string().optional(),
  summary: z.string(),
  accreditation: z.string().optional(),
  targetContext: z.string().optional(),
  structure: z.string().optional(),
  durationMonthsTypical: z.number().optional(),
  totalStructuredHoursMin: z.number().optional(),
  liveFacilitatedHoursMin: z.number().optional(),
  streams: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        courses: z.array(
          z.object({
            courseId: z.string(),
            position: z.string().optional(),
            exampleProductTask: z.string().nullable().optional(),
          }),
        ),
      }),
    )
    .default([]),
  ongoingComponents: z
    .array(
      z.object({
        courseId: z.string(),
        role: z.string(),
        structuredHours: z.number().optional(),
        graduationRequirement: z.boolean().optional(),
      }),
    )
    .default([]),
  graduationCriteria: z.array(z.string()).default([]),
  assessment: z.any().optional(),
  sourceNotes: z.array(z.string()).optional(),

  // ---- Component-based programme shape (e.g. Learning Bridge) ----
  // The GSD is course-based (streams above); a preparatory programme like Learning Bridge is built
  // from bespoke components that are not GSD Changemaker Courses. These optional fields carry that
  // shape. All are optional, so course-based programmes are unaffected.
  ageRange: z.string().optional(),
  minDurationWeeks: z.number().optional(),
  // Named variants of the same programme (e.g. Learning Bridge / Learning Bridge+).
  versions: z
    .array(z.object({ name: z.string(), summary: z.string() }))
    .default([]),
  studentGains: z.array(z.string()).default([]),
  // Programme components (not courses). Hours split into facilitated/independent where known.
  components: z
    .array(
      z.object({
        title: z.string(),
        summary: z.string().nullable().optional(),
        structuredHours: z.number().optional(),
        facilitatedHours: z.number().optional(),
        independentHours: z.number().optional(),
        deliveryOptions: z.array(z.string()).default([]),
        optional: z.boolean().optional(),
        // When set, this component is delivered as a full course; the programme links to it.
        // Validated against the course collection in validateGraph().
        courseSlug: z.string().optional(),
      }),
    )
    .default([]),
  // Row-per-aspect comparison of the versions (e.g. LB vs LB+); `detail` describes both.
  versionComparison: z
    .array(z.object({ aspect: z.string(), detail: z.string() }))
    .default([]),
  // "What it takes to deliver" — staffing, coordinator, training, assessment-time notes.
  delivery: z
    .array(
      z.object({
        title: z.string(),
        detail: z.string().nullable().optional(),
        items: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  // "What Amala provides" — support, resources, moderation.
  support: z
    .array(z.object({ title: z.string(), detail: z.string() }))
    .default([]),
  // Grading/certification (e.g. Learning Bridge+): assessed competencies + grade scale.
  grading: z
    .object({
      intro: z.string().nullable().optional(),
      assessedCompetencies: z
        .array(z.object({ title: z.string(), description: z.string() }))
        .default([]),
      scale: z
        .array(z.object({ grade: z.string(), requirement: z.string() }))
        .default([]),
      note: z.string().nullable().optional(),
    })
    .optional(),
});

// ---- Facilitation materials (§4.3) ----
export const FacilitationContextSchema = z.enum([
  "group",
  "one-to-one-mentoring",
  "independent",
]);

export const MaterialTypeSchema = z.enum([
  "activity",
  "case-study",
  "tools-approaches",
  "concept",
  "resource",
]);

export const AgencyIndicatorSchema = z.enum([
  "contribution-to-community",
  "control-of-future-pathways",
  "power-over-wellbeing-and-self-direction",
]);

export const AgencyContributionSchema = z.object({
  indicators: z.array(AgencyIndicatorSchema).min(1),
  how: z.string(),
});

// A single facilitation step (activities), modelled on the v1 site's rich step structure.
export const ActivityStepSchema = z.object({
  title: z.string(),
  duration: z.string().nullable().optional(),
  guidance: z.string(),
  keyPrompts: z.array(z.string()).default([]),
  watchOuts: z.array(z.string()).default([]),
  adaptation: z.string().nullable().optional(), // low-bandwidth / async / pre-work note (🏠)
});

export const FacilitationMaterialSchema = z.object({
  id: z.string(),
  slug: z.string(),
  access: AccessSchema.optional(),
  // When set, this material is specific to a contextualised programme edition (e.g.
  // "learning-bridge-coxs-bazar"): it keeps its own page but is hidden from the generic /materials
  // library, site search, and objective/course/competency listings. Validated in validateGraph().
  edition: z.string().optional(),
  type: MaterialTypeSchema,
  title: z.string(),
  summary: z.string().nullable().optional(),
  facilitationContext: z.array(FacilitationContextSchema).default([]),
  // The delivery mode the material is designed around; the others read as adaptations.
  primaryContext: FacilitationContextSchema.optional(),
  // How to run this material in each delivery mode it supports (mode axis). Distinct from a
  // step's `adaptation`, which handles the constraint axis (low bandwidth, time, attendance).
  deliveryAdaptations: z
    .array(z.object({ context: FacilitationContextSchema, how: z.string() }))
    .default([]),
  toolsFacet: z.enum(["analytical", "facilitation", "both"]).optional(),
  // running detail (mainly activities)
  duration: z.string().nullable().optional(),
  grouping: z.string().nullable().optional(),
  whatLearnersDo: z.array(z.string()).default([]),
  materialsAndPreparation: z.array(z.string()).default([]),
  facilitationNotes: z.string().nullable().optional(),
  steps: z.array(ActivityStepSchema).default([]),
  closing: z.string().nullable().optional(),
  educatorContent: z.string().nullable().optional(),
  learnerContent: z.string().nullable().optional(),
  agencyContribution: AgencyContributionSchema,
  // Legacy flat lists (still valid). Preferred are the explained forms below, which say HOW this
  // specific material connects to each principle and competency.
  principlesForegrounded: z.array(z.string()).default([]),
  competencyCodes: z.array(z.string()).default([]),
  principleAlignment: z
    .array(z.object({ principle: z.string(), how: z.string() }))
    .default([]),
  competencyDevelopment: z
    .array(z.object({ code: z.string(), how: z.string() }))
    .default([]),
  objectiveIds: z.array(z.string()).default([]),
  relatedSlugs: z.array(z.string()).default([]),
  // External links this material points to (e.g. a video a resource is built around). Rendered as
  // clickable links on the material page.
  links: z
    .array(
      z.object({
        label: z.string(),
        url: z.string(),
        note: z.string().nullable().optional(),
      }),
    )
    .default([]),
  // An illustrative diagram (e.g. a 2x2 tool grid). src is a path under public/, checked at build time.
  diagram: z
    .object({ src: z.string(), alt: z.string(), caption: z.string().nullable().optional() })
    .optional(),
  sourceRefs: z.array(z.string()).optional(),
  provenanceNote: z.string().nullable().optional(),
});

export type FacilitationContext = z.infer<typeof FacilitationContextSchema>;
export type MaterialType = z.infer<typeof MaterialTypeSchema>;
export type FacilitationMaterial = z.infer<typeof FacilitationMaterialSchema>;

// ---- Unit plan (scheme of work) ----
// A unit sequences existing materials into a week-by-week plan for one component of one programme,
// with the facilitated / independent split per session. It is the "what to do and when" document
// that carries the facilitator guidance inline (the guidance lives on the referenced materials).
export const UnitSessionSchema = z.object({
  title: z.string(),
  // The material this session runs. Validated against the materials collection in validateGraph().
  materialSlug: z.string(),
  facilitatedMin: z.number(),
  independentMin: z.number().default(0),
  // The task set for the independent portion (done from the workbook, offline, no device).
  independentTask: z.string().nullable().optional(),
  // Which parts can flex between in-person and independent, and anything else worth flagging.
  flexNote: z.string().nullable().optional(),
});

export const UnitWeekSchema = z.object({
  number: z.number(),
  title: z.string(),
  // The course objective this week develops. Validated against objective ids in validateGraph().
  objectiveId: z.string().nullable().optional(),
  outcome: z.string().nullable().optional(),
  sessions: z.array(UnitSessionSchema).default([]),
});

export const UnitSchema = z.object({
  id: z.string(),
  slug: z.string(),
  access: AccessSchema.optional(),
  title: z.string(),
  // The programme edition and component this unit belongs to. programmeSlug is validated against
  // programmes; courseSlug (the component's course) against courses, in validateGraph().
  programmeSlug: z.string(),
  componentTitle: z.string(),
  courseSlug: z.string().nullable().optional(),
  summary: z.string(),
  // The weekly time budget this unit plans against (e.g. 180 facilitated + 120 independent).
  weeklyFacilitatedMin: z.number(),
  weeklyIndependentMin: z.number(),
  weeks: z.array(UnitWeekSchema).default([]),
  sourceNotes: z.array(z.string()).default([]),
});

export type UnitSession = z.infer<typeof UnitSessionSchema>;
export type UnitWeek = z.infer<typeof UnitWeekSchema>;
export type Unit = z.infer<typeof UnitSchema>;

// ---- Glossary (§4.4) ----
export const GlossaryCategorySchema = z.enum(["curriculum-system", "content", "assessment"]);

export const GlossaryTermSchema = z.object({
  id: z.string(),
  slug: z.string(),
  access: AccessSchema.optional(),
  term: z.string(),
  category: GlossaryCategorySchema,
  definition: z.string(),
  matchPhrases: z.array(z.string()).default([]),
  examples: z.array(z.string()).default([]),
  nonExamples: z.array(z.string()).default([]),
  useInContext: z.string().nullable().optional(),
  relatedTermIds: z.array(z.string()).default([]),
});

export type GlossaryCategory = z.infer<typeof GlossaryCategorySchema>;
export type GlossaryTerm = z.infer<typeof GlossaryTermSchema>;

export type Area = z.infer<typeof AreaSchema>;
export type Competency = z.infer<typeof CompetencySchema>;
export type ProficiencyLevel = z.infer<typeof ProficiencyLevelSchema>;
export type ProficiencyScale = z.infer<typeof ProficiencyScaleSchema>;
export type Principle = z.infer<typeof PrincipleSchema>;
export type Agency = z.infer<typeof AgencySchema>;
export type Objective = z.infer<typeof ObjectiveSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type Programme = z.infer<typeof ProgrammeSchema>;
export type CompetencyEvidence = z.infer<typeof CompetencyEvidenceSchema>;
