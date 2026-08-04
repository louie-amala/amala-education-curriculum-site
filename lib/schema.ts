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
  // Curated glossary terms a facilitator should understand before planning this course
  // (professional learning). Slugs into the glossary; the depth lives on the term page, so the
  // guide stays a set of links rather than duplicated prose. Validated in validateGraph().
  keyConcepts: z.array(z.string()).default([]),
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
  // Intended outcomes / theory of change (e.g. WELP): grouped outcome areas, each with points.
  // Programme-level impact aims, distinct from learner-facing studentGains.
  outcomes: z
    .array(z.object({ title: z.string(), points: z.array(z.string()).default([]) }))
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
  // An educator move: a small, named, repeatable thing a good educator does. The first set are
  // mentor moves (see MentorRoleSchema). Programme-agnostic by default (no `edition`); carries a
  // `mentorRole` bucket, required on this type and validated in validateGraph().
  "educator-move",
]);

// The part of the mentor's role an educator move belongs to. A mentor is generally responsible for
// a learner's academic progress and wellbeing, but the exact remit is set by the partner — these
// buckets are a menu to adopt from, not a fixed mandate. Safeguarding is deliberately its own
// bucket, separate from wellbeing: it is about protection and follows the setting's own policy.
export const MentorRoleSchema = z.enum([
  "wellbeing",
  "safeguarding",
  "progress",
  "recognising-growth",
  "pathways",
]);

// The part of the course-facilitator function an educator move belongs to. Mirrors the three top-level
// sections of the Course Facilitator Playbook.
export const FacilitationAreaSchema = z.enum([
  "learning-design",
  "learning-facilitation",
  "improving-practice",
]);

// The part of the assessor function an educator move belongs to. At Amala the competency lives in the
// person, not the artefact: the assessor builds the best possible picture of a learner's proficiency
// (seeking-evidence), brings it together to judge a competency (making-judgements), and uses structured
// instruments to elicit evidence (assessment-tools).
export const AssessmentAreaSchema = z.enum([
  "seeking-evidence",
  "making-judgements",
  "assessment-tools",
]);

// The kind of downloadable artefact, so the worksheet/template distinction is machine-real and can be
// rendered under labelled groups rather than one undifferentiated list:
//   - explainer: the method written up (what it is, why, when to use it).
//   - worksheet: the fully-scaffolded, guided sheet a learner works through; embeds the blank template.
//   - template:  the blank final product on its own, for the learner who has done it once already.
//   - example:   a worked/filled example to show what "good" looks like.
// Optional and defaulted so existing downloads (which predate the field) remain valid.
export const DownloadRoleSchema = z.enum(["explainer", "worksheet", "template", "example"]);

export const DownloadSchema = z.object({
  label: z.string(),
  file: z.string(),
  format: z.string().nullable().optional(),
  role: DownloadRoleSchema.optional(),
  note: z.string().nullable().optional(),
});

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
  // Which educator function(s) this move belongs to, and the bucket within each. An educator-move must
  // set at least one of these (enforced in validateGraph); a move may serve more than one function. Each
  // drives the grouping on that function's page under /educators.
  mentorRole: MentorRoleSchema.optional(),
  facilitationArea: FacilitationAreaSchema.optional(),
  assessmentArea: AssessmentAreaSchema.optional(),
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
  // The student worksheet for this activity — a `resource` material holding the learner-facing sheet.
  // Rendered as a prominent callout on the activity page. Every activity that appears in a unit plan
  // should set this (validateGraph warns otherwise). The printable version is compiled into the
  // component's downloadable workbook, so the worksheet resource says so rather than shipping its own file.
  worksheet: z
    .object({ slug: z.string(), note: z.string().nullable().optional() })
    .nullable()
    .optional(),
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
  // Downloadable resources this material provides (e.g. a printable template + worked example that
  // learners can reuse for other goals). `file` is a path under public/, checked in validateGraph().
  // Each carries an optional `role` (worksheet/template/example/explainer) so the guided worksheet and
  // the blank template render as distinct, labelled artefacts rather than one undifferentiated list.
  downloads: z.array(DownloadSchema).default([]),
  sourceRefs: z.array(z.string()).optional(),
  provenanceNote: z.string().nullable().optional(),
});

export type FacilitationContext = z.infer<typeof FacilitationContextSchema>;
export type MaterialType = z.infer<typeof MaterialTypeSchema>;
export type MentorRole = z.infer<typeof MentorRoleSchema>;
export type FacilitationArea = z.infer<typeof FacilitationAreaSchema>;
export type AssessmentArea = z.infer<typeof AssessmentAreaSchema>;
export type DownloadRole = z.infer<typeof DownloadRoleSchema>;
export type Download = z.infer<typeof DownloadSchema>;
export type FacilitationMaterial = z.infer<typeof FacilitationMaterialSchema>;

// ---- Unit plan (scheme of work) ----
// A unit sequences materials (and connective blocks) into an HOURS-BASED plan for one component of
// one programme. It deliberately does NOT use weeks: it sets out the hours so an educator can fit
// them into their own weekly schedule. Blocks are grouped into phases (usually the course
// objectives, plus orientation and consolidation). Facilitator guidance is carried inline by the
// referenced material; connective blocks (orientation, goal-pursuit practice, showcase) carry a
// `description` instead of a material.
export const UnitBlockSchema = z.object({
  title: z.string(),
  kind: z.enum(["activity", "practice", "orientation", "consolidation", "assessment"]).optional(),
  // The material this block runs, if any. Validated against the materials collection in
  // validateGraph(). Connective blocks have no material and use `description`.
  materialSlug: z.string().nullable().optional(),
  facilitatedHours: z.number(),
  independentHours: z.number().default(0),
  // For blocks without a material: what happens and the facilitator's role.
  description: z.string().nullable().optional(),
  // The task learners carry out in their independent hours (offline, from the workbook).
  independentTask: z.string().nullable().optional(),
  flexNote: z.string().nullable().optional(),
});

export const UnitPhaseSchema = z.object({
  title: z.string(),
  // The course objective this phase develops. Validated against objective ids in validateGraph().
  objectiveId: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  // How much the learner leads in this phase, tracing the deliberate release of control (from
  // facilitator-led, through shared, to learner-led) by which agency is grown.
  lead: z.enum(["facilitator-led", "shared", "learner-led"]).nullable().optional(),
  blocks: z.array(UnitBlockSchema).default([]),
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
  // Total hours this component takes, split facilitated / independent (e.g. 30 + 20 = 50).
  totalFacilitatedHours: z.number(),
  totalIndependentHours: z.number(),
  // A short note on the delivery approach for the whole unit, e.g. how it deliberately hands over
  // control from facilitator-led to learner-led (and the cautions in doing so).
  deliveryApproach: z.string().nullable().optional(),
  // How the anchor competency is assessed in this unit (educator judgement against the proficiency
  // scale, using evidence gathered across the activities). Rendered on the unit page and facilitator doc.
  assessmentNote: z.string().nullable().optional(),
  phases: z.array(UnitPhaseSchema).default([]),
  // Editable downloadable files for this unit (facilitator plan, workbook, slides). `file` is a path
  // under public/, whose existence is checked at build time in validateGraph().
  downloads: z.array(DownloadSchema).default([]),
  sourceNotes: z.array(z.string()).default([]),
});

export type UnitBlock = z.infer<typeof UnitBlockSchema>;
export type UnitPhase = z.infer<typeof UnitPhaseSchema>;
export type Unit = z.infer<typeof UnitSchema>;

// ---- Modules (competency / skill modules) ----
// A Module groups materials at a FINER grain than a course, around the development of one framework
// competency. It is a cross-cutting path — materials → skill → competency — that sits alongside the
// existing material → objective → course edges, not a replacement for them. Two grains share one
// schema (house style — cf. one ProgrammeSchema for course- and component-based programmes):
//   - grain "competency": develops a whole competency (e.g. FSI1); made of ordered skill modules.
//   - grain "skill":       develops one specific skill of that competency (e.g. "Conduct primary
//                          research"); made of ordered materials, and rolls up into a competency module.
export const ModuleGrainSchema = z.enum(["skill", "competency"]);

// A step in a module's learning sequence (its mini scheme of work). A step either RUNS a material
// (materialSlug set) or is a CONNECTIVE block — orientation, bridge, consolidation, assessment — that
// carries only `guidance`. The guidance is the connective tissue that turns a pile of materials into a
// coherent sequence: why this step happens here, what it builds on, what to draw out, how it sets up
// the next one. Modelled on UnitBlock but hours-light (a module is smaller than a programme component).
export const ModuleStepKindSchema = z.enum([
  "orientation",
  "activity",
  "practice",
  "bridge",
  "consolidation",
  "assessment",
]);

export const ModuleStepSchema = z.object({
  title: z.string(),
  kind: ModuleStepKindSchema.default("activity"),
  // The material this step runs, if any. Validated against the materials collection in validateGraph().
  // Connective steps (orientation/bridge/consolidation/assessment) leave it unset and rely on guidance.
  materialSlug: z.string().nullable().optional(),
  // The connective narrative for this step — the reason it earns its place in the sequence.
  guidance: z.string(),
  // Optional light timings (modules are hours-light; set where useful). Totals are summed if omitted.
  facilitatedHours: z.number().nullable().optional(),
  independentHours: z.number().nullable().optional(),
  // What learners do between or around sessions for this step (offline-friendly).
  independentTask: z.string().nullable().optional(),
});

export type ModuleStepKind = z.infer<typeof ModuleStepKindSchema>;
export type ModuleStep = z.infer<typeof ModuleStepSchema>;

export const ModuleSchema = z.object({
  id: z.string(),
  slug: z.string(),
  access: AccessSchema.optional(),
  grain: ModuleGrainSchema,
  title: z.string(),
  summary: z.string(),
  // The framework competency this module develops. For a competency module, THE competency; for a
  // skill module, the parent competency the skill belongs to. Validated against the framework in
  // validateGraph() (competency-code resolution + skill/parent grain agreement).
  competencyCode: z.string(),
  // Skill modules only: the specific skill, phrased as a capability the learner gains.
  skill: z.object({ label: z.string(), description: z.string() }).optional(),
  // How working through this module develops and demonstrates its MAIN competency (competencyCode).
  // Mirrors a course objective's anchorContribution: develops = how proficiency is built; demonstrates
  // = the evidence a learner produces that shows it.
  anchorContribution: z
    .object({ develops: z.string(), demonstrates: z.string() })
    .optional(),
  // OTHER framework competencies this module also develops and demonstrates (not its main one).
  // `how` says, in one line, how the work builds and shows that competency. Codes validated in
  // validateGraph(). Mirrors a material's competencyDevelopment.
  competencyDevelopment: z
    .array(z.object({ code: z.string(), how: z.string() }))
    .default([]),
  // Competency modules only: the ordered skill modules that make it up (skill-module slugs).
  skillModuleSlugs: z.array(z.string()).default([]),
  // Skill modules only: the competency module it rolls up into (back-link, optional).
  parentModuleSlug: z.string().nullable().optional(),
  // Ordered materials that make up this module (material slugs). Skill modules carry these directly;
  // a competency module may also carry its own framing/consolidation materials. This is the flat
  // membership list (used for indexing and material→module back-links); the ordered teaching sequence,
  // with connective guidance between materials, lives in `plan` below.
  materialSlugs: z.array(z.string()).default([]),
  // Optional mini scheme of work: an ordered sequence that incorporates the module's materials WITH the
  // connective guidance that links them into a coherent learning journey. When present, it is the
  // primary way to follow the module (the flat material list becomes a fallback). Modelled on Unit but
  // module-scoped and hours-light.
  plan: z
    .object({
      summary: z.string().nullable().optional(),
      totalFacilitatedHours: z.number().nullable().optional(),
      totalIndependentHours: z.number().nullable().optional(),
      steps: z.array(ModuleStepSchema).default([]),
    })
    .optional(),
  // How working through this module builds agency for positive change (the site's spine concept).
  agencyNote: z.string().nullable().optional(),
  sourceNotes: z.array(z.string()).default([]),
});

export type ModuleGrain = z.infer<typeof ModuleGrainSchema>;
export type Module = z.infer<typeof ModuleSchema>;

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
  // Optional longer-form explanation ("professional learning" depth) beyond the one-line
  // definition. Markdown-lite (paragraphs, "## " headings, bullets, [label](href) links); rendered
  // with <Prose gloss>, so sibling terms auto-link. Thin entries omit it and stay thin.
  explainer: z.string().nullable().optional(),
  // External references for educators who want to go deeper.
  furtherReading: z
    .array(
      z.object({
        title: z.string(),
        url: z.string(),
        source: z.string().nullable().optional(), // publisher / outlet, e.g. "Journal of Peace Research"
        note: z.string().nullable().optional(), // one line on why it's worth reading
      }),
    )
    .default([]),
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
