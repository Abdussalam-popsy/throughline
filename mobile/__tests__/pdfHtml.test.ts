/// <reference types="jest" />
import { buildExportHtml } from "../src/lib/pdfHtml";
import type { Entry } from "../src/lib/types";

const entries: Entry[] = [
  {
    id: "1",
    date: "2026-06-06",
    text: "felt <overwhelmed> today",
    riskLevel: "elevated",
    stressor: "Exam pressure",
    createdAt: 1,
  },
  {
    id: "2",
    date: "2026-06-07",
    text: "a bit better",
    riskLevel: "none",
    createdAt: 2,
  },
];

test("includes each entry's date and text", () => {
  const html = buildExportHtml(entries);
  expect(html).toContain("2026-06-06");
  expect(html).toContain("2026-06-07");
  expect(html).toContain("a bit better");
});

test("escapes HTML in entry text", () => {
  const html = buildExportHtml(entries);
  expect(html).toContain("felt &lt;overwhelmed&gt; today");
  expect(html).not.toContain("<overwhelmed>");
});

test("renders the stressor chip text when present", () => {
  expect(buildExportHtml(entries)).toContain("Exam pressure");
});

test("includes a brief section when brief markdown is provided", () => {
  const html = buildExportHtml(entries, "# Summary\nKey themes: **exam stress**.");
  expect(html).toMatch(/One-Page Brief/i);
  expect(html).toContain("Summary");
  expect(html).toContain("Key themes: <strong>exam stress</strong>.");
});

test("omits the brief section when no brief markdown is given", () => {
  expect(buildExportHtml(entries).toLowerCase()).not.toContain("one-page brief");
});

test("is a complete HTML document", () => {
  const html = buildExportHtml(entries);
  expect(html).toMatch(/^<!doctype html>/i);
  expect(html).toContain("</html>");
});
