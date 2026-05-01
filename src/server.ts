import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import cors from "cors";
import { z } from "zod";
import { RoomEngine } from "./engine.js";
import { LightingMood } from "./types.js";

// ── Zod schemas for tool inputs ─────────────────────────

const PositionSchema = z.object({
  x: z.number().int().min(0).max(9),
  y: z.number().int().min(-1).max(9),
});

const AddItemSchema = z.object({
  type: z.string(),
  position: PositionSchema,
  variant: z.string().optional(),
  facing: z.enum(["left", "right"]).optional(),
});

const RemoveItemSchema = z.object({
  position: PositionSchema,
});

const SetLightingSchema = z.object({
  mood: z.enum(["morning", "evening", "night", "warm"]),
});

// ── Engine instance ─────────────────────────────────────

const engine = new RoomEngine();

// ── MCP Server setup ────────────────────────────────────

const server = new Server(
  {
    name: "isometric-room-builder",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// ── Tool definitions ────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "add_item",
        description:
          "Place a furniture item in the room. Position x: 0-9, y: 0-9 for floor items, y: -1 for wall items. Check get_room_state first to avoid overlaps.",
        inputSchema: {
          type: "object",
          properties: {
            type: {
              type: "string",
              description:
                "Item type: desk, chair, lamp, window, bookshelf, bed, plant, rug, cat",
            },
            position: {
              type: "object",
              properties: {
                x: { type: "number", description: "Grid column 0-9" },
                y: {
                  type: "number",
                  description: "Grid row 0-9 (floor) or -1 (wall)",
                },
              },
              required: ["x", "y"],
            },
            variant: {
              type: "string",
              description:
                "Optional variant (e.g., rainy, full, sleeping, blue)",
            },
            facing: {
              type: "string",
              enum: ["left", "right"],
              description: "Optional facing direction",
            },
          },
          required: ["type", "position"],
        },
      },
      {
        name: "remove_item",
        description: "Remove an item occupying the given grid position.",
        inputSchema: {
          type: "object",
          properties: {
            position: {
              type: "object",
              properties: {
                x: { type: "number" },
                y: { type: "number" },
              },
              required: ["x", "y"],
            },
          },
          required: ["position"],
        },
      },
      {
        name: "set_lighting",
        description: "Change the room lighting mood.",
        inputSchema: {
          type: "object",
          properties: {
            mood: {
              type: "string",
              enum: ["morning", "evening", "night", "warm"],
            },
          },
          required: ["mood"],
        },
      },
      {
        name: "clear_room",
        description: "Remove all items and reset lighting to morning.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "export_svg",
        description:
          "Render the current room as an SVG string. Returns raw SVG XML that can be saved to a .svg file or displayed.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "get_room_state",
        description:
          "Get the current room state: lighting mood and list of placed items with positions. Use before adding items to check occupancy.",
        inputSchema: { type: "object", properties: {} },
      },
    ],
  };
});

// ── Tool handlers ───────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "add_item": {
        const parsed = AddItemSchema.parse(args);
        const result = engine.addItem(
          parsed.type,
          parsed.position,
          parsed.variant,
          parsed.facing,
        );
        if (!result.success) {
          return {
            content: [{ type: "text", text: `Error: ${result.error}` }],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: "text",
              text: `Added ${result.item!.type} (${result.item!.id}) at (${result.item!.position.x}, ${result.item!.position.y})`,
            },
          ],
        };
      }

      case "remove_item": {
        const parsed = RemoveItemSchema.parse(args);
        const result = engine.removeItem(parsed.position);
        if (!result.success) {
          return {
            content: [{ type: "text", text: `Error: ${result.error}` }],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: "text",
              text: `Removed item at (${parsed.position.x}, ${parsed.position.y})`,
            },
          ],
        };
      }

      case "set_lighting": {
        const parsed = SetLightingSchema.parse(args);
        engine.setLighting(parsed.mood as LightingMood);
        return {
          content: [{ type: "text", text: `Lighting set to ${parsed.mood}` }],
        };
      }

      case "clear_room": {
        engine.clearRoom();
        return {
          content: [{ type: "text", text: "Room cleared." }],
        };
      }

      case "export_svg": {
        const svg = engine.renderSVG();
        return {
          content: [{ type: "text", text: svg }],
        };
      }

      case "get_room_state": {
        const state = engine.getState();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(state, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text", text: `Validation/Runtime error: ${message}` }],
      isError: true,
    };
  }
});

// ── Start ───────────────────────────────────────────────

async function main() {
  const app = express();

  // CRITICAL: Parse JSON bodies and allow cross-origin requests
  app.use(cors());
  app.use(express.json());

  let transport: SSEServerTransport | null = null;

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", items: engine.getState().items.length });
  });

  // SSE endpoint — ChatGPT connects here
  app.get("/sse", async (_req, res) => {
    transport = new SSEServerTransport("/messages", res);
    await server.connect(transport);
    console.error("Client connected via SSE");
  });

  // Message endpoint — ChatGPT POSTs tool calls here
  app.post("/messages", async (req, res) => {
    if (!transport) {
      res.status(400).json({ error: "No SSE connection established" });
      return;
    }
    await transport.handlePostMessage(req, res);
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.error(`Room MCP HTTP server running on http://localhost:${PORT}`);
    console.error(`SSE endpoint: http://localhost:${PORT}/sse`);
    console.error(`Message endpoint: http://localhost:${PORT}/messages`);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
