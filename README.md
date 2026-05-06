# Room MCP — AI-Controlled Isometric Room Builder
⭐ If you found this interesting, consider starring the repo!
<p align="center">
<a href="https://www.youtube.com/watch?v=Zv9mTm1hc30">
  <img width="500" alt="Watch Demo" src="https://github.com/user-attachments/assets/2dc4e02b-4c2c-4649-92ce-bf3abb5a1b04" />
</a>
</p>

Room MCP is a TypeScript-based MCP server that allows an AI assistant (ChatGPT / Claude) to build and modify an isometric room using tools.

The assistant can add furniture, remove items, change lighting, clear the room, export SVG, and read the current room state. A simple browser UI reflects all changes in real time.

---

## Demo

https://www.youtube.com/watch?v=Zv9mTm1hc30

---

## Features

* MCP server built with TypeScript and Express
* Tool-based interaction with an AI assistant
* Add and remove furniture
* Change lighting mood
* Clear the room
* Export the room as SVG
* Retrieve room state as JSON
* Live browser updates using Server-Sent Events
* Simple frontend with no framework dependencies

---

## Why this project

This project explores how an AI assistant can interact with a real application through structured tools.

Instead of generating text only, the assistant:

* Calls backend tools
* Modifies application state
* Updates a live UI

---

## Quick Start

```bash
git clone https://github.com/Salehcodes/room-mcp.git
cd room-mcp
npm install
npm run dev
```

Open:

```txt
http://localhost:3000
```

---

## Example prompt

```txt
Add a desk at position (3,4), place a chair next to it, add a plant near the wall, and set the lighting to warm.
```

---

## Screenshots

### Empty Room

<img width="100%" src="https://github.com/user-attachments/assets/567a8aa6-d794-4d0c-a4cb-6db9713361bb" />

### After AI commands

<img width="100%" src="https://github.com/user-attachments/assets/5d09a6a4-3dea-46ae-83e6-e259d2be9d20" />

---

## Architecture

```
AI Assistant (ChatGPT / Claude)
        ↓
      /mcp
        ↓
   MCP Tools (Express)
        ↓
    RoomEngine
        ↓
   Server-Sent Events
        ↓
     Browser UI
```

---

## Available MCP tools

* add_item
* remove_item
* set_lighting
* clear_room
* export_svg
* get_room_state

---

## Frontend

The browser UI:

* Displays the SVG room
* Shows item list and lighting
* Automatically updates when the room changes

---

## Tech stack

* TypeScript
* Node.js
* Express
* MCP SDK
* Zod
* SVG
* Vanilla JavaScript

---

## Notes

* This is a demo project, not a production system
* Some SVG assets are AI-generated and manually adjusted

---

## Future improvements

* Drag-and-drop editing
* Save/load room layouts
* Undo/redo
* More furniture types
* Persistent storage

---

## License

MIT
