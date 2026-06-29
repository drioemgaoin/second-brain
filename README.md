# Second Brain

A personal knowledge base you can talk to. Capture what you learn, connect ideas across domains, and retrieve knowledge through natural conversation — from any device.

The idea is simple: instead of scattering notes across apps, docs, and bookmarks, you store everything in one place and query it like you would ask a colleague. Whether you're deep in a terminal session with Claude Code or on your phone between meetings, your brain is always available.

Two interfaces, one brain:

- **Web chatbot** — ask questions, manage notes through a chat UI powered by a local LLM (free, private)
- **Claude Code CLI** — search, create, and edit notes directly from your terminal using Claude

A note created in one appears in the other instantly.

## Table of contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Using the web chatbot](#using-the-web-chatbot)
- [Using Claude Code CLI](#using-claude-code-cli)
- [Notes and areas](#notes-and-areas)
  - [Built-in areas](#built-in-areas)
  - [Note format](#note-format)
  - [Types of notes you can create](#types-of-notes-you-can-create)
  - [Adding notes manually](#adding-notes-manually)
- [Web chatbot vs Claude Code CLI](#web-chatbot-vs-claude-code-cli)
- [Project layout](#project-layout)
- [Production deployment](#production-deployment)
  - [Deploy the API stack to your VPS](#1-deploy-the-api-stack-to-your-vps)
  - [Deploy the chat frontend to Cloudflare Pages](#2-deploy-the-chat-frontend-to-cloudflare-pages)
  - [Import your notes to production](#3-import-your-notes-to-production)
- [For users: accessing a deployed brain](#for-users-accessing-a-deployed-brain)
  - [Web chatbot](#web-chatbot-any-device)
  - [Claude Code (desktop + mobile)](#claude-code-desktop--mobile)
- [Environment variables](#environment-variables)
- [Makefile commands](#makefile-commands)
- [Scaling with Postgres](#scaling-with-postgres)
- [Costs](#costs)
- [Public repo, private notes](#public-repo-private-notes)

## Architecture

```
  Web browser                    Terminal
      |                              |
      v                              v
+----------------+         +------------------+
| Chat frontend  |         |   Claude Code    |
| (Next.js:3000) |         |                  |
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

- [Docker](https://docs.docker.com/get-docker/) (for Ollama)
- [Bun](https://bun.sh) (to install GBrain)
- [Node.js 20+](https://nodejs.org/) (for API and frontend)
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) (optional, for terminal usage)

## Quick start

### 1. Bootstrap

```bash
bash brain/scripts/bootstrap.sh
```

This installs GBrain, starts Ollama, pulls models, creates the database, and loads example notes.

### 2. Install and configure

```bash
make api-setup                          # install API dependencies
make chat-setup                         # install frontend dependencies
cp app/api/.env.example app/api/.env    # configure API (defaults work for local dev)
cp app/chat/.env.local.example app/chat/.env.local
```

### 3. Start

```bash
make dev
```

Open [http://localhost:3000](http://localhost:3000) to use the chatbot.

### 4. Wire Claude Code (optional)

```bash
make mcp
```

This registers the API's MCP endpoint so Claude Code can access your brain.

## Using the web chatbot

Open [http://localhost:3000](http://localhost:3000). The chat interface has two sections:

### Chat

Ask questions in natural language. The chatbot retrieves relevant notes from your brain and answers using the local Ollama LLM.

```
> What did I write about RAG evaluation?
> Summarize my hiring pipeline notes.
> What do I know about quantum error correction?
```

### Notes

Browse, create, edit, and delete notes through a visual interface:

- **Filter by area** — click an area pill to filter (ai-learning, hiring, etc.)
- **Create** — click "New Note", fill in title/area/tags/content in markdown
- **Edit** — click any note card to open the editor with write/preview tabs
- **Delete** — hover a note card and click "Delete"

## Using Claude Code CLI

Start the stack (`make dev` or at least `make up && make serve & make api-dev`), then open Claude Code in this project directory. Just talk naturally — Claude uses the brain's MCP tools automatically.

### Searching

```
> What did I write about RAG evaluation?
> Summarize everything I have on the hiring pipeline.
> Cross-reference my notes on quantum physics and flag any gaps.
```

### Creating notes from conversations

Have a conversation about any topic, then ask Claude to save it. Claude will structure the content, show you a preview, and ask for confirmation before saving:

```
> Save a note about what we just discussed.
> Capture our conversation as a note in ai-learning.
> Create a note from this with key takeaways and action items.
```

### Editing

```
> Show me my note on rag-evaluation.
> Add a section about RAGAS metrics to my rag-evaluation note.
> Update my hiring pipeline note with what we just discussed.
```

### Browsing and deleting

```
> List my recent notes.
> Show me all notes in the ai-learning area.
> Delete my note hiring/old-draft.
```

Deletes are soft — recoverable for 72 hours.

## Notes and areas

Notes are the building blocks of your brain. Each note is a markdown file with metadata that makes it searchable, filterable, and connected to related knowledge.

### Built-in areas

Notes are organized by **area** — a top-level category that groups related knowledge. The project ships with four areas, and you can create your own:

| Area | Purpose | Example notes |
|------|---------|---------------|
| `ai-learning` | AI/ML concepts, tools, techniques, papers | RAG evaluation, embedding models, fine-tuning notes |
| `quantum-physics` | Quantum computing, physics concepts | Error correction, qubit architectures |
| `hiring` | Recruitment processes, interviews, pipelines | Interview stages, company-specific tracking |
| `others` | Anything that doesn't fit above | Reading lists, personal projects, meeting notes |

You can use any area name — new ones are created automatically when you create a note with a new area.

### Note format

Every note is a markdown file with YAML frontmatter:

```markdown
---
area: ai-learning
tags: [ai-learning, rag, chunking]
---

# RAG chunking strategies

Your content here...
```

- **`area`** — the top-level category (determines the folder and filtering)
- **`tags`** — freeform labels for cross-cutting concerns (a note can have many tags)
- **Title** — the `# heading` in the body becomes the note's title
- **Content** — standard markdown (headings, lists, code blocks, links, etc.)

### Types of notes you can create

There's no rigid schema — you decide what goes in. Here are common patterns:

**Learning notes** — capture what you learn from courses, articles, experiments:
```
> Create a note about what we discussed on RAG evaluation.
  Area: ai-learning
```

**Process notes** — document workflows, pipelines, checklists:
```
> Save a note describing our interview pipeline with all 5 stages.
  Area: hiring
```

**Research notes** — deep dives with references, comparisons, trade-offs:
```
> Create a note comparing embedding models. Include a comparison table
  and our benchmarks. Area: ai-learning
```

**Meeting / conversation notes** — capture key decisions and action items:
```
> Summarize our conversation with key takeaways and action items.
  Save as others/team-sync-2025-01-15
```

**Reference notes** — cheat sheets, config recipes, quick-lookup material:
```
> Create a note with our Docker Compose patterns and common commands.
  Area: others
```

**Structured extractions** — let Claude organize raw information:
```
> Create a note from our conversation with:
  - A one-paragraph summary
  - Key takeaways as bullet points
  - Open questions to explore next
  Save it as ai-learning/transformer-attention
```

All notes are versioned by GBrain. You can ask Claude Code to show version history or revert changes.

### Adding notes manually

```bash
make note area=ai-learning title="Embedding models compared"
# Edit the file, then:
make import
```

Or create the file directly in `notes/<area>/` and run `make import`.

## Web chatbot vs Claude Code CLI

| | Web chatbot | Claude Code CLI |
|---|-------------|-----------------|
| **Ask questions** | Chat UI at localhost:3000 | Natural language in terminal |
| **LLM** | Ollama (local, free) | Claude (your subscription) |
| **Create notes** | Form with markdown editor | From conversation context |
| **Best for** | Quick lookups, visual editing | Deep work, capturing from discussions |

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
  deploy/          Production deployment configs
  notes/           Your private notes (git-ignored, symlink your own)
  docker-compose.yml       Local dev (Ollama only)
  docker-compose.prod.yml  Production stack (all services)
  Makefile
```

## Production deployment

The production setup splits across two hosts:

- **Cloudflare Pages** — serves the chat frontend as a static site (free, global CDN)
- **VPS** (Contabo, Hetzner, DigitalOcean, etc.) — runs the API, GBrain, and Ollama behind Caddy with automatic HTTPS

```
  Browser / Mobile                          Desktop terminal
        |                                        |
        v                                        v
+-------------------+                   +------------------+
| Cloudflare Pages  |                   |  Claude Code CLI |
| (static frontend) |                   |                  |
+--------+----------+                   +--------+---------+
         |                                       |
         | HTTPS                                 | MCP (HTTPS)
         v                                       v
+------------------------------------------------------+
|  Contabo VPS                                         |
|  +--------+    +-------+    +--------+    +--------+ |
|  | Caddy  |--->|  API  |--->| GBrain |--->| Ollama | |
|  | :80/443|    | :3001 |    | :3002  |    | :11434 | |
|  +--------+    +-------+    +--------+    +--------+ |
+------------------------------------------------------+
```

### 1. Deploy the API stack to your VPS

SSH into your VPS and run:

```bash
# Install Docker if not already present
curl -fsSL https://get.docker.com | sh

# Clone the repo
git clone https://github.com/yourusername/second-brain.git
cd second-brain

# Configure production environment
cp deploy/.env.example .env
# Edit .env — set your domain and Cloudflare Pages URL:
#   API_DOMAIN=api.yourdomain.com
#   CORS_ORIGIN=https://your-project.pages.dev
#   CHAT_MODEL=llama3.2

# Build and start the stack
make deploy-build
make deploy-up

# Wait ~30s for Ollama to start, then pull models
make deploy-pull-model

# Load example notes (optional)
make deploy-seed
```

Make sure your DNS has an **A record** for `api.yourdomain.com` pointing to your VPS IP. Caddy will automatically provision a TLS certificate from Let's Encrypt.

Verify it's running:

```bash
curl https://api.yourdomain.com/health
# {"ok":true}
```

### 2. Deploy the chat frontend to Cloudflare Pages

1. Push your repo to GitHub
2. Go to [Cloudflare Pages](https://dash.cloudflare.com/) and create a new project
3. Connect your GitHub repo
4. Configure the build:
   - **Build command**: `cd app/chat && npm install && npm run build`
   - **Build output directory**: `app/chat/out`
   - **Environment variable**: `NEXT_PUBLIC_API_URL` = `https://api.yourdomain.com`
5. Deploy

Optionally, add a custom domain (e.g., `chat.yourdomain.com`) in Cloudflare Pages settings.

### 3. Import your notes to production

Copy your private notes to the VPS and import them:

```bash
# From your local machine:
scp -r notes/ user@your-vps-ip:~/second-brain/notes/

# On the VPS:
cd second-brain
make deploy-import
```

---

## For users: accessing a deployed brain

Once deployed, there are two ways to use the brain:

### Web chatbot (any device)

Visit the Cloudflare Pages URL (e.g., `https://chat.yourdomain.com`) in any browser. No installation needed.

- **Chat tab** — ask questions in natural language, get answers from the knowledge base
- **Notes tab** — browse, create, edit, and delete notes with a visual editor

### Claude Code (desktop + mobile)

Run the install script once on your computer. It sets up both desktop and mobile:

```bash
curl -sL https://raw.githubusercontent.com/yourusername/second-brain/main/install.sh | bash -s https://api.yourdomain.com
```

This does three things:
1. **Desktop** — registers the MCP endpoint and installs the brain skill globally
2. **Mobile** — creates a workspace repo at `~/second-brain-workspace/` with the MCP config and skill
3. **Permissions** — pre-approves all brain MCP tools

#### Desktop

Already working after the install. Open Claude Code in any project and talk naturally:

```
> What did I write about RAG evaluation?
> Create a note from our conversation about embeddings.
> List my recent notes in ai-learning.
```

#### Mobile

The install script automatically pushes a private `second-brain-workspace` repo to your GitHub. Open it in claude.ai/code on your phone — the brain skill and MCP tools are loaded from the repo.

#### How it works

The brain skill auto-triggers when you mention notes, your brain, or knowledge base. It tells Claude to always use the MCP tools — never write files directly. When you create a note, Claude searches for duplicates, structures the content with a template, shows a preview, and waits for your confirmation. This works identically on desktop and mobile.

---

## Environment variables

**API (`app/api/.env`):**

| Variable | Default | Description |
|----------|---------|-------------|
| `GBRAIN_URL` | `http://localhost:3002` | GBrain HTTP server URL |
| `PORT` | `3001` | API port |
| `CORS_ORIGIN` | any localhost | Allowed CORS origins (comma-separated) |
| `CHAT_MODEL` | `llama3.2` | Ollama chat model |
| `OLLAMA_BASE_URL` | `http://localhost:11434/v1` | Ollama API URL |

**Chat (`app/chat/.env.local`):**

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | API URL (baked at build time) |

**Production (`deploy/.env.example` → `.env`):**

| Variable | Example | Description |
|----------|---------|-------------|
| `API_DOMAIN` | `api.yourdomain.com` | Domain for the API (Caddy provisions TLS) |
| `CORS_ORIGIN` | `https://your-project.pages.dev` | Chat frontend URL for CORS |
| `CHAT_MODEL` | `llama3.2` | Ollama chat model |

## Makefile commands

Run `make help` to see all available commands.

**Local development:**

| Command | What it does |
|---------|-------------|
| `make dev` | Start everything for local development |
| `make setup` | Install all dependencies |
| `make up` / `make down` | Start/stop Ollama |
| `make serve` | Start GBrain HTTP server |
| `make seed` | Load example notes |
| `make import` | Load private notes from `notes/` |
| `make mcp` | Register MCP endpoint in Claude Code |
| `make doctor` | Health check |
| `make note area=X title="Y"` | Create a note file |

**Production deployment:**

| Command | What it does |
|---------|-------------|
| `make deploy-build` | Build production Docker images |
| `make deploy-up` / `make deploy-down` | Start/stop production stack |
| `make deploy-logs` | Tail production logs |
| `make deploy-pull-model` | Pull Ollama models in production |
| `make deploy-seed` | Load example notes in production |
| `make deploy-import` | Import notes in production |

## Scaling with Postgres

For multi-user or production use, switch GBrain from PGLite to Postgres:

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
| Claude Code CLI | Your existing subscription |
| VPS (API + Ollama hosting) | ~$10-20/month |

## Public repo, private notes

This repo is designed to be **public**. Your notes stay **private**:

- All scaffolding, config, and example notes are safe to publish
- Your real notes live in `notes/`, which is git-ignored
- Example notes live in `brain/examples/` and are public
- Symlink your private notes repo: `ln -s /path/to/your/notes notes/`
