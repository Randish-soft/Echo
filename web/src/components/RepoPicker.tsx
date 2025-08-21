import { useState } from "react";

interface RepoPickerProps {
  onSelectRepo: (repo: string) => void;
}

function RepoPicker({ onSelectRepo }: RepoPickerProps) {
  const [repoUrl, setRepoUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoUrl.trim()) {
      onSelectRepo(repoUrl.trim());
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-blue-600">Select Repository</h2>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="https://github.com/user/repo"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Load Repo
        </button>
      </form>
    </div>
  );
}

export default RepoPicker;
