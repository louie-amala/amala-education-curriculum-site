import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import {
  AgencySchema,
  AreaSchema,
  CompetencySchema,
  CourseSchema,
  FacilitationMaterialSchema,
  PrincipleSchema,
  ProficiencyScaleSchema,
  ProgrammeSchema,
  type Agency,
  type Area,
  type Competency,
  type Course,
  type FacilitationMaterial,
  type Objective,
  type Principle,
  type ProficiencyScale,
  type Programme,
} from "./schema";

// Build-time content layer over content-source/. Every file is validated against its
// Zod schema on load; cross-references are checked in validateGraph(). A failure throws,
// which fails `next build` — the spec's core safeguard (§12).

const ROOT = join(process.cwd(), "content-source");

function readYaml(...segments: string[]): unknown {
  return parse(readFileSync(join(ROOT, ...segments), "utf8"));
}

function listYaml(dir: string): string[] {
  return readdirSync(join(ROOT, dir))
    .filter((f) => f.endsWith(".yaml"))
    .sort();
}

function parseWith<T>(schema: { parse: (v: unknown) => T }, where: string, value: unknown): T {
  try {
    return schema.parse(value);
  } catch (err) {
    throw new Error(`Content validation failed in ${where}:\n${String(err)}`);
  }
}

// ---- load + validate each collection once (module-level cache) ----
function loadAreas(): Area[] {
  return (readYaml("framework", "areas.yaml") as unknown[]).map((a, i) =>
    parseWith(AreaSchema, `framework/areas.yaml[${i}]`, a),
  );
}
function loadCompetencies(): Competency[] {
  return (readYaml("framework", "competencies.yaml") as unknown[]).map((c, i) =>
    parseWith(CompetencySchema, `framework/competencies.yaml[${i}]`, c),
  );
}
function loadPrinciples(): Principle[] {
  return (readYaml("foundations", "principles.yaml") as unknown[]).map((p, i) =>
    parseWith(PrincipleSchema, `foundations/principles.yaml[${i}]`, p),
  );
}
function loadCourses(): Course[] {
  return listYaml("courses").map((f) =>
    parseWith(CourseSchema, `courses/${f}`, readYaml("courses", f)),
  );
}
function loadProgrammes(): Programme[] {
  return listYaml("programmes").map((f) =>
    parseWith(ProgrammeSchema, `programmes/${f}`, readYaml("programmes", f)),
  );
}

export const areas: Area[] = loadAreas();
export const competencies: Competency[] = loadCompetencies();
export const principles: Principle[] = loadPrinciples();
export const proficiencyScale: ProficiencyScale = parseWith(
  ProficiencyScaleSchema,
  "framework/proficiency-scale.yaml",
  readYaml("framework", "proficiency-scale.yaml"),
);
export const agency: Agency = parseWith(
  AgencySchema,
  "foundations/agency.yaml",
  readYaml("foundations", "agency.yaml"),
);
function loadMaterials(): FacilitationMaterial[] {
  if (!existsSync(join(ROOT, "materials"))) return [];
  return listYaml("materials").map((f) =>
    parseWith(FacilitationMaterialSchema, `materials/${f}`, readYaml("materials", f)),
  );
}

export const courses: Course[] = loadCourses();
export const programmes: Programme[] = loadProgrammes();
export const materials: FacilitationMaterial[] = loadMaterials();

// ---- objectives as addressable entities (id = `<courseId>--o<n>`) ----
export interface ObjectiveEntity {
  id: string;
  index: number;
  course: Course;
  objective: Objective;
}

const objectiveEntities: ObjectiveEntity[] = courses.flatMap((course) =>
  course.objectives.map((objective, i) => ({
    id: `${course.id}--o${i + 1}`,
    index: i + 1,
    course,
    objective,
  })),
);
const objectiveById = new Map(objectiveEntities.map((o) => [o.id, o]));

export function getAllObjectives(): ObjectiveEntity[] {
  return objectiveEntities;
}
export function getObjectiveById(id: string) {
  return objectiveById.get(id);
}
export function getCourseObjectives(course: Course): ObjectiveEntity[] {
  return objectiveEntities.filter((o) => o.course.id === course.id);
}
export function objectiveId(courseId: string, index1: number) {
  return `${courseId}--o${index1}`;
}

// ---- lookup maps ----
const competencyByCode = new Map(competencies.map((c) => [c.code, c]));
const competencyById = new Map(competencies.map((c) => [c.id, c]));
const areaById = new Map(areas.map((a) => [a.id, a]));
const principleById = new Map(principles.map((p) => [p.id, p]));
const courseById = new Map(courses.map((c) => [c.id, c]));

export function getArea(id: string) {
  return areaById.get(id);
}
export function getCompetencyByCode(code: string) {
  return competencyByCode.get(code);
}
export function getCompetencyById(id: string) {
  return competencyById.get(id);
}
export function getCourse(slug: string) {
  return courses.find((c) => c.slug === slug) ?? courseById.get(slug);
}
export function getPrinciple(id: string) {
  return principleById.get(id);
}
export function getProgramme(slug: string) {
  return programmes.find((p) => p.slug === slug);
}

// ---- reverse index: which courses/objectives evidence a competency ----
export interface EvidenceRef {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  objectiveId: string;
  objectiveStatement: string;
  condition: string;
  citedTitle?: string | null;
}

const evidenceByCompetencyCode = new Map<string, EvidenceRef[]>();
for (const course of courses) {
  course.objectives.forEach((obj, i) => {
    for (const ev of obj.competencyEvidence) {
      const list = evidenceByCompetencyCode.get(ev.code) ?? [];
      list.push({
        courseId: course.id,
        courseTitle: course.title,
        courseSlug: course.slug,
        objectiveId: `${course.id}--o${i + 1}`,
        objectiveStatement: obj.statement,
        condition: ev.condition,
        citedTitle: ev.citedTitle,
      });
      evidenceByCompetencyCode.set(ev.code, list);
    }
  });
}
export function getEvidenceForCompetency(code: string): EvidenceRef[] {
  return evidenceByCompetencyCode.get(code) ?? [];
}

// distinct competencies a course evidences (with the objectives that do so)
export function getCourseCompetencies(course: Course): Competency[] {
  const codes = new Set<string>();
  for (const obj of course.objectives) {
    for (const ev of obj.competencyEvidence) codes.add(ev.code);
  }
  return [...codes]
    .map((code) => competencyByCode.get(code))
    .filter((c): c is Competency => Boolean(c));
}

export function getAreaCompetencies(areaId: string): Competency[] {
  return competencies.filter((c) => c.areaId === areaId);
}

export function getProgrammeForCourse(courseId: string): Programme | undefined {
  return programmes.find(
    (p) =>
      p.streams.some((s) => s.courses.some((c) => c.courseId === courseId)) ||
      p.ongoingComponents.some((c) => c.courseId === courseId),
  );
}

export function getCourseStream(courseId: string) {
  for (const p of programmes) {
    for (const s of p.streams) {
      if (s.courses.some((c) => c.courseId === courseId)) return { programme: p, stream: s };
    }
  }
  return undefined;
}

// ---- materials indexes ----
const materialBySlug = new Map(materials.map((m) => [m.slug, m]));
const materialsByObjectiveId = new Map<string, FacilitationMaterial[]>();
for (const m of materials) {
  for (const oid of m.objectiveIds) {
    const list = materialsByObjectiveId.get(oid) ?? [];
    list.push(m);
    materialsByObjectiveId.set(oid, list);
  }
}

export function getMaterial(slug: string) {
  return materialBySlug.get(slug);
}
export function getMaterialsForObjective(objectiveIdValue: string): FacilitationMaterial[] {
  return materialsByObjectiveId.get(objectiveIdValue) ?? [];
}
export function getMaterialsForCourse(course: Course): FacilitationMaterial[] {
  const ids = new Set(getCourseObjectives(course).map((o) => o.id));
  return materials.filter((m) => m.objectiveIds.some((oid) => ids.has(oid)));
}
export function getMaterialsForCompetencyCode(code: string): FacilitationMaterial[] {
  return materials.filter((m) => m.competencyCodes.includes(code));
}

// For a material, the "if learners…" conditions (from the objectives it serves) that explain
// HOW it evidences each competency code it claims.
export function getEvidenceConditionsForMaterial(
  material: FacilitationMaterial,
): Map<string, string[]> {
  const byCode = new Map<string, string[]>();
  for (const oid of material.objectiveIds) {
    const oe = objectiveById.get(oid);
    if (!oe) continue;
    for (const ev of oe.objective.competencyEvidence) {
      if (!material.competencyCodes.includes(ev.code)) continue;
      const arr = byCode.get(ev.code) ?? [];
      if (!arr.includes(ev.condition)) arr.push(ev.condition);
      byCode.set(ev.code, arr);
    }
  }
  return byCode;
}

// ---- cross-reference validation (build-time gate) ----
export interface ValidationReport {
  errors: string[];
  warnings: string[];
}

export function validateGraph(): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validPrincipleIds = new Set(principles.map((p) => p.id));

  for (const course of courses) {
    for (const obj of course.objectives) {
      for (const ev of obj.competencyEvidence) {
        const comp = competencyByCode.get(ev.code);
        if (!comp) {
          errors.push(`Course "${course.id}" cites unknown competency code "${ev.code}".`);
        } else if (
          ev.citedTitle &&
          ev.citedTitle.trim().toLowerCase() !== comp.title.trim().toLowerCase()
        ) {
          warnings.push(
            `Course "${course.id}" cites ${ev.code} as "${ev.citedTitle}" but framework title is "${comp.title}".`,
          );
        }
      }
    }
    for (const pm of course.principleMappings) {
      if (!validPrincipleIds.has(pm.principle)) {
        errors.push(`Course "${course.id}" maps unknown principle "${pm.principle}".`);
      }
    }
    const mapped = new Set(course.principleMappings.map((m) => m.principle));
    for (const p of principles) {
      if (!mapped.has(p.id)) {
        warnings.push(`Course "${course.id}" has no mapping for principle "${p.id}".`);
      }
    }
  }

  for (const area of areas) {
    for (const cid of area.competencyIds) {
      if (!competencyById.has(cid)) {
        errors.push(`Area "${area.id}" lists unknown competency "${cid}".`);
      }
    }
  }

  for (const prog of programmes) {
    const refs = [
      ...prog.streams.flatMap((s) => s.courses.map((c) => c.courseId)),
      ...prog.ongoingComponents.map((c) => c.courseId),
    ];
    for (const cid of refs) {
      if (!courseById.has(cid)) {
        errors.push(`Programme "${prog.id}" references unknown course "${cid}".`);
      }
    }
  }

  const materialSlugs = new Set(materials.map((m) => m.slug));
  for (const m of materials) {
    for (const code of m.competencyCodes) {
      if (!competencyByCode.has(code)) {
        errors.push(`Material "${m.slug}" cites unknown competency code "${code}".`);
      }
    }
    for (const oid of m.objectiveIds) {
      if (!objectiveById.has(oid)) {
        errors.push(`Material "${m.slug}" references unknown objective "${oid}".`);
      }
    }
    for (const pid of m.principlesForegrounded) {
      if (!validPrincipleIds.has(pid)) {
        errors.push(`Material "${m.slug}" foregrounds unknown principle "${pid}".`);
      }
    }
    for (const rel of m.relatedSlugs) {
      if (!materialSlugs.has(rel)) {
        warnings.push(`Material "${m.slug}" links unresolved related material "${rel}".`);
      }
    }
    if (m.type === "tools-approaches" && !m.toolsFacet) {
      warnings.push(`Tools material "${m.slug}" has no toolsFacet.`);
    }
  }

  return { errors, warnings };
}

// Run the gate as a side effect of loading the content layer in production builds.
const report = validateGraph();
if (report.errors.length > 0) {
  throw new Error(
    `Content graph validation failed with ${report.errors.length} error(s):\n- ` +
      report.errors.join("\n- "),
  );
}
