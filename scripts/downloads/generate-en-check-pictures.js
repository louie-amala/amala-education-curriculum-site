/* Draw the line pictures the English Check needs, as SVG, and render them to PNG for the docx.

   Everything here is authored for a pre-literate learner looking at a photocopy: pure black on
   white, one thick stroke weight, no shading, no colour anywhere (a grey fill vanishes on the third
   photocopy), and no detail that only reads at full size. Each picture is one object on its own,
   centred in a square, because they are printed small and in a grid.

   The word set is fixed by the phonics the component actually teaches - see
   docs/ENGLISH-ASSESSMENT-BLUEPRINT.md. Do not add a picture without adding its word to a form.

   Run:  node scripts/downloads/generate-en-check-pictures.js */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT = path.resolve(__dirname, '..', '..', 'public', 'brand', 'en-check');
const K = '#000';
const svg = (body, w = 100, h = 100) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<rect width="${w}" height="${h}" fill="#fff"/>
<g fill="none" stroke="${K}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;

// A person: one head, one body, two arms, two legs. Deliberately neutral - no hair, no clothing
// detail, nothing that reads as a gender or a costume, because these pictures are looked at by
// young women and young men in the same room.
const person = (x, y, s) => `
<circle cx="${x}" cy="${y - 22 * s}" r="${7 * s}"/>
<path d="M${x} ${y - 15 * s} V${y + 6 * s}"/>
<path d="M${x - 9 * s} ${y - 8 * s} L${x} ${y - 12 * s} L${x + 9 * s} ${y - 8 * s}"/>
<path d="M${x} ${y + 6 * s} L${x - 7 * s} ${y + 22 * s} M${x} ${y + 6 * s} L${x + 7 * s} ${y + 22 * s}"/>`;

const PICTURES = {
  // --- the decodable words (s t l m n / a o u / hard k) ---
  sun: svg(`<circle cx="50" cy="50" r="20"/>
    ${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
      const r = (a * Math.PI) / 180;
      return `<path d="M${50 + 27 * Math.cos(r)} ${50 + 27 * Math.sin(r)} L${50 + 38 * Math.cos(r)} ${50 + 38 * Math.sin(r)}"/>`;
    }).join('')}`),

  man: svg(person(50, 52, 1.55)),

  sock: svg(`<path d="M36 18 H62 V56 q0 8 8 12 l10 8 q6 5 1 11 -5 6 -12 2 l-22 -13 q-11 -7 -11 -20 Z"/>
    <path d="M36 30 H62"/>`),

  nut: svg(`<path d="M50 14 q17 0 17 18 0 10 -6 14 6 6 6 16 0 22 -17 22 -17 0 -17 -22 0 -10 6 -16 -6 -4 -6 -14 0 -18 17 -18Z"/>
    <path d="M39 28 q11 6 22 0 M40 46 q10 5 20 0 M39 64 q11 6 22 0 M40 76 q10 5 20 0"/>`),

  cat: svg(`<path d="M28 34 L25 14 L41 25"/><path d="M64 25 L80 14 L77 34"/>
    <circle cx="52" cy="36" r="17"/>
    <circle cx="46" cy="34" r="2.5" fill="${K}"/><circle cx="58" cy="34" r="2.5" fill="${K}"/>
    <path d="M52 40 v3 M52 43 q-4 4 -7 1 M52 43 q4 4 7 1"/>
    <path d="M30 38 H18 M30 44 H19 M74 38 H86 M74 44 H85"/>
    <path d="M52 53 q-16 4 -18 20 -2 14 4 17 h28 q6 -3 4 -17 -2 -16 -18 -20Z"/>
    <path d="M70 84 q18 0 16 -18 -1 -10 -8 -12"/>`),

  cot: svg(`<path d="M12 40 V78 M88 46 V78"/>
    <path d="M12 40 h6 v20 h-6" />
    <path d="M12 60 H88 v10 H12 Z"/>
    <path d="M20 60 q0 -12 14 -12 h10 q10 0 10 12"/>
    <path d="M56 60 H88"/>
    <path d="M22 70 v8 M78 70 v8"/>`),

  mat: svg(`<path d="M14 34 H86 L94 70 H6 Z"/>
    <path d="M22 34 L16 70 M38 34 L34 70 M54 34 L56 70 M70 34 L76 70"/>
    <path d="M11 46 H89 M8 58 H92"/>`),

  can: svg(`<ellipse cx="50" cy="26" rx="24" ry="8"/>
    <path d="M26 26 V72 q0 8 24 8 t24 -8 V26"/>
    <path d="M34 40 H66 M34 52 H66"/>`),

  // --- the everyday words (Part 1) ---
  tap: svg(`<path d="M20 30 H52 q14 0 14 14 V56 H50 V46 q0 -6 -8 -6 H20 Z"/>
    <path d="M30 30 V20 h14 v10"/>
    <path d="M58 66 q0 -8 -8 -8 q-8 0 -8 8 0 6 8 6 t8 -6Z" stroke-width="3"/>
    <path d="M50 78 v6 M44 84 v4 M56 84 v4" stroke-width="3"/>`),

  school: svg(`<path d="M6 46 H94 V86 H6 Z"/>
    <path d="M6 46 L50 28 L94 46"/>
    <path d="M42 86 V64 h16 v22"/><path d="M50 64 V86"/>
    <path d="M14 56 h11 v11 H14 Z M31 56 h11 v11 H31 Z M58 56 h11 v11 H58 Z M75 56 h11 v11 H75 Z"/>
    <path d="M50 28 V6"/><path d="M50 6 h18 l-5 6 5 6 h-18"/>`),

  house: svg(`<path d="M16 44 L50 18 L84 44"/>
    <path d="M26 44 V84 H74 V44"/>
    <path d="M52 84 V60 h14 v24"/>
    <path d="M34 56 h12 v12 H34 Z"/>`),

  phone: svg(`<rect x="32" y="12" width="36" height="76" rx="6"/>
    <path d="M38 24 H62 V70 H38 Z"/>
    <circle cx="50" cy="79" r="4"/>`),

  bag: svg(`<path d="M22 38 H78 L72 84 H28 Z"/>
    <path d="M38 38 V28 q0 -12 12 -12 t12 12 v10"/>`),

  tree: svg(`<path d="M43 88 V58 M57 88 V58"/>
    <path d="M32 88 H68"/>
    <path d="M50 60 q-24 0 -24 -18 0 -13 12 -16 2 -14 16 -14 14 0 16 14 12 3 12 16 0 18 -24 18Z"/>`),

  road: svg(`<path d="M30 88 L44 26 M70 88 L56 26"/>
    <path d="M50 30 v8 M50 46 v10 M50 64 v12 M50 84 v4"/>
    <path d="M8 26 H92"/>`),

  cup: svg(`<path d="M24 34 H68 V64 q0 12 -14 12 H38 q-14 0 -14 -12Z"/>
    <path d="M68 40 h8 q10 0 10 10 t-10 10 h-8"/>
    <path d="M24 34 H68" /><path d="M36 24 q4 -6 0 -10 M50 24 q4 -6 0 -10"/>`),

  // --- the two oral prompt scenes ---
  // Kept to a building, a doorway and people. Nothing that dates it, brands it, or claims to show
  // any particular block - it is a prompt to talk, not a picture of somebody's home.
  'scene-learning-centre': svg(`
    <path d="M20 62 L70 32 L120 62"/>
    <path d="M28 62 V112 H112 V62"/>
    <path d="M58 112 V80 h24 v32"/>
    <path d="M38 74 h12 v12 H38 Z M90 74 h12 v12 H90 Z"/>
    <path d="M70 32 V18 M70 18 h16 v9 H70"/>
    ${person(150, 88, 1.3)}${person(178, 92, 1.3)}
    <path d="M8 118 H192"/>`, 200, 130),

  'scene-shop': svg(`
    <path d="M34 46 H166"/>
    <path d="M34 46 q11 16 22 0 q11 16 22 0 q11 16 22 0 q11 16 22 0 q11 16 22 0 q11 16 22 0"/>
    <path d="M40 62 V46 M160 62 V46"/>
    <path d="M40 90 H160 V112 H40 Z"/>
    <path d="M52 90 V74 h16 v16 M80 90 V78 h14 v12 M108 90 V72 h18 v18"/>
    ${person(140, 94, 0.8)}${person(178, 96, 1.0)}
    <path d="M8 118 H192"/>`, 200, 130),
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  for (const [name, src] of Object.entries(PICTURES)) {
    const wide = name.startsWith('scene-');
    await sharp(Buffer.from(src), { density: 600 })
      .resize(wide ? 1200 : 600, wide ? 780 : 600, { fit: 'contain', background: '#fff' })
      .flatten({ background: '#fff' })
      .png({ colours: 2 })
      .toFile(path.join(OUT, `${name}.png`));
  }
  console.log(`  ${Object.keys(PICTURES).length} pictures -> public/brand/en-check/`);
})();
