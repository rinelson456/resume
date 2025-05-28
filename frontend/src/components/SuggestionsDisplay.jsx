import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

export default function SuggestionsDisplay({ suggestions }) {
  if (!suggestions) return null;
  return (
    <div className="my-4 bg-gray-100 p-4 rounded">
      <h2 className="text-xl font-semibold mb-2">Suggestions</h2>
      <div className="prose">
        <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{suggestions}</ReactMarkdown>
      </div>
    </div>
  );
}