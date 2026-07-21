import Link from "next/link";
import type { FacilitationContext, MaterialType } from "@/lib/schema";
import { CONTEXT_LABEL, typeMeta } from "@/lib/ui";

export interface MaterialCardData {
  slug: string;
  title: string;
  summary?: string | null;
  type: MaterialType;
  toolsFacet?: string;
  facilitationContext: FacilitationContext[];
}

export function MaterialCard({ material }: { material: MaterialCardData }) {
  const t = typeMeta(material.type);
  return (
    <Link
      href={`/materials/${material.slug}`}
      className={`block h-full rounded-lg border-l-4 ${t.border} border-y border-r border-cool-grey/20 bg-white p-4 shadow-sm transition hover:shadow-md`}
    >
      <div className="flex items-center gap-2">
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${t.bg} ${t.text}`}>
          {t.label}
          {material.toolsFacet ? ` · ${material.toolsFacet}` : ""}
        </span>
      </div>
      <h3 className="mt-2 font-heading font-semibold text-dark-navy">{material.title}</h3>
      {material.summary && <p className="mt-1 text-sm text-cool-grey">{material.summary}</p>}
      {material.facilitationContext.length > 0 && (
        <p className="mt-2 text-xs text-cool-grey">
          {material.facilitationContext.map((c) => CONTEXT_LABEL[c] ?? c).join(" · ")}
        </p>
      )}
    </Link>
  );
}
