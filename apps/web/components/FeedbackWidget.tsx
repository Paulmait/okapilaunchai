"use client";

import { useState } from "react";

type FeedbackType = "bug" | "feature_request" | "complaint" | "praise" | "general";

const feedbackLabels: Record<FeedbackType, string> = {
  bug: "Report a Bug",
  feature_request: "Request a Feature",
  complaint: "Share a Complaint",
  praise: "Share Praise",
  general: "General Feedback"
};

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("general");
  const [rating, setRating] = useState<number>(0);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (message.trim().length < 10) {
      setError("Please provide at least 10 characters of feedback");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackType,
          rating: rating > 0 ? rating : undefined,
          message: message.trim(),
          pagePath: typeof window !== "undefined" ? window.location.pathname : undefined
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit feedback");
      }

      setSubmitted(true);
      setMessage("");
      setRating(0);
      setFeedbackType("general");

      // Auto-close after success
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full p-4 shadow-lg z-40 transition-transform hover:scale-110"
        aria-label="Send feedback"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
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
              <div className="text-center py-8">
                <div className="text-green-400 text-5xl mb-4">✓</div>
                <h3 className="text-xl font-bold text-white">Thank you!</h3>
                <p className="text-gray-400 mt-2">Your feedback helps us improve.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3 className="text-xl font-bold text-white mb-4">Send Feedback</h3>

                {/* Feedback Type */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">
                    What type of feedback?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(feedbackLabels) as FeedbackType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFeedbackType(type)}
                        className={`px-3 py-2 text-sm rounded border transition-colors ${
                          feedbackType === type
                            ? "bg-orange-500 border-orange-500 text-white"
                            : "bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500"
                        }`}
                      >
                        {feedbackLabels[type]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">
                    How would you rate your experience? (optional)
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-2xl transition-colors ${
                          star <= rating ? "text-yellow-400" : "text-gray-600 hover:text-gray-400"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                    {rating > 0 && (
                      <button
                        type="button"
                        onClick={() => setRating(0)}
                        className="text-sm text-gray-500 hover:text-gray-400 ml-2"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">
                    Your feedback <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you think... (minimum 10 characters)"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none resize-none"
                    rows={4}
                    maxLength={2000}
                    required
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {message.length}/2000 characters
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || message.trim().length < 10}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded transition-colors"
                >
                  {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
