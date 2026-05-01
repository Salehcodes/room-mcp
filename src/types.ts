export type ItemType =
  | "desk"
  | "chair"
  | "lamp"
  | "window"
  | "bookshelf"
  | "bed"
  | "plant"
  | "rug"
  | "cat";
export type LightingMood = "morning" | "evening" | "night" | "warm";
export type Layer = "floor" | "wall";

export type Position = {
  x: number; // 0-9 grid column
  y: number; // 0-9 grid row (floor), -1 for back wall
};

export type RoomItem = {
  id: string;
  type: ItemType;
  position: Position;
  variant?: string;
  facing?: "left" | "right";
};

export type RoomState = {
  lighting: LightingMood;
  items: RoomItem[];
  gridSize: number;
  tileSize: number;
};

export type PlacementError =
  | "OUT_OF_BOUNDS"
  | "OCCUPIED"
  | "INVALID_LAYER"
  | "UNKNOWN_TYPE";
