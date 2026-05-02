import { ItemType, Layer } from "./types";

export interface CatalogItem {
  type: ItemType;
  allowedLayers: Layer[];
  width: number;
  depth: number;
  height: number;
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
  top: (w: number, d: number, ts: number, color: string) => {
    const hw = (w * ts) / 2;
    const hd = (d * ts) / 4;

    return `<path d="M0,${-hd} L${hw},0 L0,${hd} L${-hw},0 Z"
      fill="${color}"
      stroke="rgba(0,0,0,0.25)"
      stroke-width="1"
      stroke-linejoin="round"/>`;
  },

  right: (w: number, d: number, h: number, ts: number, color: string) => {
    const hw = (w * ts) / 2;
    const hd = (d * ts) / 4;

    return `<path d="M0,${hd} L${hw},0 L${hw},${-h} L0,${hd - h} Z"
      fill="${color}"
      stroke="rgba(0,0,0,0.25)"
      stroke-width="1"
      stroke-linejoin="round"/>`;
  },

  left: (w: number, d: number, h: number, ts: number, color: string) => {
    const hw = (w * ts) / 2;
    const hd = (d * ts) / 4;

    return `<path d="M0,${hd} L${-hw},0 L${-hw},${-h} L0,${hd - h} Z"
      fill="${color}"
      stroke="rgba(0,0,0,0.25)"
      stroke-width="1"
      stroke-linejoin="round"/>`;
  },
};

const shadow = (rx: number, ry: number, y = 8) =>
  `<ellipse cx="0" cy="${y}" rx="${rx}" ry="${ry}" fill="rgba(0,0,0,0.16)"/>`;

const line = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 1,
  opacity = 1,
) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
    stroke="${color}"
    stroke-width="${width}"
    opacity="${opacity}"
    stroke-linecap="round"/>`;

const px = (x: number, y: number, w: number, h: number, color: string) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`;

// ── Catalog ────────────────────────────────────────────

export const catalog: Record<ItemType, CatalogItem> = {
  // ── DESK ───────────────────────────────────────────
  desk: {
    type: "desk",
    allowedLayers: ["floor"],
    width: 2,
    depth: 2,
    height: 12,
    variants: ["default"],

    render: (ts, _variant, facing) => {
      return `
      <g>
        ${shadow(50, 12)}

        <!-- Desk top -->
        <g transform="translate(0,-22)">
          ${iso.right(1.45, 1.0, 7, ts, "#6B4A28")}
          ${iso.left(1.45, 1.0, 7, ts, "#7A5530")}
          <g transform="translate(0,-7)">
            ${iso.top(1.45, 1.0, ts, "#A87945")}
          </g>
        </g>

        <!-- Front left leg -->
        <g transform="translate(-45,0)">
          ${iso.right(0.16, 0.16, 26, ts, "#5A3A1F")}
          ${iso.left(0.16, 0.16, 26, ts, "#6B4A28")}
          <g transform="translate(0,-26)">
            ${iso.top(0.16, 0.16, ts, "#8A5E35")}
          </g>
        </g>

        <!-- Front right leg -->
        <g transform="translate(42,0)">
          ${iso.right(0.16, 0.16, 26, ts, "#5A3A1F")}
          ${iso.left(0.16, 0.16, 26, ts, "#6B4A28")}
          <g transform="translate(0,-26)">
            ${iso.top(0.16, 0.16, ts, "#8A5E35")}
          </g>
        </g>



        <!-- Back right leg -->
        <g transform="translate(-1,10)">
          ${iso.right(0.14, 0.14, 22, ts, "#4F321A")}
          ${iso.left(0.14, 0.14, 22, ts, "#5E3D22")}
          <g transform="translate(0,-22)">
            ${iso.top(0.14, 0.14, ts, "#7A5530")}
          </g>
        </g>
      </g>
    `;
    },
  },

  // ── CHAIR ──────────────────────────────────────────
  chair: {
    type: "chair",
    allowedLayers: ["floor"],
    width: 1,
    depth: 1,
    height: 16,
    variants: ["default"],

    render: (ts, _variant, facing) => {
      const dir = facing === "left" ? -1 : 1;

      return `
      <g>
        ${shadow(36, 10)}

        <!-- BACK LEGS: from floor up to backrest -->
        <g transform="translate(${-26 * dir},0)">
          ${iso.right(0.12, 0.12, 42, ts, "#4F321A")}
          ${iso.left(0.12, 0.12, 42, ts, "#5E3D22")}
          <g transform="translate(0,-42)">
            ${iso.top(0.12, 0.12, ts, "#7A5530")}
          </g>
        </g>

        <g transform="translate(${-4 * dir},-18)">
          ${iso.right(0.12, 0.12, 42, ts, "#4F321A")}
          ${iso.left(0.12, 0.12, 42, ts, "#5E3D22")}
          <g transform="translate(0,-42)">
            ${iso.top(0.12, 0.12, ts, "#7A5530")}
          </g>
        </g>

        <!-- FRONT LEGS -->
        <g transform="translate(${0 * dir},7)">
          ${iso.right(0.12, 0.12, 18, ts, "#5A3A1F")}
          ${iso.left(0.12, 0.12, 18, ts, "#6B4A28")}
          <g transform="translate(0,-18)">
            ${iso.top(0.12, 0.12, ts, "#8A5E35")}
          </g>
        </g>

        <g transform="translate(${22 * dir},-1)">
          ${iso.right(0.12, 0.12, 18, ts, "#5A3A1F")}
          ${iso.left(0.12, 0.12, 18, ts, "#6B4A28")}
          <g transform="translate(0,-18)">
            ${iso.top(0.12, 0.12, ts, "#8A5E35")}
          </g>
        </g>

        <!-- SEAT -->
        <g transform="translate(0,-18)">
          ${iso.right(0.85, 0.65, 5, ts, "#6B4A28")}
          ${iso.left(0.85, 0.65, 5, ts, "#7A5530")}
          <g transform="translate(0,-5)">
            ${iso.top(0.85, 0.65, ts, "#B07A43")}
          </g>
        </g>

        

        <!-- BACKREST connected to the two back legs -->
        <g transform="translate(${-3 * dir},-55)">
          <polygon
            points="${-28 * dir},-5 ${5 * dir},-15 ${5 * dir},10 ${-28 * dir},22"
            fill="#8A5A2B"
            stroke="#4A2E17"
            stroke-width="2"
            stroke-linejoin="round"
          />
          
        </g>
      </g>
    `;
    },
  },
  // ── LAMP ───────────────────────────────────────────
  lamp: {
    type: "lamp",
    allowedLayers: ["floor"],
    width: 1,
    depth: 1,
    height: 40,
    variants: ["default"],

    render: (ts) => {
      return `
        <g>
          ${shadow(22, 9)}

          <g transform="translate(0,-4)">
            ${iso.right(0.28, 0.28, 5, ts, "#222")}
            ${iso.left(0.28, 0.28, 5, ts, "#333")}
            ${iso.top(0.28, 0.28, ts, "#444")}
          </g>

          <rect x="-2.5" y="-37" width="5" height="32" rx="2" fill="#333"/>
          <rect x="-1" y="-37" width="2" height="32" rx="1" fill="#666" opacity="0.7"/>

          <g transform="translate(0,-44)">
            ${iso.right(0.68, 0.48, 10, ts, "#BD831B")}
            ${iso.left(0.68, 0.48, 10, ts, "#D69C2E")}
            ${iso.top(0.68, 0.48, ts, "#F5C65A")}
          </g>

          <ellipse cx="0" cy="-31" rx="28" ry="11" fill="#FFE69A" opacity="0.25" filter="url(#soft-glow)"/>
        </g>
      `;
    },
  },

  // ── WINDOW ─────────────────────────────────────────
  window: {
    type: "window",
    allowedLayers: ["wall"],
    width: 1,
    depth: 1,
    height: 0,
    variants: ["sunny", "rainy", "night"],

    render: (_ts, variant) => {
      const sky =
        variant === "night"
          ? "#18274F"
          : variant === "rainy"
            ? "#7890A2"
            : "#77C9EA";

      let detail = "";

      if (variant === "sunny") {
        detail = `
          <circle cx="-16" cy="-42" r="7" fill="#FFD95C"/>
          <circle cx="-16" cy="-42" r="13" fill="#FFD95C" opacity="0.22"/>
          <path d="M7,-28 C16,-38 27,-38 36,-28"
            fill="none"
            stroke="#FFF"
            stroke-width="2"
            opacity="0.75"/>
        `;
      } else if (variant === "rainy") {
        detail = `
          ${line(-18, -50, -23, -39, "#D6EAF8", 2, 0.9)}
          ${line(-2, -52, -7, -40, "#D6EAF8", 2, 0.9)}
          ${line(16, -48, 11, -36, "#D6EAF8", 2, 0.9)}
          ${line(29, -42, 24, -31, "#D6EAF8", 2, 0.9)}
        `;
      } else {
        detail = `
          <circle cx="-18" cy="-48" r="1.7" fill="#FFF"/>
          <circle cx="10" cy="-53" r="1.5" fill="#FFF"/>
          <circle cx="25" cy="-36" r="1.4" fill="#FFF"/>
          <circle cx="22" cy="-48" r="6" fill="#F7E27E"/>
        `;
      }

      return `
        <g transform="translate(0,-8)">
          <rect x="-34" y="-64" width="68" height="48" rx="3"
            fill="#6B4A2F"
            stroke="#3B281A"
            stroke-width="2"/>
          <rect x="-28" y="-58" width="56" height="36" rx="2" fill="${sky}"/>

          <rect x="-3" y="-58" width="6" height="36" fill="#6B4A2F"/>
          <rect x="-28" y="-42" width="56" height="5" fill="#6B4A2F"/>

          ${detail}

          <path d="M-27,-57 L-4,-57 L-27,-34 Z" fill="#FFF" opacity="0.14"/>
          <path d="M4,-57 L27,-57 L4,-34 Z" fill="#FFF" opacity="0.12"/>
        </g>
      `;
    },
  },

  // ── BOOKSHELF ──────────────────────────────────────
  bookshelf: {
    type: "bookshelf",
    allowedLayers: ["floor"],
    width: 1,
    depth: 1,
    height: 50,
    variants: ["default", "full"],

    render: (ts, variant) => {
      const books =
        variant === "full"
          ? `
            <g transform="translate(0,-58)">
              ${px(-22, 4, 6, 12, "#C94A4A")}
              ${px(-14, 1, 7, 15, "#4A79C9")}
              ${px(-5, 6, 5, 10, "#E0B84A")}
              ${px(3, 3, 7, 13, "#5EAD68")}
              ${px(13, 5, 6, 11, "#9B5BC9")}

              ${px(-22, 24, 7, 13, "#E07A3F")}
              ${px(-12, 27, 6, 10, "#5EAD68")}
              ${px(-3, 22, 8, 15, "#C94A4A")}
              ${px(8, 25, 7, 12, "#4A79C9")}
              ${px(18, 23, 5, 14, "#E0B84A")}

              ${px(-22, 43, 7, 13, "#4A79C9")}
              ${px(-12, 46, 7, 10, "#9B5BC9")}
              ${px(-2, 41, 6, 15, "#5EAD68")}
              ${px(8, 44, 7, 12, "#C94A4A")}
              ${px(18, 47, 5, 9, "#E07A3F")}
            </g>
          `
          : "";

      return `
        <g>
          ${shadow(28, 10)}

          <g transform="translate(0,-4)">
            ${iso.right(0.85, 0.52, 50, ts, "#5E3920")}
            ${iso.left(0.85, 0.52, 50, ts, "#7A4B2A")}
            <g transform="translate(0,-50)">
              ${iso.top(0.85, 0.52, ts, "#A97843")}
            </g>
          </g>

          <g transform="translate(0,-58)">
            <rect x="-26" y="0" width="52" height="56" rx="2" fill="#321D11"/>
            <rect x="-30" y="-3" width="60" height="6" rx="2" fill="#8D5C32"/>
            <rect x="-30" y="53" width="60" height="6" rx="2" fill="#5E3920"/>
            <rect x="-30" y="-3" width="6" height="62" fill="#7A4B2A"/>
            <rect x="24" y="-3" width="6" height="62" fill="#4E2E1A"/>

            <rect x="-24" y="17" width="48" height="4" fill="#7A4B2A"/>
            <rect x="-24" y="38" width="48" height="4" fill="#7A4B2A"/>
          </g>

          ${books}
        </g>
      `;
    },
  },

  // ── BED ────────────────────────────────────────────
  bed: {
    type: "bed",
    allowedLayers: ["floor"],
    width: 2,
    depth: 1,
    height: 14,
    variants: ["default"],

    render: (ts, _variant, facing) => {
      const pillowX = facing === "left" ? 25 : -25;
      const blanketX = facing === "left" ? -10 : 10;

      return `
        <g>
          ${shadow(56, 14)}

          <!-- Bed frame -->
          <g transform="translate(0,-4)">
            ${iso.right(1.85, 0.88, 10, ts, "#6B4A28")}
            ${iso.left(1.85, 0.88, 10, ts, "#7A5530")}
            <g transform="translate(0,-10)">
              ${iso.top(1.85, 0.88, ts, "#9B7040")}
            </g>
          </g>

          <!-- Mattress -->
          <g transform="translate(0,-15)">
            ${iso.right(1.65, 0.72, 6, ts, "#C4B5A1")}
            ${iso.left(1.65, 0.72, 6, ts, "#D8CDBC")}
            <g transform="translate(0,-6)">
              ${iso.top(1.65, 0.72, ts, "#F0E8D8")}
            </g>
          </g>

          <!-- Blanket -->
          <g transform="translate(${blanketX},-23)">
            ${iso.right(1.15, 0.66, 5, ts, "#244777")}
            ${iso.left(1.15, 0.66, 5, ts, "#335FA8")}
            <g transform="translate(0,-5)">
              ${iso.top(1.15, 0.66, ts, "#4A79C9")}
            </g>
          </g>

          <!-- Pillow -->
          <g transform="translate(${pillowX},-20)">
            ${iso.right(0.38, 0.3, 4, ts, "#CFC0AD")}
            ${iso.left(0.38, 0.3, 4, ts, "#E7DAC8")}
            <g transform="translate(0,-4)">
              ${iso.top(0.38, 0.3, ts, "#FFF7EA")}
            </g>
          </g>
        </g>
      `;
    },
  },

  // ── PLANT ──────────────────────────────────────────
  plant: {
    type: "plant",
    allowedLayers: ["floor"],
    width: 1,
    depth: 1,
    height: 22,
    variants: ["default"],

    render: (ts) => {
      return `
        <g>
          ${shadow(21, 8)}

          <g transform="translate(0,-4)">
            ${iso.right(0.42, 0.42, 14, ts, "#7D321A")}
            ${iso.left(0.42, 0.42, 14, ts, "#A64724")}
            <g transform="translate(0,-14)">
              ${iso.top(0.42, 0.42, ts, "#D66A32")}
              ${iso.top(0.28, 0.28, ts, "#3A2416")}
            </g>
          </g>

          <rect x="-2" y="-34" width="4" height="20" rx="2" fill="#2E7D32"/>

          <g transform="translate(0,-39)">
            <ellipse cx="-12" cy="2" rx="13" ry="6" fill="#438F3A" transform="rotate(-28 -12 2)"/>
            <ellipse cx="12" cy="1" rx="13" ry="6" fill="#4CAF45" transform="rotate(28 12 1)"/>
            <ellipse cx="-5" cy="-10" rx="12" ry="6" fill="#5CBF54" transform="rotate(-60 -5 -10)"/>
            <ellipse cx="7" cy="-12" rx="12" ry="6" fill="#3F9E3A" transform="rotate(58 7 -12)"/>
            <ellipse cx="0" cy="-20" rx="13" ry="6" fill="#69C861" transform="rotate(-90 0 -20)"/>
          </g>
        </g>
      `;
    },
  },

  // ── RUG ────────────────────────────────────────────
  rug: {
    type: "rug",
    allowedLayers: ["floor"],
    width: 1,
    depth: 1,
    height: 0,
    variants: ["red", "blue"],

    render: (ts, variant) => {
      const isBlue = variant === "blue";

      const outer = isBlue ? "#244777" : "#7A2020";
      const middle = isBlue ? "#4A79C9" : "#C94A4A";
      const inner = isBlue ? "#AFC8F2" : "#F0B0A0";
      const accent = isBlue ? "#EAF2FF" : "#FFE6D8";

      return `
        <g>
          ${iso.top(0.95, 0.82, ts, outer)}
          <g transform="translate(0,-1)">
            ${iso.top(0.72, 0.62, ts, middle)}
          </g>
          <g transform="translate(0,-2)">
            ${iso.top(0.45, 0.36, ts, inner)}
          </g>

          <g opacity="0.85">
            ${line(-13, 0, 0, -7, accent, 1.5)}
            ${line(0, -7, 13, 0, accent, 1.5)}
            ${line(-13, 0, 0, 7, accent, 1.5)}
            ${line(0, 7, 13, 0, accent, 1.5)}
          </g>
        </g>
      `;
    },
  },

  // ── CAT ────────────────────────────────────────────
  cat: {
    type: "cat",
    allowedLayers: ["floor"],
    width: 1,
    depth: 1,
    height: 0,
    variants: ["sleeping", "awake"],

    render: (_ts, variant, facing) => {
      const flip = facing === "left" ? -1 : 1;

      if (variant === "awake") {
        return `
          <g transform="scale(${flip},1)">
            ${shadow(17, 6)}

            <ellipse cx="0" cy="-9" rx="10" ry="14" fill="#D3842D"/>
            <ellipse cx="2" cy="-6" rx="6" ry="9" fill="#F0B15D" opacity="0.8"/>

            <circle cx="0" cy="-27" r="9" fill="#D3842D"/>
            <path d="M-6,-34 L-2,-45 L2,-34 Z" fill="#A85E1E"/>
            <path d="M6,-34 L12,-44 L12,-32 Z" fill="#A85E1E"/>

            <circle cx="-3" cy="-29" r="1.5" fill="#111"/>
            <circle cx="4" cy="-29" r="1.5" fill="#111"/>
            <path d="M0,-25 L2,-23 L-2,-23 Z" fill="#7A3A2A"/>

            <path d="M9,-7 C25,-10 22,-29 11,-24"
              fill="none"
              stroke="#D3842D"
              stroke-width="5"
              stroke-linecap="round"/>
          </g>
        `;
      }

      return `
        <g transform="scale(${flip},1)">
          ${shadow(20, 6)}

          <ellipse cx="3" cy="-7" rx="18" ry="10" fill="#686868"/>
          <ellipse cx="-14" cy="-11" rx="9" ry="7" fill="#686868"/>

          <path d="M-20,-17 L-17,-25 L-13,-17 Z" fill="#444"/>
          <path d="M-11,-17 L-6,-24 L-5,-16 Z" fill="#444"/>

          <path d="M16,-7 C27,-10 27,2 15,2"
            fill="none"
            stroke="#555"
            stroke-width="5"
            stroke-linecap="round"/>

          <path d="M-18,-11 Q-15,-9 -12,-11"
            fill="none"
            stroke="#222"
            stroke-width="1.3"
            stroke-linecap="round"/>
          <circle cx="-20" cy="-11" r="1.2" fill="#222"/>
        </g>
      `;
    },
  },
};
