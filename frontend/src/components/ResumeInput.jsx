import React from "react";
import ReactQuill from "react-quill";

export default function ResumeInput({ resume, setResume, extractTextFromPDF, inputMode }) {
  return (
    <div className="my-4">
      <label className="block font-medium mb-1">Resume Input</label>
      {inputMode === "paste" ? (
        <ReactQuill value={resume} onChange={setResume} theme="snow" />
      ) : (
        <input
          type="file"
          accept="application/pdf"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              const text = await extractTextFromPDF(file);
              setResume(text);
            }
          }}
        />
      )}
    </div>
  );
}