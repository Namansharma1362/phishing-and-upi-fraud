import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useInView, animate } from "framer-motion";

// --- Animated Counter ---
function AnimatedCounter({ target, suffix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, target, {
      duration: 2.5,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Number(v.toFixed(target % 1 !== 0 ? 1 : 0))),
    });
    return controls.stop;
  }, [inView, target]);

  return <span ref={ref}>{display.toLocaleString()}{suffix}</span>;
}

// --- Soft Mesh Background ---
function BackgroundMesh() {
  return (
    <div className="mesh-bg-container" aria-hidden="true">
      <div className="blur-orb orb-lavender" />
      <div className="blur-orb orb-cyan" />
      <div className="blur-orb orb-mint" />
    </div>
  );
}

// --- World Threat Map (Hero Right Side) ---
function WorldThreatMap() {
  const nodes = [
    { x: "20%", y: "30%", critical: false },
    { x: "75%", y: "45%", critical: true },
    { x: "50%", y: "25%", critical: false },
    { x: "85%", y: "60%", critical: false },
    { x: "30%", y: "70%", critical: true },
  ];

  return (
    <motion.div 
      className="world-map-container"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
    >
      <svg viewBox="0 0 800 400" className="world-map-svg">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0)" />
            <stop offset="50%" stopColor="rgba(59, 130, 246, 0.8)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
          </linearGradient>
        </defs>
        <path d="M 50,150 Q 200,50 400,100 T 700,200" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="2" />
        <path d="M 150,250 Q 300,350 500,250 T 750,150" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="2" />
        <path d="M 350,100 Q 500,50 650,250" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="2" />
      </svg>
      
      {/* Animated Connection Lines over the SVG */}
      <div className="map-line">
        <svg viewBox="0 0 800 400">
          <path d="M 50,150 Q 200,50 400,100 T 700,200" />
          <path d="M 150,250 Q 300,350 500,250 T 750,150" />
          <path d="M 350,100 Q 500,50 650,250" />
        </svg>
      </div>

      {nodes.map((node, i) => (
        <div 
          key={i} 
          className={`map-node ${node.critical ? 'critical' : ''}`} 
          style={{ left: node.x, top: node.y }} 
        />
      ))}
    </motion.div>
  );
}

// --- Hero Section ---
function HeroSection() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleScan = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (query.includes("@")) navigate(`/scan/upi?id=${encodeURIComponent(query)}`);
    else navigate(`/scan/url?url=${encodeURIComponent(query)}`);
  };

  return (
    <section className="hero-section">
      <motion.div className="hero-content" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
        <h1 className="hero-title">
          AI That Stops Fraud <br />
          <span className="text-gradient">Before It Happens.</span>
        </h1>
        <p className="hero-subtitle">
          Protect your platform with real-time threat intelligence. SentinelAI leverages an ensemble of advanced machine learning models to detect zero-day phishing and UPI fraud anomalies in milliseconds.
        </p>
        
        <div className="hero-actions">
          <Link to="/scan/url" className="btn-primary">View Dashboard</Link>
          <a href="#features" className="btn-secondary">Explore Platform</a>
        </div>

        <form className="hero-search" onSubmit={handleScan}>
          <input
            type="text"
            placeholder="Analyze a suspicious URL or UPI ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn-small">Analyze Threat</button>
        </form>
      </motion.div>
      
      <WorldThreatMap />
    </section>
  );
}

// --- Statistics Bar ---
function StatisticsBar() {
  return (
    <div className="stats-bar">
      {[
        { val: 12450892, lbl: "Threats Blocked", suffix: "" },
        { val: 42, lbl: "Avg. Response (ms)", suffix: "" },
        { val: 99.4, lbl: "Detection Accuracy", suffix: "%" },
        { val: 2.5, lbl: "Users Protected", suffix: "M+" }
      ].map((s, i) => (
        <motion.div 
          key={i} className="stat-card glass-panel"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
        >
          <div className="stat-value text-primary"><AnimatedCounter target={s.val} suffix={s.suffix} /></div>
          <div className="stat-label">{s.lbl}</div>
        </motion.div>
      ))}
    </div>
  );
}

// --- Live Intelligence Dashboard Section ---
function LiveIntelligence() {
  const [feed, setFeed] = useState([
    { type: "red", msg: "Malicious URL Blocked", time: "2s ago" },
    { type: "yellow", msg: "Suspicious Redirect", time: "12s ago" },
    { type: "red", msg: "UPI Fraud Prevented", time: "24s ago" },
    { type: "green", msg: "New Threat Signature", time: "1m ago" }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFeed(prev => {
        const newFeed = [...prev];
        newFeed.pop();
        newFeed.unshift({ type: Math.random() > 0.5 ? "red" : "yellow", msg: "Phishing Site Blocked", time: "Just now" });
        return newFeed;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="live-intel-section">
      <div className="text-center">
        <h2 className="section-heading">Global Threat Intelligence</h2>
        <p className="section-sub mx-auto">Monitor real-time security events across our global network, powered by edge compute nodes.</p>
      </div>

      <div className="intel-grid">
        {/* Live Feed */}
        <motion.div className="intel-card glass-panel" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="intel-header">Live Threat Feed</div>
          <div className="feed-list">
            {feed.map((f, i) => (
              <motion.div key={i} className="feed-item" layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <span className={`feed-icon ${f.type}`}></span>
                {f.msg}
                <span className="feed-time">{f.time}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Top Locations */}
        <motion.div className="intel-card glass-panel" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
          <div className="intel-header">Top Threat Locations</div>
          <div className="locations-list" style={{ marginTop: '10px' }}>
            {[ { c: "India", f: "🇮🇳", p: 42 }, { c: "United States", f: "🇺🇸", p: 28 }, { c: "Singapore", f: "🇸🇬", p: 15 }, { c: "Germany", f: "🇩🇪", p: 9 }, { c: "Brazil", f: "🇧🇷", p: 6 }].map((loc, i) => (
              <div key={i} className="location-row">
                <span className="loc-flag">{loc.f}</span>
                <div style={{ width: '100px' }}>{loc.c}</div>
                <div className="loc-bar-bg">
                  <motion.div className="loc-bar-fill" initial={{ width: 0 }} whileInView={{ width: `${loc.p}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.5 }} />
                </div>
                <span className="loc-pct">{loc.p}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Model Accuracy */}
        <motion.div className="intel-card glass-panel" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
          <div className="intel-header">Ensemble Model Accuracy</div>
          <div className="accuracy-container">
            <svg viewBox="0 0 36 36" className="circular-chart">
              <defs>
                <linearGradient id="accGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
              </defs>
              <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <motion.path 
                className="circle circle-gradient" 
                strokeDasharray="100, 100"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                initial={{ strokeDashoffset: 100 }}
                whileInView={{ strokeDashoffset: 0.6 }} // 99.4%
                viewport={{ once: true }}
                transition={{ duration: 2, ease: "easeOut" }}
              />
              <text x="18" y="20.35" className="percentage">99.4%</text>
            </svg>
            <div className="acc-label">Confidence Interval</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// --- Features Section ---
function FeaturesSection() {
  const feats = [
    { i: "🎣", t: "AI Phishing Detection", d: "Identify sophisticated zero-day phishing sites before they appear on any blocklist." },
    { i: "💳", t: "UPI Fraud Detection", d: "Analyze transaction velocity, location anomalies, and behavioral risk in real-time." },
    { i: "🔬", t: "Explainable AI (SHAP)", d: "Never guess why a decision was made. View exact feature contributions for every scan." },
    { i: "⚡", t: "Real-Time Intelligence", d: "Sub-100ms inference times powered by edge caching and optimized models." },
    { i: "🧠", t: "Machine Learning Ensemble", d: "6 parallel models (XGBoost, LightGBM, CatBoost) working in concert." },
    { i: "📊", t: "Enterprise Dashboard", d: "Comprehensive analytics, threat history, and risk trend visualization." }
  ];

  return (
    <section id="features" className="features-section">
      <div className="text-center">
        <h2 className="section-heading">Security Without Compromise</h2>
      </div>
      <div className="features-grid">
        {feats.map((f, i) => (
          <motion.div key={i} className="feature-card glass-panel" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
            <div className="feat-icon">{f.i}</div>
            <div className="feat-title">{f.t}</div>
            <div className="feat-desc">{f.d}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// --- Pipeline Timeline ---
function PipelineTimeline() {
  const steps = ["Suspicious Request (URL/UPI)", "Feature Extraction (Lexical, Host, Velocity)", "Machine Learning Inference", "SHAP Value Computation", "Real-Time Verdict & Protection"];
  
  return (
    <section className="pipeline-section">
      <h2 className="section-heading">The Detection Pipeline</h2>
      <p className="section-sub mx-auto">How SentinelAI secures a transaction in under 80 milliseconds.</p>
      
      <div className="timeline-container">
        {steps.map((step, i) => (
          <motion.div key={i} className="timeline-step" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }}>
            <div className="step-box glass-panel">{step}</div>
            {i < steps.length - 1 && <div className="step-arrow">↓</div>}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// --- Tech Stack ---
function TechStack() {
  const tech = ["Python", "FastAPI", "React", "PostgreSQL", "Redis", "Docker", "XGBoost", "LightGBM", "CatBoost", "SHAP"];
  return (
    <section className="stack-section">
      <h2 className="section-heading" style={{ fontSize: '2rem' }}>Powered by the Modern AI Stack</h2>
      <div className="stack-grid">
        {tech.map((t, i) => (
          <motion.div key={i} className="stack-badge" whileHover={{ scale: 1.05 }}>{t}</motion.div>
        ))}
      </div>
    </section>
  );
}

// --- Comparison Section ---
function ComparisonSection() {
  return (
    <section className="compare-section">
      <h2 className="section-heading text-center">Why SentinelAI</h2>
      <div className="compare-grid">
        <div className="compare-col col-trad glass-panel">
          <div className="comp-title">Traditional Security</div>
          <ul className="comp-list trad">
            <li>Rule-based static blocklists</li>
            <li>No explainability (Black Box)</li>
            <li>High false positive rate</li>
            <li>Slow detection of zero-days</li>
            <li>Siloed data analysis</li>
          </ul>
        </div>
        <div className="compare-col col-ai glass-panel">
          <div className="comp-title">SentinelAI</div>
          <ul className="comp-list ai">
            <li>Dynamic AI-powered detection</li>
            <li>Full SHAP explainability</li>
            <li>Precision ensemble scoring</li>
            <li>Real-time zero-day prevention</li>
            <li>Contextual threat intelligence</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  useEffect(() => { document.title = "SentinelAI | Enterprise AI Security"; }, []);

  return (
    <main className="landing-root">
      <BackgroundMesh />
      <HeroSection />
      <StatisticsBar />
      <LiveIntelligence />
      <FeaturesSection />
      <PipelineTimeline />
      <ComparisonSection />
      <TechStack />
      <div style={{ height: "100px" }}></div>
    </main>
  );
}
