# Second Brain — Claude Code Setup

## Prerequisites

1. **Docker** — for Ollama (local embeddings + LLM)
2. **GBrain CLI** — `bun install -g github:garrytan/gbrain`
3. **Node.js 20+** — for the API and chat frontend

## First-time setup

```bash
# 1. Start Ollama and pull models
make up
make pull-model
make pull-chat-model

# 2. Create the local brain database
make init

# 3. Install dependencies
make api-setup
make chat-setup

# 4. Configure the API
cp app/api/.env.example app/api/.env

# 5. Seed with example notes
make seed

# 6. (Optional) Link your private notes and import them
ln -s /path/to/your/notes notes/
make import
```

## Starting the services

```bash
# Start everything (Ollama + GBrain HTTP + API + Chat frontend):
make dev

# Or start only what Claude Code needs:
make up && make serve &    # Ollama + GBrain on :3002
make api-dev               # API on :3001
```

## Wiring Claude Code MCP

With the API running on port 3001, register the MCP:

```bash
make mcp
# This runs: claude mcp add --transport http second-brain http://localhost:3001/mcp
```

## MCP tools available

Once connected, Claude Code has these tools via the `second-brain` MCP:

- `search_notes` — semantic + keyword search across all notes
- `list_notes` — list notes, optionally filtered by area
- `get_note` — get full content of a note by slug
- `create_note` — create a new note
- `update_note` — update an existing note
- `delete_note` — soft-delete a note

## Architecture

```
Claude Code CLI → MCP (http://localhost:3001/mcp) → Hono API → GBrain
Web Chat UI    → REST (http://localhost:3001)      → Hono API → GBrain
```

The API (port 3001) is the single entry point for both interfaces.
It talks to GBrain (port 3002) internally.

## Areas

Notes are organized by area: `ai-learning`, `quantum-physics`, `hiring`, `others`.

## Creating notes

```bash
make note area=ai-learning title="My new note"
# Then edit the file and run: make import
```
