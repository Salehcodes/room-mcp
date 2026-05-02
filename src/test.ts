import { writeFileSync } from "fs";
import { RoomEngine } from "./engine";

const engine = new RoomEngine();

function add(
  type: string,
  position: { x: number; y: number },
  variant?: string,
  facing?: "left" | "right",
) {
  const result = engine.addItem(type, position, variant, facing);

  if (!result.success) {
    console.error(`Failed to add ${type}:`, result.error);
    return;
  }

  console.log(`Added ${type} at (${position.x}, ${position.y})`);
}

function saveSVG(filename = "output.svg") {
  const svg = engine.renderSVG();

  // writeFileSync overwrites the old file each run
  writeFileSync(filename, svg, "utf-8");

  console.log(`Saved SVG to ${filename}`);
}

// Wall item
add("window", { x: 4, y: -1 }, "sunny");

// // Floor items
add("bookshelf", { x: 8, y: 2 }, "full");
add("lamp", { x: 1, y: 2 });

add("desk", { x: 3, y: 2 });
add("chair", { x: 2, y: 3 }, "default", "left");

add("bed", { x: 1, y: 5 }, "default", "right");

add("rug", { x: 5, y: 6 }, "blue");
add("plant", { x: 7, y: 5 });
add("cat", { x: 4, y: 7 }, "sleeping", "left");

engine.setLighting("evening");

saveSVG("output.svg");
