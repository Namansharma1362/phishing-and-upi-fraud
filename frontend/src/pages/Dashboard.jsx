/**
 * SentinelAI — Dashboard Page (Phase 5)
 * Enterprise cybersecurity dashboard with live history, analytics, and export.
 */

import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, AreaChart, Area
} from "recharts";
import { historyAPI } from "../api/client";
import { useAuthStore } from "../store/authStore";

// ── Helpers ──────────────────────────────────────────────────────────────────

const classColor = (cls) => {
  const c = (cls || "").toLowerCase();
  if (c === "safe") return { text: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" };
  if (c === "suspicious") return { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" };
  if (c === "malicious" || c === "fraud") return { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" };
  return { text: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/30" };
};

const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

const fmtRisk = (r) => `${(r * 100).toFixed(0)}%`;

function Badge({ cls }) {
  const s = classColor(cls);
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.text} ${s.bg} ${s.border}`}>
      {cls}
    </span>
  );
}

function StatCard({ label, value, icon, sub, color = "blue" }) {
  const colors = {
    blue: "from-blue-600/20 to-indigo-600/20 border-blue-500/20 text-blue-400",
    red: "from-red-600/20 to-rose-600/20 border-red-500/20 text-red-400",
    green: "from-green-600/20 to-emerald-600/20 border-green-500/20 text-green-400",
    purple: "from-purple-600/20 to-indigo-600/20 border-purple-500/20 text-purple-400",
    yellow: "from-yellow-600/20 to-amber-600/20 border-yellow-500/20 text-yellow-400",
  };
  return (
    <motion.div whileHover={{ y: -3 }}
      className={`bg-gradient-to-br ${colors[color]} border backdrop-blur-sm rounded-2xl p-5 flex items-center gap-4`}>
      <div className="text-3xl">{icon}</div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-sm text-gray-400">{label}</div>
        {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
      </div>
    </motion.div>
  );
}

// ── Scan Detail Modal ─────────────────────────────────────────────────────────

function ScanModal({ item, type, onClose }) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-[#111520] border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">{type === "url" ? "URL Scan Details" : "UPI Scan Details"}</h3>
            <p className="text-xs text-gray-500 mt-1 font-mono">{item.id}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-4">
          <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/50">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Target</div>
            <div className="font-mono text-white break-all">{type === "url" ? item.url : item.upi_id}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/50">
              <div className="text-xs text-gray-500 mb-1">Risk Score</div>
              <div className="text-2xl font-bold text-white">{fmtRisk(item.risk_score)}</div>
            </div>
            <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/50">
              <div className="text-xs text-gray-500 mb-1">Classification</div>
              <Badge cls={item.classification} />
            </div>
          </div>
          {type === "upi" && (
            <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/50">
              <div className="text-xs text-gray-500 mb-1">Amount</div>
              <div className="text-lg font-semibold text-white">₹{item.amount.toLocaleString()}</div>
            </div>
          )}
          <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-700/50">
            <div className="text-xs text-gray-500 mb-1">Timestamp</div>
            <div className="text-gray-300 text-sm">{new Date(item.created_at).toLocaleString()}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
}

// ── CSV / PDF Export ──────────────────────────────────────────────────────────

function exportCSV(urlScans, upiScans, user) {
  const rows = [
    ["Type", "Target", "Risk Score", "Classification", "Amount", "Timestamp"],
    ...urlScans.map(s => ["URL", s.url, fmtRisk(s.risk_score), s.classification, "", new Date(s.created_at).toLocaleString()]),
    ...upiScans.map(s => ["UPI", s.upi_id, fmtRisk(s.risk_score), s.classification, s.amount, new Date(s.created_at).toLocaleString()]),
  ];
  const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `sentinelai-report-${Date.now()}.csv`;
  a.click();
}

function exportPDF(stats, user) {
  const html = `
    <html><head><title>SentinelAI Report</title>
    <style>
      body { font-family: Arial, sans-serif; color: #111; padding: 32px; }
      h1 { color: #4f46e5; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 13px; }
      th { background: #f3f4f6; }
      .badge-safe { color: green; } .badge-suspicious { color: orange; }
      .badge-malicious, .badge-fraud { color: red; }
    </style></head><body>
    <h1>SentinelAI Security Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
    <p>User: ${user.name} (${user.email})</p>
    <h2>Summary</h2>
    <ul>
      <li>Total URL Scans: ${stats.total_url_scans}</li>
      <li>Phishing Detected: ${stats.phishing_detected}</li>
      <li>Total UPI Scans: ${stats.total_upi_scans}</li>
      <li>Fraud Detected: ${stats.fraud_detected}</li>
      <li>Average Risk Score: ${(stats.avg_risk_score * 100).toFixed(1)}%</li>
    </ul>
    <h2>Recent URL Scans</h2>
    <table><tr><th>URL</th><th>Risk</th><th>Classification</th><th>Date</th></tr>
      ${(stats.recent_url_scans || []).map(s =>
        `<tr><td>${s.url}</td><td>${fmtRisk(s.risk_score)}</td>
         <td class="badge-${s.classification.toLowerCase()}">${s.classification}</td>
         <td>${new Date(s.created_at).toLocaleString()}</td></tr>`
      ).join("")}
    </table>
    <h2>Recent UPI Scans</h2>
    <table><tr><th>UPI ID</th><th>Amount</th><th>Risk</th><th>Classification</th><th>Date</th></tr>
      ${(stats.recent_upi_scans || []).map(s =>
        `<tr><td>${s.upi_id}</td><td>₹${s.amount}</td><td>${fmtRisk(s.risk_score)}</td>
         <td class="badge-${s.classification.toLowerCase()}">${s.classification}</td>
         <td>${new Date(s.created_at).toLocaleString()}</td></tr>`
      ).join("")}
    </table>
    </body></html>`;
  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

// ── Chart Colors ──────────────────────────────────────────────────────────────
const PIE_COLORS = { safe: "#10b981", suspicious: "#f59e0b", malicious: "#ef4444", fraud: "#ef4444" };

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalItem, setModalItem] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [urlFilter, setUrlFilter] = useState("");
  const [upiFilter, setUpiFilter] = useState("");

  useEffect(() => {
    document.title = "Dashboard — SentinelAI";
    if (!isAuthenticated) navigate("/login", { replace: true });
  }, [isAuthenticated, navigate]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const fetchAll = async (apiMethod) => {
        let allItems = [];
        let page = 1;
        let total = 0;
        do {
          const res = await apiMethod(page, 100);
          allItems = allItems.concat(res.data.items || []);
          total = res.data.total || 0;
          page++;
        } while (allItems.length < total);
        return allItems;
      };

      const [urlRes, upiRes] = await Promise.allSettled([
        fetchAll(historyAPI.getURLHistory),
        fetchAll(historyAPI.getUPIHistory)
      ]);

      const allUrlHistory = urlRes.status === "fulfilled" ? urlRes.value : [];
      const allUpiHistory = upiRes.status === "fulfilled" ? upiRes.value : [];

      if (urlRes.status === "rejected" && upiRes.status === "rejected") {
        setError("Unable to load dashboard data. Please try again.");
      } else if (urlRes.status === "rejected" || upiRes.status === "rejected") {
        setError("Some data failed to load. The dashboard may be incomplete.");
      }

      setStats({
        allUrlHistory,
        allUpiHistory
      });
    } catch (err) {
      setError("An unexpected error occurred while loading the dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadDashboard();
  }, [isAuthenticated, loadDashboard]);

  if (!isAuthenticated) return null;

  // Build chart data by counting directly from the classification field on each item.
  const countByClass = (items, ...classNames) =>
    (items || []).filter(s => classNames.includes(s.classification)).length;

  const allUrls = stats?.allUrlHistory || [];
  const allUpis = stats?.allUpiHistory || [];

  const urlSafe       = countByClass(allUrls, "Safe");
  const urlSuspicious = countByClass(allUrls, "Suspicious");
  const urlMalicious  = countByClass(allUrls, "Malicious", "Fraud");

  const upiSafe       = countByClass(allUpis, "Safe");
  const upiSuspicious = countByClass(allUpis, "Suspicious");
  const upiFraud      = countByClass(allUpis, "Fraud", "Malicious");

  const totalUrlScans = allUrls.length;
  const totalUpiScans = allUpis.length;

  let avgRiskScore = 0;
  if (totalUrlScans + totalUpiScans > 0) {
    const sumRisk = [...allUrls, ...allUpis].reduce((sum, s) => sum + s.risk_score, 0);
    avgRiskScore = sumRisk / (totalUrlScans + totalUpiScans);
  }

  const urlPieData = stats ? [
    { name: "Safe",       value: urlSafe,       fill: "#10b981" },
    { name: "Suspicious", value: urlSuspicious, fill: "#f59e0b" },
    { name: "Malicious",  value: urlMalicious,  fill: "#ef4444" },
  ] : [];

  const upiPieData = stats ? [
    { name: "Safe",       value: upiSafe,       fill: "#10b981" },
    { name: "Suspicious", value: upiSuspicious, fill: "#f59e0b" },
    { name: "Fraud",      value: upiFraud,      fill: "#ef4444" },
  ] : [];

  const barData = stats ? [
    { name: "URL Scans", Safe: urlSafe, Suspicious: urlSuspicious, Malicious: urlMalicious, Fraud: 0 },
    { name: "UPI Scans", Safe: upiSafe, Suspicious: upiSuspicious, Malicious: 0, Fraud: upiFraud },
  ] : [];

  // Plot ALL historical scans in chronological order for the Risk Trend Line Chart
  const allScansSorted = [...allUrls, ...allUpis]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const riskTrendData = allScansSorted.map((s, i) => ({
    name: `Scan ${i + 1}`,
    risk: Math.round(s.risk_score * 100)
  }));

  // Filtering searches the complete history, then limits results for the recent tables
  const filteredURL = allUrls.filter(s =>
    s.url.toLowerCase().includes(urlFilter.toLowerCase()) ||
    s.classification.toLowerCase().includes(urlFilter.toLowerCase())
  ).slice(0, 5);

  const filteredUPI = allUpis.filter(s =>
    s.upi_id.toLowerCase().includes(upiFilter.toLowerCase()) ||
    s.classification.toLowerCase().includes(upiFilter.toLowerCase())
  ).slice(0, 5);

  const pseudoStats = {
    total_url_scans: totalUrlScans,
    phishing_detected: urlMalicious,
    total_upi_scans: totalUpiScans,
    fraud_detected: upiFraud,
    avg_risk_score: avgRiskScore,
    recent_url_scans: filteredURL,
    recent_upi_scans: filteredUPI
  };

  return (
    <div className="min-h-screen bg-[#0a0c12] text-gray-100 relative">
      <div className="absolute top-0 inset-x-0 flex justify-center pointer-events-none opacity-20 z-0">
        <div className="w-[800px] h-[400px] bg-indigo-900/30 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 relative z-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🛡️</span>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                Security Dashboard
              </h1>
            </div>
            <p className="text-gray-400">
              Welcome back, <span className="text-white font-medium">{user?.name}</span> — here is your security overview.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => stats && exportCSV(allUrls, allUpis, user)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-sm rounded-xl transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              CSV
            </button>
            <button
              onClick={() => stats && exportPDF(pseudoStats, user)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              PDF Report
            </button>
            <button onClick={loadDashboard} className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-xl transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <svg className="animate-spin h-10 w-10 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <p className="text-gray-400">Loading dashboard...</p>
            </div>
          </div>
        ) : stats ? (
          <div className="space-y-8">

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <StatCard label="Total URL Scans" value={totalUrlScans} icon="🔗" color="blue" />
              <StatCard label="Safe URLs" value={urlSafe} icon="✅" color="green" />
              <StatCard label="Suspicious URLs" value={urlSuspicious} icon="⚠" color="yellow" />
              <StatCard label="Malicious URLs" value={urlMalicious} icon="🚨" color="red" />
              <StatCard label="Avg Risk Score" value={`${(avgRiskScore * 100).toFixed(1)}%`} icon="📊" color="yellow" />
              
              <StatCard label="Total UPI Scans" value={totalUpiScans} icon="💳" color="purple" />
              <StatCard label="Safe UPI Txns" value={upiSafe} icon="✅" color="green" />
              <StatCard label="Suspicious UPI Txns" value={upiSuspicious} icon="⚠" color="yellow" />
              <StatCard label="Fraudulent UPI Txns" value={upiFraud} icon="🚨" color="red" />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* URL Pie */}
              <div className="bg-[#111520]/80 border border-white/5 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">URL Verdict Breakdown</h3>
                {totalUrlScans > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={urlPieData} dataKey="value" cx="50%" cy="45%" innerRadius={55} outerRadius={75} labelLine={false}>
                        {urlPieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #2d3748", color: "#e2e8f0", borderRadius: "8px" }} itemStyle={{ color: "#e2e8f0" }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-56 flex items-center justify-center text-gray-500 text-sm">No URL scans yet</div>}
              </div>

              {/* UPI Pie */}
              <div className="bg-[#111520]/80 border border-white/5 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">UPI Verdict Breakdown</h3>
                {totalUpiScans > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={upiPieData} dataKey="value" cx="50%" cy="45%" innerRadius={55} outerRadius={75} labelLine={false}>
                        {upiPieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #2d3748", color: "#e2e8f0", borderRadius: "8px" }} itemStyle={{ color: "#e2e8f0" }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="h-56 flex items-center justify-center text-gray-500 text-sm">No UPI scans yet</div>}
              </div>

              {/* Bar Chart */}
              <div className="bg-[#111520]/80 border border-white/5 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Scan Volume</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2533" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip cursor={{fill: '#1e2533'}} contentStyle={{ background: "#1a1f2e", border: "1px solid #2d3748", color: "#e2e8f0", borderRadius: "8px" }} itemStyle={{ color: "#e2e8f0" }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
                    <Bar dataKey="Safe" fill="#10b981" radius={[4,4,0,0]} />
                    <Bar dataKey="Suspicious" fill="#f59e0b" radius={[4,4,0,0]} />
                    <Bar dataKey="Malicious" fill="#ef4444" radius={[4,4,0,0]} />
                    <Bar dataKey="Fraud" fill="#ef4444" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Risk Trend Line Chart */}
            {riskTrendData.length > 0 && (
              <div className="bg-[#111520]/80 border border-white/5 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Risk Score Trend (Recent Scans)</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={riskTrendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2533" />
                    <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #2d3748", color: "#e2e8f0" }} formatter={(v) => [`${v}%`, "Risk"]} />
                    <Area type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={2} fill="url(#riskGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* URL History Table */}
            <div className="bg-[#111520]/80 border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>🔗</span> Recent URL Scans
                </h3>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={urlFilter}
                    onChange={(e) => setUrlFilter(e.target.value)}
                    placeholder="Filter by URL or classification..."
                    className="px-3 py-1.5 text-sm bg-gray-900 border border-gray-700 rounded-lg text-gray-300 focus:border-indigo-500 outline-none w-56"
                  />
                  <Link to="/scan/url" className="text-sm text-indigo-400 hover:text-indigo-300 whitespace-nowrap">+ New Scan</Link>
                </div>
              </div>
              {filteredURL.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="text-4xl mb-3">🔗</div>
                  <p className="text-gray-400 font-medium mb-2">No URL scans yet</p>
                  <p className="text-gray-500 text-sm mb-4">Analyze a URL to see your history here.</p>
                  <Link to="/scan/url" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl transition-colors">
                    Scan a URL
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
                        <th className="px-6 py-3 bg-gray-900/30">URL</th>
                        <th className="px-4 py-3 bg-gray-900/30">Risk</th>
                        <th className="px-4 py-3 bg-gray-900/30">Classification</th>
                        <th className="px-4 py-3 bg-gray-900/30">Time</th>
                        <th className="px-4 py-3 bg-gray-900/30">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredURL.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-800/30 transition-colors">
                          <td className="px-6 py-3 font-mono text-gray-300 max-w-xs truncate">{s.url}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-800 rounded-full h-1.5">
                                <div className="h-1.5 rounded-full" style={{ width: `${s.risk_score * 100}%`, background: s.risk_score >= 0.65 ? "#ef4444" : s.risk_score >= 0.40 ? "#f59e0b" : "#10b981" }} />
                              </div>
                              <span className="text-xs text-gray-400 font-mono">{fmtRisk(s.risk_score)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3"><Badge cls={s.classification} /></td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{fmtDate(s.created_at)}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => { setModalItem(s); setModalType("url"); }} className="text-indigo-400 hover:text-indigo-300 text-xs">Details</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* UPI History Table */}
            <div className="bg-[#111520]/80 border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>💳</span> Recent UPI Scans
                </h3>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={upiFilter}
                    onChange={(e) => setUpiFilter(e.target.value)}
                    placeholder="Filter by UPI ID or classification..."
                    className="px-3 py-1.5 text-sm bg-gray-900 border border-gray-700 rounded-lg text-gray-300 focus:border-indigo-500 outline-none w-56"
                  />
                  <Link to="/scan/upi" className="text-sm text-purple-400 hover:text-purple-300 whitespace-nowrap">+ New Scan</Link>
                </div>
              </div>
              {filteredUPI.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="text-4xl mb-3">💳</div>
                  <p className="text-gray-400 font-medium mb-2">No UPI scans yet</p>
                  <p className="text-gray-500 text-sm mb-4">Analyze a UPI transaction to see your history here.</p>
                  <Link to="/scan/upi" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-xl transition-colors">
                    Scan a UPI
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
                        <th className="px-6 py-3 bg-gray-900/30">UPI ID</th>
                        <th className="px-4 py-3 bg-gray-900/30">Amount</th>
                        <th className="px-4 py-3 bg-gray-900/30">Risk</th>
                        <th className="px-4 py-3 bg-gray-900/30">Classification</th>
                        <th className="px-4 py-3 bg-gray-900/30">Time</th>
                        <th className="px-4 py-3 bg-gray-900/30">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredUPI.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-800/30 transition-colors">
                          <td className="px-6 py-3 font-mono text-gray-300">{s.upi_id}</td>
                          <td className="px-4 py-3 text-gray-300">₹{s.amount.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-800 rounded-full h-1.5">
                                <div className="h-1.5 rounded-full" style={{ width: `${s.risk_score * 100}%`, background: s.risk_score >= 0.65 ? "#ef4444" : s.risk_score >= 0.40 ? "#f59e0b" : "#10b981" }} />
                              </div>
                              <span className="text-xs text-gray-400 font-mono">{fmtRisk(s.risk_score)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3"><Badge cls={s.classification} /></td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{fmtDate(s.created_at)}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => { setModalItem(s); setModalType("upi"); }} className="text-purple-400 hover:text-purple-300 text-xs">Details</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        ) : null}
      </div>

      {/* Scan Detail Modal */}
      <AnimatePresence>
        {modalItem && <ScanModal item={modalItem} type={modalType} onClose={() => setModalItem(null)} />}
      </AnimatePresence>
    </div>
  );
}
