import { IMAGES } from "./assets";
import type { Block, Folder, KanbanCard, LibraryItem, NoteFile, Workspace } from "./types";
import { makeBlock, uid } from "./types";

function page(blocks: Block[]) {
  return blocks;
}

export function seedWorkspaces(): Workspace[] {
  const now = Date.now();
  return [
    {
      id: "ws-study",
      name: "Study",
      icon: "book",
      color: "#3D5C54",
      theme: "paper",
      language: "en",
      font: "serif",
      createdAt: now - 86400000 * 12,
      locked: false,
      cover: IMAGES.workspaceStudy,
    },
    {
      id: "ws-work",
      name: "Work",
      icon: "briefcase",
      color: "#2C4A6E",
      theme: "light",
      language: "en",
      font: "ui",
      createdAt: now - 86400000 * 9,
      locked: false,
      cover: IMAGES.workspaceWork,
    },
    {
      id: "ws-creative",
      name: "Creative Writing",
      icon: "spark",
      color: "#9C4A2F",
      theme: "light",
      language: "en",
      font: "serif",
      createdAt: now - 86400000 * 4,
      locked: false,
      cover: IMAGES.workspaceCreative,
    },
  ];
}

export function seedFolders(): Folder[] {
  return [
    { id: "f-notes", workspaceId: "ws-study", parentId: null, name: "Lecture notes", color: "#3D5C54", createdAt: Date.now() },
    { id: "f-meet", workspaceId: "ws-work", parentId: null, name: "Meetings", color: "#2C4A6E", createdAt: Date.now() },
    { id: "f-chapters", workspaceId: "ws-creative", parentId: null, name: "Chapters", color: "#9C4A2F", createdAt: Date.now() },
  ];
}

function baseFile(partial: Partial<NoteFile> & Pick<NoteFile, "id" | "workspaceId" | "name" | "blocks">): NoteFile {
  const now = Date.now();
  return {
    folderId: null,
    tags: [],
    pinned: false,
    favorite: false,
    archived: false,
    trashedAt: null,
    createdAt: now,
    updatedAt: now,
    language: "auto",
    layout: { margins: 64, columns: 1, background: "", pageSize: "a4" },
    snapshots: [],
    writingMs: 0,
    ...partial,
  };
}

export function seedFiles(): NoteFile[] {
  const now = Date.now();
  return [
    baseFile({
      id: "doc-welcome",
      workspaceId: "ws-study",
      name: "Welcome to TUYA PRO",
      tags: ["guide", "start"],
      pinned: true,
      favorite: true,
      cover: IMAGES.coverWelcome,
      icon: "✦",
      updatedAt: now - 1000 * 60 * 12,
      writingMs: 1000 * 60 * 18,
      blocks: page([
        makeBlock("h1", "A studio that stays on your desk"),
        makeBlock(
          "paragraph",
          "TUYA PRO is a writing and knowledge instrument — not a cloud product. Every document is its own world: portable, private, and identical wherever it is opened."
        ),
        makeBlock("callout", "100% local. No login, no servers, no telemetry. Your file is entirely your property.", {
          calloutIcon: "◈",
          calloutTone: "note",
        }),
        makeBlock("h2", "Three ways to write"),
        makeBlock(
          "paragraph",
          "Focus mode hides the chrome and leaves a quiet page, a word count, and an optional Pomodoro. Page mode behaves like a sheet of paper — margins, headers, print. Canvas mode is a free desk: drag, layer, lock, and compose."
        ),
        makeBlock("h2", "Everything is a block"),
        makeBlock(
          "paragraph",
          "Headings, lists, tables that think a little like spreadsheets, images, audio notes, drawings, timelines, sticky notes. Press / to insert. Type - or 1. or > and the page understands."
        ),
        makeBlock("ul", "", {
          items: [
            "Workspaces with their own colour, type, and lock",
            "Templates that carry fonts, variables, and locked zones",
            ".wnote files — a ZIP world with assets, history, and style",
            "Arabic and English, RTL and LTR, in the same breath",
          ],
        }),
        makeBlock("quote", "Simple but deep. Calm, modern, free of visual clutter.", { caption: "The brief" }),
        makeBlock("h3", "Try this"),
        makeBlock("todo", "Open Focus mode and write twenty sentences without looking away", { checked: false }),
        makeBlock("todo", "Pin a document and tag it", { checked: true }),
        makeBlock("todo", "Export this page as a .wnote and open it again", { checked: false }),
        makeBlock("divider", ""),
        makeBlock(
          "paragraph",
          "Press Ctrl/⌘ K for the command palette. Press ? for shortcuts. Nothing here leaves the machine."
        ),
      ]),
    }),
    baseFile({
      id: "doc-lecture",
      workspaceId: "ws-study",
      folderId: "f-notes",
      name: "Ontology — week 3",
      tags: ["philosophy", "lecture"],
      icon: "▤",
      updatedAt: now - 1000 * 60 * 80,
      writingMs: 1000 * 60 * 42,
      blocks: page([
        makeBlock("h1", "Being, beings, and the question"),
        makeBlock("callout", "Read Heidegger §§1–4 before Thursday. Bring one objection.", {
          calloutTone: "warn",
          calloutIcon: "!",
        }),
        makeBlock("h2", "Notes"),
        makeBlock(
          "paragraph",
          "The ontological difference is not a riddle to be solved but a relation to be kept open. We speak of beings and forget being — the forgetfulness is the history."
        ),
        makeBlock("quote", "The nothing nothings.", { caption: "A sentence to sit with" }),
        makeBlock("h3", "Questions"),
        makeBlock("ol", "", {
          items: [
            "Is the question of being still a question, or a style?",
            "What would a non-Western ontology refuse here?",
            "Where does language carry us without asking?",
          ],
        }),
        makeBlock("table", "", {
          table: {
            header: true,
            rows: 4,
            cols: 3,
            cells: [
              ["Term", "Sense", "Risk"],
              ["Dasein", "The being that we are", "Anthropology"],
              ["Ready-to-hand", "Tools in use", "Pragmatism"],
              ["Present-at-hand", "Objects observed", "Science as default"],
            ],
          },
        }),
      ]),
    }),
    baseFile({
      id: "doc-meet",
      workspaceId: "ws-work",
      folderId: "f-meet",
      name: "Studio review — 12 March",
      tags: ["meeting", "product"],
      pinned: true,
      icon: "◎",
      updatedAt: now - 1000 * 60 * 30,
      writingMs: 1000 * 60 * 25,
      blocks: page([
        makeBlock("h1", "Studio review"),
        makeBlock("paragraph", "Attending: Lina, Omar, Jules. Room 4 — paper on the table, laptops closed for the first half."),
        makeBlock("h2", "Decisions"),
        makeBlock("todo", "Ship the offline export path before any sync conversation", { checked: true }),
        makeBlock("todo", "Keep the terracotta accent; drop the neon experiment", { checked: true }),
        makeBlock("todo", "Write the Arabic sample chapter this week", { checked: false }),
        makeBlock("h2", "Notes"),
        makeBlock(
          "paragraph",
          "The product is a desk, not a feed. If a feature needs a server, it does not belong in v1. Templates should feel like letterpress, not dashboards."
        ),
        makeBlock("timeline", "", {
          timeline: [
            { date: "Week 1", title: "Foundation", text: "Blocks, workspaces, .wnote" },
            { date: "Week 2", title: "Paper", text: "Page mode, print, templates" },
            { date: "Week 3", title: "Depth", text: "Canvas, history, encryption" },
          ],
        }),
      ]),
    }),
    baseFile({
      id: "doc-brief",
      workspaceId: "ws-work",
      name: "Project brief — Atlas",
      tags: ["project"],
      favorite: true,
      icon: "▲",
      updatedAt: now - 1000 * 60 * 200,
      writingMs: 1000 * 60 * 55,
      blocks: page([
        makeBlock("h1", "Atlas — a map of private knowledge"),
        makeBlock("paragraph", "A local graph of documents, tags, and backlinks. No account. Optional lock."),
        makeBlock("h2", "Scope"),
        makeBlock("ul", "", {
          items: ["Import Markdown and HTML", "Export .wnote and PDF via print", "Workspace AES lock", "Kanban for stray ideas"],
        }),
        makeBlock("table", "", {
          table: {
            header: true,
            rows: 4,
            cols: 3,
            cells: [
              ["Workstream", "Owner", "Status"],
              ["Editor", "Jules", "Doing"],
              ["Export", "Omar", "Done"],
              ["Arabic typography", "Lina", "To do"],
            ],
          },
        }),
      ]),
    }),
    baseFile({
      id: "doc-chapter",
      workspaceId: "ws-creative",
      folderId: "f-chapters",
      name: "Chapter I — The dry river",
      tags: ["novel", "draft"],
      favorite: true,
      icon: "¶",
      cover: IMAGES.templateJournal,
      updatedAt: now - 1000 * 60 * 8,
      writingMs: 1000 * 60 * 110,
      language: "en",
      blocks: page([
        makeBlock("h1", "The dry river"),
        makeBlock(
          "paragraph",
          "By August the river was a rumour. Children still named it, as if the word could keep a bed of stones from becoming a road. Mara walked the white dust with a notebook that never opened in public."
        ),
        makeBlock(
          "paragraph",
          "She had come south for a silence that the city advertised and did not sell. What she found was a town that measured time in shadows on the clinic wall, and a grocer who saved the last figs for people who asked in complete sentences."
        ),
        makeBlock("quote", "Do not write what you saw. Write what refused to leave.", { caption: "from her teacher" }),
        makeBlock(
          "paragraph",
          "At dusk the heat receded like a tide that had never learned the moon. She sat on the clinic steps and counted the words she had not yet spent. Tomorrow she would open the notebook. Tomorrow was a discipline, not a weather."
        ),
        makeBlock("sticky", "Keep the grocer. Lose the bus station — too much arrival.", { stickyColor: "#F3E2B8" }),
      ]),
    }),
    baseFile({
      id: "doc-ar",
      workspaceId: "ws-creative",
      name: "ملاحظات عربية",
      tags: ["عربي"],
      language: "ar",
      icon: "م",
      updatedAt: now - 1000 * 60 * 50,
      writingMs: 1000 * 60 * 20,
      blocks: page([
        makeBlock("h1", "الكتابة بيتٌ يُحمل"),
        makeBlock(
          "paragraph",
          "ليست السحابة مكاناً للنصوص التي نعتز بها. الملف عالم مستقل: خطوطه معه، وصوره معه، وتاريخه معه. تفتحه على جهاز آخر فيبدو كما تركته."
        ),
        makeBlock("callout", "التطبيق يتحدث العربية والإنجليزية، ويحترم اتجاه النص دون أن يفرض واحداً على الصفحة.", {
          calloutTone: "info",
          calloutIcon: "◊",
        }),
        makeBlock("quote", "الطمأنينة شكلٌ من أشكال الدقّة.", { caption: "هامش" }),
      ]),
    }),
  ];
}

export function seedKanban(): KanbanCard[] {
  return [
    {
      id: uid("k"),
      workspaceId: "ws-creative",
      column: "todo",
      title: "Name the grocer",
      body: "He needs a voice that is not comic relief.",
      color: "#9C4A2F",
      createdAt: Date.now(),
    },
    {
      id: uid("k"),
      workspaceId: "ws-creative",
      column: "doing",
      title: "Rewrite dusk paragraph",
      body: "Less metaphor, more heat.",
      color: "#8A6A32",
      createdAt: Date.now(),
    },
    {
      id: uid("k"),
      workspaceId: "ws-work",
      column: "done",
      title: "Lock the offline promise",
      body: "No network in the architecture.",
      color: "#3D5C54",
      createdAt: Date.now(),
    },
  ];
}

export function seedLibrary(): LibraryItem[] {
  return [
    {
      id: uid("l"),
      workspaceId: "ws-creative",
      type: "quote",
      text: "Do not write what you saw. Write what refused to leave.",
      source: "Chapter I notes",
      createdAt: Date.now(),
    },
    {
      id: uid("l"),
      workspaceId: "ws-study",
      type: "note",
      text: "Ontological difference ≠ a puzzle. Keep it open.",
      createdAt: Date.now() - 86400000,
    },
  ];
}

export const TEMPLATE_BLOCKS: Record<string, () => Block[]> = {
  blank: () => [makeBlock("paragraph", "")],
  article: () => [
    makeBlock("h1", "Title of the piece"),
    makeBlock("paragraph", "A lede that earns the next sentence."),
    makeBlock("h2", "The argument"),
    makeBlock("paragraph", "Develop the thought without hurrying."),
    makeBlock("quote", "A line worth keeping."),
    makeBlock("h2", "Close"),
    makeBlock("paragraph", "Leave a door, not a summary."),
  ],
  meeting: () => [
    makeBlock("h1", "Meeting — {date}"),
    makeBlock("paragraph", "Attendees: "),
    makeBlock("h2", "Agenda"),
    makeBlock("ol", "", { items: ["", "", ""] }),
    makeBlock("h2", "Decisions"),
    makeBlock("todo", "", { checked: false }),
    makeBlock("h2", "Notes"),
    makeBlock("paragraph", ""),
  ],
  journal: () => [
    makeBlock("h1", "{date}"),
    makeBlock("paragraph", "How did the day actually feel — not how it should be told?"),
    makeBlock("h3", "Kept"),
    makeBlock("ul", "", { items: [""] }),
    makeBlock("h3", "Released"),
    makeBlock("ul", "", { items: [""] }),
  ],
  resume: () => [
    makeBlock("h1", "{author}"),
    makeBlock("paragraph", "City · email · craft"),
    makeBlock("h2", "Experience"),
    makeBlock("h3", "Role — Place"),
    makeBlock("ul", "", { items: ["A concrete outcome", "A second outcome"] }),
    makeBlock("h2", "Education"),
    makeBlock("paragraph", ""),
  ],
  plan: () => [
    makeBlock("h1", "Business plan — {title}"),
    makeBlock("h2", "Problem"),
    makeBlock("paragraph", ""),
    makeBlock("h2", "Approach"),
    makeBlock("paragraph", ""),
    makeBlock("h2", "Numbers"),
    makeBlock("table", "", {
      table: {
        header: true,
        rows: 4,
        cols: 3,
        cells: [
          ["Item", "Year 1", "Year 2"],
          ["Revenue", "", ""],
          ["Cost", "", ""],
          ["Margin", "", ""],
        ],
      },
    }),
  ],
  science: () => [
    makeBlock("h1", "Experiment — {date}"),
    makeBlock("h2", "Hypothesis"),
    makeBlock("paragraph", ""),
    makeBlock("h2", "Method"),
    makeBlock("ol", "", { items: [""] }),
    makeBlock("h2", "Observations"),
    makeBlock("paragraph", ""),
    makeBlock("h2", "Result"),
    makeBlock("paragraph", ""),
  ],
  finance: () => [
    makeBlock("h1", "Ledger — {date}"),
    makeBlock("table", "", {
      table: {
        header: true,
        rows: 5,
        cols: 4,
        cells: [
          ["Date", "Item", "In", "Out"],
          ["", "", "", ""],
          ["", "", "", ""],
          ["", "", "", ""],
          ["", "SUM", "", ""],
        ],
      },
    }),
  ],
  project: () => [
    makeBlock("h1", "Brief — {title}"),
    makeBlock("callout", "One sentence: what must be true when we are done.", { calloutTone: "info", calloutIcon: "△" }),
    makeBlock("h2", "Scope"),
    makeBlock("ul", "", { items: [""] }),
    makeBlock("h2", "Out of scope"),
    makeBlock("ul", "", { items: [""] }),
    makeBlock("h2", "Milestones"),
    makeBlock("timeline", "", {
      timeline: [
        { date: "Now", title: "Start", text: "" },
        { date: "Next", title: "Review", text: "" },
      ],
    }),
  ],
  chapter: () => [
    makeBlock("h1", "Chapter"),
    makeBlock("paragraph", ""),
    makeBlock("paragraph", ""),
  ],
};
