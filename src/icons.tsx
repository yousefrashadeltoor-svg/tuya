import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

export function Ico({ d, size = 18, ...rest }: P & { d: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      <path d={d} />
    </svg>
  );
}

const p = {
  dash: "M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z",
  files: "M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v6h6",
  tmpl: "M4 5h16M4 12h16M4 19h10",
  star: "M12 3l2.4 6.6H21l-5.2 4 2 6.4L12 16.8 6.2 20l2-6.4L3 9.6h6.6z",
  archive: "M3 6h18v3H3zM5 9v10h14V9M10 13h4",
  trash: "M5 7h14M10 7V5h4v2M8 7l1 12h6l1-12",
  board: "M4 5h5v14H4zM10.5 5h5v8h-5zM17 5h3v11h-3z",
  cal: "M5 5h14v14H5zM5 9h14M9 5v4M15 5v4",
  chart: "M4 19h16M7 16v-5M12 16V8M17 16v-8",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM5 12h2M17 12h2M7.5 7.5l1.4 1.4M15.1 15.1l1.4 1.4M7.5 16.5l1.4-1.4M15.1 8.9l1.4-1.4",
  book: "M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3V4zM5 4v16",
  graph: "M5 19l4-8 4 4 6-10",
  pen: "M4 20l4.5-1.2L19 8.3 15.7 5 5.2 15.5z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  plus: "M12 5v14M5 12h14",
  chevron: "M9 6l6 6-6 6",
  left: "M15 6l-6 6 6 6",
  undo: "M9 8H5V4M5 8c3-5 13-5 14 4M19 16c-1 5-11 5-14 0",
  redo: "M15 8h4V4M19 8c-3-5-13-5-14 4M5 16c1 5 11 5 14 0",
  save: "M5 5h11l3 3v11H5zM8 5v5h8M8 19v-6h8v6",
  share: "M4 12v7h16v-7M12 4v11M8 8l4-4 4 4",
  bold: "M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z",
  italic: "M10 5h8M6 19h8M14 5l-4 14",
  under: "M7 5v7a5 5 0 0 0 10 0V5M5 21h14",
  alignL: "M4 6h16M4 12h10M4 18h14",
  alignC: "M4 6h16M7 12h10M5 18h14",
  alignR: "M4 6h16M10 12h10M6 18h14",
  link: "M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 1 0 7 7l1-1",
  image: "M4 6h16v12H4zM8 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM4 16l5-5 4 4 2-2 5 5",
  table: "M4 6h16v12H4zM4 10h16M4 14h16M10 6v12M14 6v12",
  code: "M8 8l-4 4 4 4M16 8l4 4-4 4",
  list: "M8 6h13M8 12h13M8 18h13M4 6h.01M4 12h.01M4 18h.01",
  check: "M5 13l4 4L19 7",
  quote: "M7 9h5v6H8a3 3 0 0 1-3-3V9h2zM14 9h5v6h-4a3 3 0 0 1-3-3V9h2z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  lock: "M8 11V8a4 4 0 1 1 8 0v3M6 11h12v9H6z",
  unlock: "M8 11V8a4 4 0 0 1 7-2M6 11h12v9H6z",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19",
  moon: "M20 14.5A8 8 0 1 1 10 4a7 7 0 0 0 10 10.5z",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 4 3 14 0 18M12 3c-3 4-3 14 0 18",
  x: "M6 6l12 12M18 6L6 18",
  dots: "M6 12h.01M12 12h.01M18 12h.01",
  grip: "M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01",
  folder: "M4 6h6l2 2h8v10H4z",
  pin: "M12 21v-6M8 4h8l-1 7H9z",
  home: "M4 11l8-7 8 7v9H4z",
  leaf: "M5 19c8-1 13-8 14-15-7 1-14 6-14 15zM5 19c3-4 7-7 12-9",
  spark: "M12 3l1.5 6.5L20 11l-6.5 1.5L12 19l-1.5-6.5L4 11l6.5-1.5z",
  lab: "M9 3h6M10 3v6L5 20h14L14 9V3",
  briefcase: "M8 7V5h8v2M4 7h16v12H4zM4 12h16",
  play: "M8 5l12 7-12 7z",
  pause: "M7 5h3v14H7zM14 5h3v14h-3z",
  mic: "M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v4",
  download: "M12 4v12M7 11l5 5 5-5M5 20h14",
  upload: "M12 20V8M7 13l5-5 5 5M5 4h14",
  print: "M6 9V4h12v5M6 14H5a1 1 0 0 1-1-1V9h16v4a1 1 0 0 1-1 1h-1M6 14h12v6H6z",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  layer: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  type: "M5 6h14M12 6v12M8 18h8",
  comment: "M5 5h14v10H8l-3 3z",
  warn: "M12 4l9 16H3zM12 10v4M12 17h.01",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01",
  focus: "M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4",
  page: "M7 3h7l5 5v13H7z",
  canvas: "M4 6h16v12H4zM8 10h.01M12 14l3-3 3 3",
  more: "M12 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
};

export function Icon({ name, size = 18, className }: { name: keyof typeof p | string; size?: number; className?: string }) {
  const d = p[name as keyof typeof p] || p.pen;
  return <Ico d={d} size={size} className={className} />;
}

export const NAV_ICONS = p;
