import type { Entry } from "./types";

const RISK_LABEL: Record<string, string> = {
  none: "Settled",
  elevated: "Elevated",
  crisis: "Crisis",
};
const RISK_COLOR: Record<string, string> = {
  none: "#7fae9f",
  elevated: "#e0a13c",
  crisis: "#b4453a",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMd(s: string): string {
  return s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

/**
 * Minimal, safe Markdown→HTML for the brief: headings (#..###), bold, and
 * bulleted lists. Everything is HTML-escaped first, so the brief text can never
 * inject markup into the document.
 */
function markdownToHtml(md: string): string {
  const lines = escapeHtml(md).split(/\r?\n/);
  const out: string[] = [];
  let inList = false;
  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };
  for (const raw of lines) {
    const line = raw.trim();
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    const item = line.match(/^[-*]\s+(.*)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      out.push(`<h${level}>${inlineMd(heading[2])}</h${level}>`);
    } else if (item) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inlineMd(item[1])}</li>`);
    } else if (line.length === 0) {
      closeList();
    } else {
      closeList();
      out.push(`<p>${inlineMd(line)}</p>`);
    }
  }
  closeList();
  return out.join("\n");
}

function entryRow(entry: Entry): string {
  const risk = entry.riskLevel ?? "none";
  const stressor = entry.stressor
    ? `<span class="chip">${escapeHtml(entry.stressor)}</span>`
    : "";
  return `
    <div class="entry">
      <div class="entry-head">
        <span class="date">${escapeHtml(entry.date)}</span>
        <span class="risk" style="color:${RISK_COLOR[risk]}">${
    RISK_LABEL[risk] ?? "Settled"
  }</span>
      </div>
      <div class="entry-text">${escapeHtml(entry.text)}</div>
      ${stressor}
    </div>`;
}

/**
 * Builds the full HTML document exported as a PDF from the Timeline. Includes an
 * optional one-page brief at the top followed by the full entry log. Pure and
 * deterministic so it can be unit-tested without the native print module.
 */
export function buildExportHtml(entries: Entry[], briefMarkdown?: string): string {
  const generated = new Date().toISOString().slice(0, 10);
  const briefSection =
    briefMarkdown && briefMarkdown.trim().length > 0
      ? `<section class="brief">
           <h2 class="section-title">One-Page Brief</h2>
           <div class="brief-body">${markdownToHtml(briefMarkdown)}</div>
         </section>`
      : "";
  const log =
    entries.length > 0
      ? entries.map(entryRow).join("")
      : `<p class="empty">No entries yet.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1d2b27; padding: 32px; }
  .kicker { color: #2f6f5e; font-weight: 700; font-size: 11px; letter-spacing: 1.2px; }
  h1 { font-size: 22px; margin: 4px 0 2px; }
  .generated { color: #7b8884; font-size: 12px; margin-bottom: 20px; }
  .section-title { font-size: 15px; color: #2f6f5e; border-bottom: 1px solid #d4e5de; padding-bottom: 4px; margin-top: 28px; }
  .brief-body h1, .brief-body h2, .brief-body h3 { font-size: 15px; margin: 12px 0 4px; }
  .brief-body p, .brief-body li { font-size: 13px; line-height: 1.5; }
  .entry { border-left: 3px solid #d4e5de; padding: 6px 0 6px 12px; margin: 10px 0; }
  .entry-head { display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; }
  .date { color: #7b8884; }
  .entry-text { font-size: 13px; line-height: 1.45; margin-top: 4px; }
  .chip { display: inline-block; font-size: 11px; color: #2f6f5e; background: #eef5f2;
          border: 1px solid #d4e5de; border-radius: 999px; padding: 2px 8px; margin-top: 6px; }
  .empty { color: #7b8884; font-size: 13px; }
</style>
</head>
<body>
  <div class="kicker">THROUGHLINE</div>
  <h1>Your journal export</h1>
  <div class="generated">Generated ${generated} · ${entries.length} ${
    entries.length === 1 ? "entry" : "entries"
  }</div>
  ${briefSection}
  <h2 class="section-title">Entry Log</h2>
  ${log}
</body>
</html>`;
}
