import Link from "next/link";
import { GlossedText } from "@/components/GlossedText";
import { findGlossaryMatches } from "@/lib/content";

// Lightweight prose renderer for material content. Handles paragraphs, "## " headings,
// "- " / "* " bullet lists, and inline markdown links [label](href) (internal href starting
// with "/" becomes a Next Link; anything else opens in a new tab). With `gloss`, glossary terms
// are marked on first mention, deduped across blocks (and continuing from `skip`).
const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

export function Prose({
  text,
  gloss = false,
  skip,
}: {
  text: string;
  gloss?: boolean;
  skip?: string[];
}) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const used = new Set<string>(skip ?? []);

  // Render a run of text: split out inline links, gloss the rest.
  const render = (s: string, keyBase: string): React.ReactNode => {
    const glossSeg = (seg: string, k: string) => {
      if (!gloss) return seg;
      const snapshot = [...used];
      findGlossaryMatches(seg, used).forEach((m) => used.add(m.slug));
      return <GlossedText key={k} text={seg} skip={snapshot} />;
    };
    const parts: React.ReactNode[] = [];
    let last = 0;
    let i = 0;
    let m: RegExpExecArray | null;
    LINK_RE.lastIndex = 0;
    while ((m = LINK_RE.exec(s)) !== null) {
      if (m.index > last) parts.push(glossSeg(s.slice(last, m.index), `${keyBase}-t${i++}`));
      const [, label, href] = m;
      parts.push(
        href.startsWith("/") ? (
          <Link key={`${keyBase}-l${i++}`} href={href} className="font-medium text-navy underline underline-offset-2 hover:no-underline">
            {label}
          </Link>
        ) : (
          <a key={`${keyBase}-l${i++}`} href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-navy underline underline-offset-2 hover:no-underline">
            {label}
          </a>
        ),
      );
      last = m.index + m[0].length;
    }
    if (last < s.length) parts.push(glossSeg(s.slice(last), `${keyBase}-t${i++}`));
    return parts.length > 0 ? parts : glossSeg(s, `${keyBase}-t0`);
  };

  return (
    <div className="space-y-3 text-dark-navy/90">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const isList = lines.every((l) => /^[-*]\s+/.test(l.trim()));
        if (isList) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{render(l.replace(/^[-*]\s+/, ""), `${i}-${j}`)}</li>
              ))}
            </ul>
          );
        }
        if (block.startsWith("## ")) {
          return (
            <h3 key={i} className="font-heading text-lg font-semibold text-dark-navy">
              {block.replace(/^##\s+/, "")}
            </h3>
          );
        }
        if (block.startsWith("### ")) {
          return (
            <h4 key={i} className="font-heading font-semibold text-dark-navy">
              {block.replace(/^###\s+/, "")}
            </h4>
          );
        }
        return <p key={i}>{render(block, String(i))}</p>;
      })}
    </div>
  );
}
