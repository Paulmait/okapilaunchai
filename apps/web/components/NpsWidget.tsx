"use client";

import { useState, useEffect } from "react";

export default function NpsWidget() {
  const [isVisible, setIsVisible] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has seen NPS prompt recently
    const lastNpsPrompt = localStorage.getItem("nps_last_prompt");
    const lastDismiss = localStorage.getItem("nps_dismissed");

    // Show NPS after user has been active for 3 sessions or 1 day
    const sessionCount = parseInt(localStorage.getItem("session_count") || "0") + 1;
    localStorage.setItem("session_count", sessionCount.toString());

    const shouldShow =
      sessionCount >= 3 &&
      (!lastNpsPrompt || Date.now() - parseInt(lastNpsPrompt) > 7 * 24 * 60 * 60 * 1000) &&
      (!lastDismiss || Date.now() - parseInt(lastDismiss) > 30 * 24 * 60 * 60 * 1000);

    if (shouldShow) {
      // Delay showing the widget
      const timer = setTimeout(() => {
        setIsVisible(true);
        localStorage.setItem("nps_last_prompt", Date.now().toString());
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, []);

  async function handleSubmit() {
    if (score === null) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/nps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score,
          reason: reason.trim() || undefined
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }

      setSubmitted(true);

      // Auto-close after thank you
      setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem("nps_dismissed", Date.now().toString());
    setIsVisible(false);
  }

  if (!isVisible || dismissed) return null;

  return (
    <div className="fixed bottom-24 right-6 bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6 max-w-sm z-40">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-white p-1"
        aria-label="Dismiss"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {submitted ? (
        <div className="text-center py-4">
          <div className="text-green-400 text-4xl mb-2">✓</div>
          <h3 className="text-lg font-bold text-white">Thank you!</h3>
          <p className="text-gray-400 text-sm mt-1">Your feedback helps us improve.</p>
        </div>
      ) : (
        <>
          <h3 className="text-lg font-bold text-white mb-2">
            How likely are you to recommend us?
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            On a scale of 0-10, how likely are you to recommend OkapiLaunch to a friend or colleague?
          </p>

          {/* Score Selection */}
          <div className="flex gap-1 mb-4">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                onClick={() => setScore(n)}
                className={`w-8 h-8 text-sm font-medium rounded transition-colors ${
                  score === n
                    ? n <= 6
                      ? "bg-red-500 text-white"
                      : n <= 8
                        ? "bg-yellow-500 text-black"
                        : "bg-green-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="flex justify-between text-xs text-gray-500 mb-4">
            <span>Not likely</span>
            <span>Very likely</span>
          </div>

          {/* Reason Input (shown after score selection) */}
          {score !== null && (
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Tell us why (optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="What's the main reason for your score?"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none resize-none text-sm"
                rows={2}
                maxLength={1000}
              />
            </div>
          )}

          {error && (
            <div className="mb-4 p-2 bg-red-500/20 border border-red-500 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={score === null || isSubmitting}
            className="w-full py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded text-sm transition-colors"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </>
      )}
    </div>
  );
}
