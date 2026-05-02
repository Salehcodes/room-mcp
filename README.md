# Room MCP — Isometric Room Builder
<p align="center">
<a href="https://www.youtube.com/watch?v=Zv9mTm1hc30">
  <img width="300" height="169" alt="Watch Video" src="https://github.com/user-attachments/assets/2dc4e02b-4c2c-4649-92ce-bf3abb5a1b04" />
</a>
</p>

Room MCP is a TypeScript-based MCP server that lets an AI assistant build and modify an isometric room using tools.

The assistant can add furniture, remove items, change lighting, clear the room, export SVG, and read the current room state. The project also includes a simple HTML frontend that shows the current room and automatically refreshes when changes happen.

---

## Demo
### example of a prompt and result.
<img width="731" height="187" alt="image" src="https://github.com/user-attachments/assets/e2d271ec-e1cc-4a94-9067-95164e84d076" />
### chatGPT reply: 

<img width="505" height="595" alt="image" src="https://github.com/user-attachments/assets/c05f23c6-77e5-4c16-a4e6-b7c2981345aa" />

### result 
<img width="1658" height="867" alt="image" src="https://github.com/user-attachments/assets/86ad5298-dd26-47f9-9e1b-89f52d724c72" />

### Recorded Video

```md
[Watch the demo video](https://www.youtube.com/watch?v=Zv9mTm1hc30)
```


## Screenshots

### Empty Room

> Add a screenshot of the empty room here.
<img width="1858" height="843" alt="image" src="https://github.com/user-attachments/assets/567a8aa6-d794-4d0c-a4cb-6db9713361bb" />


### Room After Adding Furniture

<img width="1033" height="782" alt="image" src="https://github.com/user-attachments/assets/5d09a6a4-3dea-46ae-83e6-e259d2be9d20" />


---

## Features

- MCP server built with TypeScript and Express
- Streamable HTTP MCP endpoint
- Add furniture items to an isometric room
- Remove items from the room
- Change lighting mood
- Clear the full room
- Export the room as SVG
- Get the current room state as JSON
- Simple HTML/CSS/JavaScript frontend
- Live browser updates using Server-Sent Events
- No React, no Vite, no frontend framework required

---

## Tech Stack

- TypeScript
- Node.js
- Express
- MCP SDK
- Zod
- HTML
- CSS
- Vanilla JavaScript
- SVG

---

## Project Structure

```txt
room-mcp/
├─ public/
│  └─ index.html
├─ src/
│  ├─ catalog.ts
│  ├─ engine.ts
│  ├─ server.ts
│  ├─ test.ts
│  └─ types.ts
├─ docs/
│  ├─ demo.mp4
│  └─ screenshots/
│     ├─ empty-room.png
│     ├─ room-with-furniture.png
│     └─ frontend-viewer.png
├─ package.json
├─ tsconfig.json
└─ README.md
```

---

## How It Works

The project has one shared `RoomEngine` instance on the server.

MCP tools modify this engine. The frontend reads from the same engine through simple HTTP routes.

```txt
AI Assistant / MCP Client
        |
        v
POST /mcp
        |
        v
MCP tools call RoomEngine
        |
        v
Room state changes
        |
        v
Browser receives update from /events
        |
        v
Frontend reloads /api/room/svg and /api/room
```

---

## Available MCP Tools

### `add_item`

Adds a furniture item to the room.

Example:

```json
{
  "type": "desk",
  "position": {
    "x": 3,
    "y": 4
  },
  "variant": "default",
  "facing": "right"
}
```

---

### `remove_item`

Removes an item from a specific grid position.

Example:

```json
{
  "position": {
    "x": 3,
    "y": 4
  }
}
```

---

### `set_lighting`

Changes the room lighting mood.

Supported moods:

```txt
morning
evening
night
warm
```

Example:

```json
{
  "mood": "warm"
}
```

---

### `clear_room`

Removes all items and resets the room.

Example:

```json
{}
```

---

### `export_svg`

Returns the current room as an SVG string.

Example:

```json
{}
```

---

### `get_room_state`

Returns the current room state as JSON.

Example:

```json
{}
```

---

## Frontend Viewer

The project includes a simple frontend served by Express.

Open:

```txt
http://localhost:3000
```

The frontend shows:

- current SVG room
- current lighting mood
- number of items
- item list
- last update time

The frontend automatically refreshes when MCP tools change the room.

---

## API Routes

### `GET /`

Serves the frontend viewer from:

```txt
public/index.html
```

---

### `GET /api/room`

Returns the current room state as JSON.

Example response:

```json
{
  "items": [],
  "lighting": "morning"
}
```

---

### `GET /api/room/svg`

Returns the current room as SVG.

---

### `GET /events`

Server-Sent Events endpoint used by the frontend for live updates.

When a room-changing MCP tool is called, the server notifies connected browsers.

---

### `POST /mcp`

Main MCP endpoint.

---

### `GET /health`

Health check endpoint.

Example response:

```json
{
  "status": "ok"
}
```

---

## Installation

Clone the repository:

```bash
git clone https://github.com/Salehcodes/room-mcp.git
cd room-mcp
```

Install dependencies:

```bash
npm install
```

---

## Development

Run the server in development mode:

```bash
npm run dev
```

Then open:

```txt
http://localhost:3000
```

---

## Build

Compile the TypeScript project:

```bash
npm run build
```

---

## Start Production Build

After building, run:

```bash
npm start
```

---

## Example Usage Flow

1. Start the server:

```bash
npm run dev
```

2. Open the frontend:

```txt
http://localhost:3000
```

3. Connect the MCP server to an MCP-compatible client.

4. Ask the assistant to modify the room.

Example prompt:

```txt
Add a desk to the room, put a chair next to it, add a plant near the wall, and set the lighting to warm.
```

5. Watch the frontend update automatically.

---

## Example Room Commands

```txt
Add a desk at position x=3, y=4.
```

```txt
Add a chair facing left next to the desk.
```

```txt
Add a window on the wall.
```

```txt
Set the lighting to warm.
```

```txt
Remove the item at x=3, y=4.
```

```txt
Clear the room.
```

```txt
Export the current room as SVG.
```

---

## Why This Project Is Useful

This project demonstrates how an AI assistant can interact with a visual application through MCP tools.

It combines:

- backend tool execution
- structured room state management
- SVG rendering
- live frontend updates
- AI-controlled UI changes

It is a small but practical example of connecting an AI assistant to a custom interactive application.

---

## Future Improvements

- Add more furniture types
- Add drag-and-drop editing in the browser
- Add save/load room layouts
- Add persistent storage
- Add multiple room templates
- Add undo/redo
- Add support for exporting PNG
- Add better collision handling
- Add room themes
- Add authentication for deployed usage

---

## Suggested Screenshot Folder

Create this folder:

```bash
mkdir -p docs/screenshots
```

Then save your screenshots as:

```txt
docs/screenshots/empty-room.png
docs/screenshots/room-with-furniture.png
docs/screenshots/frontend-viewer.png
```

For the recorded video, you can create:

```txt
docs/demo.mp4
```

Or upload the video externally and replace the link in the Demo section.

---

## License

MIT License
