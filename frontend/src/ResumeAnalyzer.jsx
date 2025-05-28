import React, { useState, useEffect } from "react";
import { app } from "./firebaseConfig";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { loadStripe } from "@stripe/stripe-js";
import { ToastContainer, toast } from "react-toastify";
import AuthForm from "./components/AuthForm";
import ResumeInput from "./components/ResumeInput";
import JobDescriptionInput from "./components/JobDescriptionInput";
import SuggestionsDisplay from "./components/SuggestionsDisplay";
import ModifiedResumeDisplay from "./components/ModifiedResumeDisplay";
import SubscriptionPrompt from "./components/SubscriptionPrompt";
import MainLayout from "./components/MainLayout";
import "react-quill/dist/quill.snow.css";
import "react-toastify/dist/ReactToastify.css";
import * as pdfjsLib from "pdfjs-dist";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const auth = getAuth(app);

const extractTextFromPDF = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join("") + "\n";
  }

  return text;
};

export default function ResumeAnalyzer() {
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [modifiedResume, setModifiedResume] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [inputMode] = useState("paste");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setUserId(currentUser ? currentUser.uid : null);
    });
    return () => unsubscribe();
  }, []);

  const handleAnalyze = async () => {
    setLoading(true);
    setSuggestions("");
    setModifiedResume("");
    setError("");
    try {
      const user = auth.currentUser;
      const firebaseToken = await user.getIdToken();

      const response = await fetch(import.meta.env.VITE_BACKEND_URL + "/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${firebaseToken}`,
        },
        body: JSON.stringify({ resume, jobDescription, userId: user.uid }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Something went wrong.");
        return;
      }

      setSuggestions(data.suggestions);
      setModifiedResume(data.modifiedResume);
    } catch (error) {
      toast.error("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();

      const res = await fetch(import.meta.env.VITE_BACKEND_URL + "/api/create-customer-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.uid }),
      });

      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to open billing portal");
      }
    } catch (error) {
      toast.error("Something went wrong while opening the billing portal");
    }
  };

  const handleCheckout = async () => {
    try {
      if (!user) {
        toast.error("User not logged in");
        return;
      }
      localStorage.setItem("resume", resume);
      localStorage.setItem("jobDescription", jobDescription);

      const token = await user.getIdToken();

      const response = await fetch(
        import.meta.env.VITE_BACKEND_URL + "/api/subscribe",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: user.uid,
            resume,
            jobDescription,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "API error");
        return;
      }

      const sessionId = data.sessionId;

      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        toast.error("Stripe redirect error: " + error.message);
      }
    } catch (error) {
      toast.error("Checkout failed");
    }
  };

  const handleAuth = async () => {
    try {
      let userCredential;
      if (isRegistering) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await fetch(import.meta.env.VITE_BACKEND_URL + "/api/createUser", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
          }),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      let message = "An error occurred. Please try again.";
      if (error.code === "auth/invalid-credential") {
        message = "Invalid credentials. Please check your email and password.";
      } else if (error.code === "auth/email-already-in-use") {
        message = "This email is already registered.";
      } else if (error.code === "auth/weak-password") {
        message = "Password should be at least 6 characters.";
      } else if (error.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (error.code === "auth/user-not-found") {
        message = "No account found with this email.";
      } else if (error.code === "auth/wrong-password") {
        message = "Incorrect password.";
      }
      toast.error(message);
    }
  };

  const handleSignOut = () => signOut(auth);

  if (!userId) {
    return (
      <AuthForm
        onAuth={handleAuth}
        isRegistering={isRegistering}
        setIsRegistering={setIsRegistering}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
      />
    );
  }

  return (
    <MainLayout onSignOut={handleSignOut} onUpgrade={handleUpgrade}>
      <ToastContainer />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ResumeInput
          resume={resume}
          setResume={setResume}
          extractTextFromPDF={extractTextFromPDF}
          inputMode={inputMode}
        />
        <JobDescriptionInput
          jobDescription={jobDescription}
          setJobDescription={setJobDescription}
        />
      </div>
      <div className="text-center my-4">
        <button
          className="bg-blue-700 text-white px-6 py-2 rounded"
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Analyze Resume"}
        </button>
      </div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <SuggestionsDisplay suggestions={suggestions} />
      {modifiedResume ? (
        <ModifiedResumeDisplay modifiedResume={modifiedResume} />
      ) : (
        suggestions && <SubscriptionPrompt onCheckout={handleCheckout} />
      )}
    </MainLayout>
  );
}