import RepoPicker from "../components/RepoPicker";
import DocPreview from "../components/DocPreview";
import PromptTuner from "../components/PromptTuner";
import DiffViewer from "../components/DiffViewer";
import { useState } from "react";

function RepoDocs() {
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [docContent, setDocContent] = useState<string>("");
  const [generatedContent, setGeneratedContent] = useState<string>("");

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Repository Documentation</h1>
        <p className="text-slate-600">
          Pick a repo, tune the prompt, and generate docs.
        </p>
      </div>

      <div className="card">
        <RepoPicker onSelectRepo={(repo) => setSelectedRepo(repo)} />
      </div>

      {selectedRepo && (
        <div className="card">
          <PromptTuner repo={selectedRepo} onGenerate={(output) => setGeneratedContent(output)} />
        </div>
      )}

      {generatedContent && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Generated Documentation</h2>
          <DocPreview content={generatedContent} />
        </div>
      )}

      {docContent && generatedContent && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Compare Changes</h2>
          <DiffViewer oldContent={docContent} newContent={generatedContent} />
        </div>
      )}
    </div>
  );
}
export default RepoDocs;
