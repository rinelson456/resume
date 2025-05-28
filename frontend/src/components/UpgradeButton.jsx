import React from "react";

export default function UpgradeButton({ onUpgrade }) {
  return (
    <button
      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      onClick={onUpgrade}
    >
      Upgrade Subscription
    </button>
  );
}