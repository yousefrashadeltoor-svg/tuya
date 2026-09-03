import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { t } from "../i18n";
import { Icon } from "../icons";
import type { Block, BlockType, EditorMode, Lang, NoteFile } from "../types";
import { makeBlock, uid } from "../types";

export const BLOCK_TYPES: { type: BlockType; icon: string; key: string; slash: string[] }[] = [
  { type: "paragraph", icon: "type", key: "typeP", slash: ["/text", "/p"] },
  { type: "h1", icon: "type", key: "typeH1", slash: ["/h1", "/heading"] },
  { type: "h2", icon: "type", key: "typeH2", slash: ["/h2"] },
  { type: "h3", icon: "type", key: "typeH3", slash: ["/h3"] },
  { type: "ul", icon: "list", key: "typeUl", slash: ["/ul", "/list", "/bullet"] },
  { type: "ol", icon: "list", key: "typeOl", slash: ["/ol", "/num"] },
  { type: "todo", icon: "check", key: "typeTodo", slash: ["/todo", "/task"] },
  { type: "quote", icon: "quote", key: "typeQuote", slash: ["/quote"] },
  { type: "divider", icon: "tmpl", key: "typeDiv", slash: ["/div", "/hr", "/divider"] },
  { type: "callout", icon: "info", key: "typeCall", slash: ["/callout", "/call"] },
  { type: "code", icon: "code", key: "typeCode", slash: ["/code"] },
  { type: "toggle", icon: "chevron", key: "typeToggle", slash: ["/toggle"] },
  { type: "bookmark", icon: "link", key: "typeBm", slash: ["/link", "/bookmark"] },
  { type: "table", icon: "table", key: "typeTable", slash: ["/table"] },
  { type: "image", icon: "image", key: "typeImg", slash: ["/image", "/img"] },
  { type: "video", icon: "play", key: "typeVid", slash: ["/video"] },
  { type: "pdf", icon: "files", key: "typePdf", slash: ["/pdf"] },
  { type: "file", icon: "files", key: "typeFile", slash: ["/file"] },
  { type: "audio", icon: "mic", key: "typeAud", slash: ["/audio"] },
  { type: "drawing", icon: "pen", key: "typeDraw", slash: ["/draw"] },
  { type: "shape", icon: "spark", key: "typeShape", slash: ["/shape"] },
  { type: "sticky", icon: "comment", key: "typeSticky", slash: ["/sticky", "/note"] },
  { type: "timeline", icon: "clock", key: "typeTime", slash: ["/time", "/timeline"] },
  { type: "gallery", icon: "grid", key: "typeGal", slash: ["/gallery"] },
];

function TextCE({
  value,
  onChange,
  onKeyDown,
  className,
  placeholder,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
  className?: string;
  placeholder?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current && ref.current && ref.current.innerText !== (value || "")) {
      ref.current.innerText = value || "";
    }
  }, [value]);
  return (
    <div
      ref={ref}
      className={"ce " + (className || "")}
      contentEditable
      suppressContentEditableWarning
      data-ph={placeholder}
      style={style}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={(e) => {
        focused.current = false;
        onChange(e.currentTarget.innerText);
      }}
      onInput={(e) => onChange(e.currentTarget.innerText)}
      onKeyDown={onKeyDown}
    />
  );
}

function emptyTable(r = 3, c = 3) {
  return {
    header: true,
    rows: r,
    cols: c,
    cells: Array.from({ length: r }, () => Array.from({ length: c }, () => "")),
  };
}

function evalCell(raw: string, col: string[], row: string[]): string {
  const u = raw.trim().toUpperCase();
  const nums = (arr: string[]) =>
    arr.map((x) => parseFloat(x)).filter((n) => !Number.isNaN(n));
  if (u === "=SUM" || u === "=SUM()") return String(nums(col).reduce((a, b) => a + b, 0));
  if (u === "=AVG" || u === "=AVERAGE") {
    const n = nums(col);
    return n.length ? (n.reduce((a, b) => a + b, 0) / n.length).toFixed(2) : "0";
  }
  if (u === "=COUNT") return String(nums(col).length);
  if (u === "=MAX") return String(Math.max(...nums(col), 0));
  if (u === "=MIN") return String(Math.min(...(nums(col).length ? nums(col) : [0])));
  if (u === "=IF") return nums(row).some((n) => n > 0) ? "Yes" : "No";
  return raw;
}

function readFileAsData(file: File): Promise<string> {
  return new Promise((res) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result || ""));
    r.readAsDataURL(file);
  });
}

function DrawingPad({ src, onSave, lang }: { src?: string; onSave: (s: string) => void; lang: Lang }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fbf7f0";
    ctx.fillRect(0, 0, c.width, c.height);
    if (src) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, c.width, c.height);
      img.src = src;
    }
  }, [src]);
  const pos = (e: React.MouseEvent | React.TouchEvent) => {
    const c = ref.current!;
    const r = c.getBoundingClientRect();
    const p = "touches" in e ? e.touches[0] : e;
    return { x: ((p.clientX - r.left) / r.width) * c.width, y: ((p.clientY - r.top) / r.height) * c.height };
  };
  const down = (e: React.MouseEvent | React.TouchEvent) => {
    drawing.current = true;
    const ctx = ref.current!.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    const ctx = ref.current!.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.strokeStyle = "#1c1612";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const up = () => {
    drawing.current = false;
    onSave(ref.current!.toDataURL("image/png"));
  };
  return (
    <div>
      <canvas
        ref={ref}
        width={640}
        height={280}
        className="w-full rounded-lg border"
        style={{ borderColor: "var(--line)", touchAction: "none", cursor: "crosshair" }}
        onMouseDown={down}
        onMouseMove={move}
        onMouseUp={up}
        onMouseLeave={up}
        onTouchStart={down}
        onTouchMove={move}
        onTouchEnd={up}
      />
      <div className="mt-1 text-[11px]" style={{ color: "var(--faint)" }}>
        {t(lang, "drawHint")}
      </div>
    </div>
  );
}

export default function Editor({
  file,
  lang,
  mode,
  selectedId,
  onSelect,
  onChange,
  zoom,
  dim,
  grid,
  preview,
}: {
  file: NoteFile;
  lang: Lang;
  mode: EditorMode;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (blocks: Block[]) => void;
  zoom: number;
  dim: boolean;
  grid: boolean;
  preview: boolean;
}) {
  const [slash, setSlash] = useState<{ q: string; i: number } | null>(null);
  const [ctx, setCtx] = useState<{ x: number; y: number; id: string } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  const blocks = file.blocks;
  const setBlocks = (next: Block[]) => onChange(next);
  const patch = (id: string, p: Partial<Block>) => setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...p } : b)));
  const patchStyle = (id: string, s: Block["style"]) =>
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, style: { ...b.style, ...s } } : b)));

  const insertAt = (i: number, type: BlockType) => {
    const extra: Partial<Block> = {};
    if (type === "table") extra.table = emptyTable();
    if (type === "ul" || type === "ol") extra.items = [""];
    if (type === "todo") extra.checked = false;
    if (type === "callout") {
      extra.calloutTone = "note";
      extra.calloutIcon = "◈";
    }
    if (type === "toggle") extra.open = true;
    if (type === "sticky") extra.stickyColor = "#F3E2B8";
    if (type === "shape") extra.shape = "rect";
    if (type === "timeline") extra.timeline = [{ date: "", title: "", text: "" }];
    if (type === "gallery") extra.gallery = [];
    if (mode === "canvas") extra.style = { x: 40, y: 40 + i * 24, width: 420, zIndex: i + 1 };
    const b = makeBlock(type, type === "divider" ? "" : "", extra);
    const next = [...blocks];
    next.splice(i, 0, b);
    setBlocks(next);
    onSelect(b.id);
    setSlash(null);
  };

  const remove = (id: string) => {
    const i = blocks.findIndex((b) => b.id === id);
    const next = blocks.filter((b) => b.id !== id);
    setBlocks(next.length ? next : [makeBlock("paragraph", "")]);
    onSelect(next[Math.max(0, i - 1)]?.id ?? null);
  };

  const convert = (id: string, type: BlockType) => {
    const b = blocks.find((x) => x.id === id);
    if (!b) return;
    const extra: Partial<Block> = { type };
    if (type === "table" && !b.table) extra.table = emptyTable();
    if ((type === "ul" || type === "ol") && !b.items) extra.items = [b.content];
    patch(id, extra);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>, b: Block, i: number) => {
    if (e.key === "/" && !(b.content || "").length) {
      setSlash({ q: "/", i });
    }
    if (slash && e.key !== "Escape") {
      if (e.key === "Enter") {
        e.preventDefault();
        const q = (slash.q + (e.key === "Enter" ? "" : "")).toLowerCase();
        const hit = BLOCK_TYPES.find((x) => x.slash.some((s) => s.startsWith(q) || q.startsWith(s)));
        if (hit) {
          convert(b.id, hit.type);
          patch(b.id, { content: "" });
          setSlash(null);
        }
      }
    }
    if (e.key === "Escape") setSlash(null);
    if (e.key === "Enter" && !e.shiftKey) {
      if (["paragraph", "h1", "h2", "h3", "quote", "callout", "todo"].includes(b.type)) {
        e.preventDefault();
        insertAt(i + 1, "paragraph");
      }
    }
    if (e.key === "Backspace" && !(b.content || "") && (!b.items || !b.items.join(""))) {
      e.preventDefault();
      if (blocks.length > 1) remove(b.id);
    }
    if (e.key === " ") {
      const c = b.content;
      const map: Record<string, BlockType> = { "#": "h1", "##": "h2", "###": "h3", ">": "quote", "-": "ul", "1.": "ol", "[]": "todo", "---": "divider" };
      if (c in map) {
        e.preventDefault();
        convert(b.id, map[c]);
        patch(b.id, { content: "", items: map[c] === "ul" || map[c] === "ol" ? [""] : b.items });
      }
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "b") document.execCommand("bold");
    if ((e.metaKey || e.ctrlKey) && e.key === "i") document.execCommand("italic");
  };

  useEffect(() => {
    const hide = () => setCtx(null);
    window.addEventListener("click", hide);
    return () => window.removeEventListener("click", hide);
  }, []);

  const styleOf = (b: Block): CSSProperties => ({
    color: b.style.color,
    background: b.style.background || b.style.highlight,
    fontFamily: b.style.fontFamily,
    fontSize: b.style.fontSize ? b.style.fontSize + "px" : undefined,
    fontWeight: b.style.fontWeight,
    fontStyle: b.style.fontStyle,
    textDecoration: b.style.textDecoration,
    letterSpacing: b.style.letterSpacing,
    lineHeight: b.style.lineHeight,
    textAlign: b.style.textAlign,
    direction: b.style.direction === "rtl" || b.style.direction === "ltr" ? b.style.direction : undefined,
    opacity: b.style.opacity,
    transform: b.style.rotation ? `rotate(${b.style.rotation}deg)` : undefined,
    padding: b.style.padding,
    border: b.style.borderWidth ? `${b.style.borderWidth}px ${b.style.borderStyle || "solid"} ${b.style.borderColor || "var(--line)"}` : undefined,
    borderRadius: b.style.borderRadius,
    boxShadow: b.style.shadow ? "var(--shadow-sm)" : undefined,
    display: b.style.hidden ? "none" : undefined,
  });

  const renderBlock = (b: Block, i: number) => {
    const sel = selectedId === b.id;
    const ph = t(lang, "emptyEditor");
    const inner = (() => {
      if (b.type === "h1" || b.type === "h2" || b.type === "h3" || b.type === "paragraph")
        return (
          <TextCE
            value={b.content}
            onChange={(v) => {
              patch(b.id, { content: v });
              if (v.startsWith("/")) setSlash({ q: v, i });
              else setSlash(null);
            }}
            onKeyDown={(e) => onKey(e, b, i)}
            className={b.type === "paragraph" ? "" : b.type}
            placeholder={b.type === "paragraph" ? ph : t(lang, "type" + b.type.toUpperCase())}
            style={styleOf(b)}
          />
        );
      if (b.type === "quote")
        return (
          <blockquote className="border-s-2 ps-4" style={{ borderColor: "var(--accent)", ...styleOf(b) }}>
            <TextCE value={b.content} onChange={(v) => patch(b.id, { content: v })} onKeyDown={(e) => onKey(e, b, i)} className="italic" placeholder={t(lang, "typeQuote")} />
            <input className="field mt-2 text-xs" value={b.caption || ""} placeholder={t(lang, "caption")} onChange={(e) => patch(b.id, { caption: e.target.value })} />
          </blockquote>
        );
      if (b.type === "divider")
        return <hr className="my-4" style={{ borderColor: "var(--line)" }} />;
      if (b.type === "ul" || b.type === "ol")
        return (
          <div>
            {(b.items || [""]).map((it, ii) => (
              <div key={ii} className="flex gap-2 items-start py-0.5">
                <span className="w-5 text-end text-sm" style={{ color: "var(--faint)" }}>
                  {b.type === "ol" ? ii + 1 + "." : "•"}
                </span>
                <TextCE
                  value={it}
                  onChange={(v) => {
                    const items = [...(b.items || [])];
                    items[ii] = v;
                    patch(b.id, { items });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const items = [...(b.items || [])];
                      items.splice(ii + 1, 0, "");
                      patch(b.id, { items });
                    }
                    if (e.key === "Backspace" && !it && (b.items || []).length > 1) {
                      e.preventDefault();
                      patch(b.id, { items: (b.items || []).filter((_, k) => k !== ii) });
                    }
                  }}
                  className="flex-1"
                />
              </div>
            ))}
          </div>
        );
      if (b.type === "todo")
        return (
          <label className="flex items-start gap-2">
            <input type="checkbox" checked={!!b.checked} onChange={(e) => patch(b.id, { checked: e.target.checked })} className="mt-1.5" />
            <TextCE value={b.content} onChange={(v) => patch(b.id, { content: v })} onKeyDown={(e) => onKey(e, b, i)} className={b.checked ? "line-through opacity-60 flex-1" : "flex-1"} placeholder={t(lang, "typeTodo")} />
          </label>
        );
      if (b.type === "callout")
        return (
          <div className={"callout " + (b.calloutTone || "note")}>
            <div className="flex gap-2">
              <span>{b.calloutIcon || "◈"}</span>
              <TextCE value={b.content} onChange={(v) => patch(b.id, { content: v })} className="flex-1" placeholder={t(lang, "typeCall")} />
            </div>
          </div>
        );
      if (b.type === "code")
        return (
          <div className="rounded-lg overflow-hidden border" style={{ borderColor: "var(--line)", background: "var(--bg-2)" }}>
            <div className="flex justify-between px-3 py-1 text-[11px]" style={{ color: "var(--faint)" }}>
              <input className="bg-transparent outline-none w-32" value={b.language || ""} placeholder="language" onChange={(e) => patch(b.id, { language: e.target.value })} />
              <button
                className="icon-btn"
                onClick={() => {
                  navigator.clipboard.writeText(b.content);
                }}
              >
                {t(lang, "copy")}
              </button>
            </div>
            <textarea className="mono w-full bg-transparent p-3 outline-none min-h-[120px] text-sm" value={b.content} onChange={(e) => patch(b.id, { content: e.target.value })} />
          </div>
        );
      if (b.type === "toggle")
        return (
          <div>
            <button className="flex items-center gap-2 font-medium" onClick={() => patch(b.id, { open: !b.open })}>
              <Icon name="chevron" size={14} className={b.open ? "rotate-90" : ""} />
              <TextCE value={b.content} onChange={(v) => patch(b.id, { content: v })} placeholder={t(lang, "typeToggle")} className="flex-1" />
            </button>
            {b.open && <div className="ps-6 pt-2 text-sm" style={{ color: "var(--muted)" }}>{t(lang, "slash")}</div>}
          </div>
        );
      if (b.type === "bookmark")
        return (
          <div className="tuya-card rounded-xl p-3 flex gap-3 items-center">
            <Icon name="link" />
            <div className="flex-1">
              <TextCE value={b.content} onChange={(v) => patch(b.id, { content: v })} placeholder={t(lang, "typeBm")} />
              <input className="field mt-1 text-xs" value={b.link || ""} placeholder="https://" onChange={(e) => patch(b.id, { link: e.target.value })} />
            </div>
          </div>
        );
      if (b.type === "table" && b.table)
        return (
          <div className="overflow-auto">
            <table className="tuya-table">
              <tbody>
                {b.table.cells.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => {
                      const Tag = ri === 0 && b.table!.header ? "th" : "td";
                      const col = b.table!.cells.map((r) => r[ci]).filter((_, k) => k !== ri);
                      const shown = evalCell(cell, col, row);
                      return (
                        <Tag key={ci}>
                          <input
                            className="w-full bg-transparent outline-none"
                            value={cell}
                            onChange={(e) => {
                              const cells = b.table!.cells.map((r) => [...r]);
                              cells[ri][ci] = e.target.value;
                              patch(b.id, { table: { ...b.table!, cells } });
                            }}
                          />
                          {shown !== cell && <div className="text-[10px]" style={{ color: "var(--accent-2)" }}>{shown}</div>}
                        </Tag>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {!preview && (
              <div className="flex gap-2 mt-2">
                <button
                  className="tuya-btn"
                  onClick={() => {
                    const t = b.table!;
                    patch(b.id, {
                      table: { ...t, rows: t.rows + 1, cells: [...t.cells, Array.from({ length: t.cols }, () => "")] },
                    });
                  }}
                >
                  + {t(lang, "addRow")}
                </button>
                <button
                  className="tuya-btn"
                  onClick={() => {
                    const tbl = b.table!;
                    patch(b.id, {
                      table: { ...tbl, cols: tbl.cols + 1, cells: tbl.cells.map((r) => [...r, ""]) },
                    });
                  }}
                >
                  + {t(lang, "addCol")}
                </button>
              </div>
            )}
          </div>
        );
      if (b.type === "image")
        return (
          <figure>
            {b.src ? (
              <img src={b.src} alt={b.alt || ""} className="max-w-full rounded-lg" style={{ filter: b.style.background }} />
            ) : (
              <label className="tuya-card rounded-xl p-8 text-center cursor-pointer block" style={{ color: "var(--muted)" }}>
                <Icon name="image" size={28} className="mx-auto mb-2" />
                {t(lang, "chooseFile")} / {t(lang, "pasteImg")}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) patch(b.id, { src: await readFileAsData(f), fileName: f.name, fileSize: f.size });
                  }}
                />
              </label>
            )}
            <input className="field mt-2 text-xs" value={b.caption || ""} placeholder={t(lang, "caption")} onChange={(e) => patch(b.id, { caption: e.target.value })} />
          </figure>
        );
      if (b.type === "video")
        return b.src ? (
          <video src={b.src} controls className="w-full rounded-lg" />
        ) : (
          <label className="tuya-card rounded-xl p-6 text-center cursor-pointer block">
            {t(lang, "typeVid")}
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) patch(b.id, { src: await readFileAsData(f), fileName: f.name });
              }}
            />
          </label>
        );
      if (b.type === "pdf")
        return b.src ? (
          <iframe src={b.src} className="w-full h-[480px] rounded-lg border" style={{ borderColor: "var(--line)" }} title="pdf" />
        ) : (
          <label className="tuya-card rounded-xl p-6 text-center cursor-pointer block">
            PDF
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) patch(b.id, { src: await readFileAsData(f), fileName: f.name });
              }}
            />
          </label>
        );
      if (b.type === "file")
        return (
          <label className="tuya-card rounded-xl p-4 flex items-center gap-3 cursor-pointer">
            <Icon name="files" />
            <div>
              <div>{b.fileName || t(lang, "typeFile")}</div>
              <div className="text-xs" style={{ color: "var(--faint)" }}>
                {b.fileSize ? Math.round(b.fileSize / 1024) + " KB" : t(lang, "chooseFile")}
              </div>
            </div>
            <input
              type="file"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) patch(b.id, { src: await readFileAsData(f), fileName: f.name, fileSize: f.size });
              }}
            />
          </label>
        );
      if (b.type === "audio")
        return <AudioBlock b={b} lang={lang} patch={patch} />;
      if (b.type === "drawing")
        return <DrawingPad src={b.src} onSave={(s) => patch(b.id, { src: s })} lang={lang} />;
      if (b.type === "shape") {
        const sh = b.shape || "rect";
        return (
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 72,
                height: 72,
                background: b.style.background || "var(--accent)",
                borderRadius: sh === "circle" ? 999 : sh === "star" ? 8 : 6,
                clipPath: sh === "star" ? "polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)" : undefined,
                transform: sh === "arrow" ? "rotate(90deg)" : undefined,
              }}
            />
            <select className="field w-32" value={sh} onChange={(e) => patch(b.id, { shape: e.target.value as Block["shape"] })}>
              <option value="rect">rect</option>
              <option value="circle">circle</option>
              <option value="arrow">arrow</option>
              <option value="star">star</option>
            </select>
          </div>
        );
      }
      if (b.type === "sticky")
        return (
          <div className="sticky-note p-4 w-[240px]" style={{ background: b.stickyColor || "#F3E2B8", color: "#2a2218" }}>
            <TextCE value={b.content} onChange={(v) => patch(b.id, { content: v })} placeholder={t(lang, "typeSticky")} />
          </div>
        );
      if (b.type === "timeline")
        return (
          <div className="timeline space-y-4">
            {(b.timeline || []).map((ev, ei) => (
              <div key={ei} className="relative ps-1">
                <span className="timeline-dot" />
                <input className="field mb-1 text-xs w-40" value={ev.date} placeholder={t(lang, "calCreated")} onChange={(e) => {
                  const timeline = [...(b.timeline || [])];
                  timeline[ei] = { ...ev, date: e.target.value };
                  patch(b.id, { timeline });
                }} />
                <input className="field mb-1 font-medium" value={ev.title} placeholder={t(lang, "name")} onChange={(e) => {
                  const timeline = [...(b.timeline || [])];
                  timeline[ei] = { ...ev, title: e.target.value };
                  patch(b.id, { timeline });
                }} />
                <TextCE value={ev.text} onChange={(v) => {
                  const timeline = [...(b.timeline || [])];
                  timeline[ei] = { ...ev, text: v };
                  patch(b.id, { timeline });
                }} />
              </div>
            ))}
            <button className="tuya-btn" onClick={() => patch(b.id, { timeline: [...(b.timeline || []), { date: "", title: "", text: "" }] })}>
              + {t(lang, "addEvent")}
            </button>
          </div>
        );
      if (b.type === "gallery")
        return (
          <div className="grid grid-cols-3 gap-2">
            {(b.gallery || []).map((g, gi) => (
              <img key={gi} src={g} alt="" className="rounded-lg h-28 w-full object-cover" />
            ))}
            <label className="tuya-card rounded-lg h-28 flex items-center justify-center cursor-pointer">
              +
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) patch(b.id, { gallery: [...(b.gallery || []), await readFileAsData(f)] });
                }}
              />
            </label>
          </div>
        );
      return <TextCE value={b.content} onChange={(v) => patch(b.id, { content: v })} />;
    })();

    const canvasPos: CSSProperties =
      mode === "canvas"
        ? {
            position: "absolute",
            left: b.style.x ?? 40,
            top: b.style.y ?? 40,
            width: b.style.width ?? 440,
            zIndex: b.style.zIndex ?? i,
            cursor: dragId === b.id ? "grabbing" : "default",
          }
        : {};

    return (
      <div
        key={b.id}
        className={"block-wrap mb-3 " + (sel ? "selected" : "")}
        style={canvasPos}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(b.id);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          onSelect(b.id);
          setCtx({ x: e.clientX, y: e.clientY, id: b.id });
        }}
        onMouseDown={(e) => {
          if (mode !== "canvas" || b.style.locked) return;
          if ((e.target as HTMLElement).closest(".ce, input, textarea, button, label")) return;
          setDragId(b.id);
        }}
      >
        {!preview && mode !== "canvas" && (
          <button className="grip" title={t(lang, "drag")} onClick={() => insertAt(i, "paragraph")}>
            <Icon name="grip" size={14} />
          </button>
        )}
        <div className="block-inner">{inner}</div>
      </div>
    );
  };

  useEffect(() => {
    if (!dragId || mode !== "canvas") return;
    const move = (e: MouseEvent) => {
      const box = wrap.current?.getBoundingClientRect();
      if (!box) return;
      patchStyle(dragId, { x: e.clientX - box.left - 20, y: e.clientY - box.top - 20 });
    };
    const up = () => setDragId(null);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [dragId, mode]);

  const filteredSlash = slash
    ? BLOCK_TYPES.filter((x) => x.slash.some((s) => s.includes(slash.q.replace(/\s/g, "").toLowerCase())) || t(lang, x.key).toLowerCase().includes(slash.q.slice(1).toLowerCase()))
    : [];

  const sheetClass = mode === "page" ? "page-sheet mx-auto" : mode === "focus" ? "focus-sheet mx-auto py-16 px-8" : "relative min-h-[70vh] " + (grid ? "canvas-grid" : "");
  const pad = mode === "page" ? file.layout.margins : undefined;

  return (
    <div
      ref={wrap}
      className={(dim ? "dim-others " : "") + sheetClass}
      style={{
        transform: `scale(${zoom})`,
        transformOrigin: "top center",
        fontFamily: file.language === "ar" ? "Tahoma, 'Segoe UI', sans-serif" : "Georgia, 'Palatino Linotype', serif",
        padding: pad,
        columnCount: mode !== "canvas" && file.layout.columns > 1 ? file.layout.columns : undefined,
        columnGap: 32,
        direction: file.language === "ar" ? "rtl" : undefined,
      }}
      onClick={() => onSelect(null)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={async (e) => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (!f) return;
        const src = await readFileAsData(f);
        const type: BlockType = f.type.startsWith("image") ? "image" : f.type.startsWith("video") ? "video" : f.type === "application/pdf" ? "pdf" : f.type.startsWith("audio") ? "audio" : "file";
        const b = makeBlock(type, "", { src, fileName: f.name, fileSize: f.size });
        setBlocks([...blocks, b]);
      }}
      onPaste={async (e) => {
        const item = [...e.clipboardData.items].find((i) => i.type.startsWith("image"));
        if (!item) return;
        const f = item.getAsFile();
        if (!f) return;
        const src = await readFileAsData(f);
        setBlocks([...blocks, makeBlock("image", "", { src })]);
      }}
    >
      {blocks.map((b, i) => renderBlock(b, i))}
      {!preview && (
        <button className="tuya-btn ghost mt-4" onClick={() => insertAt(blocks.length, "paragraph")}>
          <Icon name="plus" size={14} /> {t(lang, "insert")}
        </button>
      )}
      {slash && filteredSlash.length > 0 && (
        <div className="slash-menu absolute z-30 w-72 p-2 max-h-72 overflow-auto">
          {filteredSlash.map((x) => (
            <button
              key={x.type}
              className="nav-item w-full text-start"
              onMouseDown={(e) => {
                e.preventDefault();
                const i = slash.i;
                convert(blocks[i].id, x.type);
                patch(blocks[i].id, { content: "" });
                setSlash(null);
              }}
            >
              <Icon name={x.icon} size={16} /> {t(lang, x.key)}
            </button>
          ))}
        </div>
      )}
      {ctx && (
        <div className="ctx-menu fixed z-40 w-52 p-1 text-sm" style={{ left: ctx.x, top: ctx.y }} onClick={(e) => e.stopPropagation()}>
          {[
            ["duplicate", () => {
              const b = blocks.find((x) => x.id === ctx.id);
              if (b) setBlocks([...blocks, { ...b, id: uid("b") }]);
            }],
            ["delete", () => remove(ctx.id)],
            ["lock", () => patchStyle(ctx.id, { locked: !blocks.find((x) => x.id === ctx.id)?.style.locked })],
            ["insertAfter", () => insertAt(blocks.findIndex((x) => x.id === ctx.id) + 1, "paragraph")],
          ].map(([k, fn]) => (
            <button
              key={String(k)}
              className="nav-item w-full text-start"
              onClick={() => {
                (fn as () => void)();
                setCtx(null);
              }}
            >
              {t(lang, String(k))}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AudioBlock({ b, lang, patch }: { b: Block; lang: Lang; patch: (id: string, p: Partial<Block>) => void }) {
  const rec = useRef<MediaRecorder | null>(null);
  const [on, setOn] = useState(false);
  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    mr.ondataavailable = (e) => chunks.push(e.data);
    mr.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const r = new FileReader();
      r.onload = () => patch(b.id, { src: String(r.result) });
      r.readAsDataURL(blob);
      stream.getTracks().forEach((tr) => tr.stop());
    };
    rec.current = mr;
    mr.start();
    setOn(true);
  };
  return (
    <div className="tuya-card rounded-xl p-4">
      {b.src && <audio src={b.src} controls className="w-full mb-2" />}
      <div className="flex gap-2">
        {!on ? (
          <button className="tuya-btn" onClick={start}>
            <Icon name="mic" size={14} /> {t(lang, "record")}
          </button>
        ) : (
          <button
            className="tuya-btn primary"
            onClick={() => {
              rec.current?.stop();
              setOn(false);
            }}
          >
            {t(lang, "stop")}
          </button>
        )}
        <label className="tuya-btn">
          {t(lang, "chooseFile")}
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) patch(b.id, { src: await readFileAsData(f) });
            }}
          />
        </label>
      </div>
    </div>
  );
}
