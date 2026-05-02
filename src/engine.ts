import { RoomState, RoomItem, Position, LightingMood, Layer } from "./types";
import { catalog } from "./catalog";

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export class RoomEngine {
  private state: RoomState;

  constructor() {
    this.state = {
      lighting: "morning",
      items: [],
      gridSize: 10,
      tileSize: 60,
    };
  }

  // ── Isometric projection ──────────────────────────────
  // Converts grid coordinates to screen pixels.

  private gridToScreen(x: number, y: number): { x: number; y: number } {
    const ts = this.state.tileSize;
    const centerX = 400;
    const centerY = 200;

    return {
      x: centerX + (x - y) * (ts / 2),
      y: centerY + (x + y) * (ts / 4),
    };
  }

  // ── Occupancy helpers ─────────────────────────────────

  private getOccupiedCells(item: RoomItem): Set<string> {
    const cat = catalog[item.type];
    const cells = new Set<string>();

    for (let dx = 0; dx < cat.width; dx++) {
      for (let dy = 0; dy < cat.depth; dy++) {
        cells.add(`${item.position.x + dx},${item.position.y + dy}`);
      }
    }

    return cells;
  }

  // ── Validation ────────────────────────────────────────

  private validatePlacement(
    type: string,
    pos: Position,
  ): { valid: boolean; error?: string } {
    const cat = catalog[type as keyof typeof catalog];

    if (!cat) {
      return { valid: false, error: `Unknown item type: ${type}` };
    }

    const layer: Layer = pos.y === -1 ? "wall" : "floor";

    if (!cat.allowedLayers.includes(layer)) {
      return { valid: false, error: `${type} cannot be placed on ${layer}` };
    }

    if (pos.x < 0 || pos.x >= this.state.gridSize) {
      return { valid: false, error: `X must be 0–${this.state.gridSize - 1}` };
    }

    if (layer === "floor") {
      if (pos.y < 0 || pos.y >= this.state.gridSize) {
        return {
          valid: false,
          error: `Floor Y must be 0–${this.state.gridSize - 1}`,
        };
      }

      if (
        pos.x + cat.width > this.state.gridSize ||
        pos.y + cat.depth > this.state.gridSize
      ) {
        return { valid: false, error: "Item extends beyond room boundaries" };
      }
    } else {
      // Wall items must use y = -1.
      if (pos.y !== -1) {
        return { valid: false, error: "Wall items must be at Y = -1" };
      }

      if (pos.x + cat.width > this.state.gridSize) {
        return { valid: false, error: "Item extends beyond wall boundaries" };
      }

      if (pos.y + cat.depth > 0) {
        return { valid: false, error: "Wall item extends onto floor" };
      }
    }

    // Collision check.
    const newCells = new Set<string>();

    for (let dx = 0; dx < cat.width; dx++) {
      for (let dy = 0; dy < cat.depth; dy++) {
        newCells.add(`${pos.x + dx},${pos.y + dy}`);
      }
    }

    for (const item of this.state.items) {
      const existingCells = this.getOccupiedCells(item);

      for (const cell of newCells) {
        if (existingCells.has(cell)) {
          return {
            valid: false,
            error: `Position overlaps with existing ${item.type}`,
          };
        }
      }
    }

    return { valid: true };
  }

  // ── Public API ────────────────────────────────────────

  addItem(
    type: string,
    position: Position,
    variant?: string,
    facing?: "left" | "right",
  ): { success: boolean; item?: RoomItem; error?: string } {
    const check = this.validatePlacement(type, position);

    if (!check.valid) {
      return { success: false, error: check.error };
    }

    const cat = catalog[type as keyof typeof catalog];

    const item: RoomItem = {
      id: generateId(),
      type: type as RoomItem["type"],
      position: { ...position },
      variant: variant || cat.variants[0],
      facing,
    };

    this.state.items.push(item);

    return { success: true, item };
  }

  removeItem(position: Position): { success: boolean; error?: string } {
    const idx = this.state.items.findIndex((item) => {
      const cat = catalog[item.type];

      return (
        position.x >= item.position.x &&
        position.x < item.position.x + cat.width &&
        position.y >= item.position.y &&
        position.y < item.position.y + cat.depth
      );
    });

    if (idx === -1) {
      return { success: false, error: "No item at this position" };
    }

    this.state.items.splice(idx, 1);

    return { success: true };
  }

  setLighting(mood: LightingMood): void {
    this.state.lighting = mood;
  }

  clearRoom(): void {
    this.state.items = [];
    this.state.lighting = "morning";
  }

  getState(): RoomState {
    return JSON.parse(JSON.stringify(this.state));
  }

  // ── Rendering helpers ─────────────────────────────────

  private renderBackWall(): string {
    return `
      <g id="back-walls">
        <!-- Left wall -->
        <path
          d="M400,185 L100,335 L100,205 L400,55 Z"
          fill="#EED8B8"
          stroke="#D4B88C"
          stroke-width="1"
        />

        <!-- Right wall -->
        <path
          d="M400,185 L700,335 L700,205 L400,55 Z"
          fill="#E6CDA8"
          stroke="#D4B88C"
          stroke-width="1"
        />

        <!-- Back corner vertical line -->
        <path
          d="M400,55 L400,185"
          stroke="#C7A77A"
          stroke-width="1"
          opacity="0.7"
        />

        <!-- Left wall subtle grid lines -->
        <path
          d="M400,95 L160,215"
          stroke="#D8BD92"
          stroke-width="0.7"
          opacity="0.45"
        />
        <path
          d="M400,135 L120,275"
          stroke="#D8BD92"
          stroke-width="0.7"
          opacity="0.45"
        />

        <!-- Right wall subtle grid lines -->
        <path
          d="M400,95 L640,215"
          stroke="#CBAF84"
          stroke-width="0.7"
          opacity="0.45"
        />
        <path
          d="M400,135 L680,275"
          stroke="#CBAF84"
          stroke-width="0.7"
          opacity="0.45"
        />
      </g>
    `;
  }

  private renderFloor(): string {
    const ts = this.state.tileSize;
    const hw = ts / 2;
    const hd = ts / 4;

    let floorSVG = '<g id="floor">';

    for (let x = 0; x < this.state.gridSize; x++) {
      for (let y = 0; y < this.state.gridSize; y++) {
        const { x: sx, y: sy } = this.gridToScreen(x, y);

        floorSVG += `
          <path
            d="M${sx},${sy - hd} L${sx + hw},${sy} L${sx},${sy + hd} L${sx - hw},${sy} Z"
            fill="#E8DCC4"
            stroke="#D4C5A9"
            stroke-width="0.5"
          />
        `;
      }
    }

    floorSVG += "</g>";

    return floorSVG;
  }

  private renderWallItems(): string {
    const ts = this.state.tileSize;

    const wallItems = this.state.items.filter((item) => {
      const cat = catalog[item.type];
      return cat.allowedLayers.includes("wall");
    });

    let wallSVG = '<g id="wall-items">';

    for (const item of wallItems) {
      const cat = catalog[item.type];

      /*
        Wall placement:
        - y = -1 means wall item.
        - x = 0..9 maps across the right wall.
        - This is visual only. Validation/collision still uses catalog width/depth.
      */
      const wallX = 430 + item.position.x * 24;
      const wallY = 160 + item.position.x * 12;

      const content = cat.render(ts, item.variant, item.facing);

      wallSVG += `
        <g transform="translate(${wallX}, ${wallY})">
          ${content}
        </g>
      `;
    }

    wallSVG += "</g>";

    return wallSVG;
  }

  private renderFloorItems(): string {
    const ts = this.state.tileSize;

    const floorItems = this.state.items.filter((item) => {
      const cat = catalog[item.type];
      return cat.allowedLayers.includes("floor");
    });

    const sortedItems = [...floorItems].sort((a, b) => {
      const catA = catalog[a.type];
      const catB = catalog[b.type];

      const cxa = a.position.x + (catA.width - 1) / 2;
      const cya = a.position.y + (catA.depth - 1) / 2;

      const cxb = b.position.x + (catB.width - 1) / 2;
      const cyb = b.position.y + (catB.depth - 1) / 2;

      return this.gridToScreen(cxa, cya).y - this.gridToScreen(cxb, cyb).y;
    });

    let itemsSVG = '<g id="floor-items">';

    for (const item of sortedItems) {
      const cat = catalog[item.type];

      const cx = item.position.x + (cat.width - 1) / 2;
      const cy = item.position.y + (cat.depth - 1) / 2;

      const { x: sx, y: sy } = this.gridToScreen(cx, cy);
      const content = cat.render(ts, item.variant, item.facing);

      itemsSVG += `
        <g transform="translate(${sx}, ${sy})">
          ${content}
        </g>
      `;
    }

    itemsSVG += "</g>";

    return itemsSVG;
  }

  private renderLighting(): string {
    const overlays: Record<LightingMood, { color: string; opacity: number }> = {
      morning: { color: "#E6F3FF", opacity: 0.15 },
      evening: { color: "#FF8C00", opacity: 0.12 },
      night: { color: "#000033", opacity: 0.45 },
      warm: { color: "#FFD700", opacity: 0.08 },
    };

    const light = overlays[this.state.lighting];

    return `
      <rect
        x="0"
        y="0"
        width="800"
        height="600"
        fill="${light.color}"
        opacity="${light.opacity}"
        style="pointer-events:none; mix-blend-mode:multiply;"
      />
    `;
  }

  // ── Rendering ─────────────────────────────────────────

  renderSVG(): string {
    const wallSVG = this.renderBackWall();
    const floorSVG = this.renderFloor();
    const wallItemsSVG = this.renderWallItems();
    const floorItemsSVG = this.renderFloorItems();
    const lightingSVG = this.renderLighting();

    return `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 800 600"
        width="800"
        height="600"
        style="background:#F5F5F0;"
      >
        <defs>
          <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        ${wallSVG}
        ${floorSVG}
        ${wallItemsSVG}
        ${floorItemsSVG}
        ${lightingSVG}
      </svg>
    `;
  }
}
