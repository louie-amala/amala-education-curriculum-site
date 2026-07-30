import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import {
  AgencySchema,
  AreaSchema,
  CompetencySchema,
  CourseSchema,
  FacilitationMaterialSchema,
  GlossaryTermSchema,
  ModuleSchema,
  PrincipleSchema,
  ProficiencyScaleSchema,
  ProgrammeSchema,
  UnitSchema,
  type Agency,
  type Area,
  type Competency,
  type Course,
  type FacilitationMaterial,
  type GlossaryTerm,
  type Module,
  type Objective,
  type Principle,
  type ProficiencyScale,
  type Programme,
  type Unit,
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

function loadGlossary(): GlossaryTerm[] {
  if (!existsSync(join(ROOT, "glossary"))) return [];
  return listYaml("glossary").map((f) =>
    parseWith(GlossaryTermSchema, `glossary/${f}`, readYaml("glossary", f)),
  );
}

function loadUnits(): Unit[] {
  if (!existsSync(join(ROOT, "units"))) return [];
  return listYaml("units").map((f) =>
    parseWith(UnitSchema, `units/${f}`, readYaml("units", f)),
  );
}

function loadModules(): Module[] {
  if (!existsSync(join(ROOT, "modules"))) return [];
  return listYaml("modules").map((f) =>
    parseWith(ModuleSchema, `modules/${f}`, readYaml("modules", f)),
  );
}

export const courses: Course[] = loadCourses();
export const programmes: Programme[] = loadProgrammes();
export const materials: FacilitationMaterial[] = loadMaterials();
export const glossaryTerms: GlossaryTerm[] = loadGlossary();
export const units: Unit[] = loadUnits();
export const modules: Module[] = loadModules();

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
export function getUnit(slug: string) {
  return units.find((u) => u.slug === slug);
}
export function getUnitsForProgramme(programmeSlug: string): Unit[] {
  return units.filter((u) => u.programmeSlug === programmeSlug);
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
  const course = courseById.get(courseId);
  return programmes.find(
    (p) =>
      p.streams.some((s) => s.courses.some((c) => c.courseId === courseId)) ||
      p.ongoingComponents.some((c) => c.courseId === courseId) ||
      // component-based programmes (e.g. Learning Bridge) link by course slug
      p.components.some((c) => c.courseSlug && course && c.courseSlug === course.slug),
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
// Materials tagged with an `edition` (a contextualised programme edition, e.g. the Cox's Bazar
// Learning Bridge) keep their own page but are excluded from the generic library, search, and
// objective/course/competency listings. `libraryMaterials` is the generic-only view those surfaces use.
export const libraryMaterials: FacilitationMaterial[] = materials.filter((m) => !m.edition);

const materialBySlug = new Map(materials.map((m) => [m.slug, m]));
const materialsByObjectiveId = new Map<string, FacilitationMaterial[]>();
for (const m of libraryMaterials) {
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
// Edition-specific materials for an objective (the generic index above excludes them).
export function getEditionMaterialsForObjective(
  objectiveIdValue: string,
  edition: string,
): FacilitationMaterial[] {
  return materials.filter(
    (m) => m.edition === edition && m.objectiveIds.includes(objectiveIdValue),
  );
}
export function getMaterialsForCourse(course: Course): FacilitationMaterial[] {
  const ids = new Set(getCourseObjectives(course).map((o) => o.id));
  return libraryMaterials.filter((m) => m.objectiveIds.some((oid) => ids.has(oid)));
}
export function getMaterialsForCompetencyCode(code: string): FacilitationMaterial[] {
  return libraryMaterials.filter((m) => m.competencyCodes.includes(code));
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

// ---- modules (competency / skill modules) ----
// Modules tagged with an `access` other than public still load; visibility filtering is a UI concern.
const moduleBySlug = new Map(modules.map((m) => [m.slug, m]));
export const competencyModules = modules.filter((m) => m.grain === "competency");
export const skillModules = modules.filter((m) => m.grain === "skill");

export function getModule(slug: string) {
  return moduleBySlug.get(slug);
}
// Competency modules that develop a given framework competency code.
export function getCompetencyModulesForCode(code: string): Module[] {
  return competencyModules.filter((m) => m.competencyCode === code);
}
// The ordered skill modules that make up a competency module.
export function getSkillModulesFor(mod: Module): Module[] {
  return mod.skillModuleSlugs
    .map((s) => moduleBySlug.get(s))
    .filter((m): m is Module => Boolean(m));
}
// The materials a module directly sequences.
export function getModuleMaterials(mod: Module): FacilitationMaterial[] {
  return mod.materialSlugs
    .map((s) => materialBySlug.get(s))
    .filter((m): m is FacilitationMaterial => Boolean(m));
}
// Every module (skill or competency) that includes a given material.
export function getModulesForMaterial(slug: string): Module[] {
  return modules.filter(
    (m) => m.materialSlugs.includes(slug) || getSkillModulesFor(m).some((s) => s.materialSlugs.includes(slug)),
  );
}

// ---- glossary + term matching (§4.4) ----
const termBySlug = new Map(glossaryTerms.map((t) => [t.slug, t]));
export function getGlossaryTerm(slug: string) {
  return termBySlug.get(slug);
}

interface PhraseEntry {
  detect: string; // full phrase to look for (lowercase, brackets stripped)
  linkOffset: number; // where the linked span starts within the detected phrase
  linkLength: number; // how much of it becomes the link
  slug: string;
  definition: string;
}

// A match phrase may wrap part of itself in [brackets] to mark the span that becomes the link.
// "[primary] and secondary research" detects the whole phrase but links only "primary", leaving
// "secondary research" free to match its own term.
function parsePhrase(raw: string): { detect: string; linkOffset: number; linkLength: number } {
  const open = raw.indexOf("[");
  const close = raw.indexOf("]");
  if (open === -1 || close === -1 || close < open) {
    return { detect: raw, linkOffset: 0, linkLength: raw.length };
  }
  const detect = raw.slice(0, open) + raw.slice(open + 1, close) + raw.slice(close + 1);
  return { detect, linkOffset: open, linkLength: close - open - 1 };
}

// longest phrases first, so a term's most specific phrase wins
const phraseIndex: PhraseEntry[] = glossaryTerms
  .flatMap((t) =>
    t.matchPhrases.map((p) => {
      const { detect, linkOffset, linkLength } = parsePhrase(p);
      return {
        detect: detect.toLowerCase(),
        linkOffset,
        linkLength,
        slug: t.slug,
        definition: t.definition,
      };
    }),
  )
  .sort((a, b) => b.detect.length - a.detect.length);

function firstBoundedIndex(haystackLower: string, haystack: string, needleLower: string): number {
  let from = 0;
  let idx = haystackLower.indexOf(needleLower, from);
  while (idx !== -1) {
    const before = idx === 0 ? "" : haystack[idx - 1];
    const afterPos = idx + needleLower.length;
    const after = afterPos >= haystack.length ? "" : haystack[afterPos];
    const okBefore = before === "" || /[^A-Za-z0-9]/.test(before);
    const okAfter = after === "" || /[^A-Za-z0-9]/.test(after);
    if (okBefore && okAfter) return idx;
    from = idx + 1;
    idx = haystackLower.indexOf(needleLower, from);
  }
  return -1;
}

export interface GlossaryMatch {
  start: number;
  end: number;
  slug: string;
  text: string;
  definition: string;
}

// First mention per term, non-overlapping, longest phrase wins. Pass `skip` with terms already
// marked earlier on the page so a term links once per page, not once per block.
export function findGlossaryMatches(text: string, skip?: Iterable<string>): GlossaryMatch[] {
  if (!text || phraseIndex.length === 0) return [];
  const lower = text.toLowerCase();
  const raw: GlossaryMatch[] = [];
  const usedSlug = new Set<string>(skip ?? []);
  for (const p of phraseIndex) {
    if (usedSlug.has(p.slug)) continue;
    const idx = firstBoundedIndex(lower, text, p.detect);
    if (idx >= 0) {
      const start = idx + p.linkOffset;
      const end = start + p.linkLength;
      raw.push({ start, end, slug: p.slug, text: text.slice(start, end), definition: p.definition });
      usedSlug.add(p.slug);
    }
  }
  raw.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
  const out: GlossaryMatch[] = [];
  let lastEnd = -1;
  for (const m of raw) {
    if (m.start >= lastEnd) {
      out.push(m);
      lastEnd = m.end;
    }
  }
  return out;
}

export interface ExploredIn {
  competencies: { code: string; title: string }[];
  materials: { slug: string; title: string; type: string }[];
}
export function getExploredIn(term: GlossaryTerm): ExploredIn {
  const phrases = term.matchPhrases.map((p) => parsePhrase(p).detect.toLowerCase());
  const has = (s?: string | null) =>
    !!s && phrases.some((p) => firstBoundedIndex(s.toLowerCase(), s, p) >= 0);
  const comps = competencies
    .filter((c) => has(c.goal))
    .map((c) => ({ code: c.code, title: c.title }));
  const mats = materials
    .filter(
      (m) =>
        has(m.summary) ||
        has(m.facilitationNotes) ||
        has(m.educatorContent) ||
        has(m.learnerContent) ||
        has(m.whatLearnersDo.join(" ")) ||
        has(m.steps.map((s) => `${s.guidance} ${s.keyPrompts.join(" ")}`).join(" ")),
    )
    .map((m) => ({ slug: m.slug, title: m.title, type: m.type }));
  return { competencies: comps, materials: mats };
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
    if (course.throughline && !competencyByCode.has(course.throughline.anchorCompetency)) {
      errors.push(
        `Course "${course.id}" throughline anchors unknown competency "${course.throughline.anchorCompetency}".`,
      );
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
    for (const comp of prog.components) {
      if (comp.courseSlug && !getCourse(comp.courseSlug)) {
        errors.push(
          `Programme "${prog.id}" component "${comp.title}" links unknown course "${comp.courseSlug}".`,
        );
      }
    }
  }

  const materialSlugs = new Set(materials.map((m) => m.slug));
  const programmeSlugs = new Set(programmes.map((p) => p.slug));
  for (const m of materials) {
    if (m.edition && !programmeSlugs.has(m.edition)) {
      errors.push(`Material "${m.slug}" names unknown edition "${m.edition}" (no such programme).`);
    }
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
    for (const pa of m.principleAlignment) {
      if (!validPrincipleIds.has(pa.principle)) {
        errors.push(`Material "${m.slug}" aligns to unknown principle "${pa.principle}".`);
      }
    }
    for (const cd of m.competencyDevelopment) {
      if (!competencyByCode.has(cd.code)) {
        errors.push(`Material "${m.slug}" develops unknown competency code "${cd.code}".`);
      }
    }
    for (const da of m.deliveryAdaptations) {
      if (!m.facilitationContext.includes(da.context)) {
        errors.push(
          `Material "${m.slug}" has a delivery adaptation for "${da.context}", which is not in its facilitationContext.`,
        );
      }
    }
    if (m.primaryContext && !m.facilitationContext.includes(m.primaryContext)) {
      errors.push(
        `Material "${m.slug}" has primaryContext "${m.primaryContext}" not in its facilitationContext.`,
      );
    }
    for (const ctx of m.facilitationContext) {
      if (m.deliveryAdaptations.length > 0 && !m.deliveryAdaptations.some((d) => d.context === ctx)) {
        warnings.push(`Material "${m.slug}" lists context "${ctx}" with no delivery adaptation.`);
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
    if (
      m.diagram &&
      m.diagram.src.startsWith("/") &&
      !existsSync(join(process.cwd(), "public", m.diagram.src))
    ) {
      errors.push(`Material "${m.slug}" diagram points to missing file "${m.diagram.src}".`);
    }
    for (const d of m.downloads) {
      if (d.file.startsWith("/") && !existsSync(join(process.cwd(), "public", d.file))) {
        errors.push(`Material "${m.slug}" download "${d.label}" points to missing file "${d.file}".`);
      }
    }
  }

  const termSlugs = new Set(glossaryTerms.map((t) => t.slug));
  for (const t of glossaryTerms) {
    for (const rel of t.relatedTermIds) {
      if (!termSlugs.has(rel)) {
        errors.push(`Glossary term "${t.slug}" links unknown related term "${rel}".`);
      }
    }
    if (t.matchPhrases.length === 0) {
      warnings.push(`Glossary term "${t.slug}" has no matchPhrases (it will never be marked in text).`);
    }
  }

  const programmeSlugSet = new Set(programmes.map((p) => p.slug));
  for (const u of units) {
    if (!programmeSlugSet.has(u.programmeSlug)) {
      errors.push(`Unit "${u.slug}" references unknown programme "${u.programmeSlug}".`);
    }
    if (u.courseSlug && !getCourse(u.courseSlug)) {
      errors.push(`Unit "${u.slug}" references unknown course "${u.courseSlug}".`);
    }
    let facSum = 0;
    let indSum = 0;
    for (const phase of u.phases) {
      if (phase.objectiveId && !objectiveById.has(phase.objectiveId)) {
        errors.push(`Unit "${u.slug}" phase "${phase.title}" references unknown objective "${phase.objectiveId}".`);
      }
      for (const b of phase.blocks) {
        facSum += b.facilitatedHours;
        indSum += b.independentHours;
        if (b.materialSlug && !materialBySlug.has(b.materialSlug)) {
          errors.push(
            `Unit "${u.slug}" block "${b.title}" references unknown material "${b.materialSlug}".`,
          );
        }
      }
    }
    if (Math.abs(facSum - u.totalFacilitatedHours) > 0.001) {
      warnings.push(
        `Unit "${u.slug}" facilitated hours (${facSum}) do not match the total (${u.totalFacilitatedHours}).`,
      );
    }
    if (Math.abs(indSum - u.totalIndependentHours) > 0.001) {
      warnings.push(
        `Unit "${u.slug}" independent hours (${indSum}) do not match the total (${u.totalIndependentHours}).`,
      );
    }
    for (const d of u.downloads) {
      if (d.file.startsWith("/") && !existsSync(join(process.cwd(), "public", d.file))) {
        errors.push(`Unit "${u.slug}" download "${d.label}" points to missing file "${d.file}".`);
      }
    }
  }

  for (const mod of modules) {
    if (!competencyByCode.has(mod.competencyCode)) {
      errors.push(`Module "${mod.slug}" develops unknown competency code "${mod.competencyCode}".`);
    }
    for (const s of mod.materialSlugs) {
      if (!materialBySlug.has(s)) {
        errors.push(`Module "${mod.slug}" references unknown material "${s}".`);
      }
    }
    if (mod.grain === "skill") {
      if (!mod.skill) {
        warnings.push(`Skill module "${mod.slug}" has no skill{} label/description.`);
      }
      if (mod.skillModuleSlugs.length > 0) {
        errors.push(`Skill module "${mod.slug}" lists skillModuleSlugs (only competency modules may).`);
      }
      if (mod.parentModuleSlug) {
        const parent = moduleBySlug.get(mod.parentModuleSlug);
        if (!parent) {
          errors.push(`Skill module "${mod.slug}" names unknown parent module "${mod.parentModuleSlug}".`);
        } else if (parent.grain !== "competency") {
          errors.push(`Skill module "${mod.slug}" parent "${mod.parentModuleSlug}" is not a competency module.`);
        } else if (!parent.skillModuleSlugs.includes(mod.slug)) {
          warnings.push(`Skill module "${mod.slug}" names parent "${parent.slug}" but is not listed in its skillModuleSlugs.`);
        }
      }
    } else {
      // competency module
      if (mod.skill) {
        warnings.push(`Competency module "${mod.slug}" carries a skill{} label (skill modules only).`);
      }
      for (const s of mod.skillModuleSlugs) {
        const child = moduleBySlug.get(s);
        if (!child) {
          errors.push(`Competency module "${mod.slug}" references unknown skill module "${s}".`);
        } else if (child.grain !== "skill") {
          errors.push(`Competency module "${mod.slug}" lists "${s}", which is not a skill module.`);
        } else if (child.competencyCode !== mod.competencyCode) {
          warnings.push(
            `Competency module "${mod.slug}" (${mod.competencyCode}) includes skill module "${s}" whose competency is "${child.competencyCode}".`,
          );
        }
      }
    }
  }

  return { errors, warnings };
}

// ---- site-wide search index (built once, embedded in the /search page) ----
export type SearchKind =
  | "Material"
  | "Module"
  | "Course"
  | "Competency"
  | "Objective"
  | "Glossary"
  | "Programme"
  | "Foundation";

export interface SearchRecord {
  id: string;
  kind: SearchKind;
  /** Human label for the badge, e.g. "Activity", "Tool & approach", "Course". */
  kindLabel: string;
  title: string;
  /** A short one-line description shown under the title. */
  subtitle: string;
  url: string;
  /** Extra tokens folded into the haystack but not displayed (codes, phrases, etc.). */
  keywords: string;
}

const MATERIAL_KIND_LABELS: Record<string, string> = {
  activity: "Activity",
  "tools-approaches": "Tool & approach",
  concept: "Concept",
  "case-study": "Case study",
  resource: "Resource",
};

function clip(s: string, max = 160): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

/**
 * Build the flat list of everything searchable on the site. Called at build time
 * from the /search page and passed to the client explorer, so it stays static.
 */
export function getSearchIndex(): SearchRecord[] {
  const records: SearchRecord[] = [];

  for (const m of libraryMaterials) {
    const courseTitles = [
      ...new Set(
        m.objectiveIds
          .map((oid) => objectiveById.get(oid)?.course.title)
          .filter((x): x is string => Boolean(x)),
      ),
    ];
    records.push({
      id: `material:${m.slug}`,
      kind: "Material",
      kindLabel: MATERIAL_KIND_LABELS[m.type] ?? "Material",
      title: m.title,
      subtitle: clip(m.summary ?? ""),
      url: `/materials/${m.slug}`,
      keywords: [m.type, m.toolsFacet, ...m.competencyCodes, ...courseTitles]
        .filter(Boolean)
        .join(" "),
    });
  }

  for (const c of courses) {
    records.push({
      id: `course:${c.slug}`,
      kind: "Course",
      kindLabel: "Course",
      title: c.title,
      subtitle: clip(c.strapline || c.purpose),
      url: `/courses/${c.slug}`,
      keywords: c.programmes.join(" "),
    });
  }

  for (const mod of modules) {
    const comp = competencyByCode.get(mod.competencyCode);
    records.push({
      id: `module:${mod.slug}`,
      kind: "Module",
      kindLabel: mod.grain === "competency" ? "Competency module" : "Skill module",
      title: mod.skill?.label ?? mod.title,
      subtitle: clip(mod.summary),
      url: `/modules/${mod.slug}`,
      keywords: [mod.competencyCode, comp?.title, mod.grain, "module"].filter(Boolean).join(" "),
    });
  }

  for (const c of competencies) {
    records.push({
      id: `competency:${c.code}`,
      kind: "Competency",
      kindLabel: "Competency",
      title: `${c.code} — ${c.title}`,
      subtitle: clip(c.goal || c.title),
      url: `/competencies/${c.code.toLowerCase()}`,
      keywords: [c.code, c.areaId].join(" "),
    });
  }

  for (const o of objectiveEntities) {
    records.push({
      id: `objective:${o.id}`,
      kind: "Objective",
      kindLabel: "Objective",
      title: `${o.course.title}: Objective ${o.index}`,
      subtitle: clip(o.objective.statement),
      url: `/objectives/${o.id}`,
      keywords: o.course.title,
    });
  }

  for (const t of glossaryTerms) {
    records.push({
      id: `glossary:${t.slug}`,
      kind: "Glossary",
      kindLabel: "Glossary",
      title: t.term,
      subtitle: clip(t.definition),
      url: `/glossary/${t.slug}`,
      keywords: [t.category, ...t.matchPhrases].join(" "),
    });
  }

  for (const p of programmes) {
    records.push({
      id: `programme:${p.slug}`,
      kind: "Programme",
      kindLabel: "Programme",
      title: p.title,
      subtitle: clip(p.summary),
      url: `/programmes/${p.slug}`,
      keywords: "",
    });
  }

  for (const p of principles) {
    records.push({
      id: `principle:${p.id}`,
      kind: "Foundation",
      kindLabel: "Principle",
      title: p.statement,
      subtitle: clip(p.gloss),
      url: `/foundations#${p.id}`,
      keywords: "principle",
    });
  }

  records.push({
    id: "foundation:agency",
    kind: "Foundation",
    kindLabel: "Foundation",
    title: "Agency for positive change",
    subtitle: clip(agency.definition),
    url: "/foundations",
    keywords: ["agency", ...agency.indicators.map((i) => i.label)].join(" "),
  });

  return records;
}

// Run the gate as a side effect of loading the content layer in production builds.
const report = validateGraph();
if (report.errors.length > 0) {
  throw new Error(
    `Content graph validation failed with ${report.errors.length} error(s):\n- ` +
      report.errors.join("\n- "),
  );
}
