import React from "react";
import ReactQuill from "react-quill";

export default function JobDescriptionInput({ jobDescription, setJobDescription }) {
  return (
    <div className="my-4">
      <label className="block font-medium mb-1">Paste Job Description</label>
      <ReactQuill
        value={jobDescription}
        onChange={setJobDescription}
        theme="snow"
      />
    </div>
  );
}