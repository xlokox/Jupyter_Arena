/**
 * UI string dictionary — MASTER_BRIEF.md Section 2.6: English-first,
 * internationalization-ready. All user-visible strings live here; components
 * never hardcode copy. A future locale adds a sibling file with the same shape.
 */
export const en = {
  app: {
    name: "Jupyter Arena",
    tagline: "Master debugging through live broken notebooks",
  },
  header: {
    level: "Level",
    xp: "XP",
    streakLabel: "day streak",
    completedLabel: "solved",
    statsAria: "Your progress",
    sectorFilterAria: "Filter challenges by sector",
    openSidebar: "Open file explorer",
  },
  ranks: {
    compileRookie: "Compile Rookie",
    tracebackHunter: "Traceback Hunter",
    kernelEngineer: "Kernel Engineer",
    overlordCompiler: "Overlord Compiler",
  },
  sectors: {
    all: "All",
    ml: "Machine Learning",
    dl: "Deep Learning",
    fullstack: "Full Stack",
    db: "Databases",
  },
  difficulty: {
    all: "All levels",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    very_hard: "Very Hard",
  },
  sidebar: {
    missions: "Missions",
    tutorials: "Tutorials",
    tabsAria: "Sidebar sections",
    fileExplorerAria: "Notebook file explorer",
    tutorialListAria: "Tutorial lessons",
    searchPlaceholder: "Search title or concept…",
    searchAria: "Search notebooks",
    difficultyAria: "Filter by difficulty",
    noResults: "No notebooks match your filters.",
    solvedAria: "Solved",
    closeSidebar: "Close file explorer",
  },
  workspace: {
    emptyTitle: "Select a notebook to begin",
    emptyBody:
      "Pick a mission from the file explorer. Read the briefing, study the broken cell, choose your fix, and run it.",
    briefingAria: "Mission briefing",
    inLabel: "In",
    outLabel: "Out",
    codeCellAria: "Buggy code cell",
    outputCellAria: "Execution output",
    bugRegionAria: "Bug region",
    outputRunning: "Executing cell…",
    optionsHeading: "Choose the fix",
    optionsAria: "Debugging options",
    runCell: "Run Cell",
    aiHint: "AI Hint",
    hintsAria: "AI Co-Pilot hints",
    hintLabel: "Hint",
    nextNotebook: "Next Notebook",
    solvedBadge: "Fix verified",
    failedBadge: "Not the fix — read why below",
    explanationHeading: "Why the bug happened — and why your fix works",
    recruiterHeading: "Senior Tech Lead — Code Review",
    recruiterRole: "Staff Engineer, reviewing your patch",
    approvedStamp: "APPROVED",
  },
  tutorial: {
    badge: "Tutorial",
    videosHeading: "Recommended videos",
    watchOnYoutube: "Search on YouTube",
    startMission: "Start mission",
  },
} as const;

export type Dictionary = typeof en;
