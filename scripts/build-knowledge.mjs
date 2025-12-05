// scripts/build-knowledge.mjs
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
        const title = data.title || slug;
        const url = `${base}/${slug}`;
        const baseId = `${type}:${slug}`;

        const text = `${title}\n\n${data.summary ?? ""}\n\n${content}`;
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
        const indexCandidates = ["index.mdx", "index.md"];

        for (const idx of indexCandidates) {
          const full = path.join(folder, idx);
          try {
            const raw = await fs.readFile(full, "utf8");
            const { data, content } = matter(raw);

            const slug = data.slug || entry.name;
            const title = data.title || slug;
            const url = `${base}/${slug}`;
            const baseId = `${type}:${slug}`;

            const text = `${title}\n\n${data.summary ?? ""}\n\n${content}`;
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

  const outDir = path.join(root, "netlify", "functions", "chat");
  await fs.mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, "knowledge.json");
  await fs.writeFile(outFile, JSON.stringify(items, null, 2), "utf8");
  console.log(`Wrote ${items.length} chunks to ${outFile}`);
}

collect().catch((err) => {
  console.error(err);
  process.exit(1);
});
