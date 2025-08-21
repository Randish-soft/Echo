// api/src/routes/docs.routes.ts
import { Router } from "express";
import { addTOC, wrapWithFrontmatter } from "../utils/markdown.util";
import { generateDocMarkdown, generateDocStructured } from "../services/openai.service";
import { Documentation } from "../utils/schema.util";
import { parseRepoUrl, summarizeRepoQuick, getRepoMetadata } from "../services/github.service";

const router = Router();

/** Convert structured Documentation -> Markdown */
function structuredToMarkdown(doc: Documentation): string {
  const lines: string[] = [];
  if (doc.title) lines.push(`# ${doc.title}`, "");
  if (doc.description) lines.push(doc.description.trim(), "");
  if (Array.isArray(doc.sections)) {
    for (const s of doc.sections) {
      lines.push(`## ${s.heading}`, "", s.content.trim(), "");
    }
  }
  return lines.join("\n").trim() + "\n";
}

/**
 * POST /api/docs/generate
 * Body:
 * {
 *   prompt?: string,
 *   repoUrl?: string,          // e.g., https://github.com/facebook/react
 *   mode?: "markdown"|"structured",
 *   addTOC?: boolean,
 *   frontmatter?: Record<string, string | number | boolean | null | undefined>
 * }
 */
router.post("/generate", async (req, res) => {
  try {
    const {
      prompt,
      repoUrl,
      mode = "markdown",
      addTOC: wantTOC = true,
      frontmatter = {},
    } = (req.body ?? {}) as {
      prompt?: string;
      repoUrl?: string;
      mode?: "markdown" | "structured";
      addTOC?: boolean;
      frontmatter?: Record<string, string | number | boolean | null | undefined>;
    };

    if (!prompt && !repoUrl) {
      return res.status(400).json({ error: "Provide either 'prompt' or 'repoUrl'." });
    }

    // If repoUrl is provided, build a helpful prompt context from README/package.json
    let finalPrompt = prompt?.trim() ?? "";
    let meta:
      | { name: string; fullName: string; url: string; defaultBranch: string }
      | undefined;

    if (repoUrl) {
      const { owner, repo } = parseRepoUrl(repoUrl);
      const quick = await summarizeRepoQuick(owner, repo);
      const m = await getRepoMetadata(owner, repo);
      meta = {
        name: m.name,
        fullName: m.fullName,
        url: m.url,
        defaultBranch: m.defaultBranch,
      };

      const repoIntro =
        `You are generating technical documentation for the GitHub repository ${m.fullName} (${m.url}).\n` +
        `Primary language: ${m.language ?? "unknown"} • Stars: ${m.stars} • Forks: ${m.forks}\n` +
        `Default branch: ${m.defaultBranch}\n\n` +
        `Context snippet (README or package.json, truncated):\n` +
        `---\n${quick}\n---\n\n`;

      finalPrompt =
        (finalPrompt ? repoIntro + finalPrompt : repoIntro + "Produce comprehensive documentation (installation, usage, API, configuration, examples, troubleshooting).");
    }

    let markdown: string;
    let structured: Documentation | undefined;

    if (mode === "structured") {
      structured = await generateDocStructured(finalPrompt);
      markdown = structuredToMarkdown(structured);
    } else {
      markdown = await generateDocMarkdown(finalPrompt);
    }

    if (wantTOC) markdown = addTOC(markdown);
    if (frontmatter && Object.keys(frontmatter).length > 0) {
      markdown = wrapWithFrontmatter(frontmatter, markdown);
    }

    return res.json({
      ok: true,
      mode,
      metadata: meta,
      markdown,
      structured: mode === "structured" ? structured : undefined,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to generate documentation" });
  }
});

/**
 * GET /api/docs/templates
 * Returns a couple of prompt starters you can show in the UI.
 */
router.get("/templates", (_req, res) => {
  const templates = [
    {
      id: "full-docs",
      label: "Full Documentation",
      prompt:
        "Generate comprehensive documentation including Overview, Installation, Quick Start, Core Concepts, API Reference, Configuration, Examples, and Troubleshooting.",
    },
    {
      id: "api-reference",
      label: "API Reference",
      prompt:
        "Create an API reference with endpoints/functions, parameters, return values, examples, and error handling in Markdown tables.",
    },
    {
      id: "contributing",
      label: "Contributing Guide",
      prompt:
        "Produce a CONTRIBUTING.md covering development setup, branching, commit conventions, PR process, code style, testing, and release checklist.",
    },
  ];
  res.json({ ok: true, templates });
});

export default router;
