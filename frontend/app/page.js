'use client';

import { useEffect, useMemo, useState } from 'react';
import apiService from './services/apiService';

export default function Home() {
  // Wizard state
  const [step, setStep] = useState(1);

  // Form state
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [docType, setDocType] = useState('internal');
  const [audience, setAudience] = useState('developers');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('checking'); // 'checking' | 'connected' | 'error'

  useEffect(() => {
    checkBackendConnection();
    loadRepositories();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const health = await apiService.checkHealth();
      if (health.status === 'healthy') {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('error');
        setError('Backend is reachable but reported an unhealthy status.');
      }
    } catch (err) {
      setConnectionStatus('error');
      setError("Can't reach the backend. Make sure it's running on port 8000.");
      console.error(err);
    }
  };

  const loadRepositories = async () => {
    try {
      const data = await apiService.getRepositories();
      const list = data?.repositories ?? [];
      setRepositories(list);
      if (list.length > 0) {
        setStep(2);
      }
    } catch (err) {
      console.error('Failed to load repositories:', err);
      setError('Failed to load repositories.');
    }
  };

  const handleAddRepository = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await apiService.addRepository(repoUrl, branch);

      if (result.status === 'success') {
        setSuccess(result.message || 'Repository added successfully.');
        setRepoUrl('');
        setBranch('main');
        await loadRepositories();
        setStep(2);
        if (result.repo_id) setSelectedRepo(result.repo_id);
      } else {
        setError(result.error || 'Failed to add repository.');
      }
    } catch (err) {
      setError(err.message || 'Failed to add repository.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDocumentation = async () => {
    if (!selectedRepo) {
      setError('Please select a repository first.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await apiService.generateDocumentation(selectedRepo, docType, audience);

      if (result.status === 'success') {
        setSuccess(result.message || 'Documentation generated successfully!');
        // You could show a preview modal here using result.documentation
        console.log('Generated documentation:', result.documentation);
      } else {
        setError(result.error || 'Failed to generate documentation.');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate documentation.');
    } finally {
      setLoading(false);
    }
  };

  const steps = useMemo(
    () => [
      { id: 1, label: 'Add Repository' },
      { id: 2, label: 'Select Repository' },
      { id: 3, label: 'Generate Documentation' },
    ],
    []
  );

  const StatusBadge = ({ state }) => {
    if (state === 'checking') {
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-yellow-500/10 px-3 py-1 text-sm text-yellow-300 ring-1 ring-yellow-500/40">
          <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
          Checking backend…
        </span>
      );
    }
    if (state === 'connected') {
      return (
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300 ring-1 ring-emerald-500/40">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Backend connected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1 text-sm text-rose-300 ring-1 ring-rose-500/40">
        <span className="h-2 w-2 rounded-full bg-rose-400" />
        Connection failed
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Top Bar */}
      <div className="border-b border-white/10 bg-slate-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-fuchsia-600 font-black text-white">
              E
            </div>
            <div className="leading-tight">
              <div className="text-lg font-bold">Echo</div>
              <div className="text-xs text-slate-400">Documentation Generator</div>
            </div>
          </div>
          <StatusBadge state={connectionStatus} />
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Hero */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-lg">
          <p className="text-center text-lg text-slate-300">
            Transform your GitHub repository into comprehensive documentation in seconds.
          </p>
        </div>

        {/* Stepper */}
        <ol className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {steps.map(({ id, label }, idx) => {
            const isActive = id === step;
            const isDone = id < step;
            return (
              <li
                key={id}
                className={`group flex items-center gap-4 rounded-xl border p-4 transition ${
                  isActive
                    ? 'border-blue-500/60 bg-blue-500/10'
                    : isDone
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-white/10 bg-slate-900/40'
                }`}
              >
                <span
                  className={`grid h-9 w-9 flex-none place-items-center rounded-full text-sm font-bold ${
                    isActive
                      ? 'bg-gradient-to-br from-blue-500 to-fuchsia-600 text-white'
                      : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {isDone ? '✓' : id}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm">{label}</p>
                  <button
                    className={`mt-0.5 text-xs underline-offset-2 hover:underline ${
                      id <= step ? 'text-sky-300' : 'text-slate-500 cursor-not-allowed'
                    }`}
                    onClick={() => id <= step && setStep(id)}
                  >
                    {id < step ? 'Review' : id === step ? 'Current' : 'Pending'}
                  </button>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Alerts */}
        {error && (
          <div className="mb-6 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-200">
            <div className="flex items-start justify-between">
              <p className="pr-6">{error}</p>
              <button
                className="rounded-md px-2 py-1 text-rose-200/80 hover:bg-rose-400/10"
                onClick={() => setError('')}
              >
                ✕
              </button>
            </div>
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-200">
            <div className="flex items-start justify-between">
              <p className="pr-6">{success}</p>
              <button
                className="rounded-md px-2 py-1 text-emerald-200/80 hover:bg-emerald-400/10"
                onClick={() => setSuccess('')}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Panels */}
        <div className="grid gap-6">
          {/* Step 1 */}
          {step === 1 && (
            <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
              <header className="mb-6">
                <h2 className="text-xl font-semibold">1. Add Repository</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Enter the GitHub repository URL you want to document.
                </p>
              </header>

              <form onSubmit={handleAddRepository} className="grid gap-5">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">GitHub Repository URL</label>
                  <input
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/owner/repository"
                    className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-slate-100 outline-none ring-0 transition focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                    required
                    disabled={loading || connectionStatus !== 'connected'}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">Branch (optional)</label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="main"
                    className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-slate-100 outline-none ring-0 transition focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                    disabled={loading || connectionStatus !== 'connected'}
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  {repositories.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700"
                    >
                      Select existing →
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading || connectionStatus !== 'connected'}
                    className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:from-blue-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="h-4 w-4 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Processing…
                      </span>
                    ) : (
                      'Add Repository'
                    )}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
              <header className="mb-6">
                <h2 className="text-xl font-semibold">2. Select Repository</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Choose from your scanned repositories.
                </p>
              </header>

              <div className="grid gap-3">
                {repositories.length === 0 ? (
                  <div className="rounded-lg border border-white/10 bg-slate-950 p-6 text-center text-slate-400">
                    No repositories found.
                    <div className="mt-3">
                      <button
                        onClick={() => setStep(1)}
                        className="text-sky-300 underline underline-offset-4 hover:text-sky-200"
                      >
                        ← Add a repository
                      </button>
                    </div>
                  </div>
                ) : (
                  <ul className="grid max-h-80 gap-3 overflow-y-auto">
                    {repositories.map((repo) => (
                      <li key={repo}>
                        <button
                          type="button"
                          onClick={() => setSelectedRepo(repo)}
                          className={`w-full rounded-lg border p-4 text-left transition ${
                            selectedRepo === repo
                              ? 'border-sky-500/60 bg-sky-500/10'
                              : 'border-white/10 bg-slate-950 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{repo}</span>
                            {selectedRepo === repo && (
                              <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300 ring-1 ring-emerald-500/30">
                                Selected
                              </span>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!selectedRepo}
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:from-blue-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue →
                </button>
              </div>
            </section>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
              <header className="mb-6">
                <h2 className="text-xl font-semibold">3. Generate Documentation</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Customize your output and generate docs.
                </p>
              </header>

              <div className="grid gap-5">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Documentation Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20"
                  >
                    <option value="internal">Internal (engineering docs)</option>
                    <option value="external">External (user-facing guides)</option>
                  </select>
                  <p className="mt-2 text-xs text-slate-400">
                    {docType === 'internal'
                      ? 'Focused on code structure, APIs, architecture, and developer notes.'
                      : 'Focused on getting started, concepts, how-tos, and FAQs.'}
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">Target Audience</label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20"
                  >
                    <option value="developers">Developers</option>
                    <option value="technical">Technical Users</option>
                    <option value="business">Business Stakeholders</option>
                    <option value="general">General Users</option>
                  </select>
                </div>

                {selectedRepo && (
                  <div className="rounded-lg border border-white/10 bg-slate-950 p-4">
                    <p className="text-xs text-slate-400">Selected Repository</p>
                    <p className="truncate font-medium">{selectedRepo}</p>
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleGenerateDocumentation}
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:from-emerald-500 hover:to-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="h-4 w-4 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Generating…
                      </span>
                    ) : (
                      '🚀 Generate Documentation'
                    )}
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="mt-10 text-center text-xs text-slate-500">
          Echo • Built with ❤️ by Randish • Powered by C++ &amp; Next.js
        </div>
      </div>
    </div>
  );
}
