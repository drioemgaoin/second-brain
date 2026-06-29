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

export const api = {
  async listNotes(area?: string): Promise<NoteListItem[]> {
    const params = area ? `?area=${encodeURIComponent(area)}` : "";
    const res = await fetch(`${API_URL}/notes${params}`);
    if (!res.ok) throw new Error("Failed to list notes");
    return res.json();
  },

  async getNote(slug: string): Promise<NotePage> {
    const res = await fetch(`${API_URL}/notes/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error("Note not found");
    return res.json();
  },

  async createNote(data: {
    title: string;
    area: string;
    tags: string[];
    content: string;
  }): Promise<{ slug: string }> {
    const res = await fetch(`${API_URL}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create note");
    }
    return res.json();
  },

  async updateNote(
    slug: string,
    data: { title: string; area: string; tags: string[]; content: string }
  ): Promise<void> {
    const res = await fetch(`${API_URL}/notes/${encodeURIComponent(slug)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update note");
    }
  },

  async deleteNote(slug: string): Promise<void> {
    const res = await fetch(`${API_URL}/notes/${encodeURIComponent(slug)}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete note");
  },
};
