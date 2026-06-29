# second-brain

A small, local, free **knowledge brain** for *any* subject, grouped by area. You
drop short notes into `notes/<area>/`, and later ask Claude Code questions. GBrain
finds the right notes; Claude Code writes the answer.

The areas below are just a starting set — add, rename, or remove folders for
whatever you want to keep: work, study, recipes, health, anything.

Starter areas: `ai-learning`, `quantum-physics`, `hiring`, `others`.

Nothing here runs in the cloud. The only thing you pay for is your Claude Code
subscription, which you already have.

## How "the right area" actually works

This is the part worth understanding.

GBrain is **one** brain, not many. When you ask a question, search pulls the notes
closest in meaning to your question. Ask about RAG and it surfaces your
`ai-learning` notes; ask about qubits and it surfaces `quantum-physics`. The
unrelated areas simply do not match, so they do not show up. **Routing to the
right area happens automatically through relevance — there is no expert to switch
to.**

So the area folders do two jobs:

1. **Organize you** — your notes stay tidy by subject.
2. **Let you force a scope** — when you want to, you can limit a question to one
   area. This helps when a word means different things across areas (a "model" in
   AI vs a "model" in physics).

You do not need rigid walls for correct answers. The folders are for your
benefit, plus the option to scope on demand.

## Public repo, private notes

This repo is meant to be **public**. Your notes are meant to be **private**.

- Scaffolding, config, and example notes are safe to publish.
- Your real notes live in `notes/<area>/`, which is **git-ignored**. They never
  reach the public repo.
- Example notes live in `examples/<area>/` and are public, so a fresh clone has
  something to import and test with.

## How the pieces fit

```
   YOU
    |  ask / capture, in plain English
    v
+------------------+   spawns on demand    +------------------+
|  Claude Code     | --------------------> |  GBrain          |
|  (you pay this)  |   via MCP (stdio)     |  (gbrain serve)  |
|  does ANSWERING  | <-------------------- |  does RETRIEVING |
+------------------+   notes + sources     +--------+---------+
                                                    | reads / writes
                          +-------------------------+------------------------+
                          v                                                  v
                  +---------------+                                 +-----------------+
                  |  PGLite DB    |                                 |  Ollama         |
                  |  files on disk|                                 |  (embeddings)   |
                  |  ~/.gbrain    |                                 |  Docker, free   |
                  +---------------+                                 +-----------------+
```

## Prerequisites

- **Docker** (Docker Desktop, or engine + compose).
- **Bun** (to install GBrain): https://bun.sh
- **Claude Code CLI** (you have this).

## First-time setup

One command does it all:

```bash
bash scripts/bootstrap.sh
```

Or step by step:

```bash
bun install -g github:garrytan/gbrain          # 1. install GBrain on host
make up && make pull-model                      # 2. start Ollama, pull model
gbrain providers test --model ollama:nomic-embed-text   # 3. smoke-test
make init && make doctor                        # 4. create brain, health check
make mcp                                         # 5. wire into Claude Code
make seed                                        # 6. load public example notes
```

If step 4 complains, trust `gbrain doctor` over this README — it prints the exact
fix for your machine.

## Adding notes

Use the helper to create a tagged note in the right area:

```bash
make note area=quantum-physics title="Entanglement basics"
# or:
bash scripts/note.sh quantum-physics "Entanglement basics"
```

It creates `notes/quantum-physics/entanglement-basics.md` with frontmatter:

```
---
area: quantum-physics
tags: [quantum-physics]
---

# Entanglement basics
```

Edit the file, then load it into the brain:

```bash
make import
```

## Asking questions

Ask **inside Claude Code**. Two ways:

**Let relevance route it (normal):**

> What did I record about evaluating RAG?

Search finds your `ai-learning` notes because that is where the match is. You did
nothing special.

**Force an area when you want to (scoping):**

> Using only my quantum-physics notes, explain superposition the way I wrote it.

Naming the area steers both retrieval and the answer toward that folder. This is
the simple, reliable way to scope. (For a harder, built-in scope you can also
filter by tag in raw search — run `gbrain search --help` to see the current flag,
as it varies by version.)

Raw retrieval without Claude Code (free, no synthesis):

```bash
make search q="superposition qubit"
```

## Turning the machine off

Nothing here needs to keep running. PGLite is files; Claude Code starts GBrain
only when you ask; Ollama is a container you stop with `make down` and start with
`make up`. You skip GBrain's paid 24/7 "dream cycle".

## Push the public repo to GitHub

```bash
git init
git add .
git commit -m "Initial second-brain"
git branch -M main
git remote add origin git@github.com:YOUR_USERNAME/second-brain.git
git push -u origin main
```

`.env` and everything under `notes/` are git-ignored, so only scaffolding and
example notes get published.

## Backing up notes privately (optional)

To version your notes in a **separate private repo**, make `notes/` its own repo.
The public repo already ignores `notes/`, so the two never interfere:

```bash
cd notes
git init && git add -A && git commit -m "My private notes"
git branch -M main
git remote add origin git@github.com:YOUR_USERNAME/second-brain-notes.git   # create as PRIVATE
git push -u origin main
cd ..
```

## Upgrade: full Docker (Postgres + pgvector)

When PGLite is not enough, uncomment the `postgres` service in
`docker-compose.yml` and init against it:

```bash
make up
gbrain init --postgres "postgresql://gbrain:gbrain@localhost:5432/gbrain" \
  --embedding-model ollama:nomic-embed-text
```

Verify the exact `--postgres` flag with `gbrain init --help`.

## Project layout

```
second-brain/
  docker-compose.yml      Ollama service (Postgres optional, commented)
  Makefile                short commands
  .env.example            copy to .env if you need to change anything
  scripts/
    bootstrap.sh          full first-time setup
    note.sh               create a tagged note in an area
  examples/<area>/        public sample notes (make seed)
  notes/<area>/           your private notes (make import) — git-ignored
```
