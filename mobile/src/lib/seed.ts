import type { Entry } from "./types";

/**
 * Demo account: a UCL student over ~3 weeks.
 * Arc: worsening (sleep -> anxiety -> withdrawal -> attendance) then stabilising.
 * Peaks at "elevated" — never "crisis". Mirrors server/src/lib/seed.ts.
 */
export const SEED_ENTRIES: Entry[] = [
  {
    id: "seed-01",
    date: "2026-05-12",
    text: "Couldn't fall asleep again until like 3am. Kept replaying the stats coursework I haven't started. Woke up for the 10am lecture but my brain was static the whole time.",
    riskLevel: "none",
    themes: ["sleep", "coursework", "concentration"],
    createdAt: 1747000000000,
  },
  {
    id: "seed-02",
    date: "2026-05-14",
    text: "Third night this week I've been up past 2. Coffee isn't touching it anymore. I read the same paragraph of the reading four times and nothing went in.",
    riskLevel: "none",
    themes: ["sleep", "concentration"],
    createdAt: 1747100000000,
  },
  {
    id: "seed-03",
    date: "2026-05-16",
    text: "Skipped the group project meeting. Told them I was ill but I just couldn't face sitting in a room and talking. Felt easier to stay in my room.",
    riskLevel: "elevated",
    themes: ["withdrawal", "anxiety", "attendance"],
    createdAt: 1747250000000,
  },
  {
    id: "seed-04",
    date: "2026-05-17",
    text: "Spent most of the day in bed scrolling. Didn't really eat until the evening, just had toast. Keep telling myself I'll start the coursework tomorrow.",
    riskLevel: "elevated",
    themes: ["appetite", "low mood", "coursework"],
    createdAt: 1747320000000,
  },
  {
    id: "seed-05",
    date: "2026-05-19",
    text: "My flatmates asked if I wanted to come to dinner and I said I had work to do. I didn't. I just didn't have the energy to be a person tonight.",
    riskLevel: "elevated",
    themes: ["withdrawal", "low energy"],
    createdAt: 1747500000000,
  },
  {
    id: "seed-06",
    date: "2026-05-20",
    text: "Heart was going really fast before the seminar, hands clammy. Sat at the back and didn't say anything. Left as soon as it finished so I didn't have to talk to anyone.",
    riskLevel: "elevated",
    themes: ["anxiety", "withdrawal", "attendance"],
    createdAt: 1747580000000,
  },
  {
    id: "seed-07",
    date: "2026-05-22",
    text: "Missed the 9am entirely, just couldn't get up. That's two this week now. I feel like I'm falling behind and the gap keeps getting bigger.",
    riskLevel: "elevated",
    themes: ["attendance", "sleep", "low mood"],
    createdAt: 1747750000000,
  },
  {
    id: "seed-08",
    date: "2026-05-23",
    text: "Everything feels grey and pointless lately. Not in a scary way, I just don't really care about things I used to. Gaming, football, none of it lands.",
    riskLevel: "elevated",
    themes: ["low mood", "anhedonia"],
    createdAt: 1747830000000,
  },
  {
    id: "seed-09",
    date: "2026-05-25",
    text: "Booked a slot at the GP for next week, mostly because my mum kept asking. Felt weirdly relieved after I did it. Slept a bit better, maybe 5 hours.",
    riskLevel: "elevated",
    themes: ["help-seeking", "sleep"],
    createdAt: 1748000000000,
  },
  {
    id: "seed-10",
    date: "2026-05-27",
    text: "Made myself go to the library with Sam. Only did an hour of work but it was the first proper thing in a while. Had a real lunch too.",
    riskLevel: "none",
    themes: ["coursework", "social", "appetite"],
    createdAt: 1748170000000,
  },
  {
    id: "seed-11",
    date: "2026-05-29",
    text: "Anxiety before the seminar was still there but I actually answered a question. Small thing but I noticed it. Walked home with someone from the course.",
    riskLevel: "none",
    themes: ["anxiety", "social", "attendance"],
    createdAt: 1748340000000,
  },
  {
    id: "seed-12",
    date: "2026-05-31",
    text: "Two nights in a row of getting to sleep before 1. Still tired but less foggy. Started the stats coursework, got the intro done.",
    riskLevel: "none",
    themes: ["sleep", "coursework", "concentration"],
    createdAt: 1748510000000,
  },
  {
    id: "seed-13",
    date: "2026-06-02",
    text: "Went to all my lectures this week. The low feeling comes and goes but the mornings are easier. Trying to keep the momentum before the GP appointment.",
    riskLevel: "none",
    themes: ["attendance", "low mood", "help-seeking"],
    createdAt: 1748680000000,
  },
  {
    id: "seed-14",
    date: "2026-06-04",
    text: "GP is tomorrow. Wrote down some of what's been going on so I don't freeze up. Still not sleeping brilliantly but I feel more like myself than I did two weeks ago.",
    riskLevel: "none",
    themes: ["help-seeking", "sleep", "low mood"],
    createdAt: 1748850000000,
  },
];

export const DEMO_PATIENT_NAME = "Alex Morgan";
