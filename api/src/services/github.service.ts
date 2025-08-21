import { RepoMetadata, RepoMetadataSchema, validateSchema } from "../utils/schema.util";

/**
 * Lightweight GitHub REST v3 client using native fetch.
 * Token is optional for public repos but recommended to raise rate limits.
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GH_API = "https://api.github.com";

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "repodocs",
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  return headers;
}

async function ghFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${GH_API}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers || {}) },
  });

  if (res.status === 404) {
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub 404: ${path} — ${body}`);
  }
  if (res.status === 403) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `GitHub 403 (Forbidden/Rate limit). Add a GITHUB_TOKEN. Details: ${body}`
    );
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub error ${res.status}: ${body}`);
  }

  return (await res.json()) as T;
}

/** Parse a full GitHub URL like https://github.com/owner/repo(.git) -> { owner, repo } */
export function parseRepoUrl(url: string): { owner: string; repo: string } {
  try {
    const u = new URL(url);
    const parts = u.pathname.replace(/^\//, "").replace(/\.git$/, "").split("/");
    if (parts.length < 2) throw new Error("Invalid GitHub URL");
    return { owner: parts[0], repo: parts[1] };
  } catch {
    throw new Error("Invalid GitHub repository URL.");
  }
}

/** Get repo metadata and validate */
export async function getRepoMetadata(
  owner: string,
  repo: string
): Promise<RepoMetadata> {
  const data = await ghFetch<any>(`/repos/${owner}/${repo}`);

  const meta = {
    name: data.name,
    fullName: data.full_name,
    url: data.html_url,
    defaultBranch: data.default_branch,
    description: data.description,
    language: data.language,
    stars: data.stargazers_count ?? 0,
    forks: data.forks_count ?? 0,
  };

  return validateSchema(RepoMetadataSchema, meta);
}

/** Convenience wrapper from a repo URL */
export async function getRepoMetadataByUrl(url: string): Promise<RepoMetadata> {
  const { owner, repo } = parseRepoUrl(url);
  return getRepoMetadata(owner, repo);
}

/** Return README content (decoded) + sha */
export async function getReadme(
  owner: string,
  repo: string,
  ref?: string
): Promise<{ content: string; sha: string }> {
  const data = await ghFetch<any>(
    `/repos/${owner}/${repo}/readme${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`
  );
  const buff = Buffer.from(data.content, data.encoding || "base64");
  return { content: buff.toString("utf-8"), sha: data.sha };
}

/** Get a file’s raw content at a path/ref */
export async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  ref?: string
): Promise<{ content: string; sha: string }> {
  const data = await ghFetch<any>(
    `/repos/${owner}/${repo}/contents/${encodeURIComponent(
      path
    )}${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`
  );
  const buff = Buffer.from(data.content, data.encoding || "base64");
  return { content: buff.toString("utf-8"), sha: data.sha };
}

/** List files via the Git tree (optionally recursive) */
export async function listTree(
  owner: string,
  repo: string,
  treeSha: string,
  recursive = true
): Promise<{ path: string; type: "blob" | "tree"; sha: string }[]> {
  const data = await ghFetch<any>(
    `/repos/${owner}/${repo}/git/trees/${treeSha}${recursive ? "?recursive=1" : ""}`
  );
  return (data.tree || [])
    .filter((e: any) => e.type === "blob" || e.type === "tree")
    .map((e: any) => ({ path: e.path, type: e.type, sha: e.sha }));
}

/** Get the commit SHA for the tip of a branch (default: main) */
export async function getBranchSha(
  owner: string,
  repo: string,
  branch = "main"
): Promise<string> {
  const data = await ghFetch<any>(`/repos/${owner}/${repo}/branches/${branch}`);
  return data.commit?.sha as string;
}

/** Best-effort: get README first, else package.json summary */
export async function summarizeRepoQuick(owner: string, repo: string): Promise<string> {
  try {
    const readme = await getReadme(owner, repo);
    return readme.content.slice(0, 8000); // keep it manageable
  } catch {
    try {
      const pkg = await getFileContent(owner, repo, "package.json");
      return pkg.content.slice(0, 8000);
    } catch {
      return "";
    }
  }
}
