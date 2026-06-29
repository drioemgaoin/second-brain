---
area: ai-learning
tags: [ai-learning, rag, evaluation, ragas]
---

# RAG evaluation

RAG evaluation means checking whether a retrieval-augmented answer is good: is it
backed by the retrieved text, and did retrieval find the right text?

## Ragas

- **Faithfulness**: is the answer supported by the retrieved chunks? Use it as a
  gate, often around a 0.85 threshold.
- **Context precision / recall**: did retrieval pull the right chunks, and enough
  of them?

Use Ragas when you want automatic, repeatable scoring of a RAG pipeline rather
than eyeballing answers.
