'use client'

import { useState } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import { FileText, GitBranch, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function Home() {
  const [githubUrl, setGithubUrl] = useState('')
  const [branch, setBranch] = useState('main')
  const [loading, setLoading] = useState(false)
  const [repoId, setRepoId] = useState(null)
  const [documentation, setDocumentation] = useState(null)
  const [docType, setDocType] = useState('internal')
  const [error, setError] = useState(null)
  const [step, setStep] = useState(1) // 1: Add Repo, 2: Generate Docs, 3: View Docs

  const handleAddRepository = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await axios.post(`${API_URL}/api/repos/add`, {
        github_url: githubUrl,
        branch: branch
      })

      setRepoId(response.data.repo_id)
      setStep(2)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add repository')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateDocs = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.post(`${API_URL}/api/docs/generate`, {
        repo_id: repoId,
        doc_type: docType,
        audience: 'developers'
      })

      setDocumentation(response.data.documentation)
      setStep(3)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate documentation')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setGithubUrl('')
    setBranch('main')
    setRepoId(null)
    setDocumentation(null)
    setError(null)
    setStep(1)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Echo
        </h1>
        <p className="text-xl text-gray-600">
          Automatically generate documentation for any GitHub repository
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Step 1: Add Repository */}
      {step === 1 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <div className="bg-indigo-100 rounded-full p-3 mr-4">
              <GitBranch className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Step 1: Add Repository</h2>
              <p className="text-gray-600">Enter the GitHub repository URL you want to document</p>
            </div>
          </div>

          <form onSubmit={handleAddRepository} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GitHub Repository URL
              </label>
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username/repository"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch (optional)
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Cloning & Analyzing Repository...
                </>
              ) : (
                'Add Repository'
              )}
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Generate Documentation */}
      {step === 2 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <div className="bg-green-100 rounded-full p-3 mr-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Repository Added Successfully!</h2>
              <p className="text-gray-600">Repo ID: <code className="bg-gray-100 px-2 py-1 rounded">{repoId}</code></p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Documentation Type
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="internal">Internal (Developer Documentation)</option>
                <option value="external">External (User Documentation)</option>
              </select>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleGenerateDocs}
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5 mr-2" />
                    Generate Documentation
                  </>
                )}
              </button>

              <button
                onClick={resetForm}
                className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: View Documentation */}
      {step === 3 && documentation && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="bg-indigo-100 rounded-full p-3 mr-4">
                <FileText className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Documentation Generated</h2>
                <p className="text-gray-600">Type: {docType === 'internal' ? 'Internal (Developer)' : 'External (User)'}</p>
              </div>
            </div>
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Generate New
            </button>
          </div>

          <div className="prose max-w-none bg-gray-50 rounded-lg p-6 border border-gray-200">
            <ReactMarkdown>{documentation}</ReactMarkdown>
          </div>

          <div className="mt-6 flex space-x-4">
            <button
              onClick={() => {
                const blob = new Blob([documentation], { type: 'text/markdown' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `documentation-${docType}-${repoId}.md`
                a.click()
              }}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Download as Markdown
            </button>
          </div>
        </div>
      )}

      {/* Features Section */}
      {step === 1 && (
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <GitBranch className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">GitHub Integration</h3>
            <p className="text-gray-600">Automatically clone and analyze any public or private GitHub repository</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Analysis</h3>
            <p className="text-gray-600">Detect file purposes, functions, classes, and dependencies automatically</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Instant Docs</h3>
            <p className="text-gray-600">Generate comprehensive documentation in seconds, not hours</p>
          </div>
        </div>
      )}
    </div>
  )
}