// api/src/routes/github.routes.ts
import { Router } from "express";
import {
  getRepoMetadataByUrl,
  getReadme,
  getFileContent,
  getBranchSha,
  listTree,
  parseRepoUrl,
} from "../services/github.service";

const router = Router();

/**
 * GET /api/github/metadata?url=<repoUrl>
 * Example: /api/github/metadata?url=https://github.com/facebook/react
 */
router.get("/metadata", async (req, res) => {
  try {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ error: "Missing url query param" });

    const meta = await getRepoMetadataByUrl(url);
    res.json(meta);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch metadata" });
  }
});

/**
 * GET /api/github/readme?url=<repoUrl>&ref=<branch>
 */
router.get("/readme", async (req, res) => {
  try {
    const url = req.query.url as string;
    const ref = req.query.ref as string | undefined;
    if (!url) return res.status(400).json({ error: "Missing url query param" });

    const { owner, repo } = parseRepoUrl(url);
    const data = await getReadme(owner, repo, ref);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch README" });
  }
});

/**
 * GET /api/github/file?url=<repoUrl>&path=<filePath>&ref=<branch>
 */
router.get("/file", async (req, res) => {
  try {
    const url = req.query.url as string;
    const path = req.query.path as string;
    const ref = req.query.ref as string | undefined;
    if (!url || !path)
      return res.status(400).json({ error: "Missing url or path query param" });

    const { owner, repo } = parseRepoUrl(url);
    const data = await getFileContent(owner, repo, path, ref);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch file" });
  }
});

/**
 * GET /api/github/tree?url=<repoUrl>&ref=<branch>
 */
router.get("/tree", async (req, res) => {
  try {
    const url = req.query.url as string;
    const ref = req.query.ref as string | undefined;
    if (!url) return res.status(400).json({ error: "Missing url query param" });

    const { owner, repo } = parseRepoUrl(url);
    const sha = await getBranchSha(owner, repo, ref);
    const tree = await listTree(owner, repo, sha, true);
    res.json(tree);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch tree" });
  }
});

export default router;
