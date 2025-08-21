// web/src/components/DiffViewer.tsx
import React, { useMemo, useState } from "react";
import { diffLines, Change } from "diff";

interface DiffViewerProps {
  oldContent: string;
  newContent: string;
  mode?: "unified" | "split";
  className?: string;
}

type Row =
  | { type: "context"; left?: string; right?: string }
  | { type: "added"; left?: string; right: string }
  | { type: "removed"; left: string; right?: string }
  | { type: "changed"; left: string; right: string };

function pairForSplit(parts: Change[]): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.added && !p.removed) {
      const rightLines = (p.value || "").split("\n");
      if (rightLines[rightLines.length - 1] === "") rightLines.pop();
      rightLines.forEach((line) => rows.push({ type: "added", right: line }));
      continue;
    }
    if (p.removed && !p.added) {
      const leftLines = (p.value || "").split("\n");
      if (leftLines[leftLines.length - 1] === "") leftLines.pop();
      // If next is an added block, pair line-by-line to mark as changed
      if (i + 1 < parts.length && parts[i + 1].added && !parts[i + 1].removed) {
        const rightLines = (parts[i + 1].value || "").split("\n");
        if (rightLines[rightLines.length - 1] === "") rightLines.pop();
        const max = Math.max(leftLines.length, rightLines.length);
        for (let j = 0; j < max; j++) {
          const L = leftLines[j];
          const R = rightLines[j];
          if (L !== undefined && R !== undefined) {
            rows.push({ type: "changed", left: L, right: R });
          } else if (L !== undefined) {
            rows.push({ type: "removed", left: L });
          } else if (R !== undefined) {
            rows.push({ type: "added", right: R });
          }
        }
        i++; // consume the paired added block
      } else {
        leftLines.forEach((line) => rows.push({ type: "removed", left: line }));
      }
      continue;
    }
    // context (unchanged)
    const ctxLines = (p.value || "").split("\n");
    if (ctxLines[ctxLines.length - 1] === "") ctxLines.pop();
    ctxLines.forEach((line) => rows.push({ type: "context", left: line, right: line }));
  }
  return rows;
}

const DiffViewer: React.FC<DiffViewerProps> = ({
  oldContent,
  newContent,
  mode = "unified",
  className = "",
}) => {
  const [viewMode, setViewMode] = useState<"unified" | "split">(mode);

  const parts = useMemo(() => diffLines(oldContent ?? "", newContent ?? ""), [oldContent, newContent]);

  const stats = useMemo(() => {
    let added = 0,
      removed = 0;
    parts.forEach((p) => {
      if (p.added) added += (p.count ?? (p.value.match(/\n/g)?.length ?? 0));
      if (p.removed) removed += (p.count ?? (p.value.match(/\n/g)?.length ?? 0));
    });
    return { added, removed };
  }, [parts]);

  const splitRows = useMemo(() => pairForSplit(parts), [parts]);

  return (
    <div className={`w-full ${className}`}>
      {/* Toolbar */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span className="mr-3">Diff</span>
          <span className="px-2 py-1 rounded bg-green-100 text-green-700 mr-2">+{stats.added}</span>
          <span className="px-2 py-1 rounded bg-rose-100 text-rose-700">-{stats.removed}</span>
        </div>
        <div className="space-x-2">
          <button
            onClick={() => setViewMode("unified")}
            className={`px-3 py-1.5 rounded border text-sm ${
              viewMode === "unified" ? "bg-gray-900 text-white" : "bg-white"
            }`}
          >
            Unified
          </button>
          <button
            onClick={() => setViewMode("split")}
            className={`px-3 py-1.5 rounded border text-sm ${
              viewMode === "split" ? "bg-gray-900 text-white" : "bg-white"
            }`}
          >
            Split
          </button>
        </div>
      </div>

      {viewMode === "unified" ? (
        // Unified view
        <div className="rounded-2xl overflow-hidden border">
          <pre className="text-sm leading-6 overflow-auto p-0 m-0">
            {parts.map((part, idx) => {
              const lines = part.value.split("\n");
              // remove trailing blank line caused by terminal newline
              if (lines[lines.length - 1] === "") lines.pop();
              return lines.map((line, i) => {
                const key = `${idx}:${i}`;
                let bg = "bg-white";
                let sign = " ";
                let text = "text-gray-800";
                if (part.added) {
                  bg = "bg-green-50";
                  sign = "+";
                  text = "text-green-800";
                } else if (part.removed) {
                  bg = "bg-rose-50";
                  sign = "-";
                  text = "text-rose-800";
                }
                return (
                  <div
                    key={key}
                    className={`whitespace-pre-wrap px-4 py-1 ${bg} border-b last:border-b-0 border-gray-100`}
                  >
                    <span className="inline-block w-4 mr-2 opacity-70">{sign}</span>
                    <span className={`${text}`}>{line}</span>
                  </div>
                );
              });
            })}
          </pre>
        </div>
      ) : (
        // Split view
        <div className="rounded-2xl overflow-hidden border">
          <div className="grid grid-cols-2 text-sm">
            <div className="px-3 py-2 font-semibold bg-gray-50 border-b">Original</div>
            <div className="px-3 py-2 font-semibold bg-gray-50 border-b">New</div>
          </div>
          <div className="grid grid-cols-2">
            {splitRows.map((row, i) => {
              const base = "whitespace-pre-wrap px-3 py-1 border-b border-gray-100";
              const leftClass =
                row.type === "removed"
                  ? "bg-rose-50 text-rose-800"
                  : row.type === "changed"
                  ? "bg-amber-50 text-amber-900"
                  : "bg-white";
              const rightClass =
                row.type === "added"
                  ? "bg-green-50 text-green-800"
                  : row.type === "changed"
                  ? "bg-amber-50 text-amber-900"
                  : "bg-white";
              return (
                <React.Fragment key={i}>
                  <div className={`${base} ${leftClass}`}>{row.left ?? ""}</div>
                  <div className={`${base} ${rightClass}`}>{row.right ?? ""}</div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiffViewer;
