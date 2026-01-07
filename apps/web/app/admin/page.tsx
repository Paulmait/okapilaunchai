"use client";

import { useState, useEffect } from "react";

type AnalyticsSummary = {
  totalUsers: number;
  totalProjects: number;
  totalExports: number;
  conversionRate: number;
  dailyActiveUsers: number;
};

type NpsData = {
  npsScore: number;
  total: number;
  breakdown: {
    promoters: number;
    passives: number;
    detractors: number;
    promoterPercent: number;
    passivePercent: number;
    detractorPercent: number;
  };
};

type FeedbackItem = {
  id: string;
  feedback_type: string;
  rating?: number;
  message: string;
  status: string;
  created_at: string;
};

type ViolationsData = {
  totalViolations: number;
  uniqueIps: number;
  blocked: number;
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [nps, setNps] = useState<NpsData | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [violations, setViolations] = useState<ViolationsData | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "feedback" | "security">("overview");

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    setLoading(true);
    setError(null);

    try {
      const [analyticsRes, npsRes, feedbackRes, violationsRes] = await Promise.all([
        fetch("/api/analytics?type=summary&days=30"),
        fetch("/api/nps?days=30"),
        fetch("/api/feedback?limit=50"),
        fetch("/api/analytics?type=violations")
      ]);

      if (!analyticsRes.ok || !npsRes.ok || !feedbackRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const [analyticsData, npsData, feedbackData, violationsData] = await Promise.all([
        analyticsRes.json(),
        npsRes.json(),
        feedbackRes.json(),
        violationsRes.json()
      ]);

      setAnalytics(analyticsData);
      setNps(npsData);
      setFeedback(feedbackData.feedback || []);
      setViolations(violationsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchAllData}
            className="px-4 py-2 bg-orange-500 rounded hover:bg-orange-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button
            onClick={fetchAllData}
            className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 text-sm"
          >
            Refresh
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-gray-700 pb-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded ${activeTab === "overview" ? "bg-orange-500" : "bg-gray-700 hover:bg-gray-600"}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("feedback")}
            className={`px-4 py-2 rounded ${activeTab === "feedback" ? "bg-orange-500" : "bg-gray-700 hover:bg-gray-600"}`}
          >
            Feedback
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-2 rounded ${activeTab === "security" ? "bg-orange-500" : "bg-gray-700 hover:bg-gray-600"}`}
          >
            Security
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <MetricCard
                title="Total Users"
                value={analytics?.totalUsers || 0}
                color="blue"
              />
              <MetricCard
                title="Total Projects"
                value={analytics?.totalProjects || 0}
                color="green"
              />
              <MetricCard
                title="Total Exports"
                value={analytics?.totalExports || 0}
                color="purple"
              />
              <MetricCard
                title="Conversion Rate"
                value={`${analytics?.conversionRate || 0}%`}
                color="orange"
              />
              <MetricCard
                title="Daily Active"
                value={analytics?.dailyActiveUsers || 0}
                color="cyan"
              />
            </div>

            {/* NPS Score */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Net Promoter Score (NPS)</h2>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className={`text-5xl font-bold ${getNpsColor(nps?.npsScore || 0)}`}>
                    {nps?.npsScore || 0}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">NPS Score</div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 w-24">Promoters</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-4">
                      <div
                        className="bg-green-500 h-4 rounded-full"
                        style={{ width: `${nps?.breakdown?.promoterPercent || 0}%` }}
                      />
                    </div>
                    <span className="text-sm w-12">{nps?.breakdown?.promoterPercent || 0}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 w-24">Passives</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-4">
                      <div
                        className="bg-yellow-500 h-4 rounded-full"
                        style={{ width: `${nps?.breakdown?.passivePercent || 0}%` }}
                      />
                    </div>
                    <span className="text-sm w-12">{nps?.breakdown?.passivePercent || 0}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 w-24">Detractors</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-4">
                      <div
                        className="bg-red-500 h-4 rounded-full"
                        style={{ width: `${nps?.breakdown?.detractorPercent || 0}%` }}
                      />
                    </div>
                    <span className="text-sm w-12">{nps?.breakdown?.detractorPercent || 0}%</span>
                  </div>
                </div>
              </div>
              <div className="text-gray-400 text-sm mt-4">
                Based on {nps?.total || 0} responses in the last 30 days
              </div>
            </div>
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === "feedback" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Recent Feedback</h2>
            {feedback.length === 0 ? (
              <p className="text-gray-400">No feedback yet</p>
            ) : (
              <div className="space-y-4">
                {feedback.map((item) => (
                  <div key={item.id} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${getFeedbackTypeColor(item.feedback_type)}`}>
                          {item.feedback_type}
                        </span>
                        {item.rating && (
                          <span className="text-yellow-400">
                            {"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}
                          </span>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-gray-300">{item.message}</p>
                    <p className="text-gray-500 text-sm mt-2">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="space-y-8">
            <h2 className="text-xl font-bold">Security Overview</h2>

            <div className="grid grid-cols-3 gap-4">
              <MetricCard
                title="Total Violations"
                value={violations?.totalViolations || 0}
                color="red"
              />
              <MetricCard
                title="Unique IPs"
                value={violations?.uniqueIps || 0}
                color="yellow"
              />
              <MetricCard
                title="Currently Blocked"
                value={violations?.blocked || 0}
                color="orange"
              />
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Rate Limit Configuration</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-700 p-3 rounded">
                  <span className="text-gray-400">Standard API:</span> 60 req/min
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <span className="text-gray-400">Auth Endpoints:</span> 10 req/min
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <span className="text-gray-400">Heavy Operations:</span> 5 req/min
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <span className="text-gray-400">Delete Data:</span> 3 req/hour
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <span className="text-gray-400">Feedback:</span> 10 req/hour
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <span className="text-gray-400">NPS:</span> 1 req/day
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, color }: { title: string; value: number | string; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: "text-blue-400",
    green: "text-green-400",
    purple: "text-purple-400",
    orange: "text-orange-400",
    cyan: "text-cyan-400",
    red: "text-red-400",
    yellow: "text-yellow-400"
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className={`text-3xl font-bold ${colorClasses[color] || "text-white"}`}>
        {value}
      </div>
      <div className="text-gray-400 text-sm">{title}</div>
    </div>
  );
}

function getNpsColor(score: number): string {
  if (score >= 50) return "text-green-400";
  if (score >= 0) return "text-yellow-400";
  return "text-red-400";
}

function getFeedbackTypeColor(type: string): string {
  const colors: Record<string, string> = {
    bug: "bg-red-500/20 text-red-400",
    feature_request: "bg-blue-500/20 text-blue-400",
    complaint: "bg-orange-500/20 text-orange-400",
    praise: "bg-green-500/20 text-green-400",
    general: "bg-gray-500/20 text-gray-400"
  };
  return colors[type] || colors.general;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: "bg-blue-500/20 text-blue-400",
    reviewed: "bg-yellow-500/20 text-yellow-400",
    resolved: "bg-green-500/20 text-green-400",
    ignored: "bg-gray-500/20 text-gray-400"
  };
  return colors[status] || colors.new;
}
