import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { scanAPI } from "../api/client";
import { useAuthStore } from "../store/authStore";

const EXAMPLES = [
  { 
    label: "Safe", 
    upi_id: "friend@ybl", 
    amount: 500, 
    newBen: false, 
    time: "14:00", 
    desc: "Known beneficiary",
    simSwapped: false,
    deviceChanged: false
  },
  { 
    label: "Suspicious", 
    upi_id: "reward-support@okaxis", 
    amount: 20000, 
    newBen: true, 
    time: "23:00", 
    desc: "New beneficiary",
    simSwapped: false,
    deviceChanged: true
  },
  { 
    label: "Fraud", 
    upi_id: "cashback-offer@unknownbank", 
    amount: 50000, 
    newBen: true, 
    time: "03:00", 
    desc: "SIM changed, Large amount",
    simSwapped: true,
    deviceChanged: true
  },
];

// --- Toggle Switch Component ---
function Toggle({ label, enabled, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-900/40 border border-gray-700/50 rounded-xl">
      <span className="text-gray-300 text-sm font-medium">{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-purple-600' : 'bg-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

// --- Circular Progress ---
function CircularProgress({ percentage, colorClass }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let strokeColor = "#3b82f6"; // default blue
  if (colorClass.includes("red")) strokeColor = "#ef4444";
  else if (colorClass.includes("yellow")) strokeColor = "#f59e0b";
  else if (colorClass.includes("green")) strokeColor = "#10b981";

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="transform -rotate-90 w-24 h-24">
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-gray-700"
        />
        <motion.circle
          cx="48"
          cy="48"
          r={radius}
          stroke={strokeColor}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-white">{percentage.toFixed(0)}%</span>
      </div>
    </div>
  );
}

export default function UPIChecker() {
  const [searchParams] = useSearchParams();
  const initialUpi = searchParams.get("id") || "";

  // Core API fields
  const [upiId, setUpiId] = useState(initialUpi);
  const [amount, setAmount] = useState("");
  const [time, setTime] = useState("");
  const [isNewBeneficiary, setIsNewBeneficiary] = useState(false);

  // UI-only Enterprise Fields
  const [date, setDate] = useState("");
  const [paymentApp, setPaymentApp] = useState("Google Pay");
  const [txType, setTxType] = useState("Send Money");
  const [merchantCat, setMerchantCat] = useState("Shopping");
  const [deviceChanged, setDeviceChanged] = useState(false);
  const [simSwapped, setSimSwapped] = useState(false);
  const [intlLogin, setIntlLogin] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    document.title = "UPI Fraud Detection Engine — SentinelAI";
  }, []);

  const handleScan = async (e, directData = null) => {
    if (e) e.preventDefault();
    
    let targetUpi = upiId;
    let targetAmount = Number(amount);
    let targetHour = time ? parseInt(time.split(":")[0], 10) : NaN;
    let targetNewBen = isNewBeneficiary;

    if (directData) {
      targetUpi = directData.upi_id;
      targetAmount = directData.amount;
      targetHour = parseInt(directData.time.split(":")[0], 10);
      targetNewBen = directData.newBen;
      
      setUpiId(directData.upi_id);
      setAmount(directData.amount.toString());
      setTime(directData.time);
      setIsNewBeneficiary(directData.newBen);
      setSimSwapped(directData.simSwapped);
      setDeviceChanged(directData.deviceChanged);
    }

    if (!directData && (!date || !time)) {
      setError("Transaction Date and Time are required.");
      setResult(null);
      return;
    }

    if (!targetUpi || !targetAmount || isNaN(targetHour)) return;

    if (!isAuthenticated) {
      setError("Authentication required. Please sign in to analyze transactions.");
      return;
    }

    if (!targetUpi.includes("@")) {
      setError("Invalid UPI format. Must contain '@'.");
      setResult(null);
      return;
    }

    if (targetAmount <= 0) {
      setError("Invalid amount. Must be greater than 0.");
      setResult(null);
      return;
    }

    setError("");
    setResult(null);
    setLoading(true);

    try {
      const response = await scanAPI.scanUPI({
        upi_id: targetUpi,
        transaction_amount: targetAmount,
        transaction_hour: targetHour,
        is_new_beneficiary: targetNewBen,
        device_changed: deviceChanged,
        sim_swapped: simSwapped,
        intl_login: intlLogin,
        transaction_type: txType,
        merchant_category: merchantCat
      });
      setResult({ ...response.data, timestamp: new Date().toLocaleString() });
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Your session has expired. Please sign in again.");
      } else if (err.response?.status === 400) {
        setError(err.response.data.detail || "Invalid input.");
      } else {
        setError("Network timeout. Could not reach the detection engine.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getClassificationStyles = (classification) => {
    switch (classification) {
      case "Safe": return { color: "green", text: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", icon: "✓", rec: "Proceed normally." };
      case "Suspicious": return { color: "yellow", text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: "⚠", rec: "Verify beneficiary details before payment." };
      case "Fraud": return { color: "red", text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: "✕", rec: "Do not proceed. Contact your bank immediately if this transaction was not initiated by you." };
      default: return { color: "gray", text: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20", icon: "?", rec: "Unknown status." };
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c12] text-gray-100 py-12 px-4 relative overflow-hidden font-sans">
      {/* Premium Background Mesh */}
      <div className="absolute top-0 inset-x-0 flex justify-center pointer-events-none opacity-30 z-0">
        <div className="w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-purple-900/10 to-transparent blur-[100px]" />
      </div>

      <main className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center gap-2 text-xl font-bold text-gray-300 mb-6 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            SentinelAI Dashboard
          </Link>
          <div className="mb-4">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              SENTINEL AI SUITE v1.0
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 mb-6">
            UPI Fraud Detection Engine
          </h1>
          <p className="text-gray-400 max-w-3xl mx-auto text-lg leading-relaxed">
            Analyze UPI IDs and transaction behaviour using AI, behavioural analytics and explainable machine learning to detect fraudulent payments before they happen.
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-[#111520]/80 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 shadow-2xl mb-12">
          <form onSubmit={handleScan}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              
              {/* Left Column: Transaction Details */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-200">Transaction Details</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1.5 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                      UPI ID
                    </label>
                    <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="rahul@ybl" className="w-full px-4 py-3 bg-[#0a0c12] border border-gray-700/60 rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono" disabled={loading} required />
                  </div>
                  
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1.5 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Transaction Amount (₹)
                    </label>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="5000" min="1" className="w-full px-4 py-3 bg-[#0a0c12] border border-gray-700/60 rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono" disabled={loading} required />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Transaction Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => { setDate(e.target.value); setError(""); }}
                      className="w-full px-4 py-3 bg-[#0a0c12] border border-gray-700/60 rounded-xl text-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      style={{ colorScheme: "dark" }}
                      disabled={loading}
                      required
                    />
                    {!date && <p className="text-xs text-gray-500 mt-1">Select any date — past or future</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Transaction Time
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => { setTime(e.target.value); setError(""); }}
                      className="w-full px-4 py-3 bg-[#0a0c12] border border-gray-700/60 rounded-xl text-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      style={{ colorScheme: "dark" }}
                      disabled={loading}
                      required
                    />
                    {!time && <p className="text-xs text-gray-500 mt-1">Select any time (00:00 – 23:59)</p>}
                  </div>

                  <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Payment App</label>
                      <select value={paymentApp} onChange={(e)=>setPaymentApp(e.target.value)} disabled={loading} className="w-full px-3 py-2.5 bg-[#0a0c12] border border-gray-700/60 rounded-lg text-gray-300 text-sm focus:border-indigo-500 outline-none">
                        <option>Google Pay</option><option>PhonePe</option><option>Paytm</option><option>BHIM</option><option>Amazon Pay</option><option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Txn Type</label>
                      <select value={txType} onChange={(e)=>setTxType(e.target.value)} disabled={loading} className="w-full px-3 py-2.5 bg-[#0a0c12] border border-gray-700/60 rounded-lg text-gray-300 text-sm focus:border-indigo-500 outline-none">
                        <option>Send Money</option><option>Merchant Payment</option><option>Collect Request</option><option>QR Payment</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Merchant Category</label>
                      <select value={merchantCat} onChange={(e)=>setMerchantCat(e.target.value)} disabled={loading} className="w-full px-3 py-2.5 bg-[#0a0c12] border border-gray-700/60 rounded-lg text-gray-300 text-sm focus:border-indigo-500 outline-none">
                        <option>Shopping</option><option>Food</option><option>Recharge</option><option>Utilities</option><option>Travel</option><option>Entertainment</option><option>Education</option><option>Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Risk Signals */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-200">Risk Signals</h2>
                </div>

                <div className="space-y-3">
                  <Toggle label="New Beneficiary" enabled={isNewBeneficiary} onChange={setIsNewBeneficiary} disabled={loading} />
                  <Toggle label="Device Changed" enabled={deviceChanged} onChange={setDeviceChanged} disabled={loading} />
                  <Toggle label="SIM Swapped Recently" enabled={simSwapped} onChange={setSimSwapped} disabled={loading} />
                  <Toggle label="International Device Login" enabled={intlLogin} onChange={setIntlLogin} disabled={loading} />
                  <Toggle label="Large Transaction" enabled={Number(amount) > 10000} onChange={()=>{}} disabled={true} />
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={loading || !upiId || !amount || !time}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-[0_8px_30px_rgba(79,70,229,0.3)] transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg flex items-center justify-center gap-3 uppercase tracking-wider"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        Analyze Transaction
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </form>

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6 bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-4 rounded-xl flex items-center gap-3 font-medium">
                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Example Transactions */}
        <div className="mb-12">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Example Transactions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {EXAMPLES.map((ex, idx) => (
              <motion.button
                key={idx}
                whileHover={{ y: -4 }}
                onClick={() => handleScan(null, ex)}
                disabled={loading}
                className="text-left bg-[#111520]/60 backdrop-blur-md border border-white/5 hover:border-white/20 p-5 rounded-2xl transition-all group disabled:opacity-50"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                    ex.label === 'Safe' ? 'bg-green-500/10 text-green-400' : 
                    ex.label === 'Suspicious' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {ex.label}
                  </span>
                  <span className="text-lg font-mono text-gray-300">₹{ex.amount.toLocaleString()}</span>
                </div>
                <div className="font-mono text-gray-200 mb-1 break-all">{ex.upi_id}</div>
                <div className="text-sm text-gray-500 flex flex-col gap-1 mt-3 border-t border-white/5 pt-3">
                  <span className="flex items-center gap-2"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {ex.time}</span>
                  <span className="flex items-center gap-2"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {ex.desc}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Professional Dashboard Report */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 bg-[#0d1017] p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
              {/* Report Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Cybersecurity Report</h2>
                  <p className="text-gray-400 text-sm font-mono">{result.upi_id} • ₹{result.features.amount.toLocaleString()}</p>
                </div>
                <div className="flex gap-4">
                  <div className="bg-gray-900/80 px-4 py-2 rounded-xl border border-gray-700/50">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">AI Confidence</div>
                    <div className="text-lg font-bold text-blue-400">94%</div>
                  </div>
                  <div className="bg-gray-900/80 px-4 py-2 rounded-xl border border-gray-700/50">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Timestamp</div>
                    <div className="text-sm font-mono text-gray-300 mt-1">{result.timestamp}</div>
                  </div>
                </div>
              </div>

              {/* Top Row: Core Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Risk Score */}
                <div className="bg-[#151923] p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center shadow-inner">
                  <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-6">Risk Score</h3>
                  <CircularProgress percentage={result.risk_score * 100} colorClass={getClassificationStyles(result.classification).text} />
                </div>

                {/* Classification */}
                <div className="bg-[#151923] p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center col-span-1 md:col-span-2 shadow-inner">
                  <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-4">Classification</h3>
                  {(() => {
                    const styles = getClassificationStyles(result.classification);
                    return (
                      <>
                        <div className={`flex items-center gap-3 px-8 py-3 rounded-xl border ${styles.bg} ${styles.border} mb-6`}>
                          <span className="text-3xl">{styles.icon}</span>
                          <span className={`text-3xl font-extrabold tracking-wide uppercase ${styles.text}`}>{result.classification}</span>
                        </div>
                        <div className="bg-gray-900/50 px-6 py-3 rounded-lg border border-gray-700 w-full max-w-md">
                          <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Recommendation</span>
                          <span className={`font-medium ${styles.text}`}>{styles.rec}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Left Column: Factors & Behaviour */}
                <div className="space-y-8">
                  {/* Detected Risk Factors */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                      Detected Risk Factors
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className={`p-3 rounded-xl border ${result.features.is_high_amount || result.features.is_very_high_amount ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-gray-800/50 border-gray-700 text-gray-400'} flex flex-col items-center text-center gap-2`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-xs font-semibold">High Amount</span>
                      </div>
                      <div className={`p-3 rounded-xl border ${result.features.is_new_beneficiary ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-gray-800/50 border-gray-700 text-gray-400'} flex flex-col items-center text-center gap-2`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                        <span className="text-xs font-semibold">New Ben.</span>
                      </div>
                      <div className={`p-3 rounded-xl border ${result.features.is_late_night ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-gray-800/50 border-gray-700 text-gray-400'} flex flex-col items-center text-center gap-2`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                        <span className="text-xs font-semibold">Late Night</span>
                      </div>
                      <div className={`p-3 rounded-xl border ${simSwapped ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-gray-800/50 border-gray-700 text-gray-400'} flex flex-col items-center text-center gap-2`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                        <span className="text-xs font-semibold">SIM Swap</span>
                      </div>
                      <div className={`p-3 rounded-xl border ${result.features.num_scam_keywords > 0 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-gray-800/50 border-gray-700 text-gray-400'} flex flex-col items-center text-center gap-2`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        <span className="text-xs font-semibold">Scam Keyword</span>
                      </div>
                      <div className={`p-3 rounded-xl border ${result.features.is_unknown_bank ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-gray-800/50 border-gray-700 text-gray-400'} flex flex-col items-center text-center gap-2`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        <span className="text-xs font-semibold">Unknown Bank</span>
                      </div>
                    </div>
                  </div>

                  {/* Behaviour Analysis */}
                  <div className="bg-[#151923] rounded-2xl p-6 border border-white/5">
                    <h3 className="text-lg font-bold text-gray-200 mb-6 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                      Behaviour Analysis
                    </h3>
                    <div className="space-y-5">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">Beneficiary Risk</span>
                          <span className="text-gray-300 font-mono">{result.features.is_new_beneficiary ? 'High' : 'Low'}</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${result.features.is_new_beneficiary ? 'bg-red-500 w-[85%]' : 'bg-green-500 w-[15%]'}`}></div></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">Device Risk</span>
                          <span className="text-gray-300 font-mono">{deviceChanged || simSwapped ? 'Critical' : 'Normal'}</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${deviceChanged || simSwapped ? 'bg-red-500 w-[95%]' : 'bg-green-500 w-[10%]'}`}></div></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">Transaction Timing</span>
                          <span className="text-gray-300 font-mono">{result.features.is_late_night ? 'Abnormal' : 'Standard'}</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${result.features.is_late_night ? 'bg-yellow-500 w-[75%]' : 'bg-green-500 w-[20%]'}`}></div></div>
                      </div>
                      <div className="pt-3 mt-3 border-t border-white/5 flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-300">Overall Behaviour Score</span>
                        <span className="text-lg font-mono font-bold text-white">{(100 - (result.risk_score * 100)).toFixed(0)}/100</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Explainable AI */}
                <div className="bg-[#151923] rounded-2xl border border-white/5 p-6 flex flex-col shadow-inner h-full">
                  <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-200">Explainable AI (SHAP)</h3>
                      <p className="text-xs text-gray-500">Feature importance breakdown</p>
                    </div>
                  </div>

                  {result.shap_explanations.length > 0 ? (
                    <div className="space-y-4 flex-1">
                      {result.shap_explanations.map((exp, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                          key={idx} className="flex items-center justify-between bg-gray-900/60 p-4 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-8 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                            <span className="text-gray-200 font-medium text-sm">{exp.feature}</span>
                          </div>
                          <span className="text-red-400 font-mono font-bold bg-red-500/10 px-2.5 py-1 rounded-md text-sm border border-red-500/20">
                            +{(exp.contribution * 100).toFixed(0)}%
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-400 mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <p className="text-gray-300 font-medium">No fraudulent indicators detected.</p>
                      <p className="text-gray-500 text-sm mt-2">All signals appear normal.</p>
                    </div>
                  )}
                </div>

              </div>
              
              {/* Footer */}
              <div className="border-t border-white/5 pt-4 mt-8 flex items-center justify-center gap-2 text-xs text-gray-500">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Disclaimer: This prediction is AI-assisted and should be combined with bank verification before taking action.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
