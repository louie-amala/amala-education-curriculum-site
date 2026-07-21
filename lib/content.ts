import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

// Minimal build-time loader over content-source/. This is a placeholder for the
// schema-validated loader (Zod) that Phase 0 will formalise; for now it just reads
// the verified YAML dataset so the homepage can show live counts.
const ROOT = join(process.cwd(), "content-source");

function loadYaml<T>(...segments: string[]): T {
  return parse(readFileSync(join(ROOT, ...segments), "utf8")) as T;
}

function countDir(dir: string): number {
  return readdirSync(join(ROOT, dir)).filter((f) => f.endsWith(".yaml")).length;
}

export interface DatasetSummary {
  programmes: number;
  courses: number;
  competencies: number;
  areas: number;
  principles: number;
  objectives: number;
  evidenceLinks: number;
}

export function getDatasetSummary(): DatasetSummary {
  const competencies = loadYaml<unknown[]>("framework", "competencies.yaml");
  const areas = loadYaml<unknown[]>("framework", "areas.yaml");
  const principles = loadYaml<unknown[]>("foundations", "principles.yaml");

  let objectives = 0;
  let evidenceLinks = 0;
  const courseFiles = readdirSync(join(ROOT, "courses")).filter((f) => f.endsWith(".yaml"));
  for (const file of courseFiles) {
    const course = loadYaml<{ objectives?: { competencyEvidence?: unknown[] }[] }>("courses", file);
    for (const obj of course.objectives ?? []) {
      objectives += 1;
      evidenceLinks += (obj.competencyEvidence ?? []).length;
    }
  }

  return {
    programmes: countDir("programmes"),
    courses: courseFiles.length,
    competencies: competencies.length,
    areas: areas.length,
    principles: principles.length,
    objectives,
    evidenceLinks,
  };
}
