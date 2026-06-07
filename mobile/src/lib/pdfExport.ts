import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import type { Entry } from "./types";
import { buildExportHtml } from "./pdfHtml";

/**
 * Renders the one-page brief + full entry log to a PDF and opens the OS
 * share/save sheet. Throws if PDF generation fails so the caller can surface an
 * error; the HTML itself is built by the pure `buildExportHtml`.
 */
export async function exportJournalPdf(
  entries: Entry[],
  briefMarkdown?: string
): Promise<void> {
  const html = buildExportHtml(entries, briefMarkdown);
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Export your journal",
      UTI: "com.adobe.pdf",
    });
  }
}
