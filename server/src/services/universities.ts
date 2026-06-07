import fs from "fs";
import path from "path";

/** Shape of a record in `server/data/universities.json` (snake_case on disk). */
interface RawUniversity {
  key: string;
  university: string;
  city: string;
  service_name: string;
  phone: string | null;
  email: string | null;
  url: string;
  notes: string;
}

/**
 * A university's mental-health service, normalized for the client. `phone` and
 * `email` are present only when that channel is actually available — a university
 * with just an email omits `phone`, and vice versa. `url` (the service website)
 * is always present, so the user always has at least one way to reach out.
 */
export interface University {
  key: string;
  name: string;
  city: string;
  serviceName: string;
  phone?: string;
  email?: string;
  url: string;
  notes: string;
}

const DATA_PATH = path.join(__dirname, "..", "..", "data", "universities.json");
const RAW: RawUniversity[] = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));

const clean = (v: string | null | undefined): string | undefined => {
  const t = (v ?? "").trim();
  return t.length > 0 ? t : undefined;
};

const UNIVERSITIES: University[] = RAW.map((r) => {
  const u: University = {
    key: r.key,
    // Some names carry stray whitespace (e.g. "UCL )") — tidy for display.
    name: r.university.replace(/\s+/g, " ").replace(/\s+\)/g, ")").trim(),
    city: r.city.trim(),
    serviceName: r.service_name.trim(),
    url: r.url.trim(),
    notes: r.notes.trim(),
  };
  const phone = clean(r.phone);
  const email = clean(r.email);
  if (phone) u.phone = phone;
  if (email) u.email = email;
  return u;
}).sort((a, b) => a.name.localeCompare(b.name));

/** All universities, alphabetised — drives the "Select your university" dropdown. */
export function listUniversities(): University[] {
  return UNIVERSITIES;
}

/** A single university by key, or undefined if unknown. */
export function getUniversity(key: string): University | undefined {
  return UNIVERSITIES.find((u) => u.key === key);
}
