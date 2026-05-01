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

function createRoomServer() {
  const engine = new RoomEngine();

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

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "add_item",
          description:
            "Place a furniture item in the room. Position x: 0-9, y: 0-9 for floor items, y: -1 for wall items.",
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
                  x: { type: "number" },
                  y: { type: "number" },
                },
                required: ["x", "y"],
              },
              variant: { type: "string" },
              facing: {
                type: "string",
                enum: ["left", "right"],
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
          description: "Render the current room as an SVG string.",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "get_room_state",
          description: "Get current room state.",
          inputSchema: { type: "object", properties: {} },
        },
      ],
    };
  });

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
                text: `Added ${result.item!.type} at (${result.item!.position.x}, ${result.item!.position.y})`,
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
          return {
            content: [{ type: "text", text: engine.renderSVG() }],
          };
        }

        case "get_room_state": {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(engine.getState(), null, 2),
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
        content: [
          { type: "text", text: `Validation/Runtime error: ${message}` },
        ],
        isError: true,
      };
    }
  });

  return server;
}

async function main() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  const transports: Record<string, SSEServerTransport> = {};

  app.get("/", (_req, res) => {
    res.send("Isometric Room Builder MCP server is running.");
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/sse", async (_req, res) => {
    const transport = new SSEServerTransport("/messages", res);
    const server = createRoomServer();

    transports[transport.sessionId] = transport;

    res.on("close", () => {
      delete transports[transport.sessionId];
      console.error(`SSE connection closed: ${transport.sessionId}`);
    });

    await server.connect(transport);

    console.error(`Client connected via SSE: ${transport.sessionId}`);
  });

  app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId as string | undefined;

    if (!sessionId) {
      res.status(400).json({ error: "Missing sessionId" });
      return;
    }

    const transport = transports[sessionId];

    if (!transport) {
      res.status(404).json({ error: "No transport found for sessionId" });
      return;
    }

    await transport.handlePostMessage(req, res);
  });

  const PORT = Number(process.env.PORT) || 3000;

  app.listen(PORT, "0.0.0.0", () => {
    console.error(`Room MCP HTTP server running on port ${PORT}`);
    console.error(`SSE endpoint: /sse`);
    console.error(`Message endpoint: /messages?sessionId=...`);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
