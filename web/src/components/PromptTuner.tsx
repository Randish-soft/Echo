import { useState } from "react";

interface PromptTunerProps {
  repo: string;
  onGenerate: (output: string) => void;
}

function PromptTuner({ repo, onGenerate }: PromptTunerProps) {
  const [prompt, setPrompt] = useState(
    `Generate clean documentation for the repository: ${repo}`
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callGenerate = async () => {
    const body = {
      mode: "markdown",
      repoUrl: repo,
      prompt
    };
    const res = await fetch("/api/docs/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return (data.markdown as string) || "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const md = await callGenerate();
      onGenerate(md);
    } catch (err: any) {
      setError(err?.message || "Failed to generate documentation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="toolbar mb-3">
        <h2 className="text-lg font-semibold">Tune Prompt</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          className="textarea min-h-[140px]"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Generating…" : "Generate Docs"}
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() =>
              setPrompt(
                "Generate comprehensive documentation including Overview, Installation, Quick Start, API, Configuration, Examples, Troubleshooting."
              )
            }
          >
            Use Template
          </button>
        </div>
        {error && <p className="text-rose-600 text-sm">{error}</p>}
      </form>
    </div>
  );
}

export default PromptTuner;
