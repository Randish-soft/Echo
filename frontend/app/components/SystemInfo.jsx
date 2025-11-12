"use client";

import { useState, useEffect } from "react";
import api from "../services/apiService";

/**
 * SystemInfo Component
 * Displays detected system specifications and selected LLM model
 */
export default function SystemInfo() {
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchSystemInfo();
  }, []);

  async function fetchSystemInfo() {
    try {
      setLoading(true);
      const data = await api.getSystemInfo();
      setSystemInfo(data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load system information");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-stone-50 border border-stone-300 p-4" style={{borderRadius: '15px'}}>
        <p className="text-sm text-stone-600">Loading system information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-300 p-4" style={{borderRadius: '15px'}}>
        <p className="text-sm text-red-700">⚠️ {error}</p>
      </div>
    );
  }

  if (!systemInfo) return null;

  const { system, selected_model } = systemInfo;

  // Determine tier badge color
  const getTierColor = (tier) => {
    switch (tier) {
      case 'high': return 'bg-green-100 text-green-800 border-green-300';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'low': return 'bg-amber-100 text-amber-800 border-amber-300';
      default: return 'bg-stone-100 text-stone-800 border-stone-300';
    }
  };

  const getTierLabel = (tier) => {
    switch (tier) {
      case 'high': return '🚀 HIGH-PERFORMANCE';
      case 'medium': return '⚡ MID-RANGE';
      case 'low': return '🪶 LIGHTWEIGHT';
      default: return tier.toUpperCase();
    }
  };

  return (
    <div className="bg-gradient-to-br from-stone-50 to-stone-100 border border-stone-300 overflow-hidden" style={{borderRadius: '15px'}}>
      {/* Header - Always Visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left hover:bg-stone-100 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl">💻</div>
          <div>
            <h3 className="text-lg font-semibold text-stone-900">System Configuration</h3>
            <p className="text-xs text-stone-600 mt-0.5">
              {system.cpu_brand} • {system.cpu_cores} cores • {system.total_ram_gb}GB RAM
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 text-xs font-semibold border ${getTierColor(selected_model.tier)}`}
                style={{borderRadius: '10px'}}>
            {getTierLabel(selected_model.tier)}
          </span>
          <svg
            className={`w-5 h-5 text-stone-600 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-stone-300 p-4 space-y-4">
          {/* System Specs */}
          <div>
            <h4 className="text-sm font-semibold text-stone-900 mb-2 flex items-center gap-2">
              <span>🖥️</span> System Specifications
            </h4>
            <div className="bg-white border border-stone-200 p-3 space-y-2 text-xs" style={{borderRadius: '10px'}}>
              <div className="flex justify-between">
                <span className="text-stone-600">Platform:</span>
                <span className="font-medium text-stone-900">{system.platform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">CPU:</span>
                <span className="font-medium text-stone-900">{system.cpu_brand}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Cores:</span>
                <span className="font-medium text-stone-900">{system.cpu_cores}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Total RAM:</span>
                <span className="font-medium text-stone-900">{system.total_ram_gb} GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Available RAM:</span>
                <span className="font-medium text-stone-900">{system.available_ram_gb} GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">GPU:</span>
                <span className="font-medium text-stone-900">{system.gpu_type}</span>
              </div>
              {system.has_metal && (
                <div className="flex justify-between">
                  <span className="text-stone-600">Metal Acceleration:</span>
                  <span className="font-medium text-green-600">✓ Available</span>
                </div>
              )}
              {system.has_cuda && (
                <div className="flex justify-between">
                  <span className="text-stone-600">CUDA Acceleration:</span>
                  <span className="font-medium text-green-600">✓ Available</span>
                </div>
              )}
            </div>
          </div>

          {/* Selected Model */}
          <div>
            <h4 className="text-sm font-semibold text-stone-900 mb-2 flex items-center gap-2">
              <span>🤖</span> Selected AI Model
            </h4>
            <div className="bg-white border border-stone-200 p-3 space-y-2" style={{borderRadius: '10px'}}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-stone-900">{selected_model.display_name}</p>
                  <p className="text-xs text-stone-600 mt-0.5">{selected_model.name}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold border ${getTierColor(selected_model.tier)}`}
                      style={{borderRadius: '8px'}}>
                  {selected_model.tier.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-stone-600">{selected_model.description}</p>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200 text-xs">
                <div>
                  <span className="text-stone-600">Estimated Time:</span>
                  <p className="font-medium text-stone-900">~{selected_model.estimated_time_sec}s</p>
                </div>
                <div>
                  <span className="text-stone-600">Context Length:</span>
                  <p className="font-medium text-stone-900">{selected_model.context_length}</p>
                </div>
                <div>
                  <span className="text-stone-600">Max Tokens:</span>
                  <p className="font-medium text-stone-900">{selected_model.num_predict}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800" style={{borderRadius: '10px'}}>
            <p className="font-semibold mb-1">ℹ️ Automatic Model Selection</p>
            <p>
              The system automatically selected the optimal model based on your hardware.
              To manually override, set the <code className="bg-blue-100 px-1 py-0.5" style={{borderRadius: '4px'}}>OLLAMA_MODEL</code> environment variable.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
