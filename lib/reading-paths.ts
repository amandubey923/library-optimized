/**
 * Reader's HUB — Guided Reading Paths & Structured Journeys
 * Curated sequential curricula connecting real catalog masterworks.
 */

import { ReadingProgressItem } from "@/lib/reader-storage";

export interface ReadingPathStep {
  stepNumber: number;
  title: string;
  topic: string;
  bookId?: string;
  isAvailable: boolean;
  notes: string;
}

export interface ReadingPath {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  icon: string;
  accentColor: string;
  steps: ReadingPathStep[];
}

export const READING_PATHS: ReadingPath[] = [
  {
    id: "path-cs-engineering",
    title: "Computer Science & Engineering Core",
    subtitle: "From algorithmic reasoning to computer systems & network architecture",
    description: "A foundational technical curriculum covering DSA, system design, problem-solving, and computer networks.",
    category: "Technical Knowledge",
    icon: "💻",
    accentColor: "emerald",
    steps: [
      {
        stepNumber: 1,
        title: "DSA Notes That Make Concepts Easy",
        topic: "Data Structures & Algorithms Fundamentals",
        bookId: "dsa-notes-concepts-made-easy",
        isAvailable: true,
        notes: "Master core structures, complexity analysis, trees, recursion, and graphs.",
      },
      {
        stepNumber: 2,
        title: "Must Solve LeetCode Problems Roadmap",
        topic: "Algorithmic Problem Solving & Patterns",
        bookId: "must-solve-leetcode-problems-striver",
        isAvailable: true,
        notes: "Curated problem patterns for coding assessments and technical interviews.",
      },
      {
        stepNumber: 3,
        title: "Computer Networks Complete Notes",
        topic: "Network Protocols & Architecture",
        bookId: "computer-networks-complete-notes",
        isAvailable: true,
        notes: "OSI stack, TCP/IP, routing, HTTP, and socket architecture.",
      },
      {
        stepNumber: 4,
        title: "Operating Systems & Concurrency",
        topic: "Processes, Threads & Virtual Memory",
        isAvailable: false,
        notes: "Upcoming module on kernels, scheduling, and memory management.",
      },
      {
        stepNumber: 5,
        title: "System Design & Distributed Architecture",
        topic: "Scalability, Caching & Microservices",
        isAvailable: false,
        notes: "Upcoming module on high-scale distributed systems.",
      },
    ],
  },
  {
    id: "path-existential-canon",
    title: "The Existential & Philosophical Canon",
    subtitle: "A deep inquiry into meaning, consciousness, freedom, and absurdity",
    description: "Journey through seminal existentialist and psychological literature examining the human condition.",
    category: "Philosophy & Spirituality",
    icon: "🧭",
    accentColor: "amber",
    steps: [
      {
        stepNumber: 1,
        title: "Beyond Good and Evil",
        topic: "Critique of Dogma & Will to Power",
        bookId: "beyond-good-and-evil",
        isAvailable: true,
        notes: "Friedrich Nietzsche's profound prelude to a philosophy of the future.",
      },
      {
        stepNumber: 2,
        title: "The Myth of Sisyphus",
        topic: "Absurdity & Rebellion",
        bookId: "the-myth-of-sisyphus",
        isAvailable: true,
        notes: "Albert Camus' essay on confronting life's fundamental absurdity.",
      },
      {
        stepNumber: 3,
        title: "Crime and Punishment",
        topic: "Moral Psychology & Guilt",
        bookId: "crime-and-punishment",
        isAvailable: true,
        notes: "Fyodor Dostoevsky's psychological masterpiece on conscience.",
      },
      {
        stepNumber: 4,
        title: "The Denial of Death",
        topic: "Heroism, Mortality & Human Nature",
        bookId: "the-denial-of-death",
        isAvailable: true,
        notes: "Ernest Becker's Pulitzer-winning work on human drive and mortality.",
      },
    ],
  },
  {
    id: "path-mastery-wisdom",
    title: "Mastery of Self & Eastern Contemplation",
    subtitle: "Ancient wisdom for inner stillness, unconditioned awareness, and clarity",
    description: "Explore the classical treatises on self-knowledge, stoic discernment, and meditative inquiry.",
    category: "Philosophy & Spirituality",
    icon: "🪔",
    accentColor: "violet",
    steps: [
      {
        stepNumber: 1,
        title: "Geeta Darshan (गीता दर्शन)",
        topic: "Action, Duty & Yoga",
        bookId: "geeta-darshan",
        isAvailable: true,
        notes: "A timeless exploration of selfless action and ultimate purpose.",
      },
      {
        stepNumber: 2,
        title: "Meditations",
        topic: "Stoic Discipline & Equanimity",
        bookId: "meditations",
        isAvailable: true,
        notes: "Marcus Aurelius' personal journal on duty, perspective, and composure.",
      },
      {
        stepNumber: 3,
        title: "Ashtavakra Mahageeta (अष्टावक्र महागीता)",
        topic: "Non-Duality & Pure Witnessing",
        bookId: "ashtavakra-mahageeta",
        isAvailable: true,
        notes: "The classical dialog on radical awareness and spiritual freedom.",
      },
    ],
  },
  {
    id: "path-wealth-mindset",
    title: "Wealth, Mindset & Practical Economics",
    subtitle: "Disciplined capital allocation, financial principles, and psychological tenacity",
    description: "The essential foundations of economic realism and value-oriented investing.",
    category: "Business & Finance",
    icon: "📈",
    accentColor: "rose",
    steps: [
      {
        stepNumber: 1,
        title: "Think and Grow Rich",
        topic: "Mindset, Persistence & Desire",
        bookId: "think-and-grow-rich",
        isAvailable: true,
        notes: "Napoleon Hill's classic investigation into personal achievement.",
      },
      {
        stepNumber: 2,
        title: "The Intelligent Investor",
        topic: "Margin of Safety & Value Investing",
        bookId: "the-intelligent-investor",
        isAvailable: true,
        notes: "Benjamin Graham's definitive guide to rational asset allocation.",
      },
    ],
  },
];

export interface PathProgressSummary {
  pathId: string;
  totalSteps: number;
  availableSteps: number;
  completedSteps: number;
  inProgressSteps: number;
  percentComplete: number;
}

export function getPathProgress(
  path: ReadingPath,
  readingHistory: ReadingProgressItem[] = []
): PathProgressSummary {
  const historyMap = new Map(readingHistory.map((h) => [h.bookId, h]));
  let completed = 0;
  let inProgress = 0;
  const available = path.steps.filter((s) => s.isAvailable && s.bookId).length;

  path.steps.forEach((step) => {
    if (step.bookId && historyMap.has(step.bookId)) {
      const item = historyMap.get(step.bookId)!;
      if (item.progress >= 95) {
        completed += 1;
      } else if (item.progress > 0) {
        inProgress += 1;
      }
    }
  });

  const percent = available > 0 ? Math.round((completed / available) * 100) : 0;

  return {
    pathId: path.id,
    totalSteps: path.steps.length,
    availableSteps: available,
    completedSteps: completed,
    inProgressSteps: inProgress,
    percentComplete: percent,
  };
}
