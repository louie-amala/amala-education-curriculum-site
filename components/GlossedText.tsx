import { Term } from "@/components/Term";
import { findGlossaryMatches } from "@/lib/content";

// Renders plain text, marking the first mention of each glossary term as an interactive Term.
// Returns inline nodes only, so it is safe inside a <p>.
export function GlossedText({ text }: { text: string }) {
  const matches = findGlossaryMatches(text);
  if (matches.length === 0) return <>{text}</>;

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  matches.forEach((m, i) => {
    if (m.start > cursor) parts.push(text.slice(cursor, m.start));
    parts.push(
      <Term key={i} slug={m.slug} definition={m.definition}>
        {m.text}
      </Term>,
    );
    cursor = m.end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}
