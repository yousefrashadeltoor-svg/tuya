export type Lang = "en" | "ar";
export type ThemeId = "light" | "dark" | "paper" | "glass" | "matte" | "contrast";
export type EditorMode = "focus" | "page" | "canvas";
export type View =
  | "dashboard"
  | "files"
  | "editor"
  | "templates"
  | "favorites"
  | "archive"
  | "trash"
  | "kanban"
  | "calendar"
  | "stats"
  | "settings"
  | "library"
  | "graph"
  | "builder";
export type FileViewMode = "list" | "grid" | "tree";
export type BlockType =
  | "paragraph"
  | "h1"
  | "h2"
  | "h3"
  | "ul"
  | "ol"
  | "todo"
  | "quote"
  | "divider"
  | "callout"
  | "code"
  | "toggle"
  | "bookmark"
  | "table"
  | "image"
  | "video"
  | "pdf"
  | "file"
  | "audio"
  | "drawing"
  | "shape"
  | "sticky"
  | "timeline"
  | "gallery";

export interface BlockStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  fontStyle?: "normal" | "italic";
  textDecoration?: string;
  letterSpacing?: number;
  lineHeight?: number;
  color?: string;
  background?: string;
  highlight?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  direction?: "ltr" | "rtl" | "auto";
  padding?: number;
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: string;
  borderRadius?: number;
  shadow?: boolean;
  opacity?: number;
  rotation?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  zIndex?: number;
  locked?: boolean;
  hidden?: boolean;
}

export interface TableData {
  rows: number;
  cols: number;
  cells: string[][];
  header: boolean;
}

export interface TimelineEvent {
  date: string;
  title: string;
  text: string;
}

export interface BlockComment {
  id: string;
  text: string;
  at: number;
}

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  language?: string;
  items?: string[];
  open?: boolean;
  table?: TableData;
  src?: string;
  caption?: string;
  alt?: string;
  calloutIcon?: string;
  calloutTone?: "info" | "warn" | "success" | "danger" | "note";
  shape?: "rect" | "circle" | "arrow" | "star";
  stickyColor?: string;
  timeline?: TimelineEvent[];
  gallery?: string[];
  fileName?: string;
  fileSize?: number;
  comments?: BlockComment[];
  link?: string;
  style: BlockStyle;
}

export interface Snapshot {
  id: string;
  at: number;
  label?: string;
  blocks: Block[];
}

export interface NoteFile {
  id: string;
  workspaceId: string;
  folderId: string | null;
  name: string;
  tags: string[];
  pinned: boolean;
  favorite: boolean;
  archived: boolean;
  trashedAt: number | null;
  createdAt: number;
  updatedAt: number;
  templateId?: string;
  cover?: string;
  icon?: string;
  language: Lang | "auto";
  blocks: Block[];
  layout: {
    margins: number;
    columns: 1 | 2 | 3;
    background: string;
    pageSize: "a4" | "letter" | "unlimited";
  };
  snapshots: Snapshot[];
  writingMs: number;
}

export interface Folder {
  id: string;
  workspaceId: string;
  parentId: string | null;
  name: string;
  color: string;
  createdAt: number;
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  color: string;
  theme: ThemeId;
  language: Lang;
  font: string;
  createdAt: number;
  locked: boolean;
  passwordHash?: string;
  cover?: string;
}

export interface KanbanCard {
  id: string;
  workspaceId: string;
  column: "todo" | "doing" | "done";
  title: string;
  body: string;
  color: string;
  createdAt: number;
}

export interface LibraryItem {
  id: string;
  workspaceId: string;
  type: "quote" | "link" | "note";
  text: string;
  source?: string;
  createdAt: number;
}

export interface AppSettings {
  lang: Lang;
  theme: ThemeId;
  autoDark: boolean;
  lastWorkspaceId: string | null;
  pomodoroMinutes: number;
  dailyWordGoal: number;
  sidebarCollapsed: boolean;
  uiScale: number;
}

export interface TemplateDef {
  id: string;
  nameKey: string;
  descKey: string;
  icon: string;
  cover?: string;
  category: "document" | "creative" | "specialized";
  blocks: () => Block[];
}

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

export function emptyStyle(): BlockStyle {
  return {};
}

export function makeBlock(type: BlockType, content = "", extra: Partial<Block> = {}): Block {
  return { id: uid("b"), type, content, style: emptyStyle(), ...extra };
}

export function countWords(blocks: Block[]): number {
  let n = 0;
  for (const b of blocks) {
    const t = (b.content || "") + " " + (b.items || []).join(" ") + " " + (b.caption || "");
    n += t
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    if (b.table) {
      n += b.table.cells
        .flat()
        .join(" ")
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
    }
  }
  return n;
}

export function readingMinutes(words: number): number {
  return Math.max(1, Math.round(words / 200));
}

export const FONTS = [
  { id: "ui", label: "System Sans", css: 'ui-sans-serif, system-ui, "Segoe UI", Tahoma, sans-serif' },
  { id: "serif", label: "Editorial Serif", css: 'Georgia, "Iowan Old Style", "Palatino Linotype", serif' },
  { id: "mono", label: "Mono", css: 'ui-monospace, "Cascadia Code", Consolas, monospace' },
  { id: "arabic", label: "Arabic UI", css: 'Tahoma, "Segoe UI", "Noto Naskh Arabic", sans-serif' },
  { id: "display", label: "Display", css: '"Palatino Linotype", Palatino, Georgia, serif' },
];

export const TAG_COLORS = [
  "#9C4A2F",
  "#3D5C54",
  "#2C4A6E",
  "#8A6A32",
  "#6B4C7A",
  "#4A6B3D",
  "#8B3A4A",
  "#3A6B6B",
];

export const WORKSPACE_ICONS = ["pen", "book", "briefcase", "spark", "leaf", "star", "lab", "home"];
