import knowledge from "./knowledge.json" with { type: "json" };

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

type KnowledgeItem = (typeof knowledge)[number];

type KnowledgeItem = {
  id: string;
  source: string;
  title: string;
  url?: string;
  text: string;
  embedding?: number[];
};

type EmbeddingChunk = KnowledgeItem & { embedding: number[] };

let cachedChunks: EmbeddingChunk[] | null = null;

async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/gemini-embedding-001",
        content: { parts: [{ text }] },
      }),
    },
  );

  const json = await res.json();
  // Gemini responses typically have `embedding.values`
  const values = json.embedding?.values || json.embeddings?.[0]?.values || [];
  return values;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || b.length === 0) return -1;
  let dot = 0,
    na = 0,
    nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return -1;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function getEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const requests = texts.map((text) => ({
    model: "models/text-embedding-004",
    content: { parts: [{ text }] },
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requests }),
    }
  );

  const json = await res.json();
  if (!json.embeddings) {
    console.error("Batch embed failed:", json);
    return texts.map(() => []);
  }

  return json.embeddings.map((emb: any) => emb.values || []);
}

async function ensureChunkEmbeddings(): Promise<EmbeddingChunk[]> {
  // If we already have the EXACT SAME number of chunks embedded as the JSON file, use the cache.
  // Otherwise, recalculate them all. This ensures that when you run build-knowledge.mjs,
  // the serverless function immediately knows the file got bigger and recalculates.
  if (cachedChunks && cachedChunks.length === knowledge.length) {
    return cachedChunks;
  }

  const items = knowledge as KnowledgeItem[];
  
  // If knowledge.json already contains embeddings (pre-computed during build), just use them!
  const hasPrecomputed = items.length > 0 && items[0].embedding && items[0].embedding.length > 0;
  
  if (hasPrecomputed) {
    console.log("Using pre-computed embeddings from knowledge.json");
    cachedChunks = items as EmbeddingChunk[];
    return cachedChunks;
  }

  console.log(
    "Recalculating vector embeddings for",
    knowledge.length,
    "chunks...",
  );

  const chunksToCache: EmbeddingChunk[] = [];
  
  const BATCH_SIZE = 50;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const texts = batch.map((b) => b.text);
    const embeddings = await getEmbeddingsBatch(texts);
    
    for (let j = 0; j < batch.length; j++) {
      chunksToCache.push({
        ...batch[j],
        embedding: embeddings[j] || [],
      });
    }
  }

  cachedChunks = chunksToCache;
  return cachedChunks;
}

export const handler = async (event: any) => {
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
    
    if (!qEmbedding || qEmbedding.length === 0) {
      console.error("Failed to generate embedding for question");
      return { statusCode: 500, body: JSON.stringify({ answer: "I'm having trouble searching my knowledge base right now. Please try again later." }) };
    }

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
          }\n\n${c.text}`,
      )
      .join("\n\n---\n\n");

    const conversationText =
      history
        .map((m) =>
          m.role === "user" ? `User: ${m.text}` : `Assistant: ${m.text}`,
        )
        .join("\n") || "(no prior conversation)";

    const prompt = [
      "You are an AI assistant representing Srikeerthi's portfolio website. Your job is to answer questions about his experience, projects, and blogs.",
      "If the user asks a general question about Srikeerthi (like 'Who is Srikeerthi?'), introduce him as a Master's graduate in CS from UT Arlington, a software engineer, and summarize the provided context.",
      "Base your answers on the provided context. If the specific details asked cannot be found or inferred from the context, politely say you don't have that information.",
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
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
      },
    );

    const chatJson = await chatRes.json();
    console.log("Gemini API Response:", JSON.stringify(chatJson, null, 2));
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
