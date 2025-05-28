import React from "react";
import UpgradeButton from "./UpgradeButton";

export default function MainLayout({ children, onSignOut, onUpgrade }) {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <UpgradeButton onUpgrade={onUpgrade} />
      <div className="flex justify-between items-center my-2">
        <h1 className="text-3xl font-bold">ResuMe AI</h1>
        <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={onSignOut}>Sign Out</button>
      </div>
      {children}
    </div>
  );
}