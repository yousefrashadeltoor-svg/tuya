import JSZip from "jszip";
import type { Block, Folder, NoteFile, Workspace } from "./types";
import { countWords } from "./types";
import { downloadBlob } from "./storage";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function blocksToMarkdown(blocks: Block[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "h1":
          return "# " + b.content;
        case "h2":
          return "## " + b.content;
        case "h3":
          return "### " + b.content;
        case "quote":
          return "> " + b.content + (b.caption ? "\n> — " + b.caption : "");
        case "ul":
          return (b.items || []).map((i) => "- " + i).join("\n");
        case "ol":
          return (b.items || []).map((i, n) => n + 1 + ". " + i).join("\n");
        case "todo":
          return `- [${b.checked ? "x" : " "}] ${b.content}`;
        case "code":
          return "```" + (b.language || "") + "\n" + b.content + "\n```";
        case "divider":
          return "---";
        case "table":
          if (!b.table) return "";
          const rows = b.table.cells;
          if (!rows.length) return "";
          const head = "| " + rows[0].join(" | ") + " |";
          const sep = "| " + rows[0].map(() => "---").join(" | ") + " |";
          const body = rows
            .slice(1)
            .map((r) => "| " + r.join(" | ") + " |")
            .join("\n");
          return head + "\n" + sep + "\n" + body;
        case "callout":
          return "> **" + (b.calloutIcon || "i") + "** " + b.content;
        default:
          return b.content;
      }
    })
    .join("\n\n");
}

export function blocksToHtml(file: NoteFile): string {
  const inner = file.blocks
    .map((b) => {
      const c = esc(b.content);
      switch (b.type) {
        case "h1":
          return `<h1>${c}</h1>`;
        case "h2":
          return `<h2>${c}</h2>`;
        case "h3":
          return `<h3>${c}</h3>`;
        case "quote":
          return `<blockquote><p>${c}</p>${b.caption ? `<cite>${esc(b.caption)}</cite>` : ""}</blockquote>`;
        case "ul":
          return `<ul>${(b.items || []).map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
        case "ol":
          return `<ol>${(b.items || []).map((i) => `<li>${esc(i)}</li>`).join("")}</ol>`;
        case "todo":
          return `<p><input disabled type="checkbox" ${b.checked ? "checked" : ""}/> ${c}</p>`;
        case "code":
          return `<pre><code>${c}</code></pre>`;
        case "divider":
          return `<hr/>`;
        case "callout":
          return `<aside>${c}</aside>`;
        case "image":
          return b.src ? `<figure><img src="${b.src}" alt="${esc(b.alt || "")}"/><figcaption>${esc(b.caption || "")}</figcaption></figure>` : "";
        case "table":
          if (!b.table) return "";
          return `<table>${b.table.cells
            .map(
              (r, i) =>
                `<tr>${r.map((cell) => (i === 0 && b.table!.header ? `<th>${esc(cell)}</th>` : `<td>${esc(cell)}</td>`)).join("")}</tr>`
            )
            .join("")}</table>`;
        default:
          return `<p>${c}</p>`;
      }
    })
    .join("\n");
  return `<!doctype html><html><head><meta charset="utf-8"/><title>${esc(file.name)}</title>
<style>
  body{font-family:Georgia,serif;max-width:720px;margin:48px auto;padding:0 24px;color:#1c1612;background:#f6f1e8;line-height:1.7}
  h1,h2,h3{font-weight:600;letter-spacing:-.02em}
  blockquote{border-inline-start:3px solid #9C4A2F;margin:1.5em 0;padding:.2em 1em;color:#5c534a}
  table{border-collapse:collapse;width:100%}
  th,td{border:1px solid #e4d9cc;padding:8px 10px;text-align:start}
  img{max-width:100%}
  aside{background:#efe6d8;padding:12px 16px;border-radius:8px}
</style></head><body>${inner}</body></html>`;
}

export async function exportWnote(file: NoteFile) {
  const zip = new JSZip();
  zip.file(
    "manifest.json",
    JSON.stringify(
      {
        name: file.name,
        id: file.id,
        language: file.language,
        template: file.templateId || null,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
        format: "wnote",
        version: 1,
      },
      null,
      2
    )
  );
  zip.file("content.json", JSON.stringify(file.blocks, null, 2));
  zip.file(
    "metadata.json",
    JSON.stringify({ tags: file.tags, icon: file.icon, cover: file.cover ? "[embedded]" : null, words: countWords(file.blocks) }, null, 2)
  );
  zip.file("layout.json", JSON.stringify(file.layout, null, 2));
  const assets = zip.folder("assets");
  file.blocks.forEach((b, i) => {
    if (b.src && b.src.startsWith("data:")) {
      const match = b.src.match(/^data:([^;]+);base64,(.+)$/);
      if (match && assets) {
        const ext = match[1].split("/")[1] || "bin";
        assets.file(`asset-${i}.${ext}`, match[2], { base64: true });
      }
    }
  });
  zip.folder("styles")?.file("document.css", "/* document styles */\n");
  zip.folder("history")?.file(
    "snapshots.json",
    JSON.stringify(
      file.snapshots.map((s) => ({ id: s.id, at: s.at, label: s.label })),
      null,
      2
    )
  );
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, (file.name || "document") + ".wnote");
}

export async function exportWspace(ws: Workspace, files: NoteFile[], folders: Folder[]) {
  const zip = new JSZip();
  zip.file("workspace.json", JSON.stringify(ws, null, 2));
  zip.file("files.json", JSON.stringify(files, null, 2));
  zip.file("folders.json", JSON.stringify(folders, null, 2));
  zip.file("manifest.json", JSON.stringify({ format: "wspace", version: 1, name: ws.name }, null, 2));
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, (ws.name || "workspace") + ".wspace");
}

export async function importWnote(file: File): Promise<Partial<NoteFile> | null> {
  const zip = await JSZip.loadAsync(file);
  const content = zip.file("content.json");
  const manifest = zip.file("manifest.json");
  const meta = zip.file("metadata.json");
  const layout = zip.file("layout.json");
  if (!content) return null;
  const blocks = JSON.parse(await content.async("string")) as Block[];
  const man = manifest ? JSON.parse(await manifest.async("string")) : {};
  const md = meta ? JSON.parse(await meta.async("string")) : {};
  const lay = layout ? JSON.parse(await layout.async("string")) : undefined;
  return {
    name: man.name || file.name.replace(/\.wnote$/i, ""),
    blocks,
    tags: md.tags || [],
    layout: lay,
    language: man.language || "auto",
  };
}

export async function importWspace(file: File): Promise<{ workspace: Workspace; files: NoteFile[]; folders: Folder[] } | null> {
  const zip = await JSZip.loadAsync(file);
  const w = zip.file("workspace.json");
  const f = zip.file("files.json");
  const d = zip.file("folders.json");
  if (!w || !f) return null;
  return {
    workspace: JSON.parse(await w.async("string")),
    files: JSON.parse(await f.async("string")),
    folders: d ? JSON.parse(await d.async("string")) : [],
  };
}

export function parseMarkdown(md: string): Block[] {
  const { makeBlock } = requireMake();
  const lines = md.replace(/\r/g, "").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (line.startsWith("# ")) blocks.push(makeBlock("h1", line.slice(2)));
    else if (line.startsWith("## ")) blocks.push(makeBlock("h2", line.slice(3)));
    else if (line.startsWith("### ")) blocks.push(makeBlock("h3", line.slice(4)));
    else if (line.startsWith("> ")) blocks.push(makeBlock("quote", line.replace(/^>\s?/, "")));
    else if (line.trim() === "---") blocks.push(makeBlock("divider", ""));
    else if (line.startsWith("- [")) {
      const checked = /^- \[[xX]\]/.test(line);
      blocks.push(makeBlock("todo", line.replace(/^- \[[ xX]\]\s?/, ""), { checked }));
    } else if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i++;
      }
      blocks.push(makeBlock("ul", "", { items }));
      continue;
    } else if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      blocks.push(makeBlock("ol", "", { items }));
      continue;
    } else if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      i++;
      const buf: string[] = [];
      while (i < lines.length && !lines[i].startsWith("```")) {
        buf.push(lines[i]);
        i++;
      }
      blocks.push(makeBlock("code", buf.join("\n"), { language: lang }));
    } else {
      blocks.push(makeBlock("paragraph", line));
    }
    i++;
  }
  return blocks.length ? blocks : [makeBlock("paragraph", "")];
}

function requireMake() {
  return {
    makeBlock: (type: Block["type"], content = "", extra: Partial<Block> = {}) => {
      const id = "b" + Math.random().toString(36).slice(2, 9);
      return { id, type, content, style: {}, ...extra } as Block;
    },
  };
}

export function parseCsvToTable(text: string): Block {
  const rows = text
    .trim()
    .split(/\r?\n/)
    .map((r) => r.split(",").map((c) => c.trim()));
  const cols = Math.max(...rows.map((r) => r.length), 1);
  const cells = rows.map((r) => {
    const row = [...r];
    while (row.length < cols) row.push("");
    return row;
  });
  const { makeBlock } = requireMake();
  return makeBlock("table", "", { table: { header: true, rows: cells.length, cols, cells } });
}

export function exportMarkdownFile(file: NoteFile) {
  downloadBlob(new Blob([blocksToMarkdown(file.blocks)], { type: "text/markdown" }), file.name + ".md");
}
export function exportTxtFile(file: NoteFile) {
  downloadBlob(new Blob([blocksToMarkdown(file.blocks)], { type: "text/plain" }), file.name + ".txt");
}
export function exportHtmlFile(file: NoteFile) {
  downloadBlob(new Blob([blocksToHtml(file)], { type: "text/html" }), file.name + ".html");
}
export function exportJsonFile(file: NoteFile) {
  downloadBlob(new Blob([JSON.stringify(file, null, 2)], { type: "application/json" }), file.name + ".json");
}
