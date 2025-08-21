// web/src/components/DocPreview.tsx
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";

interface DocPreviewProps {
  content: string;
}

const DocPreview: React.FC<DocPreviewProps> = ({ content }) => {
  return (
    <div className="rounded-2xl border bg-white shadow-sm p-6">
      <article className="prose prose-slate max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeHighlight]}
          components={{
            a: (props) => (
              <a {...props} target="_blank" rel="noopener noreferrer" />
            ),
            code: ({ inline, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || "");
              return !inline ? (
                <pre className="rounded-lg p-4 overflow-auto">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              ) : (
                <code className="px-1 py-0.5 rounded bg-slate-100" {...props}>
                  {children}
                </code>
              );
            },
            table: (props) => (
              <div className="overflow-x-auto">
                <table {...props} />
              </div>
            ),
          }}
        >
          {content || "_Nothing to preview yet._"}
        </ReactMarkdown>
      </article>
    </div>
  );
};

export default DocPreview;
