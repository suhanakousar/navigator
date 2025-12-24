import React from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export function MarkdownMessage({ content, className }: MarkdownMessageProps) {
  return (
    <div className={cn("prose prose-invert prose-sm max-w-none text-gray-100", className)}>
      <ReactMarkdown
        components={{
          // Code blocks with syntax highlighting
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";
            const codeString = String(children).replace(/\n$/, "");

            return !inline && match ? (
              <div className="relative my-4 overflow-hidden rounded-lg border border-gray-700/50 bg-gray-900/50">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-800/70 border-b border-gray-700/50">
                  <span className="text-xs text-gray-400 font-mono uppercase">{language}</span>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(codeString);
                      } catch (err) {
                        console.error("Failed to copy:", err);
                      }
                    }}
                    className="text-xs text-gray-400 hover:text-gray-200 transition-colors px-2 py-1 rounded hover:bg-gray-700/50"
                  >
                    Copy
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <SyntaxHighlighter
                    style={oneDark}
                    language={language}
                    PreTag="div"
                    className="!m-0 !bg-transparent"
                    customStyle={{
                      margin: 0,
                      padding: "1rem",
                      background: "transparent",
                    }}
                    {...props}
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              </div>
            ) : (
              <code
                className="px-1.5 py-0.5 bg-gray-800/50 rounded text-sm font-mono text-purple-300"
                {...props}
              >
                {children}
              </code>
            );
          },
          // Paragraphs
          p({ children }) {
            return <p className="mb-4 last:mb-0 leading-7 text-gray-100">{children}</p>;
          },
          // Headings
          h1({ children }) {
            return <h1 className="text-2xl font-bold mb-3 mt-6 first:mt-0">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-xl font-bold mb-2 mt-5 first:mt-0">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-lg font-semibold mb-2 mt-4 first:mt-0">{children}</h3>;
          },
          // Lists
          ul({ children }) {
            return <ul className="list-disc mb-4 space-y-2 ml-6">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal mb-4 space-y-2 ml-6">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-7 text-gray-100">{children}</li>;
          },
          // Blockquotes
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-purple-500/50 pl-4 my-4 italic text-gray-300">
                {children}
              </blockquote>
            );
          },
          // Links
          a({ children, href }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline transition-colors"
              >
                {children}
              </a>
            );
          },
          // Strong/Bold
          strong({ children }) {
            return <strong className="font-semibold text-white">{children}</strong>;
          },
          // Emphasis/Italic
          em({ children }) {
            return <em className="italic">{children}</em>;
          },
          // Horizontal rule
          hr() {
            return <hr className="my-6 border-gray-700" />;
          },
          // Tables
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse border border-gray-700 rounded-lg">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-gray-800/50">{children}</thead>;
          },
          tbody({ children }) {
            return <tbody>{children}</tbody>;
          },
          tr({ children }) {
            return <tr className="border-b border-gray-700">{children}</tr>;
          },
          th({ children }) {
            return (
              <th className="px-4 py-2 text-left font-semibold border-r border-gray-700 last:border-r-0">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-4 py-2 border-r border-gray-700 last:border-r-0">{children}</td>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

