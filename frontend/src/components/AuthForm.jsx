import React from "react";
import { ToastContainer } from "react-toastify";

export default function AuthForm({
  onAuth,
  isRegistering,
  setIsRegistering,
  email,
  setEmail,
  password,
  setPassword,
}) {
  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <ToastContainer />
      <h2 className="text-2xl font-bold text-center">
        {isRegistering ? "Sign Up" : "Log In"}
      </h2>
      <input
        type="email"
        placeholder="Email"
        className="block w-full border p-2 my-2"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        className="block w-full border p-2 my-2"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="bg-blue-600 text-white px-4 py-2 rounded w-full" onClick={onAuth}>
        {isRegistering ? "Create Account" : "Login"}
      </button>
      <p className="text-center text-sm">
        {isRegistering ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          className="text-blue-600 underline"
          onClick={() => setIsRegistering(!isRegistering)}
        >
          {isRegistering ? "Log in" : "Sign up"}
        </button>
      </p>
    </div>
  );
}