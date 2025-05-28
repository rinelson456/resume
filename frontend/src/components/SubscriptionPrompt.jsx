import React from "react";

export default function SubscriptionPrompt({ onCheckout }) {
  return (
    <div className="my-4 bg-yellow-50 p-4 rounded">
      <p>To unlock your optimized resume, please subscribe to ResuMe AI.</p>
      <button className="bg-green-600 text-white px-4 py-2 rounded mt-2" onClick={onCheckout}>
        Subscribe with Stripe
      </button>
    </div>
  );
}