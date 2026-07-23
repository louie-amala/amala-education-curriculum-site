import { GlossedText } from "@/components/GlossedText";
import { findGlossaryMatches } from "@/lib/content";

// Lightweight prose renderer for material content. Handles paragraphs, "## " headings,
// and "- " / "* " bullet lists. A full MDX pipeline replaces this in a later phase.
// With `gloss`, glossary terms are marked on first mention, deduped across blocks (and
// continuing from `skip`, which carries terms already marked earlier on the page).
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

  const render = (s: string) => {
    if (!gloss) return s;
    const snapshot = [...used];
    findGlossaryMatches(s, used).forEach((m) => used.add(m.slug));
    return <GlossedText text={s} skip={snapshot} />;
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
                <li key={j}>{render(l.replace(/^[-*]\s+/, ""))}</li>
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
        return <p key={i}>{render(block)}</p>;
      })}
    </div>
  );
}
