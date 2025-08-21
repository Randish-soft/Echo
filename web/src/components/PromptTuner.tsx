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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Later hook this into your API
      const fakeOutput = `# Documentation for ${repo}\n\nThis is a generated placeholder.`;
      await new Promise((res) => setTimeout(res, 1000)); // simulate latency
      onGenerate(fakeOutput);
    } catch (err) {
      setError("Failed to generate documentation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-green-600">Tune Prompt</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
        >
          {loading ? "Generating..." : "Generate Docs"}
        </button>

        {error && <p className="text-red-600 mt-2">{error}</p>}
      </form>
    </div>
  );
}

export default PromptTuner;
