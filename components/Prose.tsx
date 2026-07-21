// Lightweight prose renderer for material content. Handles paragraphs, "## " headings,
// and "- " / "* " bullet lists. A full MDX pipeline replaces this in a later phase.
export function Prose({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-3 text-dark-navy/90">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const isList = lines.every((l) => /^[-*]\s+/.test(l.trim()));
        if (isList) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{l.replace(/^[-*]\s+/, "")}</li>
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
        return <p key={i}>{block}</p>;
      })}
    </div>
  );
}
