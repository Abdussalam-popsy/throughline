export type Recipient = { key: string; label: string; email: string };

const RECIPIENTS: Recipient[] = [
  {
    key: "ucl-counselling",
    label: "UCL Student Psychological & Counselling Services",
    email: "spcs-info@ucl.ac.uk",
  },
  {
    key: "ucl-mh-society",
    label: "UCL Mental Health Society",
    email: "su.mental.health.society@ucl.ac.uk",
  },
  {
    key: "candi-icope",
    label: "Camden & Islington Talking Therapies (iCope)",
    email: "candi.talkingtherapies@nhs.net",
  },
];

export const recipientList = () =>
  RECIPIENTS.map(({ key, label }) => ({ key, label }));

export const resolveRecipient = (key: string) =>
  RECIPIENTS.find((r) => r.key === key) ?? null;
