import type {
  AppSettings,
  Folder,
  KanbanCard,
  LibraryItem,
  NoteFile,
  Workspace,
} from "./types";

const DB = "tuya-pro";
const VER = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of ["workspaces", "files", "folders", "kanban", "library", "meta"]) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = fn(t.objectStore(store));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAll<T>(store: string): Promise<T[]> {
  return tx(store, "readonly", (s) => s.getAll()) as Promise<T[]>;
}

export const db = {
  allWorkspaces: () => getAll<Workspace>("workspaces"),
  putWorkspace: (w: Workspace) => tx("workspaces", "readwrite", (s) => s.put(w)),
  delWorkspace: (id: string) => tx("workspaces", "readwrite", (s) => s.delete(id)),

  allFiles: () => getAll<NoteFile>("files"),
  putFile: (f: NoteFile) => tx("files", "readwrite", (s) => s.put(f)),
  delFile: (id: string) => tx("files", "readwrite", (s) => s.delete(id)),

  allFolders: () => getAll<Folder>("folders"),
  putFolder: (f: Folder) => tx("folders", "readwrite", (s) => s.put(f)),
  delFolder: (id: string) => tx("folders", "readwrite", (s) => s.delete(id)),

  allKanban: () => getAll<KanbanCard>("kanban"),
  putKanban: (c: KanbanCard) => tx("kanban", "readwrite", (s) => s.put(c)),
  delKanban: (id: string) => tx("kanban", "readwrite", (s) => s.delete(id)),

  allLibrary: () => getAll<LibraryItem>("library"),
  putLibrary: (i: LibraryItem) => tx("library", "readwrite", (s) => s.put(i)),
  delLibrary: (id: string) => tx("library", "readwrite", (s) => s.delete(id)),
};

const SETTINGS_KEY = "tuya.settings";
const SESSION_KEY = "tuya.session";
const UNLOCK_KEY = "tuya.unlocks";
const SEEDED_KEY = "tuya.seeded";

export const defaultSettings = (): AppSettings => ({
  lang: "en",
  theme: "light",
  autoDark: false,
  lastWorkspaceId: null,
  pomodoroMinutes: 25,
  dailyWordGoal: 500,
  sidebarCollapsed: false,
  uiScale: 1,
});

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaultSettings(), ...JSON.parse(raw) } : defaultSettings();
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(s: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function loadSession(): { view?: string; fileId?: string; wsId?: string } {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveSession(s: { view?: string; fileId?: string; wsId?: string }) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function isSeeded(): boolean {
  return localStorage.getItem(SEEDED_KEY) === "1";
}

export function markSeeded() {
  localStorage.setItem(SEEDED_KEY, "1");
}

export async function hashPassword(pw: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("tuya:" + pw));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function rememberUnlock(id: string) {
  const cur = JSON.parse(sessionStorage.getItem(UNLOCK_KEY) || "[]") as string[];
  if (!cur.includes(id)) cur.push(id);
  sessionStorage.setItem(UNLOCK_KEY, JSON.stringify(cur));
}

export function isUnlocked(id: string): boolean {
  const cur = JSON.parse(sessionStorage.getItem(UNLOCK_KEY) || "[]") as string[];
  return cur.includes(id);
}

export function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function fileSizeOf(f: NoteFile): number {
  return new Blob([JSON.stringify(f)]).size;
}

export function fmtSize(n: number): string {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / 1024 / 1024).toFixed(1) + " MB";
}

export function fmtDate(ts: number, lang: "en" | "ar"): string {
  return new Date(ts).toLocaleString(lang === "ar" ? "ar" : "en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDuration(ms: number): string {
  const m = Math.round(ms / 60000);
  if (m < 60) return m + "m";
  return Math.floor(m / 60) + "h " + (m % 60) + "m";
}

export async function encryptJson(obj: unknown, password: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyRaw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("tuya-aes:" + password));
  const key = await crypto.subtle.importKey("raw", keyRaw, "AES-GCM", false, ["encrypt"]);
  const data = new TextEncoder().encode(JSON.stringify(obj));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  const out = new Uint8Array(iv.length + cipher.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(cipher), iv.length);
  return btoa(String.fromCharCode(...out));
}

export async function decryptJson<T>(payload: string, password: string): Promise<T> {
  const bin = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0));
  const iv = bin.slice(0, 12);
  const data = bin.slice(12);
  const keyRaw = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("tuya-aes:" + password));
  const key = await crypto.subtle.importKey("raw", keyRaw, "AES-GCM", false, ["decrypt"]);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return JSON.parse(new TextDecoder().decode(plain)) as T;
}
