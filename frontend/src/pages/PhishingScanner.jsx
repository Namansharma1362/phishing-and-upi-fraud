import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { scanAPI } from "../api/client";

export default function PhishingScanner() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    document.title = "Phishing Scanner — SentinelAI";
  }, []);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!url) return;

    setError("");
    setResult(null);
    setLoading(true);

    try {
      const response = await scanAPI.scanURL({ url });
      setResult(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail || "An error occurred while scanning the URL."
      );
    } finally {
      setLoading(false);
    }
  };

  const getClassificationColor = (classification) => {
    switch (classification) {
      case "Safe": return "text-green-400 bg-green-500/10 border-green-500/20";
      case "Suspicious": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      case "Malicious": return "text-red-400 bg-red-500/10 border-red-500/20";
      default: return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 py-12 px-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 inset-x-0 flex justify-center pointer-events-none opacity-30">
        <div className="w-[800px] h-[400px] bg-blue-600/20 rounded-full blur-[128px]" />
      </div>

      <main className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-white mb-8 hover:opacity-80 transition-opacity">
            🛡️ <span>SentinelAI</span>
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">Phishing URL Scanner</h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Our ML engine extracts 14+ structural and semantic features, evaluates brand impersonation, and calculates risk in real-time.
          </p>
        </div>

        {/* Scanner Form */}
        <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl mb-8">
          <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-lg"
              disabled={loading}
              required
            />
            <button
              type="submit"
              disabled={loading || !url}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-lg"
            >
              {loading ? "Scanning..." : "Analyze URL"}
            </button>
          </form>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2"
              >
                ⚠ {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Section */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Verdict Card */}
              <div className="md:col-span-1 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center text-center">
                <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Verdict</h3>
                <div className={`text-3xl font-bold mb-4 px-6 py-2 rounded-full border ${getClassificationColor(result.classification)}`}>
                  {result.classification}
                </div>
                <div className="text-gray-400">
                  Risk Score: <span className="text-white font-mono text-xl">{(result.risk_score * 100).toFixed(1)}%</span>
                </div>
              </div>

              {/* Explanations Card */}
              <div className="md:col-span-2 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-xl">
                <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-4 border-b border-gray-700 pb-2">
                  SHAP Explainability
                </h3>
                {result.shap_explanations.length > 0 ? (
                  <ul className="space-y-4">
                    {result.shap_explanations.map((exp, idx) => (
                      <li key={idx} className="flex justify-between items-start gap-4">
                        <span className="text-gray-200">{exp.feature}</span>
                        <span className="text-red-400 font-mono whitespace-nowrap bg-red-500/10 px-2 py-0.5 rounded text-sm">
                          +{(exp.contribution * 100).toFixed(0)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">No significant threat indicators detected.</p>
                )}
              </div>

              {/* Technical Features Card */}
              <div className="md:col-span-3 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-xl mt-2">
                <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-4 border-b border-gray-700 pb-2">
                  Key Extracted Features
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">URL Length</div>
                    <div className="font-mono text-gray-200">{result.features.url_length}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Subdomains</div>
                    <div className="font-mono text-gray-200">{result.features.num_subdomains}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Shannon Entropy</div>
                    <div className="font-mono text-gray-200">{result.features.entropy.toFixed(3)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">HTTPS</div>
                    <div className="font-mono text-gray-200">{result.features.is_https ? "Yes" : "No"}</div>
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
