import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

export default function ModifiedResumeDisplay({ modifiedResume }) {
  if (!modifiedResume) return null;
  return (
    <div className="my-4 bg-gray-100 p-4 rounded">
      <h2 className="text-xl font-semibold mb-2">Modified Resume</h2>
      <div id="modified-resume" className="prose">
        <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{modifiedResume}</ReactMarkdown>
      </div>
    </div>
  );
}