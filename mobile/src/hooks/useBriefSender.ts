import { useState } from "react";
import { generateBriefApi, sendBriefApi } from "../services/api";
import type { Entry, SendResult } from "../lib/types";

type Status = "idle" | "generating" | "review" | "sending" | "success" | "error";

export function useBriefSender() {
  const [status, setStatus] = useState<Status>("idle");
  const [brief, setBrief] = useState("");
  const [result, setResult] = useState<SendResult | null>(null);

  async function generate(entries: Entry[]) {
    setStatus("generating");
    try {
      setBrief(await generateBriefApi(entries));
      setStatus("review");
    } catch {
      setStatus("error");
    }
  }

  async function send(recipientKey: string, patientName: string) {
    setStatus("sending");
    try {
      setResult(
        await sendBriefApi({
          briefMarkdown: brief,
          recipientKey,
          patientName,
          consentTimestamp: new Date().toISOString(),
        })
      );
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return { status, brief, result, generate, send };
}
