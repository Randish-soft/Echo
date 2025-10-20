"use client";

import { useState, useEffect } from "react";
import RepoAdder from "../components/RepoAdder";
import RepoSelector from "../components/RepoSelector";
import DocGenerator from "../components/DocGenerator";
import apiService from "./services/apiService";

export default function Home() {
  const [repositories, setRepositories] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRepo, setSelectedRepo] = useState("");

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
    try {
      const data = await apiService.listRepositories();
      setRepositories(data.repositories || []);
    } catch (error) {
      console.error("Failed to load repositories:", error);
    }
  };

  const handleRepoAdded = (newRepos) => {
    loadRepositories(); // Reload the list
    setCurrentStep(2); // Move to next step
  };

  const handleRepoSelected = (repoId) => {
    console.log("Repository selected:", repoId);
    setSelectedRepo(repoId);
    setCurrentStep(3);
  };

  const handleDocumentGenerated = (result) => {
    console.log("Document generated:", result);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Echo Documentation Generator</h1>
          <p className="text-xl text-slate-400">
            Transform your GitHub repository into comprehensive documentation
          </p>
        </header>

        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 text-lg font-semibold ${
                    currentStep >= step
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-slate-600 text-slate-400"
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-20 h-1 ${
                      currentStep > step ? "bg-blue-600" : "bg-slate-600"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Labels */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-24">
            <div className={`text-center ${currentStep === 1 ? "text-blue-400" : "text-slate-500"}`}>
              <div className="text-sm font-medium">Add Repository</div>
            </div>
            <div className={`text-center ${currentStep === 2 ? "text-blue-400" : "text-slate-500"}`}>
              <div className="text-sm font-medium">Select Repository</div>
            </div>
            <div className={`text-center ${currentStep === 3 ? "text-blue-400" : "text-slate-500"}`}>
              <div className="text-sm font-medium">Generate Docs</div>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-6xl mx-auto">
          {currentStep === 1 && (
            <RepoAdder
              onAdded={handleRepoAdded}
              onSkip={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <RepoSelector
              repositories={repositories}
              onRepoSelected={handleRepoSelected}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <DocGenerator
              repositories={repositories}
              selectedRepo={selectedRepo}
              onDocumentGenerated={handleDocumentGenerated}
              onBack={() => setCurrentStep(2)}
            />
          )}
        </div>
      </div>
    </div>
  );
}