import knowledge from "./knowledge.json" assert { type: "json" };

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

type KnowledgeItem = (typeof knowledge)[number];

type KnowledgeItem = {
  id: string;
  source: string;
  title: string;
  url?: string;
  text: string;
};

type EmbeddingChunk = KnowledgeItem & { embedding: number[] };

let cachedChunks: EmbeddingChunk[] | null = null;

async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text }] },
      }),
    }
  );

  const json = await res.json();
  // Gemini responses typically have `embedding.values`
  const values = json.embedding?.values || json.embeddings?.[0]?.values || [];
  return values;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function ensureChunkEmbeddings(): Promise<EmbeddingChunk[]> {
  if (cachedChunks) return cachedChunks;

  const withEmbeddings: EmbeddingChunk[] = await Promise.all(
    (knowledge as KnowledgeItem[]).map(async (item) => ({
      ...item,
      embedding: await getEmbedding(item.text),
    }))
  );

  cachedChunks = withEmbeddings;
  return cachedChunks;
}

exports.handler = async (event: any) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const question: string = body.question || "";
    const history: { role: string; text: string }[] = body.history || [];

    if (!question.trim()) {
      return { statusCode: 400, body: "Missing question" };
    }

    const chunks = await ensureChunkEmbeddings();
    const retrievalText = [
      ...history.map((m) => `${m.role.toUpperCase()}: ${m.text}`),
      `USER: ${question}`,
    ].join("\n");
    const qEmbedding = await getEmbedding(retrievalText);

    const scored = chunks
      .map((c) => ({
        ...c,
        score: cosineSimilarity(qEmbedding, c.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const context = scored
      .map(
        (c) =>
          `${c.title}\nSource: ${c.source}${
            c.url ? ` (${c.url})` : ""
          }\n\n${c.text}`
      )
      .join("\n\n---\n\n");

    const conversationText =
      history
        .map((m) =>
          m.role === "user" ? `User: ${m.text}` : `Assistant: ${m.text}`
        )
        .join("\n") || "(no prior conversation)";

    const prompt = [
      "You are a helpful assistant that answers questions about Srikeerthi.",
      "Use ONLY the information in the context.",
      "If the answer is not in the context, say you don't know.",
      "",
      `Context:`,
      context,
      "",
      "Conversation so far:",
      conversationText,
      "",
      `User: ${question}`,
    ].join("\n");

    const chatRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const chatJson = await chatRes.json();
    const answer =
      chatJson.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text || "")
        .join("") || "Sorry, I couldn't generate an answer.";

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ answer }),
    };
  } catch (err: any) {
    console.error(err);
    return {
      statusCode: 500,
      body: "Error generating answer",
    };
  }
};
