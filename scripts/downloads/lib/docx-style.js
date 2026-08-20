/* Shared docx house style for the Learning Bridge+ (Cox's Bazar) offline pack.
   Extracted so the component generators and the one-stop Educator Guide render identically —
   the guide embeds the same rendered content as the standalone downloads, so nothing can drift.
   (generate-docx.js and generate-rp.js keep their own historical copies of these helpers; they
   export their *children* builders, which is what the guide composes.) */
const fs = require('fs');
const path = require('path');
const {
  Document, Paragraph, TextRun, AlignmentType, ImageRun, Footer, PageNumber, TableOfContents,
  Table, TableRow, TableCell, WidthType, BorderStyle, PageBreak, HeadingLevel,
} = require('docx');

// Brand assets live in the repo so every generated document is reproducible from source.
const BRAND = path.resolve(__dirname, '..', '..', '..', 'public', 'brand');
const LOGO = path.join(BRAND, 'amala-logo.png');
const icon = (name) => path.join(BRAND, 'icons', `${name}.png`);
const imgRun = (file, width, height) => new ImageRun({ data: fs.readFileSync(file), type: 'png', transformation: { width, height } });
// A standalone image paragraph.
const image = (file, width, height, opts = {}) => new Paragraph({
  children: [imgRun(file, width, height)],
  alignment: opts.align,
  spacing: { before: opts.before || 0, after: opts.after == null ? 120 : opts.after },
});
// An inline icon followed by its label, on one line.
const iconLine = (name, text, opts = {}) => new Paragraph({
  children: [imgRun(icon(name), opts.px || 26, opts.px || 26), new TextRun({ text: '  ' + text, size: opts.size || 22, bold: opts.bold, color: opts.color })],
  spacing: { before: opts.before || 0, after: opts.after == null ? 80 : opts.after },
});

const NAVY = '1F3A5F', PLUM = '7A3B69', GREY = '5A6473', OLIVE = '6E7A2E', LINE = 'B9B3A6';
const LETTER = { size: { width: 12240, height: 15840 } };
const FULL_W = 10800;

// Source YAML and educatorContent are markdown-flavoured. These documents are printed and read on
// paper, where a raw link target is noise — so reduce inline markdown to its text before it becomes
// a docx run. Keeps [Picture Cards pack](/downloads/…) reading as "Picture Cards pack".
const plain = (s) => String(s == null ? '' : s)
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/`([^`]+)`/g, '$1')
  .replace(/\*\*([^*]+)\*\*/g, '$1');

// Split a block-scalar string into paragraphs (blank line = new para; single newline = space).
const toParas = (s) => plain(s).trim().split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);

const P = (text, opts = {}) => new Paragraph({
  children: [new TextRun({ text: plain(text), size: opts.size || 22, bold: opts.bold, italics: opts.italics, color: opts.color })],
  spacing: { after: opts.after == null ? 120 : opts.after, before: opts.before || 0 },
  alignment: opts.align,
});
const runs = (arr, after = 120) => new Paragraph({ children: arr, spacing: { after } });
const body = (s) => toParas(s).map((t) => P(t, { size: 22, after: 120 }));
const bullet = (text, level = 0) => new Paragraph({ children: [new TextRun({ text: plain(text), size: 22 })], bullet: { level }, spacing: { after: 60 } });
const numbered = (text, ref) => new Paragraph({ children: [new TextRun({ text: plain(text), size: 22 })], numbering: { reference: ref, level: 0 }, spacing: { after: 60 } });
const label = (lab, text) => new Paragraph({ children: [new TextRun({ text: lab + ' ', bold: true, size: 22, color: PLUM }), new TextRun({ text: plain(text), size: 22 })], spacing: { after: 120 } });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 260, after: 100 }, children: [new TextRun({ text: plain(t), bold: true, size: 30, color: NAVY })] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 }, children: [new TextRun({ text: plain(t), bold: true, size: 25, color: PLUM })] });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 60 }, children: [new TextRun({ text: plain(t), bold: true, size: 23, color: NAVY })] });
const eyebrow = (t) => new Paragraph({ children: [new TextRun({ text: String(t).toUpperCase(), bold: true, size: 15, color: PLUM })], spacing: { before: 120, after: 40 } });
const mini = (t) => new Paragraph({ children: [new TextRun({ text: plain(t), bold: true, italics: true, size: 21, color: OLIVE })], spacing: { before: 80, after: 40 } });
const hr = () => new Paragraph({ text: '', border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: LINE } }, spacing: { after: 120 } });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });
const writeLine = (before = 240) => new Paragraph({ text: '', border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: '888888' } }, spacing: { before, after: 120 } });

// A full-width blank box for a learner to draw / mark / write in.
const box = (h, labelText) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  columnWidths: [FULL_W],
  rows: [new TableRow({ height: { value: h, rule: 'atLeast' }, children: [new TableCell({
    width: { size: FULL_W, type: WidthType.DXA },
    children: labelText ? [new Paragraph({ children: [new TextRun({ text: labelText, size: 18, color: GREY })] })] : [new Paragraph('')],
  })] })],
});

const gridBoxes = (cols, rows, cellH, cellLabel) => {
  const colW = Math.floor(FULL_W / cols);
  const trs = [];
  for (let r = 0; r < rows; r++) {
    trs.push(new TableRow({ height: { value: cellH, rule: 'atLeast' }, children: Array.from({ length: cols }, () => new TableCell({
      width: { size: colW, type: WidthType.DXA },
      children: [cellLabel ? new Paragraph({ children: [new TextRun({ text: cellLabel, size: 16, color: LINE })] }) : new Paragraph('')],
    })) }));
  }
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: Array(cols).fill(colW), rows: trs });
};

// A reference table with a header row and explicit column widths (in DXA, summing to FULL_W).
// Cells may be a string, or { text, bold, color, size, lines } for finer control.
function refTable(header, rows, widths) {
  const colW = widths || Array(header.length).fill(Math.floor(FULL_W / header.length));
  const cell = (content, i, isHead) => {
    const o = typeof content === 'object' && content !== null ? content : { text: String(content) };
    const lines = o.lines || String(o.text == null ? '' : o.text).split('\n');
    return new TableCell({
      width: { size: colW[i], type: WidthType.DXA },
      shading: isHead ? { fill: 'F0ECE3' } : undefined,
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: lines.map((l) => new Paragraph({ children: [new TextRun({
        text: l,
        bold: isHead || o.bold || (!isHead && i === 0 && o.bold !== false),
        size: o.size || 20,
        color: isHead ? NAVY : (o.color || (i === 0 ? PLUM : undefined)),
      })] })),
    });
  };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: colW,
    rows: [
      new TableRow({ tableHeader: true, children: header.map((h, i) => cell(h, i, true)) }),
      ...rows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, i, false)) })),
    ],
  });
}

// Two-column reference table (label column + detail column) — the historic default.
const twoCol = (header, rows) => refTable(header, rows, [3200, 7600]);

// A soft callout box for a short piece of emphasis (safeguarding, a key rule).
const callout = (heading, lines, color = PLUM) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  columnWidths: [FULL_W],
  borders: {
    top: { style: BorderStyle.SINGLE, size: 2, color: LINE },
    bottom: { style: BorderStyle.SINGLE, size: 2, color: LINE },
    left: { style: BorderStyle.SINGLE, size: 18, color },
    right: { style: BorderStyle.SINGLE, size: 2, color: LINE },
    insideHorizontal: { style: BorderStyle.NONE },
    insideVertical: { style: BorderStyle.NONE },
  },
  rows: [new TableRow({ children: [new TableCell({
    width: { size: FULL_W, type: WidthType.DXA },
    margins: { top: 120, bottom: 120, left: 200, right: 200 },
    children: [
      new Paragraph({ children: [new TextRun({ text: heading, bold: true, size: 22, color })], spacing: { after: lines.length ? 80 : 0 } }),
      ...lines.map((l, i) => P(l, { size: 21, after: i === lines.length - 1 ? 0 : 80 })),
    ],
  })] })],
});

// minimal markdown -> docx blocks (headings, bullets, pipe tables, paragraphs) for resource content
function mdTable(rowsRaw) {
  const cells = rowsRaw.map((r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
  const kept = cells.filter((r) => !r.every((c) => c === '' || /^:?-+:?$/.test(c)));
  const nCols = Math.max(...kept.map((r) => r.length));
  const colW = Math.floor(FULL_W / nCols);
  const trs = kept.map((r, ri) => new TableRow({ children: Array.from({ length: nCols }, (_, ci) => new TableCell({
    width: { size: colW, type: WidthType.DXA },
    children: [new Paragraph({ children: [new TextRun({ text: r[ci] || '', bold: ri === 0, size: 20, color: ri === 0 ? NAVY : undefined })] })],
  })) }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: Array(nCols).fill(colW), rows: trs });
}
function mdBlocks(md) {
  const out = [];
  const lines = String(md || '').replace(/\r/g, '').split('\n');
  let i = 0; let para = [];
  const flush = () => { if (para.length) { out.push(P(para.join(' '), { size: 22 })); para = []; } };
  while (i < lines.length) {
    const t = lines[i].trim();
    if (t === '') { flush(); i++; continue; }
    if (t.startsWith('### ')) { flush(); out.push(H3(t.slice(4))); i++; continue; }
    if (t.startsWith('## ')) { flush(); out.push(H2(t.slice(3))); i++; continue; }
    if (t.startsWith('# ')) { flush(); out.push(H1(t.slice(2))); i++; continue; }
    if (t.startsWith('- ')) { flush(); while (i < lines.length && lines[i].trim().startsWith('- ')) { out.push(bullet(lines[i].trim().slice(2))); i++; } continue; }
    if (t.startsWith('|')) { flush(); const rws = []; while (i < lines.length && lines[i].trim().startsWith('|')) { rws.push(lines[i].trim()); i++; } out.push(mdTable(rws)); continue; }
    para.push(t); i++;
  }
  flush();
  return out;
}

// Ordered-list references available to every document built with makeDoc().
const NUMBERING = {
  config: ['setup', 'rhythm', 'evidence', 'print', 'steps'].map((reference) => ({
    reference,
    levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.START, style: { paragraph: { indent: { left: 460, hanging: 260 } } } }],
  })),
};

// A running footer: the document's name on the left, the page number on the right. Worth it on any
// document long enough to be printed and referred back to.
const pageFooter = (text) => new Footer({
  children: [new Paragraph({
    alignment: AlignmentType.RIGHT,
    children: [
      new TextRun({ text: `${text}    `, size: 16, color: GREY }),
      new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GREY }),
    ],
  })],
});

// A live table of contents built from the Heading 1 / Heading 2 styles. `updateFields` on the
// document makes Word fill in the page numbers when the file is opened.
const toc = (levels = '1-2') => new TableOfContents('Contents', { hyperlink: true, headingStyleRange: levels });

// opts.footerText adds the running footer; opts.updateFields makes Word resolve a toc() on open.
const makeDoc = (children, opts = {}) => new Document({
  numbering: NUMBERING,
  features: opts.updateFields ? { updateFields: true } : undefined,
  styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
  sections: [{
    properties: { page: LETTER },
    footers: opts.footerText ? { default: pageFooter(opts.footerText) } : undefined,
    children,
  }],
});

module.exports = {
  BRAND, LOGO, icon, imgRun, image, iconLine, pageFooter, toc, plain,
  NAVY, PLUM, GREY, OLIVE, LINE, LETTER, FULL_W,
  toParas, P, runs, body, bullet, numbered, label, H1, H2, H3, eyebrow, mini, hr, pageBreak,
  writeLine, box, gridBoxes, refTable, twoCol, callout, mdTable, mdBlocks, NUMBERING, makeDoc,
  AlignmentType, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle,
};
