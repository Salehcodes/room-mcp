import { ItemType, Layer } from "./types";

export interface CatalogItem {
  type: ItemType;
  allowedLayers: Layer[];
  width: number; // grid units
  depth: number; // grid units
  height: number; // pixels (visual extrusion)
  variants: string[];
  render: (
    tileSize: number,
    variant?: string,
    facing?: "left" | "right",
  ) => string;
}

// ── Isometric face helpers ─────────────────────────────
// Local origin (0,0) is the center of the tile footprint

const iso = {
  // Diamond top face
  top: (w: number, d: number, ts: number, color: string) => {
    const hw = (w * ts) / 2;
    const hd = (d * ts) / 4;
    return `<path d="M0,${-hd} L${hw},0 L0,${hd} L${-hw},0 Z" fill="${color}" stroke="rgba(0,0,0,0.2)" stroke-width="1"/>`;
  },
  // Right side face (slopes down-right)
  right: (w: number, d: number, h: number, ts: number, color: string) => {
    const hw = (w * ts) / 2;
    const hd = (d * ts) / 4;
    return `<path d="M0,${hd} L${hw},0 L${hw},${-h} L0,${hd - h} Z" fill="${color}" stroke="rgba(0,0,0,0.2)" stroke-width="1"/>`;
  },
  // Left side face (slopes down-left)
  left: (w: number, d: number, h: number, ts: number, color: string) => {
    const hw = (w * ts) / 2;
    const hd = (d * ts) / 4;
    return `<path d="M0,${hd} L${-hw},0 L${-hw},${-h} L0,${hd - h} Z" fill="${color}" stroke="rgba(0,0,0,0.2)" stroke-width="1"/>`;
  },
};

// ── Catalog ────────────────────────────────────────────

export const catalog: Record<ItemType, CatalogItem> = {
  desk: {
    type: "desk",
    allowedLayers: ["floor"],
    width: 1,
    depth: 1,
    height: 20,
    variants: ["default"],
    render: (ts) => {
      const top = iso.top(1, 1, ts, "#D4A373");
      const right = iso.right(1, 1, 20, ts, "#BC8A5F");
      const left = iso.left(1, 1, 20, ts, "#A67C52");
      return `<g>${top}${right}${left}</g>`;
    },
  },

  chair: {
    type: "chair",
    allowedLayers: ["floor"],
    width: 1,
    depth: 1,
    height: 28,
    variants: ["default"],
    render: (ts) => {
      const seat = iso.top(0.7, 0.7, ts, "#8B4513");
      const right = iso.right(0.7, 0.7, 12, ts, "#5D3A1A");
      const left = iso.left(0.7, 0.7, 12, ts, "#6B4226");
      const back = `<path d="M${-ts * 0.35},${-ts * 0.175} L${ts * 0.35},${-ts * 0.175} L${ts * 0.35},${-28} L${-ts * 0.35},${-28} Z" fill="#A0522D"/>`;
      return `<g>${seat}${right}${left}${back}</g>`;
    },
  },

  lamp: {
    type: "lamp",
    allowedLayers: ["floor"],
    width: 1,
    depth: 1,
    height: 40,
    variants: ["default"],
    render: (ts) => {
      const base = `<ellipse cx="0" cy="${ts * 0.15}" rx="${ts * 0.15}" ry="${ts * 0.08}" fill="#2F4F4F"/>`;
      const pole = `<line x1="0" y1="${ts * 0.15}" x2="0" y2="${-ts * 0.5}" stroke="#2F4F4F" stroke-width="3"/>`;
      const shade = `<path d="M${-ts * 0.2},${-ts * 0.3} L${ts * 0.2},${-ts * 0.3} L${ts * 0.15},${-ts * 0.55} L${-ts * 0.15},${-ts * 0.55} Z" fill="#FFF8DC" stroke="#DAA520" stroke-width="1"/>`;
      return `<g>${base}${pole}${shade}</g>`;
    },
  },

  window: {
    type: "window",
    allowedLayers: ["wall"],
    width: 1,
    depth: 1,
    height: 0,
    variants: ["sunny", "rainy", "night"],
    render: (ts, variant) => {
      const sky = { sunny: "#87CEEB", rainy: "#708090", night: "#191970" };
      const c = sky[variant as keyof typeof sky] || "#87CEEB";
      const w = ts * 0.7;
      const h = ts * 0.5;
      return `<g>
        <rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" fill="${c}" stroke="#444" stroke-width="2"/>
        <line x1="0" y1="${-h}" x2="0" y2="0" stroke="#444" stroke-width="2"/>
        <line x1="${-w / 2}" y1="${-h / 2}" x2="${w / 2}" y2="${-h / 2}" stroke="#444" stroke-width="2"/>
      </g>`;
    },
  },

  bookshelf: {
    type: "bookshelf",
    allowedLayers: ["floor"],
    width: 1,
    depth: 1,
    height: 50,
    variants: ["default", "full"],
    render: (ts, variant) => {
      const top = iso.top(0.9, 0.8, ts, "#8B4513");
      const right = iso.right(0.9, 0.8, 50, ts, "#5D3A1A");
      const left = iso.left(0.9, 0.8, 50, ts, "#6B4226");
      let books = "";
      if (variant === "full") {
        books = `<rect x="${-ts * 0.2}" y="${-40}" width="${ts * 0.1}" height="12" fill="#800000"/>
                 <rect x="${-ts * 0.05}" y="${-42}" width="${ts * 0.08}" height="14" fill="#004d00"/>
                 <rect x="${ts * 0.05}" y="${-38}" width="${ts * 0.06}" height="10" fill="#000080"/>`;
      }
      return `<g>${top}${right}${left}${books}</g>`;
    },
  },

  bed: {
    type: "bed",
    allowedLayers: ["floor"],
    width: 2,
    depth: 1,
    height: 14,
    variants: ["default"],
    render: (ts, _v, facing) => {
      const top = iso.top(2, 1, ts, "#F5F5DC");
      const right = iso.right(2, 1, 14, ts, "#E0E0C0");
      const left = iso.left(2, 1, 14, ts, "#D0D0B0");
      const px = facing === "left" ? -ts * 0.6 : ts * 0.6;
      const pillow = `<ellipse cx="${px}" cy="${-10}" rx="${ts * 0.15}" ry="${ts * 0.08}" fill="#FFF"/>`;
      return `<g>${top}${right}${left}${pillow}</g>`;
    },
  },

  plant: {
    type: "plant",
    allowedLayers: ["floor"],
    width: 1,
    depth: 1,
    height: 22,
    variants: ["default"],
    render: (ts) => {
      const pot =
        iso.top(0.5, 0.5, ts, "#D2691E") +
        iso.right(0.5, 0.5, 10, ts, "#A0522D") +
        iso.left(0.5, 0.5, 10, ts, "#8B4513");
      const leaves = `<circle cx="0" cy="${-ts * 0.3}" r="${ts * 0.18}" fill="#228B22"/>
                      <circle cx="${-ts * 0.12}" cy="${-ts * 0.2}" r="${ts * 0.14}" fill="#32CD32"/>
                      <circle cx="${ts * 0.12}" cy="${-ts * 0.2}" r="${ts * 0.14}" fill="#006400"/>`;
      return `<g>${pot}${leaves}</g>`;
    },
  },

  rug: {
    type: "rug",
    allowedLayers: ["floor"],
    width: 1,
    depth: 1,
    height: 0,
    variants: ["red", "blue"],
    render: (ts, variant) => {
      const c = variant === "blue" ? "#4682B4" : "#B22222";
      return `<path d="M0,${-ts * 0.2} L${ts * 0.3},0 L0,${ts * 0.2} L${-ts * 0.3},0 Z" fill="${c}" stroke="#DAA520" stroke-width="2"/>`;
    },
  },

  cat: {
    type: "cat",
    allowedLayers: ["floor"],
    width: 1,
    depth: 1,
    height: 0,
    variants: ["sleeping", "awake"],
    render: (ts, variant) => {
      const color = variant === "awake" ? "#E67E22" : "#333";
      const body = `<ellipse cx="0" cy="${ts * 0.1}" rx="${ts * 0.18}" ry="${ts * 0.1}" fill="${color}"/>`;
      const head = `<circle cx="${-ts * 0.15}" cy="${ts * 0.05}" r="${ts * 0.08}" fill="${color}"/>`;
      const tail = `<path d="M${ts * 0.15},${ts * 0.1} Q${ts * 0.3},${ts * 0.05} ${ts * 0.25},${-ts * 0.05}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;
      const eyes =
        variant === "awake"
          ? `<circle cx="${-ts * 0.18}" cy="${ts * 0.03}" r="1.5" fill="#FFF"/><circle cx="${-ts * 0.12}" cy="${ts * 0.03}" r="1.5" fill="#FFF"/>`
          : "";
      return `<g>${body}${head}${tail}${eyes}</g>`;
    },
  },
};
