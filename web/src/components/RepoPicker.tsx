import { useState } from "react";

interface RepoPickerProps { onSelectRepo: (repo: string) => void; }

function RepoPicker({ onSelectRepo }: RepoPickerProps) {
  const [repoUrl, setRepoUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoUrl.trim()) onSelectRepo(repoUrl.trim());
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Select Repository</h2>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="https://github.com/user/repo"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          className="input"
        />
        <button type="submit" className="btn-primary">Load Repo</button>
      </form>
    </div>
  );
}
export default RepoPicker;
