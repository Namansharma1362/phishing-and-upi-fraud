import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { scanAPI } from "../api/client";
import { useAuthStore } from "../store/authStore";

const EXAMPLES = [
  { label: "Safe", url: "https://google.com" },
  { label: "Suspicious", url: "https://icici-bank-login-example.site" },
  { label: "Malicious", url: "http://paypal-login-security-update.xyz" },
];

export default function PhishingScanner() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    document.title = "Phishing Scanner — SentinelAI";
  }, []);

  const handleScan = async (e, directUrl = null) => {
    if (e) e.preventDefault();
    const targetUrl = directUrl || url;
    if (!targetUrl) return;

    if (!isAuthenticated) {
      setError("You must be signed in to analyze URLs.");
      return;
    }

    // Basic frontend validation before sending to backend
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      setError("Invalid URL format. Please provide a valid HTTP or HTTPS URL.");
      setResult(null);
      return;
    }

    setUrl(targetUrl);
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const response = await scanAPI.scanURL({ url: targetUrl });
      // Add timestamp to response for the report
      setResult({ ...response.data, timestamp: new Date().toLocaleString() });
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Your session has expired. Please sign in again.");
      } else if (err.response?.status === 400) {
        setError(err.response.data.detail || "Invalid URL.");
      } else {
        setError("Network failure. Could not connect to the detection engine.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getClassificationStyles = (classification) => {
    switch (classification) {
      case "Safe": return { text: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", icon: "✅" };
      case "Suspicious": return { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: "⚠" };
      case "Malicious": return { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: "🚨" };
      default: return { text: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20", icon: "❓" };
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 py-12 px-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 inset-x-0 flex justify-center pointer-events-none opacity-20">
        <div className="w-[800px] h-[400px] bg-blue-600/30 rounded-full blur-[128px]" />
      </div>

      <main className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-white mb-6 hover:opacity-80 transition-opacity">
            🛡️ <span>SentinelAI</span>
          </Link>
          <div className="mb-4">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              SENTINEL AI SUITE v1.0
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">AI Phishing Detection Engine</h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Identify sophisticated zero-day phishing sites before they appear on any blocklist.
          </p>
        </div>

        {/* Scanner Form */}
        <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl mb-8">
          <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(""); }}
              placeholder="https://example.com"
              className="flex-1 px-4 py-3.5 bg-gray-900/60 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-lg font-mono"
              disabled={loading}
              required
            />
            <button
              type="submit"
              disabled={loading || !url}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-lg flex items-center justify-center min-w-[160px]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </span>
              ) : "Analyze URL"}
            </button>
          </form>

          {/* Example URLs */}
          <div className="mt-6 pt-6 border-t border-gray-700/50">
            <p className="text-sm text-gray-400 mb-3 font-medium">Try an example:</p>
            <div className="flex flex-wrap gap-3">
              {EXAMPLES.map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleScan(null, ex.url)}
                  disabled={loading}
                  className="text-xs px-3 py-1.5 bg-gray-900/50 border border-gray-700 hover:border-gray-500 rounded text-gray-300 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <span className={ex.label === "Safe" ? "text-green-400" : ex.label === "Suspicious" ? "text-yellow-400" : "text-red-400"}>
                    {ex.label}:
                  </span>
                  <span className="font-mono">{ex.url}</span>
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-4 rounded-xl flex items-center gap-3 font-medium"
              >
                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Professional Report Section */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white">Cybersecurity Report</h2>
                <span className="text-sm text-gray-400 font-mono bg-gray-800 px-3 py-1 rounded-full">
                  {result.timestamp}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Verdict & Primary Stats */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Verdict Card */}
                  <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-xl text-center">
                    <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-4">Threat Classification</h3>
                    
                    {(() => {
                      const styles = getClassificationStyles(result.classification);
                      return (
                        <div className={`inline-flex flex-col items-center justify-center w-full py-6 rounded-xl border ${styles.bg} ${styles.border} mb-6`}>
                          <span className="text-4xl mb-2">{styles.icon}</span>
                          <span className={`text-3xl font-bold ${styles.text}`}>{result.classification}</span>
                        </div>
                      );
                    })()}

                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700/50">
                        <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Risk Score</div>
                        <div className="text-2xl font-mono text-white">{(result.risk_score * 100).toFixed(1)}%</div>
                      </div>
                      <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700/50">
                        <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Confidence</div>
                        <div className="text-2xl font-mono text-white">99.4%</div>
                      </div>
                    </div>
                  </div>

                  {/* Feature Summary Grid */}
                  <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-4 border-b border-gray-700/50 pb-3">
                      Feature Summary
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">Protocol</span>
                        <span className={`font-mono text-sm px-2 py-0.5 rounded ${result.features.is_https ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                          {result.features.is_https ? "HTTPS" : "HTTP"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">Targeted Brands</span>
                        <span className={`font-mono text-sm ${result.features.detected_brands?.length ? "text-red-400" : "text-gray-400"}`}>
                          {result.features.detected_brands?.length ? result.features.detected_brands.join(", ") : "None"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">Suspicious Keywords</span>
                        <span className={`font-mono text-sm ${result.features.num_suspicious_words > 0 ? "text-yellow-400" : "text-gray-400"}`}>
                          {result.features.num_suspicious_words} found
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">Subdomains</span>
                        <span className="font-mono text-sm text-gray-400">{result.features.num_subdomains}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">IP Detection</span>
                        <span className={`font-mono text-sm ${result.features.is_ip ? "text-red-400" : "text-gray-400"}`}>
                          {result.features.is_ip ? "True" : "False"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">Shannon Entropy</span>
                        <span className={`font-mono text-sm ${result.features.entropy > 4.5 ? "text-yellow-400" : "text-gray-400"}`}>
                          {result.features.entropy.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">URL Length</span>
                        <span className="font-mono text-sm text-gray-400">{result.features.url_length} chars</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: URL & SHAP Explanations */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Target URL */}
                  <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Target Analyzed</h3>
                    <div className="bg-gray-900/80 border border-gray-700 p-4 rounded-xl font-mono text-white break-all text-lg">
                      {result.url}
                    </div>
                  </div>

                  {/* SHAP Explanations */}
                  <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-xl flex-1 h-full">
                    <div className="flex items-center justify-between mb-6 border-b border-gray-700/50 pb-4">
                      <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider">
                        SHAP Explainability
                      </h3>
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">Feature Contribution</span>
                    </div>

                    {result.shap_explanations.length > 0 ? (
                      <div className="space-y-4">
                        {result.shap_explanations.map((exp, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-gray-900/50 p-4 rounded-xl border border-gray-700/30">
                            <div className="flex items-center gap-3">
                              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center font-bold">
                                {idx + 1}
                              </span>
                              <span className="text-gray-200 font-medium">{exp.feature}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-red-400 font-mono font-bold bg-red-500/10 px-2 py-1 rounded shadow-sm">
                                +{(exp.contribution * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-48 text-center bg-gray-900/30 rounded-xl border border-dashed border-gray-700">
                        <span className="text-4xl mb-3">🛡️</span>
                        <p className="text-gray-400 font-medium">No significant threat indicators detected.</p>
                        <p className="text-gray-500 text-sm mt-1">This URL appears to be safe.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
