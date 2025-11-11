"use client";

import { useState } from "react";
import RepoAdder from "./components/RepoAdder";
import RepoSelector from "./components/RepoSelector";
import DocGenerator from "./components/DocGenerator";

export default function HomePage() {
  const [step, setStep] = useState(1);
  const [selectedRepoId, setSelectedRepoId] = useState("");
  const [lastRepoList, setLastRepoList] = useState([]);
  const [defaultDocType, setDefaultDocType] = useState("internal_architecture");

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Echo</h1>
          <p className="text-sm text-gray-600">
            Transform your GitHub repository into comprehensive documentation in seconds.
          </p>
        </header>

        {/* Stepper */}
        <ol className="mb-6 flex gap-4 text-sm">
          <li className={`px-2 py-1 rounded ${step === 1 ? "bg-gray-900 text-white" : "bg-gray-100"}`}>1. Add Repository</li>
          <li className={`px-2 py-1 rounded ${step === 2 ? "bg-gray-900 text-white" : "bg-gray-100"}`}>2. Select Repository</li>
          <li className={`px-2 py-1 rounded ${step === 3 ? "bg-gray-900 text-white" : "bg-gray-100"}`}>3. Generate Documentation</li>
        </ol>

        {step === 1 && (
          <RepoAdder
            onAdded={(list) => {
              setLastRepoList(list || []);
              // prefer to keep selection if possible
              const first = (list && list.length) ? list[0] : "";
              if (first) setSelectedRepoId(first);
              setStep(2);
            }}
            onSkip={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <RepoSelector
            initialSelectedId={selectedRepoId}
            onBack={() => setStep(1)}
            onContinue={(rid) => {
              setSelectedRepoId(rid);
              setStep(3);
            }}
          />
        )}

        {step === 3 && (
          <DocGenerator
            repoId={selectedRepoId}
            defaultDocType={defaultDocType}
            onBack={() => setStep(2)}
            onDone={() => {}}
          />
        )}

        <footer className="mt-10 text-xs text-gray-500">
          Echo • Built with ❤️ by Randish
        </footer>
      </div>
    </main>
  );
}
