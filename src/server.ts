import { randomUUID } from "crypto";
import express from "express";
import cors from "cors";
import { z } from "zod";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { RoomEngine } from "./engine";
import { LightingMood } from "./types";

const engine = new RoomEngine();

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

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
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
  }));

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

  const transports: Record<string, StreamableHTTPServerTransport> = {};

  app.get("/", (_req, res) => {
    res.send("Isometric Room Builder MCP server is running.");
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/mcp", async (req, res) => {
    try {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;
      let transport: StreamableHTTPServerTransport;

      if (sessionId && transports[sessionId]) {
        transport = transports[sessionId];
      } else {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (newSessionId) => {
            transports[newSessionId] = transport;
            console.error(`MCP session initialized: ${newSessionId}`);
          },
        });

        transport.onclose = () => {
          if (transport.sessionId) {
            delete transports[transport.sessionId];
            console.error(`MCP session closed: ${transport.sessionId}`);
          }
        };

        const server = createRoomServer();
        await server.connect(transport);
      }

      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error("MCP request error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal MCP server error" });
      }
    }
  });

  app.get("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (!sessionId || !transports[sessionId]) {
      res.status(400).send("Invalid or missing MCP session ID");
      return;
    }

    await transports[sessionId].handleRequest(req, res);
  });

  app.delete("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (!sessionId || !transports[sessionId]) {
      res.status(400).send("Invalid or missing MCP session ID");
      return;
    }

    await transports[sessionId].handleRequest(req, res);
  });

  const PORT = Number(process.env.PORT) || 3000;

  app.listen(PORT, "0.0.0.0", () => {
    console.error(`Room MCP HTTP server running on port ${PORT}`);
    console.error("MCP endpoint: /mcp");
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
