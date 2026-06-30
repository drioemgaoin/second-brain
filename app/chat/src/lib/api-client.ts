const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface NoteListItem {
  slug: string;
  title: string;
  area: string;
  updatedAt?: string;
}

export interface NotePage {
  slug: string;
  title: string;
  area: string;
  tags: string[];
  content: string;
}

/** Check if the API server is reachable */
async function ensureApi(): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error();
  } catch {
    throw new Error("Unable to reach the server. Please try again in a moment.");
  }
}

/** Read error body (JSON or plain text) with a fallback message */
async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const text = await res.text();
    const parsed = JSON.parse(text);
    return parsed.error || fallback;
  } catch {
    return fallback;
  }
}

export const api = {
  async listNotes(area?: string): Promise<NoteListItem[]> {
    await ensureApi();
    const params = area ? `?area=${encodeURIComponent(area)}` : "";
    const res = await fetch(`${API_URL}/notes${params}`);
    if (!res.ok) throw new Error(await readError(res, "Could not load notes. Please try again."));
    return res.json();
  },

  async getNote(slug: string): Promise<NotePage> {
    await ensureApi();
    const res = await fetch(`${API_URL}/notes/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error(await readError(res, "Could not find this note."));
    return res.json();
  },

  async createNote(data: {
    title: string;
    area: string;
    tags: string[];
    content: string;
  }): Promise<{ slug: string }> {
    await ensureApi();
    const res = await fetch(`${API_URL}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error(await readError(res, "Could not save the note. Please try again."));
    }
    return res.json();
  },

  async updateNote(
    slug: string,
    data: { title: string; area: string; tags: string[]; content: string }
  ): Promise<void> {
    await ensureApi();
    const res = await fetch(`${API_URL}/notes/${encodeURIComponent(slug)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error(await readError(res, "Could not update the note. Please try again."));
    }
  },

  async deleteNote(slug: string): Promise<void> {
    await ensureApi();
    const res = await fetch(`${API_URL}/notes/${encodeURIComponent(slug)}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error(await readError(res, "Could not delete the note. Please try again."));
  },
};
