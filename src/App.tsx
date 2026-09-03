import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { IMAGES } from "./assets";
import Editor, { BLOCK_TYPES } from "./components/Editor";
import {
  BuilderView,
  CalendarView,
  Dashboard,
  EmptyState,
  FileManager,
  GraphView,
  KanbanView,
  LibraryView,
  SettingsView,
  StatsView,
  TemplatesView,
  templateBlocks,
} from "./components/views";
import {
  exportHtmlFile,
  exportJsonFile,
  exportMarkdownFile,
  exportTxtFile,
  exportWnote,
  exportWspace,
  importWnote,
  importWspace,
  parseCsvToTable,
  parseMarkdown,
} from "./exportEngine";
import { t } from "./i18n";
import { Icon } from "./icons";
import { seedFiles, seedFolders, seedKanban, seedLibrary, seedWorkspaces } from "./seed";
import {
  db,
  downloadBlob,
  fmtDate,
  hashPassword,
  isSeeded,
  isUnlocked,
  loadSession,
  loadSettings,
  markSeeded,
  rememberUnlock,
  saveSession,
  saveSettings,
} from "./storage";
import type {
  AppSettings,
  Block,
  EditorMode,
  FileViewMode,
  Folder,
  KanbanCard,
  Lang,
  LibraryItem,
  NoteFile,
  ThemeId,
  View,
  Workspace,
} from "./types";
import { FONTS, countWords, makeBlock, readingMinutes, uid } from "./types";

const NAV: { id: View; icon: string }[] = [
  { id: "dashboard", icon: "dash" },
  { id: "files", icon: "files" },
  { id: "templates", icon: "tmpl" },
  { id: "favorites", icon: "star" },
  { id: "kanban", icon: "board" },
  { id: "calendar", icon: "cal" },
  { id: "library", icon: "book" },
  { id: "graph", icon: "graph" },
  { id: "stats", icon: "chart" },
  { id: "archive", icon: "archive" },
  { id: "trash", icon: "trash" },
  { id: "builder", icon: "layer" },
  { id: "settings", icon: "gear" },
];

function applyTheme(theme: ThemeId, autoDark: boolean) {
  let th = theme;
  if (autoDark && window.matchMedia("(prefers-color-scheme: dark)").matches) th = "dark";
  document.documentElement.setAttribute("data-theme", th);
}

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [files, setFiles] = useState<NoteFile[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [kanban, setKanban] = useState<KanbanCard[]>([]);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [wsId, setWsId] = useState<string>("");
  const [view, setView] = useState<View>("dashboard");
  const [fileId, setFileId] = useState<string | null>(null);
  const [mode, setMode] = useState<EditorMode>("page");
  const [sel, setSel] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [splash, setSplash] = useState(true);
  const [cmd, setCmd] = useState(false);
  const [cmdQ, setCmdQ] = useState("");
  const [toast, setToast] = useState("");
  const [right, setRight] = useState(true);
  const [help, setHelp] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [wsOpen, setWsOpen] = useState(false);
  const [newWs, setNewWs] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [pass, setPass] = useState("");
  const [preview, setPreview] = useState(false);
  const [present, setPresent] = useState(false);
  const [book, setBook] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [dim, setDim] = useState(false);
  const [grid, setGrid] = useState(true);
  const [fileMode, setFileMode] = useState<FileViewMode>("list");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"name" | "date" | "size">("date");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [filterTag, setFilterTag] = useState("");
  const [quick, setQuick] = useState("");
  const [pomoOn, setPomoOn] = useState(false);
  const [pomoLeft, setPomoLeft] = useState(settings.pomodoroMinutes * 60);
  const [pomoBreak, setPomoBreak] = useState(false);
  const [undo, setUndo] = useState<Block[][]>([]);
  const [redo, setRedo] = useState<Block[][]>([]);
  const [saving, setSaving] = useState(false);
  const [wsName, setWsName] = useState("");
  const [slide, setSlide] = useState(0);
  const writeTick = useRef<number>(0);
  const importRef = useRef<HTMLInputElement>(null);

  const lang = settings.lang;
  const ws = workspaces.find((w) => w.id === wsId) || workspaces[0];
  const current = files.find((f) => f.id === fileId) || null;
  const wsFiles = files.filter((f) => f.workspaceId === (ws?.id || "") && !f.trashedAt);
  const liveFiles = wsFiles.filter((f) => !f.archived);

  const ping = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  useEffect(() => {
    (async () => {
      if (!isSeeded()) {
        const w = seedWorkspaces();
        const fl = seedFiles();
        const fd = seedFolders();
        const k = seedKanban();
        const lib = seedLibrary();
        for (const x of w) await db.putWorkspace(x);
        for (const x of fl) await db.putFile(x);
        for (const x of fd) await db.putFolder(x);
        for (const x of k) await db.putKanban(x);
        for (const x of lib) await db.putLibrary(x);
        markSeeded();
      }
      const [w, fl, fd, k, lib] = await Promise.all([
        db.allWorkspaces(),
        db.allFiles(),
        db.allFolders(),
        db.allKanban(),
        db.allLibrary(),
      ]);
      setWorkspaces(w);
      setFiles(fl);
      setFolders(fd);
      setKanban(k);
      setLibrary(lib);
      const sess = loadSession();
      const id = sess.wsId && w.some((x) => x.id === sess.wsId) ? sess.wsId : w[0]?.id || "";
      setWsId(id);
      if (sess.view) setView(sess.view as View);
      if (sess.fileId) {
        setFileId(sess.fileId);
        setView("editor");
      }
      setReady(true);
      setTimeout(() => setSplash(false), 1400);
    })();
  }, []);

  useEffect(() => {
    applyTheme(settings.theme, settings.autoDark);
    document.documentElement.lang = settings.lang;
    document.documentElement.dir = settings.lang === "ar" ? "rtl" : "ltr";
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveSession({ view, fileId: fileId || undefined, wsId });
  }, [view, fileId, wsId]);

  useEffect(() => {
    if (!pomoOn) return;
    const tmr = setInterval(() => {
      setPomoLeft((s) => {
        if (s <= 1) {
          setPomoBreak((b) => !b);
          return (pomoBreak ? settings.pomodoroMinutes : 5) * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tmr);
  }, [pomoOn, pomoBreak, settings.pomodoroMinutes]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (view === "editor" && fileId) {
        writeTick.current += 10000;
        setFiles((prev) => {
          const f = prev.find((x) => x.id === fileId);
          if (!f) return prev;
          const n = { ...f, writingMs: f.writingMs + 10000 };
          db.putFile(n);
          return prev.map((x) => (x.id === fileId ? n : x));
        });
      }
    }, 10000);
    return () => window.clearInterval(id);
  }, [view, fileId]);

  const patchSettings = (p: Partial<AppSettings>) => setSettings((s) => ({ ...s, ...p }));

  const persistFile = async (f: NoteFile) => {
    setSaving(true);
    await db.putFile(f);
    setSaving(false);
  };

  const patchFile = useCallback((id: string, p: Partial<NoteFile>) => {
    setFiles((prev) => {
      const next = prev.map((f) => (f.id === id ? { ...f, ...p, updatedAt: Date.now() } : f));
      const f = next.find((x) => x.id === id);
      if (f) persistFile(f);
      return next;
    });
  }, []);

  const setBlocks = (blocks: Block[]) => {
    if (!current) return;
    setUndo((u) => [...u.slice(-40), current.blocks]);
    setRedo([]);
    patchFile(current.id, { blocks });
  };

  const doUndo = () => {
    if (!current || !undo.length) return;
    const prev = undo[undo.length - 1];
    setUndo((u) => u.slice(0, -1));
    setRedo((r) => [...r, current.blocks]);
    patchFile(current.id, { blocks: prev });
  };
  const doRedo = () => {
    if (!current || !redo.length) return;
    const nx = redo[redo.length - 1];
    setRedo((r) => r.slice(0, -1));
    setUndo((u) => [...u, current.blocks]);
    patchFile(current.id, { blocks: nx });
  };

  const openFile = (id: string) => {
    setFileId(id);
    setView("editor");
    setSel(null);
    setUndo([]);
    setRedo([]);
  };

  const createFile = (tpl?: string, folderId: string | null = null) => {
    if (!ws) return;
    const now = Date.now();
    const f: NoteFile = {
      id: uid("d"),
      workspaceId: ws.id,
      folderId,
      name: tpl ? t(lang, tpl === "blank" ? "untitled" : tpl) : t(lang, "untitled"),
      tags: [],
      pinned: false,
      favorite: false,
      archived: false,
      trashedAt: null,
      createdAt: now,
      updatedAt: now,
      language: "auto",
      blocks: templateBlocks(tpl || "blank"),
      layout: { margins: 64, columns: 1, background: "", pageSize: "a4" },
      snapshots: [],
      writingMs: 0,
      templateId: tpl,
      icon: "¶",
    };
    setFiles((p) => [f, ...p]);
    db.putFile(f);
    openFile(f.id);
    ping(t(lang, "success"));
  };

  const createFolder = () => {
    if (!ws) return;
    const name = prompt(t(lang, "folderName")) || t(lang, "newFolder");
    const fd: Folder = { id: uid("f"), workspaceId: ws.id, parentId: null, name, color: ws.color, createdAt: Date.now() };
    setFolders((p) => [...p, fd]);
    db.putFolder(fd);
  };

  const keepQuick = () => {
    if (!quick.trim() || !ws) return;
    const f: NoteFile = {
      id: uid("d"),
      workspaceId: ws.id,
      folderId: null,
      name: quick.slice(0, 32) || t(lang, "untitled"),
      tags: ["quick"],
      pinned: false,
      favorite: false,
      archived: false,
      trashedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      language: "auto",
      blocks: [makeBlock("paragraph", quick)],
      layout: { margins: 64, columns: 1, background: "", pageSize: "a4" },
      snapshots: [],
      writingMs: 0,
      icon: "✎",
    };
    setFiles((p) => [f, ...p]);
    db.putFile(f);
    setQuick("");
    ping(t(lang, "keep"));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmd(true);
        setCmdQ("");
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) doRedo();
        else doUndo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (current) {
          const snap = { id: uid("s"), at: Date.now(), label: t(lang, "snapshot"), blocks: current.blocks };
          patchFile(current.id, { snapshots: [...current.snapshots, snap] });
          ping(t(lang, "snapshot"));
        }
      }
      if (e.key === "?" && !(e.target as HTMLElement).closest("input,textarea,[contenteditable]")) setHelp(true);
      if (e.key === "Escape") {
        setCmd(false);
        setHelp(false);
        setPresent(false);
        setExportOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const words = current ? countWords(current.blocks) : 0;
  const block = current?.blocks.find((b) => b.id === sel) || null;

  const headings = current?.blocks.filter((b) => b.type === "h1" || b.type === "h2" || b.type === "h3") || [];
  const slides = current?.blocks.filter((b) => b.type === "h1") || [];

  const locked = !!(ws?.locked && !isUnlocked(ws.id));

  const cmdItems = useMemo(() => {
    const q = cmdQ.toLowerCase();
    const acts = [
      { k: t(lang, "newFile"), run: () => createFile() },
      { k: t(lang, "focus"), run: () => { setView("editor"); setMode("focus"); } },
      { k: t(lang, "page"), run: () => setMode("page") },
      { k: t(lang, "canvas"), run: () => setMode("canvas") },
      { k: t(lang, "settings"), run: () => setView("settings") },
      { k: t(lang, "templates"), run: () => setView("templates") },
      { k: t(lang, "exportWnote"), run: () => current && exportWnote(current) },
      { k: t(lang, "presentation"), run: () => setPresent(true) },
      { k: t(lang, "print"), run: () => window.print() },
      ...liveFiles.map((f) => ({ k: f.name, run: () => openFile(f.id) })),
      ...BLOCK_TYPES.map((b) => ({
        k: "/ " + t(lang, b.key),
        run: () => {
          if (!current) return;
          setBlocks([...current.blocks, makeBlock(b.type, "")]);
        },
      })),
    ];
    return acts.filter((a) => a.k.toLowerCase().includes(q)).slice(0, 14);
  }, [cmdQ, lang, liveFiles, current]);

  const onImport = async (file: File) => {
    const name = file.name.toLowerCase();
    if (name.endsWith(".wnote")) {
      const data = await importWnote(file);
      if (data && ws) createFromImport(data);
    } else if (name.endsWith(".wspace")) {
      const data = await importWspace(file);
      if (data) {
        const nw = { ...data.workspace, id: uid("ws") };
        setWorkspaces((p) => [...p, nw]);
        db.putWorkspace(nw);
        data.files.forEach((f) => {
          const nf = { ...f, id: uid("d"), workspaceId: nw.id };
          setFiles((p) => [...p, nf]);
          db.putFile(nf);
        });
        ping(t(lang, "imported"));
      }
    } else if (name.endsWith(".md")) {
      const text = await file.text();
      createFromImport({ name: file.name.replace(/\.md$/i, ""), blocks: parseMarkdown(text) });
    } else if (name.endsWith(".csv")) {
      const text = await file.text();
      createFromImport({ name: file.name, blocks: [parseCsvToTable(text)] });
    } else if (name.endsWith(".json")) {
      const data = JSON.parse(await file.text());
      createFromImport(data);
    } else if (name.endsWith(".html") || name.endsWith(".txt")) {
      const text = await file.text();
      createFromImport({ name: file.name, blocks: [makeBlock("paragraph", text.replace(/<[^>]+>/g, ""))] });
    } else ping(t(lang, "imported"));
  };

  const createFromImport = (data: Partial<NoteFile>) => {
    if (!ws) return;
    const f: NoteFile = {
      id: uid("d"),
      workspaceId: ws.id,
      folderId: null,
      name: data.name || t(lang, "untitled"),
      tags: data.tags || ["imported"],
      pinned: false,
      favorite: false,
      archived: false,
      trashedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      language: data.language || "auto",
      blocks: data.blocks || [makeBlock("paragraph", "")],
      layout: data.layout || { margins: 64, columns: 1, background: "", pageSize: "a4" },
      snapshots: [],
      writingMs: 0,
      icon: "↓",
    };
    setFiles((p) => [f, ...p]);
    db.putFile(f);
    openFile(f.id);
    ping(t(lang, "imported"));
  };

  if (splash || !ready) {
    return (
      <div className="h-full flex flex-col items-center justify-center" style={{ background: "#1c1612", color: "#f4ead6" }}>
        <img src={IMAGES.logo} alt="TUYA" className="splash-mark w-28 h-28 rounded-full object-cover mb-6" />
        <div className="logo-type splash-mark">TUYA PRO</div>
        <p className="mt-3 text-sm opacity-70 splash-mark">{t(lang, "tagline")}</p>
        <p className="text-xs mt-8 opacity-40">{t(lang, "loading")}</p>
      </div>
    );
  }

  if (!ws) return null;

  if (locked) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="tuya-card rounded-3xl p-8 w-full max-w-sm text-center">
          <Icon name="lock" size={28} className="mx-auto mb-3" />
          <h1 className="font-serif text-2xl">{ws.name}</h1>
          <p className="text-sm my-3" style={{ color: "var(--muted)" }}>{t(lang, "enterPass")}</p>
          <input className="field mb-3" type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
          <button
            className="tuya-btn primary w-full justify-center"
            onClick={async () => {
              if (ws.passwordHash && (await hashPassword(pass)) === ws.passwordHash) {
                rememberUnlock(ws.id);
                setPass("");
                setWorkspaces((p) => [...p]);
              } else ping(t(lang, "wrongPass"));
            }}
          >
            {t(lang, "unlockWs")}
          </button>
        </div>
      </div>
    );
  }

  const listFor = (v: View) => {
    if (v === "favorites") return liveFiles.filter((f) => f.favorite);
    if (v === "archive") return wsFiles.filter((f) => f.archived);
    if (v === "trash") return files.filter((f) => f.workspaceId === ws.id && f.trashedAt);
    return liveFiles;
  };

  const collapsed = settings.sidebarCollapsed;
  const hideChrome = mode === "focus" && view === "editor";

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--bg)", color: "var(--ink)" }}>
      {!hideChrome && (
        <header className="no-print h-12 flex items-center gap-2 px-3 border-b" style={{ borderColor: "var(--line)", background: "var(--sidebar)" }}>
          <button className="flex items-center gap-2 pe-3" onClick={() => setView("dashboard")}>
            <img src={IMAGES.iconApp} alt="" className="w-7 h-7 rounded-lg object-cover" />
            <span className="logo-type hidden sm:inline">TUYA PRO</span>
          </button>
          {current && view === "editor" ? (
            <input
              className="bg-transparent outline-none font-medium text-sm flex-1 min-w-0"
              value={current.name}
              onChange={(e) => patchFile(current.id, { name: e.target.value })}
            />
          ) : (
            <div className="flex-1 text-sm" style={{ color: "var(--muted)" }}>{ws.name}</div>
          )}
          <span className="text-[11px] flex items-center gap-1" style={{ color: "var(--faint)" }}>
            <span className="offline-dot" /> {saving ? t(lang, "saving") : t(lang, "save")}
          </span>
          <button className="icon-btn" onClick={doUndo} title={t(lang, "undo")}><Icon name="undo" size={16} /></button>
          <button className="icon-btn" onClick={doRedo} title={t(lang, "redo")}><Icon name="redo" size={16} /></button>
          {view === "editor" && (
            <>
              {(["focus", "page", "canvas"] as EditorMode[]).map((m) => (
                <button key={m} className={"tuya-btn " + (mode === m ? "primary" : "ghost")} style={{ padding: "4px 10px" }} onClick={() => setMode(m)}>
                  {t(lang, m)}
                </button>
              ))}
              <button className="tuya-btn ghost" onClick={() => setPreview((p) => !p)}>{preview ? t(lang, "edit") : t(lang, "preview")}</button>
            </>
          )}
          <button className="icon-btn" onClick={() => setExportOpen(true)} title={t(lang, "export")}><Icon name="share" size={16} /></button>
          <button className="icon-btn" onClick={() => setCmd(true)} title={t(lang, "cmdK")}><Icon name="search" size={16} /></button>
          <button className="tuya-btn ghost" onClick={() => patchSettings({ lang: lang === "en" ? "ar" : "en" })}>
            {lang === "en" ? "ع" : "EN"}
          </button>
        </header>
      )}

      <div className="flex flex-1 min-h-0">
        {!hideChrome && (
          <aside className={"no-print flex flex-col border-e " + (collapsed ? "w-14" : "w-[220px]")} style={{ borderColor: "var(--line)", background: "var(--sidebar)" }}>
            <button className="m-2 tuya-card rounded-xl p-2 flex items-center gap-2" onClick={() => setWsOpen(true)}>
              <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: ws.color }}><Icon name={ws.icon} size={16} /></span>
              {!collapsed && <div className="text-start min-w-0"><div className="text-sm font-medium truncate">{ws.name}</div><div className="text-[10px]" style={{ color: "var(--faint)" }}>{t(lang, "switchWs")}</div></div>}
            </button>
            <nav className="flex-1 overflow-auto scroll-thin px-2 space-y-0.5">
              {NAV.map((n) => (
                <button key={n.id} className={"nav-item w-full " + (view === n.id ? "active" : "")} onClick={() => { setView(n.id); if (n.id !== "editor") setFileId(null); }}>
                  <Icon name={n.icon} size={16} />
                  {!collapsed && t(lang, n.id === "dashboard" ? "dash" : n.id)}
                </button>
              ))}
            </nav>
            <button className="icon-btn m-2" onClick={() => patchSettings({ sidebarCollapsed: !collapsed })}>
              <Icon name={collapsed ? "chevron" : "left"} size={16} />
            </button>
          </aside>
        )}

        <main className="flex-1 min-w-0 overflow-auto scroll-thin relative" onClick={() => hideChrome && setMode("page")}>
          {view === "dashboard" && (
            <Dashboard lang={lang} ws={ws} files={liveFiles} onOpen={openFile} onNew={() => createFile()} quick={quick} setQuick={setQuick} onKeepQuick={keepQuick} />
          )}
          {view === "files" && (
            <FileManager
              lang={lang}
              files={liveFiles}
              folders={folders.filter((f) => f.workspaceId === ws.id)}
              mode={fileMode}
              setMode={setFileMode}
              query={query}
              setQuery={setQuery}
              sort={sort}
              setSort={setSort}
              selected={selectedFiles}
              setSelected={setSelectedFiles}
              onOpen={openFile}
              onNew={() => createFile()}
              onNewFolder={createFolder}
              onPatch={(id, p) => patchFile(id, p)}
              onDelete={(ids) => ids.forEach((id) => patchFile(id, { trashedAt: Date.now() }))}
              filterTag={filterTag}
              setFilterTag={setFilterTag}
            />
          )}
          {(view === "favorites" || view === "archive" || view === "trash") && (
            listFor(view).length === 0 ? (
              <EmptyState lang={lang} view={view} />
            ) : (
              <div className="p-8 max-w-3xl mx-auto space-y-2">
                <h1 className="font-serif text-3xl mb-4">{t(lang, view)}</h1>
                {view === "trash" && (
                  <button className="tuya-btn mb-4" onClick={() => setFiles((p) => p.filter((f) => !(f.workspaceId === ws.id && f.trashedAt)))}>{t(lang, "emptyTrash")}</button>
                )}
                {listFor(view).map((f) => (
                  <div key={f.id} className="tuya-card rounded-xl p-3 flex items-center gap-3">
                    <button className="flex-1 text-start" onClick={() => view !== "trash" && openFile(f.id)}>{f.icon} {f.name}</button>
                    {view === "trash" && (
                      <>
                        <button className="tuya-btn" onClick={() => patchFile(f.id, { trashedAt: null })}>{t(lang, "restore")}</button>
                        <button className="tuya-btn" onClick={() => { setFiles((p) => p.filter((x) => x.id !== f.id)); db.delFile(f.id); }}>{t(lang, "forever")}</button>
                      </>
                    )}
                    {view === "archive" && <button className="tuya-btn" onClick={() => patchFile(f.id, { archived: false })}>{t(lang, "unarchive")}</button>}
                    {view === "favorites" && <button className="tuya-btn" onClick={() => patchFile(f.id, { favorite: false })}>{t(lang, "unfav")}</button>}
                  </div>
                ))}
              </div>
            )
          )}
          {view === "templates" && <TemplatesView lang={lang} onUse={(id) => createFile(id)} />}
          {view === "settings" && (
            <SettingsView
              lang={lang}
              theme={settings.theme}
              setLang={(l) => patchSettings({ lang: l })}
              setTheme={(th) => patchSettings({ theme: th })}
              autoDark={settings.autoDark}
              setAutoDark={(b) => patchSettings({ autoDark: b })}
              goal={settings.dailyWordGoal}
              setGoal={(n) => patchSettings({ dailyWordGoal: n })}
              pomo={settings.pomodoroMinutes}
              setPomo={(n) => { patchSettings({ pomodoroMinutes: n }); setPomoLeft(n * 60); }}
              ws={ws}
              onPatchWs={(p) => {
                const n = { ...ws, ...p };
                setWorkspaces((prev) => prev.map((w) => (w.id === ws.id ? n : w)));
                db.putWorkspace(n);
              }}
              onLock={() => setLockOpen(true)}
            />
          )}
          {view === "kanban" && (
            <KanbanView
              lang={lang}
              cards={kanban.filter((k) => k.workspaceId === ws.id)}
              onAdd={(col) => {
                const title = prompt(t(lang, "addCard")) || t(lang, "addCard");
                const c: KanbanCard = { id: uid("k"), workspaceId: ws.id, column: col, title, body: "", color: ws.color, createdAt: Date.now() };
                setKanban((p) => [...p, c]);
                db.putKanban(c);
              }}
              onMove={(id, col) => {
                setKanban((p) => p.map((k) => (k.id === id ? { ...k, column: col } : k)));
                const c = kanban.find((k) => k.id === id);
                if (c) db.putKanban({ ...c, column: col });
              }}
              onDel={(id) => { setKanban((p) => p.filter((k) => k.id !== id)); db.delKanban(id); }}
            />
          )}
          {view === "calendar" && <CalendarView lang={lang} files={liveFiles} onOpen={openFile} />}
          {view === "stats" && <StatsView lang={lang} files={liveFiles} goal={settings.dailyWordGoal} />}
          {view === "library" && (
            <LibraryView
              lang={lang}
              items={library.filter((i) => i.workspaceId === ws.id)}
              onAdd={(type) => {
                const text = prompt(t(lang, "addQuote")) || "";
                if (!text) return;
                const it: LibraryItem = { id: uid("l"), workspaceId: ws.id, type, text, createdAt: Date.now() };
                setLibrary((p) => [it, ...p]);
                db.putLibrary(it);
              }}
              onDel={(id) => { setLibrary((p) => p.filter((i) => i.id !== id)); db.delLibrary(id); }}
            />
          )}
          {view === "graph" && <GraphView lang={lang} files={liveFiles} onOpen={openFile} />}
          {view === "builder" && <BuilderView lang={lang} onSave={() => ping(t(lang, "saveTpl"))} />}
          {view === "editor" && current && (
            <div className="py-8 px-4">
              {hideChrome && (
                <button className="no-print tuya-btn fixed top-4 end-4 z-20" onClick={() => setMode("page")}>
                  {t(lang, "page")}
                </button>
              )}
              {mode === "page" && current.layout.pageSize !== "unlimited" && (
                <div className="text-center text-[11px] mb-3 no-print" style={{ color: "var(--faint)" }}>A4 · {t(lang, "page")}</div>
              )}
              <Editor
                file={current}
                lang={current.language === "ar" ? "ar" : lang}
                mode={mode}
                selectedId={sel}
                onSelect={setSel}
                onChange={setBlocks}
                zoom={zoom}
                dim={dim}
                grid={grid}
                preview={preview}
              />
            </div>
          )}
        </main>

        {!hideChrome && view === "editor" && current && right && (
          <aside className="no-print w-[280px] border-s overflow-auto scroll-thin p-3 hidden lg:block" style={{ borderColor: "var(--line)", background: "var(--sidebar)" }}>
            <div className="text-[11px] uppercase tracking-wide mb-2" style={{ color: "var(--faint)" }}>{t(lang, "properties")}</div>
            {block ? (
              <PropsPanel lang={lang} block={block} files={liveFiles} onPatch={(p) => setBlocks(current.blocks.map((b) => (b.id === block.id ? { ...b, ...p } : b)))} />
            ) : (
              <DocMeta lang={lang} file={current} onPatch={(p) => patchFile(current.id, p)} />
            )}
            <div className="mt-6">
              <div className="text-[11px] uppercase tracking-wide mb-2" style={{ color: "var(--faint)" }}>{t(lang, "outline")}</div>
              {headings.map((h) => (
                <button key={h.id} className={"block text-start w-full py-1 " + (h.type === "h1" ? "font-medium" : "ps-3 text-sm")} onClick={() => setSel(h.id)}>
                  {h.content || "…"}
                </button>
              ))}
            </div>
            <div className="mt-6">
              <div className="text-[11px] uppercase tracking-wide mb-2" style={{ color: "var(--faint)" }}>{t(lang, "history")}</div>
              {current.snapshots.slice().reverse().map((s) => (
                <button key={s.id} className="block text-start text-xs w-full py-1" onClick={() => patchFile(current.id, { blocks: s.blocks })}>
                  {s.label || fmtDate(s.at, lang)}
                </button>
              ))}
              <button className="tuya-btn mt-2" onClick={() => {
                const snap = { id: uid("s"), at: Date.now(), label: t(lang, "versionDraft"), blocks: current.blocks };
                patchFile(current.id, { snapshots: [...current.snapshots, snap] });
                ping(t(lang, "snapshot"));
              }}>{t(lang, "labelVer")}</button>
            </div>
          </aside>
        )}
      </div>

      <footer className="no-print h-9 border-t flex items-center gap-4 px-4 text-[11px]" style={{ borderColor: "var(--line)", color: "var(--muted)", background: "var(--sidebar)" }}>
        {current && view === "editor" && (
          <>
            <span>{words} {t(lang, "words")}</span>
            <span>{readingMinutes(words)} {t(lang, "reading")}</span>
            <span>{current.blocks.length} {t(lang, "paragraphs")}</span>
          </>
        )}
        <span className="flex items-center gap-1"><span className="offline-dot" /> {t(lang, "conn")}</span>
        <div className="flex-1" />
        {view === "editor" && (
          <>
            <label className="flex items-center gap-1"><input type="checkbox" checked={dim} onChange={(e) => setDim(e.target.checked)} /> {t(lang, "dim")}</label>
            {mode === "canvas" && <label className="flex items-center gap-1"><input type="checkbox" checked={grid} onChange={(e) => setGrid(e.target.checked)} /> {t(lang, "gridOn")}</label>}
            <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}>−</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(2, z + 0.1))}>+</button>
            <button className="tuya-btn" style={{ padding: "2px 8px" }} onClick={() => setPresent(true)}>{t(lang, "presentation")}</button>
            <button className="tuya-btn" style={{ padding: "2px 8px" }} onClick={() => setBook((b) => !b)}>{t(lang, "book")}</button>
          </>
        )}
        <button className="tuya-btn" style={{ padding: "2px 8px" }} onClick={() => setPomoOn((p) => !p)}>
          {t(lang, "pomodoro")} {Math.floor(pomoLeft / 60)}:{String(pomoLeft % 60).padStart(2, "0")}
        </button>
        <button className="icon-btn" onClick={() => setRight((r) => !r)}><Icon name="layer" size={14} /></button>
      </footer>

      {cmd && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-start justify-center pt-[12vh]" onClick={() => setCmd(false)}>
          <div className="cmd-palette w-[min(560px,92vw)] p-3" onClick={(e) => e.stopPropagation()}>
            <input autoFocus className="field mb-2" value={cmdQ} onChange={(e) => setCmdQ(e.target.value)} placeholder={t(lang, "searchCmd")} />
            <div className="max-h-80 overflow-auto">
              {cmdItems.map((it) => (
                <button key={it.k} className="nav-item w-full text-start" onClick={() => { it.run(); setCmd(false); }}>{it.k}</button>
              ))}
              {cmdItems.length === 0 && <div className="p-4 text-sm" style={{ color: "var(--muted)" }}>{t(lang, "noResults")}</div>}
            </div>
          </div>
        </div>
      )}

      {exportOpen && current && (
        <Modal title={t(lang, "export")} onClose={() => setExportOpen(false)}>
          <div className="grid grid-cols-2 gap-2">
            <button className="tuya-btn" onClick={() => exportWnote(current)}>.wnote</button>
            <button className="tuya-btn" onClick={() => window.print()}>{t(lang, "exportPdf")}</button>
            <button className="tuya-btn" onClick={() => exportHtmlFile(current)}>HTML</button>
            <button className="tuya-btn" onClick={() => exportMarkdownFile(current)}>Markdown</button>
            <button className="tuya-btn" onClick={() => exportTxtFile(current)}>TXT</button>
            <button className="tuya-btn" onClick={() => exportJsonFile(current)}>JSON</button>
            <button className="tuya-btn" onClick={() => ws && exportWspace(ws, wsFiles, folders.filter((f) => f.workspaceId === ws.id))}>.wspace</button>
            <button className="tuya-btn" onClick={() => downloadBlob(new Blob([JSON.stringify(current.blocks)]), current.name + ".json")}>{t(lang, "exportZip")}</button>
          </div>
          <label className="tuya-btn mt-4 w-full justify-center">
            {t(lang, "importFile")}
            <input ref={importRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); setExportOpen(false); }} />
          </label>
        </Modal>
      )}

      {wsOpen && (
        <Modal title={t(lang, "workspaces")} onClose={() => setWsOpen(false)}>
          <div className="space-y-2">
            {workspaces.map((w) => (
              <button key={w.id} className="tuya-card rounded-xl p-3 w-full flex gap-3 items-center text-start" onClick={() => { setWsId(w.id); setWsOpen(false); setView("dashboard"); setFileId(null); }}>
                {w.cover && <img src={w.cover} alt="" className="w-14 h-10 rounded object-cover" />}
                <span className="w-8 h-8 rounded-lg text-white flex items-center justify-center" style={{ background: w.color }}><Icon name={w.icon} size={14} /></span>
                <div className="flex-1"><div className="font-medium">{w.name}</div><div className="text-xs" style={{ color: "var(--muted)" }}>{files.filter((f) => f.workspaceId === w.id && !f.trashedAt).length} {t(lang, "filesCount")}</div></div>
                {w.locked && <Icon name="lock" size={14} />}
              </button>
            ))}
            <button className="tuya-btn primary w-full justify-center" onClick={() => { setNewWs(true); setWsName(""); }}>{t(lang, "newWorkspace")}</button>
          </div>
        </Modal>
      )}

      {newWs && (
        <Modal title={t(lang, "newWorkspace")} onClose={() => setNewWs(false)}>
          <input className="field mb-3" value={wsName} onChange={(e) => setWsName(e.target.value)} placeholder={t(lang, "wsName")} />
          <button className="tuya-btn primary" onClick={() => {
            const w: Workspace = { id: uid("ws"), name: wsName || t(lang, "newWorkspace"), icon: "pen", color: "#9C4A2F", theme: "light", language: lang, font: "ui", createdAt: Date.now(), locked: false, cover: IMAGES.coverWelcome };
            setWorkspaces((p) => [...p, w]);
            db.putWorkspace(w);
            setWsId(w.id);
            setNewWs(false);
            setWsOpen(false);
          }}>{t(lang, "create")}</button>
        </Modal>
      )}

      {lockOpen && (
        <Modal title={t(lang, "lockWs")} onClose={() => setLockOpen(false)}>
          <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>{t(lang, "setPass")}</p>
          <input className="field mb-3" type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
          <button className="tuya-btn primary" onClick={async () => {
            const passwordHash = await hashPassword(pass);
            const n = { ...ws, locked: true, passwordHash };
            setWorkspaces((p) => p.map((w) => (w.id === ws.id ? n : w)));
            db.putWorkspace(n);
            setLockOpen(false);
            setPass("");
            ping(t(lang, "encrypted"));
          }}>{t(lang, "apply")}</button>
        </Modal>
      )}

      {help && (
        <Modal title={t(lang, "shortcuts")} onClose={() => setHelp(false)}>
          <ul className="text-sm space-y-2">
            <li>⌘/Ctrl K — {t(lang, "cmdK")}</li>
            <li>⌘/Ctrl S — {t(lang, "cmdS")}</li>
            <li>⌘/Ctrl Z — {t(lang, "undo")}</li>
            <li>/ — {t(lang, "slashHint")}</li>
            <li>? — {t(lang, "shortcuts")}</li>
          </ul>
        </Modal>
      )}

      {present && current && (
        <div className="present-view" onClick={() => setPresent(false)}>
          <div className="max-w-4xl">
            <div className="text-[11px] tracking-[0.3em] uppercase opacity-50 mb-6">{t(lang, "presentation")}</div>
            <h1 className="font-serif text-5xl leading-tight">{(slides[slide] || current.blocks[0])?.content || current.name}</h1>
            <p className="mt-6 text-lg opacity-80">{current.blocks[current.blocks.indexOf(slides[slide] || current.blocks[0]) + 1]?.content}</p>
            <div className="mt-12 flex gap-4 text-sm opacity-60">
              <button onClick={(e) => { e.stopPropagation(); setSlide((s) => Math.max(0, s - 1)); }}>{t(lang, "prev")}</button>
              <span>{slide + 1} / {Math.max(slides.length, 1)}</span>
              <button onClick={(e) => { e.stopPropagation(); setSlide((s) => Math.min(Math.max(slides.length - 1, 0), s + 1)); }}>{t(lang, "next")}</button>
              <span>{t(lang, "presentEsc")}</span>
            </div>
          </div>
        </div>
      )}

      {book && current && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-8" onClick={() => setBook(false)}>
          <div className="flex gap-0 max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex-1 page-sheet p-10 min-h-[70vh] rounded-s-sm">
              <div className="text-xs mb-6" style={{ color: "var(--faint)" }}>{t(lang, "coverTitle")}</div>
              <h1 className="font-serif text-4xl">{current.name}</h1>
            </div>
            <div className="flex-1 page-sheet p-10 min-h-[70vh]">
              <div className="text-xs mb-4" style={{ color: "var(--faint)" }}>{t(lang, "toc")}</div>
              {headings.map((h) => <div key={h.id} className="py-1">{h.content}</div>)}
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center p-4" onClick={onClose}>
      <div className="tuya-card rounded-2xl p-5 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-serif text-xl">{title}</h2>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PropsPanel({ lang, block, files, onPatch }: { lang: Lang; block: Block; files: NoteFile[]; onPatch: (p: Partial<Block>) => void }) {
  const [tab, setTab] = useState<"text" | "appearance" | "position" | "link" | "comments">("text");
  const st = block.style;
  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap gap-1">
        {(["text", "appearance", "position", "link", "comments"] as const).map((tb) => (
          <button key={tb} className={"tuya-btn " + (tab === tb ? "primary" : "ghost")} style={{ padding: "2px 8px", fontSize: 11 }} onClick={() => setTab(tb)}>
            {t(lang, tb === "text" ? "text" : tb)}
          </button>
        ))}
      </div>
      {tab === "text" && (
        <>
          <label>{t(lang, "font")}
            <select className="field mt-1" value={st.fontFamily || ""} onChange={(e) => onPatch({ style: { ...st, fontFamily: e.target.value } })}>
              <option value="">{t(lang, "none")}</option>
              {FONTS.map((f) => <option key={f.id} value={f.css}>{f.label}</option>)}
            </select>
          </label>
          <label>{t(lang, "fontSize")}
            <input className="field mt-1" type="number" value={st.fontSize || 16} onChange={(e) => onPatch({ style: { ...st, fontSize: +e.target.value } })} />
          </label>
          <label>{t(lang, "weight")}
            <input className="field mt-1" type="number" step={100} min={100} max={900} value={st.fontWeight || 400} onChange={(e) => onPatch({ style: { ...st, fontWeight: +e.target.value } })} />
          </label>
          <label>{t(lang, "color")}
            <input className="field mt-1" type="color" value={st.color || "#1c1612"} onChange={(e) => onPatch({ style: { ...st, color: e.target.value } })} />
          </label>
          <div className="flex gap-1">
            {(["left", "center", "right", "justify"] as const).map((a) => (
              <button key={a} className="tuya-btn" onClick={() => onPatch({ style: { ...st, textAlign: a } })}>{t(lang, a)}</button>
            ))}
          </div>
        </>
      )}
      {tab === "appearance" && (
        <>
          <label>{t(lang, "background")}
            <input className="field mt-1" type="color" value={st.background || "#fbf7f0"} onChange={(e) => onPatch({ style: { ...st, background: e.target.value } })} />
          </label>
          <label>{t(lang, "opacity")} {Math.round((st.opacity ?? 1) * 100)}%
            <input type="range" min={0} max={1} step={0.05} value={st.opacity ?? 1} onChange={(e) => onPatch({ style: { ...st, opacity: +e.target.value } })} className="w-full" />
          </label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={!!st.shadow} onChange={(e) => onPatch({ style: { ...st, shadow: e.target.checked } })} /> {t(lang, "shadow")}</label>
          <label>{t(lang, "radius")}
            <input className="field mt-1" type="number" value={st.borderRadius || 0} onChange={(e) => onPatch({ style: { ...st, borderRadius: +e.target.value } })} />
          </label>
        </>
      )}
      {tab === "position" && (
        <>
          {(["x", "y", "width", "height", "rotation", "zIndex"] as const).map((k) => (
            <label key={k}>{k}
              <input className="field mt-1" type="number" value={(st[k] as number) || 0} onChange={(e) => onPatch({ style: { ...st, [k]: +e.target.value } })} />
            </label>
          ))}
          <label className="flex items-center gap-2"><input type="checkbox" checked={!!st.locked} onChange={(e) => onPatch({ style: { ...st, locked: e.target.checked } })} /> {t(lang, "lock")}</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={!st.hidden} onChange={(e) => onPatch({ style: { ...st, hidden: !e.target.checked } })} /> {t(lang, "vis")}</label>
        </>
      )}
      {tab === "link" && (
        <>
          <input className="field" placeholder={t(lang, "extLink")} value={block.link || ""} onChange={(e) => onPatch({ link: e.target.value })} />
          <select className="field mt-2" value="" onChange={(e) => onPatch({ link: "doc:" + e.target.value })}>
            <option value="">{t(lang, "internalLink")}</option>
            {files.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </>
      )}
      {tab === "comments" && (
        <>
          {(block.comments || []).map((c) => (
            <div key={c.id} className="text-xs tuya-card rounded-lg p-2 mb-1">{c.text}</div>
          ))}
          <input className="field" placeholder={t(lang, "commentPh")} onKeyDown={(e) => {
            if (e.key === "Enter") {
              const text = (e.target as HTMLInputElement).value;
              if (!text) return;
              onPatch({ comments: [...(block.comments || []), { id: uid("c"), text, at: Date.now() }] });
              (e.target as HTMLInputElement).value = "";
            }
          }} />
        </>
      )}
    </div>
  );
}

function DocMeta({ lang, file, onPatch }: { lang: Lang; file: NoteFile; onPatch: (p: Partial<NoteFile>) => void }) {
  const [tag, setTag] = useState("");
  return (
    <div className="space-y-2 text-sm">
      <label>{t(lang, "icon")}<input className="field mt-1" value={file.icon || ""} onChange={(e) => onPatch({ icon: e.target.value })} /></label>
      <div className="flex flex-wrap gap-1">
        {file.tags.map((tg) => (
          <button key={tg} className="tag" onClick={() => onPatch({ tags: file.tags.filter((x) => x !== tg) })}>{tg} ×</button>
        ))}
      </div>
      <input className="field" placeholder={t(lang, "addTag")} value={tag} onChange={(e) => setTag(e.target.value)} onKeyDown={(e) => {
        if (e.key === "Enter" && tag) { onPatch({ tags: [...file.tags, tag] }); setTag(""); }
      }} />
      <button className="tuya-btn w-full justify-center" onClick={() => onPatch({ pinned: !file.pinned })}>{file.pinned ? t(lang, "unpin") : t(lang, "pin")}</button>
      <button className="tuya-btn w-full justify-center" onClick={() => onPatch({ favorite: !file.favorite })}>{file.favorite ? t(lang, "unfav") : t(lang, "fav")}</button>
      <button className="tuya-btn w-full justify-center" onClick={() => onPatch({ archived: !file.archived })}>{t(lang, "archiveFile")}</button>
      <label>{t(lang, "columns")}
        <select className="field mt-1" value={file.layout.columns} onChange={(e) => onPatch({ layout: { ...file.layout, columns: +e.target.value as 1 | 2 | 3 } })}>
          <option value={1}>1</option><option value={2}>2</option><option value={3}>3</option>
        </select>
      </label>
    </div>
  );
}
