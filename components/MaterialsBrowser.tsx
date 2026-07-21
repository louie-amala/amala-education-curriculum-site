"use client";

import { useMemo, useState } from "react";
import { MaterialCard, type MaterialCardData } from "@/components/MaterialCard";
import type { FacilitationContext, MaterialType } from "@/lib/schema";

export interface BrowserItem extends MaterialCardData {
  courseIds: string[];
}

const TYPES: { value: MaterialType; label: string }[] = [
  { value: "activity", label: "Activities" },
  { value: "tools-approaches", label: "Tools & approaches" },
  { value: "concept", label: "Concepts" },
  { value: "case-study", label: "Case studies" },
  { value: "resource", label: "Resources" },
];

const CONTEXTS: { value: FacilitationContext; label: string }[] = [
  { value: "group", label: "Group" },
  { value: "one-to-one-mentoring", label: "Mentoring" },
  { value: "independent", label: "Independent" },
];

export function MaterialsBrowser({
  items,
  courses,
}: {
  items: BrowserItem[];
  courses: { id: string; title: string }[];
}) {
  const [type, setType] = useState<string>("all");
  const [context, setContext] = useState<string>("all");
  const [course, setCourse] = useState<string>("all");

  const filtered = useMemo(
    () =>
      items.filter(
        (m) =>
          (type === "all" || m.type === type) &&
          (context === "all" || m.facilitationContext.includes(context as FacilitationContext)) &&
          (course === "all" || m.courseIds.includes(course)),
      ),
    [items, type, context, course],
  );

  return (
    <div>
      <div className="flex flex-wrap gap-4 rounded-lg border border-cool-grey/20 bg-white p-4">
        <Filter label="Type" value={type} onChange={setType} options={[{ value: "all", label: "All types" }, ...TYPES]} />
        <Filter label="Context" value={context} onChange={setContext} options={[{ value: "all", label: "Any context" }, ...CONTEXTS]} />
        <Filter
          label="Course"
          value={course}
          onChange={setCourse}
          options={[{ value: "all", label: "All courses" }, ...courses.map((c) => ({ value: c.id, label: c.title }))]}
        />
      </div>

      <p className="mt-4 text-sm text-cool-grey">
        {filtered.length} {filtered.length === 1 ? "material" : "materials"}
      </p>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-lg bg-cool-grey/5 p-4 text-cool-grey">No materials match these filters.</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <li key={m.slug}>
              <MaterialCard material={m} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-cool-grey">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-cool-grey/40 bg-white px-3 py-1.5 text-dark-navy"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
