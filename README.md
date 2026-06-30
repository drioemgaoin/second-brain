# Second Brain

A personal knowledge base you can talk to. Capture what you learn, connect ideas across domains, and retrieve knowledge through natural conversation — from any device.

Instead of scattering notes across apps, docs, and bookmarks, you store everything in one place and query it like you would ask a colleague. Whether you're in a terminal session with Claude Code, chatting on your phone, or browsing notes on your laptop — your brain is always available.

**Two interfaces, one brain:**

- **Web chatbot** — ask questions and manage notes through a chat UI powered by a local LLM (free, private)
- **Claude Code** — search, create, and edit notes directly from your terminal or mobile app using Claude

A note created in one appears in the other instantly.

## Table of contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick start (local dev)](#quick-start-local-dev)
- [Using the web chatbot](#using-the-web-chatbot)
- [Using Claude Code](#using-claude-code)
- [Notes and areas](#notes-and-areas)
- [Web chatbot vs Claude Code](#web-chatbot-vs-claude-code)
- [Project layout](#project-layout)
- [Production deployment](#production-deployment)
- [For users: accessing a deployed brain](#for-users-accessing-a-deployed-brain)
- [Environment variables](#environment-variables)
- [Makefile commands](#makefile-commands)
- [Scaling with Postgres](#scaling-with-postgres)
- [Costs](#costs)
- [Public repo, private notes](#public-repo-private-notes)

## Architecture

```
  Web browser                    Terminal / Mobile
      |                              |
      v                              v
+----------------+         +------------------+
| Chat frontend  |         |   Claude Code    |
| (Next.js:3000) |         |  CLI or iOS app  |
+-------+--------+         +--------+---------+
        |                            |
        | REST                       | MCP (HTTP)
        v                            v
+------------------------------------------+
|          API (Hono :3001)                |
|   chat · notes CRUD · MCP endpoint       |
+-------------------+----------------------+
                    |
                    v
         +-------------------+
         |  GBrain (:3002)   |
         |  hybrid search    |
         |  PGLite / Postgres|
         +--------+----------+
                  |
                  v
         +-------------------+
         |  Ollama (:11434)  |
         |  embeddings + LLM |
         +-------------------+
```

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) — runs Ollama
- [Bun](https://bun.sh) — installs GBrain
- [Node.js 20+](https://nodejs.org/) — runs the API and frontend
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) — optional, for terminal/mobile usage

## Quick start (local dev)

### 1. Bootstrap

```bash
bash brain/scripts/bootstrap.sh
```

This installs GBrain, starts Ollama, pulls models, creates the database, and loads example notes. Run it once.

### 2. Install and configure

```bash
make setup                                # install API + frontend dependencies
cp app/api/.env.example app/api/.env      # defaults work for local dev
cp app/chat/.env.local.example app/chat/.env.local
```

### 3. Start everything

```bash
make dev
```

This starts Ollama, GBrain, the API, and the chat frontend in one command.

Open [http://localhost:3000](http://localhost:3000) to use the chatbot.

### 4. Wire Claude Code (optional)

```bash
make mcp
```

This registers the API's MCP endpoint so Claude Code can access your brain from any project directory.

## Using the web chatbot

Open [http://localhost:3000](http://localhost:3000). The interface has two sections:

### Chat

Ask questions in natural language. The chatbot retrieves relevant notes and answers using Ollama (local, free, private).

```
> What did I write about RAG evaluation?
> Summarize my hiring pipeline notes.
> What do I know about quantum error correction?
```

### Notes

Browse, create, edit, and delete notes through a visual interface:

- **Filter by area** — click an area pill to filter (ai-learning, hiring, etc.)
- **Create** — click "New Note", fill in title/area/tags/content in markdown
- **Edit** — click any note card to open the editor
- **Delete** — click the delete button on a note card

## Using Claude Code

Make sure the stack is running (`make dev`), then open Claude Code in this project directory. Just talk naturally — Claude uses the brain's MCP tools automatically.

### On desktop (CLI or IDE)

**Search your brain:**
```
> What did I write about RAG evaluation?
> Summarize everything I have on the hiring pipeline.
> Cross-reference my notes on quantum physics and flag any gaps.
```

**Create notes from conversations:**
```
> Save a note about what we just discussed.
> Capture our conversation as a note in ai-learning.
> Create a note from this with key takeaways and action items.
```

**Edit notes:**
```
> Add a section about RAGAS metrics to my rag-evaluation note.
> Update my hiring pipeline note with what we just discussed.
```

**Browse and delete:**
```
> List my recent notes.
> Show me all notes in the ai-learning area.
> Delete my note hiring/old-draft.
```

Deletes are soft — recoverable for 72 hours.

### On mobile (Claude iOS app)

The Claude iOS app doesn't support MCP natively, but you can brainstorm in the app and save the result via the web chatbot:

**One-time setup — create a Claude Project:**

1. Open the Claude iOS app
2. Tap **Projects** > **New Project**
3. Name it **Second Brain**
4. Tap **Project Instructions** and paste:

```
When I ask you to format a conversation as a note, use this structure:

Title: a short descriptive title
Area: one of ai-learning, quantum-physics, hiring, or others
Tags: 3-5 descriptive tags

Content:

## Summary
One paragraph capturing the core insight.

## Key takeaways
- Bullet points of the most important points

## Details
Organized content under descriptive headings.

## Action items
- Concrete next steps (omit if none)

## Open questions
- Unanswered questions (omit if none)
```

5. Save the project

**Daily workflow:**

1. Start a conversation inside the **Second Brain** project
2. When done, say: **"Format this as a note"**
3. Copy the formatted note
4. Open the web chatbot on your phone
5. Go to **Notes** > **New Note**, paste and publish

The note is now searchable from both the web chatbot and Claude Code on desktop.

## Notes and areas

Notes are the building blocks of your brain. Each note is a markdown file with metadata that makes it searchable, filterable, and connected to related knowledge.

### Built-in areas

| Area | Purpose | Example notes |
|------|---------|---------------|
| `ai-learning` | AI/ML concepts, tools, papers | RAG evaluation, embedding models, fine-tuning |
| `quantum-physics` | Quantum computing, physics | Error correction, qubit architectures |
| `hiring` | Recruitment, interviews | Interview stages, pipeline tracking |
| `others` | Everything else | Reading lists, meeting notes, personal projects |

New areas are created automatically when you use a new area name.

### Note format

Every note is markdown with YAML frontmatter:

```markdown
---
area: ai-learning
tags: [ai-learning, rag, chunking]
---

# RAG chunking strategies

Your content here...
```

- **`area`** — top-level category (determines folder and filtering)
- **`tags`** — freeform labels for cross-cutting concerns
- **Title** — the `# heading` in the body
- **Content** — standard markdown

### Adding notes manually

```bash
make note area=ai-learning title="Embedding models compared"
# Edit the generated file, then:
make import
```

Or create a file directly in `notes/<area>/` and run `make import`.

## Web chatbot vs Claude Code

| | Web chatbot | Claude Code |
|---|-------------|-------------|
| **Interface** | Chat UI at localhost:3000 | Terminal, IDE, or iOS app |
| **LLM** | Ollama (local, free) | Claude (your subscription) |
| **Create notes** | Form with markdown editor | From conversation context |
| **Best for** | Quick lookups, visual editing | Deep work, capturing discussions |

Both hit the same brain. Changes sync instantly.

## Project layout

```
second-brain/
  app/
    api/           Hono API — chat, notes CRUD, MCP endpoint
    chat/          Next.js frontend — chat UI, notes manager
  brain/
    examples/      Public sample notes (loaded with make seed)
    scripts/       bootstrap.sh, note.sh
  deploy/          Production deployment configs (Caddy, GBrain Dockerfile)
  notes/           Your private notes (git-ignored)
  .github/         CI/CD workflows (auto-deploy on push)
  docker-compose.yml       Local dev (Ollama only)
  docker-compose.prod.yml  Production stack (all services)
  Makefile                 All project commands
  install.sh               One-line setup for remote Claude Code users
```

## Production deployment

The production setup splits across two hosts:

- **Cloudflare Pages** — serves the chat frontend as a static site (free, global CDN)
- **VPS** — runs the API, GBrain, and Ollama behind Caddy with automatic HTTPS

```
  Browser / Mobile                          Desktop terminal
        |                                        |
        v                                        v
+-------------------+                   +------------------+
| Cloudflare Pages  |                   |  Claude Code     |
| (static frontend) |                   |  CLI / iOS app   |
+--------+----------+                   +--------+---------+
         |                                       |
         | HTTPS                                 | MCP (HTTPS)
         v                                       v
+------------------------------------------------------+
|  VPS                                                 |
|  +--------+    +-------+    +--------+    +--------+ |
|  | Caddy  |--->|  API  |--->| GBrain |--->| Ollama | |
|  | :80/443|    | :3001 |    | :3002  |    | :11434 | |
|  +--------+    +-------+    +--------+    +--------+ |
+------------------------------------------------------+
```

### 1. Deploy the API stack to your VPS

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone and configure
git clone https://github.com/drioemgaoin/second-brain.git
cd second-brain
cp deploy/.env.example .env
# Edit .env:
#   API_DOMAIN=api.yourdomain.com
#   CORS_ORIGIN=https://your-project.pages.dev
#   CHAT_MODEL=llama3.2

# Build, start, pull models
make deploy-build
make deploy-up
# Wait ~30s for Ollama, then:
make deploy-pull-model

# Load example notes (optional)
make deploy-seed
```

Point your DNS A record for `api.yourdomain.com` to your VPS IP. Caddy provisions TLS automatically.

Verify: `curl https://api.yourdomain.com/health` should return `{"ok":true}`.

### 2. Deploy the chat frontend to Cloudflare Pages

1. Push your repo to GitHub
2. Go to [Cloudflare Pages](https://dash.cloudflare.com/) and create a new project
3. Connect your GitHub repo
4. Configure the build:
   - **Build command**: `cd app/chat && npm install && npm run build`
   - **Build output directory**: `app/chat/out`
   - **Environment variable**: `NEXT_PUBLIC_API_URL` = `https://api.yourdomain.com`
5. Deploy

CI/CD is included — pushes to `main` auto-deploy via GitHub Actions.

### 3. Import your private notes

```bash
# From your local machine:
scp -r notes/ user@your-vps-ip:~/second-brain/notes/

# On the VPS:
cd second-brain && make deploy-import
```

## For users: accessing a deployed brain

Once deployed, there are three ways to access the brain:

### Web chatbot (any device)

Visit the Cloudflare Pages URL (e.g., `https://chat.yourdomain.com`). No installation needed.

- **Chat** — ask questions, get answers from the knowledge base
- **Notes** — browse, create, edit, and delete notes

### Claude Code (desktop)

Run the install script once:

```bash
curl -sL https://raw.githubusercontent.com/drioemgaoin/second-brain/main/install.sh | bash -s https://api.yourdomain.com
```

This registers the MCP endpoint, installs the brain skill, and configures permissions. Then open Claude Code in any project:

```
> What did I write about RAG evaluation?
> Create a note from our conversation about embeddings.
> List my recent notes in ai-learning.
```

### Claude iOS app + web chatbot (mobile)

Brainstorm in the Claude iOS app using the **Second Brain** project (see [setup above](#on-mobile-claude-ios-app)), then save formatted notes via the web chatbot on your phone.

## Environment variables

**API** (`app/api/.env`):

| Variable | Default | Description |
|----------|---------|-------------|
| `GBRAIN_URL` | `http://localhost:3002` | GBrain HTTP server URL |
| `PORT` | `3001` | API port |
| `CORS_ORIGIN` | any localhost | Allowed CORS origins (comma-separated) |
| `CHAT_MODEL` | `llama3.2` | Ollama chat model |
| `OLLAMA_BASE_URL` | `http://localhost:11434/v1` | Ollama API URL |

**Chat** (`app/chat/.env.local`):

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | API URL (baked at build time) |

**Production** (`.env` from `deploy/.env.example`):

| Variable | Example | Description |
|----------|---------|-------------|
| `API_DOMAIN` | `api.yourdomain.com` | Domain for the API (Caddy provisions TLS) |
| `CORS_ORIGIN` | `https://your-project.pages.dev` | Chat frontend URL for CORS |
| `CHAT_MODEL` | `llama3.2` | Ollama chat model |

## Makefile commands

Run `make help` to see all commands. Here are the key ones:

**Local development:**

| Command | What it does |
|---------|-------------|
| `make dev` | Start everything (Ollama + GBrain + API + chat frontend) |
| `make setup` | Install all dependencies |
| `make up` / `make down` | Start / stop Ollama |
| `make serve` | Start GBrain HTTP server |
| `make seed` | Load example notes |
| `make import` | Load private notes from `notes/` |
| `make mcp` | Register MCP endpoint in Claude Code |
| `make doctor` | Health check |
| `make note area=X title="Y"` | Create a note file from template |

**Production:**

| Command | What it does |
|---------|-------------|
| `make deploy-build` | Build production Docker images |
| `make deploy-up` / `make deploy-down` | Start / stop production stack |
| `make deploy-logs` | Tail production logs |
| `make deploy-pull-model` | Pull Ollama models in production |
| `make deploy-seed` | Load example notes in production |
| `make deploy-import` | Import notes in production |

## Scaling with Postgres

For multi-user or heavy production use, switch GBrain from PGLite to Postgres:

```bash
# Uncomment the postgres service in docker-compose.yml, then:
make up
gbrain init --postgres "postgresql://gbrain:gbrain@localhost:5432/gbrain" \
  --embedding-model ollama:nomic-embed-text
```

## Costs

| Component | Cost |
|-----------|------|
| Ollama (embeddings + chat) | Free |
| GBrain + PGLite | Free |
| Cloudflare Pages (chat hosting) | Free |
| Claude Code | Your existing subscription |
| VPS (API + Ollama) | ~$10-20/month |

## Public repo, private notes

This repo is designed to be **public**. Your notes stay **private**:

- All scaffolding, config, and example notes are safe to publish
- Your real notes live in `notes/`, which is git-ignored
- Example notes live in `brain/examples/` and are public
- Symlink your private notes repo: `ln -s /path/to/your/notes notes/`
