// scripts/build-knowledge.mjs
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter"; // npm install gray-matter --save-dev

const root = process.cwd();

const sources = [
  { dir: "src/content/blog", type: "blog", base: "/blog" },
  { dir: "src/content/projects", type: "projects", base: "/projects" },
  { dir: "src/content/work", type: "work", base: "/work" },
  { dir: "src/content/about", type: "about", base: "/about" },
];

function slugFromFilename(file) {
  return file.replace(/\.mdx?$/i, "");
}

function chunkText(text, maxLen = 600) {
  const paras = text
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);
  const chunks = [];
  let buf = "";
  for (const p of paras) {
    if ((buf + "\n\n" + p).length > maxLen && buf) {
      chunks.push(buf.trim());
      buf = p;
    } else {
      buf = buf ? buf + "\n\n" + p : p;
    }
  }
  if (buf) chunks.push(buf.trim());
  return chunks;
}

async function getEmbeddingsBatch(texts, apiKey) {
  const requests = texts.map((text) => ({
    model: "models/gemini-embedding-001",
    content: { parts: [{ text }] },
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key=${apiKey}`,
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

  return json.embeddings.map((emb) => emb.values || []);
}

async function collect() {
  const items = [];

  for (const { dir, type, base } of sources) {
    const absDir = path.join(root, dir);
    let entries;
    try {
      entries = await fs.readdir(absDir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      // Case 1: top-level markdown file (e.g. work/*.md)
      if (entry.isFile() && entry.name.match(/\.mdx?$/i)) {
        const full = path.join(absDir, entry.name);
        const raw = await fs.readFile(full, "utf8");
        const { data, content } = matter(raw);

        const slug = data.slug || slugFromFilename(entry.name);
        const url = `${base}/${slug}`;
        const baseId = `${type}:${slug}`;

        // Create the title and text string correctly
        const title =
          data.title ||
          (data.company ? `${data.role} at ${data.company}` : slug);
        const roleContext = data.company
          ? `Work Experience as ${data.role} at ${data.company}.\n\n`
          : "";
        const text = `${title}\n\n${roleContext}${data.summary ?? ""}\n\n${content}`;

        const chunks = chunkText(text);

        chunks.forEach((chunk, i) => {
          items.push({
            id: `${baseId}#${i + 1}`,
            source: type,
            title,
            url,
            text: chunk,
          });
        });
      }

      // Case 2: nested folder with index.md/mdx (e.g. blog/My-post/index.md)
      if (entry.isDirectory()) {
        const folder = path.join(absDir, entry.name);
        const indexCandidates = [
          "index.mdx",
          "index.md",
          "about.mdx",
          "about.md",
        ];

        for (const idx of indexCandidates) {
          const full = path.join(folder, idx);
          try {
            const raw = await fs.readFile(full, "utf8");
            const { data, content } = matter(raw);

            const slug = data.slug || entry.name;
            const url = `${base}/${slug}`;
            const baseId = `${type}:${slug}`;

            // Apply the same logic here to fix missing titles
            const title =
              data.title ||
              (data.company ? `${data.role} at ${data.company}` : slug);
            const roleContext = data.company
              ? `Work Experience as ${data.role} at ${data.company}.\n\n`
              : "";
            const text = `${title}\n\n${roleContext}${data.summary ?? ""}\n\n${content}`;

            const chunks = chunkText(text);

            chunks.forEach((chunk, i) => {
              items.push({
                id: `${baseId}#${i + 1}`,
                source: type,
                title,
                url,
                text: chunk,
              });
            });

            // Successfully processed this folder; no need to try other candidates.
            break;
          } catch {
            // File doesn't exist in this folder; try next candidate.
          }
        }
      }
    }
  }

  const outDir = path.join(root, "netlify", "functions");
  await fs.mkdir(outDir, { recursive: true });

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    console.log("GEMINI_API_KEY found, pre-computing embeddings during build...");
    const BATCH_SIZE = 50;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      const texts = batch.map((b) => b.text);
      let embeddings = await getEmbeddingsBatch(texts, apiKey);
      for (let j = 0; j < batch.length; j++) {
        batch[j].embedding = embeddings[j] || [];
      }
    }
  } else {
    console.log("No GEMINI_API_KEY found during build. Embeddings will be computed at runtime.");
  }

  const outFile = path.join(outDir, "knowledge.json");
  await fs.writeFile(outFile, JSON.stringify(items, null, 2), "utf8");
  console.log(`Wrote ${items.length} chunks to ${outFile}`);
}

collect().catch((err) => {
  console.error(err);
  process.exit(1);
});
