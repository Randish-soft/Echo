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
      {/* Page Title */}
      <h1 className="text-3xl font-bold text-gray-800">Repository Documentation</h1>
      <p className="text-gray-600">
        Pick a repository, fine-tune the prompt, and generate docs with AI.
      </p>

      {/* Repo Picker */}
      <div className="rounded-2xl border bg-white shadow-sm p-6">
        <RepoPicker onSelectRepo={(repo) => setSelectedRepo(repo)} />
      </div>

      {/* Prompt Tuner */}
      {selectedRepo && (
        <div className="rounded-2xl border bg-white shadow-sm p-6">
          <PromptTuner
            repo={selectedRepo}
            onGenerate={(output) => setGeneratedContent(output)}
          />
        </div>
      )}

      {/* Documentation Preview */}
      {generatedContent && (
        <div className="rounded-2xl border bg-white shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">
            Generated Documentation Preview
          </h2>
          <DocPreview content={generatedContent} />
        </div>
      )}

      {/* Diff Viewer */}
      {docContent && generatedContent && (
        <div className="rounded-2xl border bg-white shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-600">
            Compare Changes
          </h2>
          <DiffViewer oldContent={docContent} newContent={generatedContent} />
        </div>
      )}
    </div>
  );
}

export default RepoDocs;
