import type { Resource } from "../lib/types";

/**
 * Maps the `domain` field from Call 1 to a verified institutional resource.
 * Static in the hackathon; expandable to a database in v2.
 */
const RESOURCE_DB: Resource[] = [
  {
    domain: "exam_stress",
    title: "Managing Exam Anxiety",
    source: "Imperial College London Wellbeing",
    snippet:
      "Break revision into 25-minute blocks with 5-minute breaks. Stop all screens 1 hour before sleep.",
    url: "https://www.imperial.ac.uk/student-support-zone/your-health/mental-health/",
  },
  {
    domain: "body_image",
    title: "Body Image Support",
    source: "NHS Every Mind Matters",
    snippet:
      "Speak to your GP if body image thoughts are affecting your daily life. Beat Studentline: 0808 801 0811.",
    url: "https://www.nhs.uk/every-mind-matters/",
    // NOTE: No diet, fitness, exercise, or weight content per hard rules.
  },
  {
    domain: "loneliness",
    title: "Connecting When It Feels Hard",
    source: "University of Edinburgh Social PrescribED",
    snippet:
      "Shared activities (a club, a class) are often easier than unstructured socialising. No performance required.",
    url: "https://www.ed.ac.uk/students/health-wellbeing/wellbeing-services",
  },
  {
    domain: "financial_anxiety",
    title: "Financial Stress and Mental Health",
    source: "Money and Mental Health Policy Institute",
    snippet:
      "Your university's hardship fund may be available — most students don't know they qualify. Ask your student services.",
    url: "https://www.moneyandmentalhealth.org",
  },
];

export function getResourceForDomain(domain: string): Resource | null {
  if (domain === "general") return null;
  return RESOURCE_DB.find((r) => r.domain === domain) ?? null;
}
