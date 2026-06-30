import type { Page } from "@playwright/test";

export const MOCK_NOTES = [
  {
    slug: "ai-learning/rag-evaluation",
    title: "RAG Evaluation Basics",
    area: "ai-learning",
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    slug: "quantum-physics/entanglement-notes",
    title: "Quantum Entanglement Notes",
    area: "quantum-physics",
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    slug: "hiring/interview-rubric",
    title: "Interview Rubric Template",
    area: "hiring",
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    slug: "ai-learning/fine-tuning-guide",
    title: "Fine-Tuning LLMs Guide",
    area: "ai-learning",
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const MOCK_NOTE_PAGE = {
  slug: "ai-learning/rag-evaluation",
  title: "RAG Evaluation Basics",
  area: "ai-learning",
  tags: ["ai-learning", "rag", "evaluation"],
  content:
    "# RAG Evaluation Basics\n\nRetrieve-Augment-Generate pipelines need evaluation at each stage.\n\n## Key Metrics\n\n- **Retrieval recall** — are the right chunks found?\n- **Answer faithfulness** — is the answer grounded in context?\n- **Answer relevance** — does it address the question?",
};

export async function mockApi(page: Page) {
  // Only intercept API requests (port 3001), NOT the frontend dev server
  const API_ORIGIN = "http://localhost:3001";

  await page.route(`${API_ORIGIN}/notes**`, async (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    const pathname = url.pathname;

    // /notes (list or create)
    if (pathname === "/notes" || pathname === "/notes/") {
      if (method === "GET") {
        const area = url.searchParams.get("area");
        const notes = area
          ? MOCK_NOTES.filter((n) => n.area === area)
          : MOCK_NOTES;
        await route.fulfill({ json: notes });
      } else if (method === "POST") {
        await route.fulfill({
          status: 201,
          json: { slug: "ai-learning/new-note", created: true },
        });
      } else {
        await route.continue();
      }
      return;
    }

    // /notes/:slug
    if (method === "GET") {
      await route.fulfill({ json: MOCK_NOTE_PAGE });
    } else if (method === "PUT") {
      await route.fulfill({ json: { slug: MOCK_NOTE_PAGE.slug } });
    } else if (method === "DELETE") {
      await route.fulfill({ json: { deleted: true } });
    } else {
      await route.continue();
    }
  });

  await page.route(`${API_ORIGIN}/chat**`, async (route) => {
    const body =
      "This is a response from the knowledge base. Your notes contain information about RAG evaluation.";
    await route.fulfill({
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      body,
    });
  });
}
