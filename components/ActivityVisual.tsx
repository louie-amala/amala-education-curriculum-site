import type { ActivityVisual as Visual, ActivityVisualSpec } from "@/lib/schema";

// Schematic diagrams that help an educator picture an activity: how to SET IT UP, and what the
// finished OUTPUT looks like. Drawn from a compact YAML spec so every activity shares one visual
// language (see ActivityVisualSchema in lib/schema.ts). Pure SVG, safe in a server component.

const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

// Tone → accent colour, by meaning rather than raw colour (matches tailwind.config.ts palette).
const TONE: Record<string, string> = {
  neutral: "#004976", // navy
  known: "#4797A8", // teal, what we already have
  question: "#EF9600", // orange, what we still need to find out
  positive: "#8F993E", // olive
  warn: "#BD472A", // terracotta
};

const INK = "#20293B";
const INK_SOFT = "#5A6473";
const LINE = "#E7E3DA";
const CARD = "#FFFFFF";

// Approximate character budget for a given pixel width at a given font size.
function fit(text: string, widthPx: number, fontPx: number): string {
  const max = Math.max(3, Math.floor(widthPx / (fontPx * 0.55)));
  return text.length <= max ? text : text.slice(0, max - 1).trimEnd() + "…";
}

// Greedy word-wrap into at most `maxLines` lines for the given width.
function wrap(text: string, widthPx: number, fontPx: number, maxLines: number): string[] {
  const budget = Math.max(4, Math.floor(widthPx / (fontPx * 0.55)));
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > budget && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) break;
    } else {
      cur = next;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  // Fold any overflow words into the last line, truncated.
  if (lines.length === maxLines) {
    const consumed = lines.join(" ").split(/\s+/).length;
    if (consumed < words.length) lines[maxLines - 1] = fit(lines[maxLines - 1] + " …", widthPx, fontPx);
  }
  return lines.length ? lines : [""];
}

// A tiny "picture" glyph (hills) that marks a card as a drawing, not text. For oral/visual cohorts.
function PictureGlyph({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke={color} strokeWidth={1.3} fill="none">
      <circle cx={3.5} cy={3} r={2.2} fill={color} stroke="none" fillOpacity={0.7} />
      <path d="M0 14 L5 7 L9 12 L13 5 L18 14 Z" fill={color} fillOpacity={0.14} />
    </g>
  );
}

function ZonesDiagram({ spec }: { spec: Extract<ActivityVisualSpec, { type: "zones" }> }) {
  const W = 640;
  const P = 12;
  // Widen the inter-panel gap when an arrow runs between the sides, so it has room to read.
  const gap = spec.flow === "across" ? 34 : 14;
  const n = spec.zones.length;
  const panelW = (W - 2 * P - (n - 1) * gap) / n;

  const headTop = 14;
  const dotLabelGap = 24;
  const labelW = panelW - dotLabelGap - 14;
  const CH = 26; // card height
  const CG = 9; // card gap
  const cardsTop = 62; // where the first card sits inside a panel

  // Uniform panel height from the busiest zone, so the sides line up.
  const maxCards = Math.max(0,...spec.zones.map((z) => z.cards.length));
  const panelH = Math.max(120, cardsTop + maxCards * (CH + CG) + 6);
  const H = P + panelH + P;

  const aria =
    "Board split into " +
    spec.zones.map((z) => `“${z.label}”${z.cards.length ? ` (e.g. ${z.cards.join(", ")})` : ""}`).join(" and ") +
    (spec.flow === "across" ? "; an arrow shows cards moving from the first side to the next." : ".");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={aria} style={{ height: "auto" }}>
      <defs>
        <marker id="av-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill={INK_SOFT} />
        </marker>
      </defs>
      {spec.zones.map((z, i) => {
        const x = P + i * (panelW + gap);
        const accent = TONE[z.tone] ?? TONE.neutral;
        const labelLines = wrap(z.label, labelW, 14, 2);
        return (
          <g key={i}>
            {/* panel */}
            <rect x={x} y={P} width={panelW} height={panelH} rx={12} fill={CARD} stroke={LINE} strokeWidth={1.5} />
            {/* header band */}
            <path
              d={`M${x} ${P + 12} Q${x} ${P} ${x + 12} ${P} L${x + panelW - 12} ${P} Q${x + panelW} ${P} ${x + panelW} ${P + 12} L${x + panelW} ${P + 44} L${x} ${P + 44} Z`}
              fill={accent}
              fillOpacity={0.1}
            />
            <line x1={x} y1={P + 44} x2={x + panelW} y2={P + 44} stroke={accent} strokeOpacity={0.3} strokeWidth={1} />
            <circle cx={x + 16} cy={P + 22 + headTop - 14} r={5} fill={accent} />
            {labelLines.map((ln, li) => (
              <text
                key={li}
                x={x + dotLabelGap + 6}
                y={P + 18 + li * 15 + (labelLines.length === 1 ? 3 : 0)}
                fontFamily={FONT}
                fontSize={13.5}
                fontWeight={700}
                fill={INK}
              >
                {ln}
              </text>
            ))}
            {z.sublabel && (
              <text x={x + dotLabelGap + 6} y={P + 18 + labelLines.length * 15 + 1} fontFamily={FONT} fontSize={10.5} fill={INK_SOFT}>
                {fit(z.sublabel, labelW, 10.5)}
              </text>
            )}
            {/* cards */}
            {z.cards.map((c, ci) => {
              const cy = P + cardsTop + ci * (CH + CG);
              const drawing = spec.cardStyle === "drawing";
              return (
                <g key={ci}>
                  <rect
                    x={x + 12}
                    y={cy}
                    width={panelW - 24}
                    height={CH}
                    rx={7}
                    fill={drawing ? "#FBFAF6" : "#F7F5F0"}
                    stroke={accent}
                    strokeOpacity={drawing ? 0.5 : 0.35}
                    strokeWidth={1.2}
                    strokeDasharray={drawing ? "4 3" : undefined}
                  />
                  {drawing && <PictureGlyph x={x + 20} y={cy + 6} color={accent} />}
                  <text
                    x={x + (drawing ? 46 : 22)}
                    y={cy + CH / 2 + 4}
                    fontFamily={FONT}
                    fontSize={12}
                    fill={INK}
                  >
                    {fit(c, panelW - (drawing ? 66 : 42), 12)}
                  </text>
                </g>
              );
            })}
            {z.cards.length === 0 && (
              <text x={x + panelW / 2} y={P + panelH / 2 + 8} textAnchor="middle" fontFamily={FONT} fontSize={12} fontStyle="italic" fill={INK_SOFT}>
                (fills up as you go)
              </text>
            )}
          </g>
        );
      })}
      {/* flow arrow: cards move from the first side to the next */}
      {spec.flow === "across" && n >= 2 && (
        <g>
          <text x={P + panelW + gap / 2} y={P + 24} textAnchor="middle" fontFamily={FONT} fontSize={9.5} fontStyle="italic" fill={INK_SOFT}>
            {spec.flowLabel ?? "move"}
          </text>
          <line
            x1={P + panelW + 5}
            y1={P + 34}
            x2={P + panelW + gap - 3}
            y2={P + 34}
            stroke={INK_SOFT}
            strokeWidth={1.6}
            markerEnd="url(#av-arrow)"
          />
        </g>
      )}
    </svg>
  );
}

const SIZE_NAME: Record<number, string> = { 1: "on their own", 2: "in pairs", 3: "in threes" };
// Singular noun for the "N × ___" count line above a cluster.
const SIZE_NOUN: Record<number, string> = { 1: "learner", 2: "pair", 3: "three" };

function GroupsDiagram({ spec }: { spec: Extract<ActivityVisualSpec, { type: "groups" }> }) {
  const W = 640;
  const cellH = 116;
  const cols = Math.min(spec.clusters.length, 3);
  const rows = Math.ceil(spec.clusters.length / cols);
  const cellW = W / cols;
  const H = rows * cellH + (spec.facilitator ? 34 : 8);

  // A ring of `size` dots centred in a cell. Radius grows with the cluster so dots never crowd.
  function ring(cx: number, cy: number, size: number, color: string) {
    if (size === 1) return [<circle key="s" cx={cx} cy={cy} r={9} fill={color} fillOpacity={0.85} />];
    const r = size === 2 ? 15 : size === 3 ? 18 : Math.round(size * 3.6);
    const dot = size > 6 ? 6.5 : 8;
    return Array.from({ length: size }, (_, k) => {
      const a = (k / size) * Math.PI * 2 - Math.PI / 2;
      return <circle key={k} cx={cx + Math.cos(a) * r} cy={cy + Math.sin(a) * r} r={dot} fill={color} fillOpacity={0.85} />;
    });
  }

  const aria =
    "Room arrangement: " +
    spec.clusters.map((c) => `${c.count} ${c.count === 1 ? "group" : "groups"} of ${c.size}${c.label ? ` (${c.label})` : ""}`).join(", ") +
    (spec.facilitator ? "; the facilitator moves around." : ".");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={aria} style={{ height: "auto" }}>
      {spec.clusters.map((c, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cx = col * cellW + cellW / 2;
        const cyTop = row * cellH + 44;
        const color = TONE.neutral;
        const sizeName = SIZE_NAME[c.size] ?? `in groups of ${c.size}`;
        return (
          <g key={i}>
            {ring(cx, cyTop, c.size, color)}
            <text x={cx} y={cyTop + 44} textAnchor="middle" fontFamily={FONT} fontSize={13} fontWeight={700} fill={INK}>
              {(() => {
                const noun = SIZE_NOUN[c.size] ?? `group of ${c.size}`;
                return c.count === 1 ? (c.size === 1 ? "1 learner" : noun) : `${c.count} × ${noun}`;
              })()}
            </text>
            <text x={cx} y={cyTop + 60} textAnchor="middle" fontFamily={FONT} fontSize={11.5} fill={INK_SOFT}>
              {fit(c.label ?? sizeName, cellW - 20, 11.5)}
            </text>
          </g>
        );
      })}
      {spec.facilitator && (
        <g>
          <circle cx={22} cy={H - 14} r={8} fill={TONE.warn} />
          <text x={38} y={H - 10} fontFamily={FONT} fontSize={12} fill={INK_SOFT}>
            You, moving between groups
          </text>
        </g>
      )}
    </svg>
  );
}

function Diagram({ spec }: { spec: ActivityVisualSpec }) {
  if (spec.type === "zones") return <ZonesDiagram spec={spec} />;
  if (spec.type === "groups") return <GroupsDiagram spec={spec} />;
  // image escape hatch
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={spec.src} alt={spec.alt} className="mx-auto h-auto w-full" />
  );
}

const KIND_META: Record<Visual["kind"], { label: string; accent: string }> = {
  setup: { label: "How to set it up", accent: "text-navy" },
  example: { label: "What it looks like", accent: "text-olive" },
};

export function ActivityVisual({ visual }: { visual: Visual }) {
  const meta = KIND_META[visual.kind];
  return (
    <figure className="rounded-xl border border-cool-grey/20 bg-paper-card p-4">
      <figcaption className="mb-2 flex items-baseline gap-2">
        <span className={`text-xs font-semibold uppercase tracking-wide ${meta.accent}`}>{meta.label}</span>
        {visual.title && <span className="text-sm font-medium text-dark-navy">{visual.title}</span>}
      </figcaption>
      <Diagram spec={visual.spec} />
      {visual.caption && <p className="mt-2 text-xs text-cool-grey">{visual.caption}</p>}
    </figure>
  );
}

// Convenience wrapper for a list of visuals (used both on the material and inside a step).
export function ActivityVisuals({ visuals, className = "" }: { visuals: Visual[]; className?: string }) {
  if (visuals.length === 0) return null;
  return (
    <div className={`grid gap-4 ${visuals.length > 1 ? "sm:grid-cols-2" : ""} ${className}`}>
      {visuals.map((v, i) => (
        <ActivityVisual key={i} visual={v} />
      ))}
    </div>
  );
}
