// frontend/app/services/apiService.js

/**
 * Echo API Service
 * - Aligns with backend routes:
 *   GET  /api/health
 *   GET  /api/repos
 *   POST /api/repos/add           { github_url, branch? }
 *   POST /api/docs/generate       { repo_id, doc_type, audience? }
 *
 * Base URL resolution priority:
 *   1) window.__ECHO_API__ (runtime-injected on client)
 *   2) process.env.NEXT_PUBLIC_API_BASE
 *   3) http://localhost:8000
 */

const isBrowser = typeof window !== "undefined";

const BASE =
  (isBrowser && window.__ECHO_API__) ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://localhost:8000";

const DEFAULT_TIMEOUT = 15000;

/**
 * Internal: fetch wrapper with timeout + better error messages.
 * Returns parsed JSON if possible; otherwise returns text.
 */
async function request(path, { method = "GET", body, headers = {}, timeout = DEFAULT_TIMEOUT } = {}) {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeout);

  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    signal: controller.signal,
  };
  if (body !== undefined && body !== null) {
    opts.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, opts);
    clearTimeout(t);

    // Try to parse JSON; if that fails, fall back to text
    const contentType = res.headers.get("content-type") || "";
    const tryParse = async () => {
      if (contentType.includes("application/json")) return await res.json();
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    };

    const data = await tryParse();

    if (!res.ok) {
      const message =
        (data && data.message) ||
        (typeof data === "string" ? data : "Request failed");
      const err = new Error(`${res.status} ${res.statusText}: ${message}`);
      err.status = res.status;
      err.details = data;
      throw err;
    }

    return data;
  } catch (err) {
    clearTimeout(t);
    // Normalize AbortError message
    if (err.name === "AbortError") {
      const abortErr = new Error(`Request timed out after ${Math.round(timeout / 1000)}s: ${path}`);
      abortErr.code = "ETIMEOUT";
      throw abortErr;
    }
    throw err;
  }
}

/**
 * Health check
 * @returns {Promise<{status:string}>}
 */
async function getHealth() {
  return await request("/api/health");
}

/**
 * List repositories
 * @returns {Promise<{status:string, repositories:Array, count:number}>}
 */
async function listRepositories() {
  return await request("/api/repos");
}

/**
 * Add a repository by GitHub URL
 * @param {string} github_url - Full GitHub repo URL (e.g., https://github.com/user/repo)
 * @param {string} [branch='main']
 * @returns {Promise<{status:string, repository?:object}>}
 */
async function addRepository(github_url, branch = "main") {
  if (!github_url || typeof github_url !== "string") {
    throw new Error("github_url must be a non-empty string");
  }
  const payload = { github_url, branch };
  return await request("/api/repos/add", { method: "POST", body: payload });
}

/**
 * Generate documentation for a repository
 * @param {string} repo_id
 * @param {"internal"|"public"|"api"} [doc_type='internal']
 * @param {"developers"|"users"|"managers"} [audience='developers']
 * @returns {Promise<{status:string, documentation?:string, location?:string}>}
 */
async function generateDocumentation(repo_id, doc_type = "internal", audience = "developers") {
  if (!repo_id || typeof repo_id !== "string") {
    throw new Error("repo_id must be a non-empty string");
  }
  const payload = { repo_id, doc_type, audience };
  return await request("/api/docs/generate", { method: "POST", body: payload, timeout: 60000 });
}

/**
 * Optional: fetch a single repo (if your backend supports it later)
 * Left here as a convenience pattern.
 */
// async function getRepository(repo_id) {
//   if (!repo_id) throw new Error("repo_id is required");
//   return await request(`/api/repos/${encodeURIComponent(repo_id)}`);
// }

export {
  BASE,
  getHealth,
  listRepositories,
  addRepository,
  generateDocumentation,
};

export default {
  BASE,
  getHealth,
  listRepositories,
  addRepository,
  generateDocumentation,
};
