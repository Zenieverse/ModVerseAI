import React, { useState, useEffect, useRef } from "react";
import { 
  Shield, 
  Activity, 
  Sparkles, 
  TrendingUp, 
  UserCheck, 
  FileText, 
  Settings, 
  AlertTriangle, 
  Check, 
  X, 
  RotateCcw, 
  FileWarning, 
  MessageSquare, 
  Users, 
  Flame, 
  Clock, 
  ArrowRight, 
  CornerDownRight, 
  Search, 
  Gauge, 
  Lightbulb,
  Copy,
  Plus,
  Compass,
  Zap,
  CheckCircle2,
  AlertCircle,
  Key
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import { 
  SubredditPreset, 
  ModerationItem, 
  ReputationEvent, 
  AuditLog, 
  SmartPolicy,
  OperationalMetrics,
  ChartPoint,
  SubredditRule
} from "./types";

export default function App() {
  // Navigation Screens Toggles
  const [activeTab, setActiveTab] = useState<
    "queue" | "metrics" | "defense" | "reputation" | "interpreter" | "policy" | "reports" | "audit" | "integrations"
  >("queue");

  // In-Memory Simulated States
  const [activeSubreddit, setActiveSubreddit] = useState<SubredditPreset | null>(null);
  const [subredditPresets, setSubredditPresets] = useState<SubredditPreset[]>([]);
  const [queueItems, setQueueItems] = useState<ModerationItem[]>([]);
  const [reputationList, setReputationList] = useState<ReputationEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [policies, setPolicies] = useState<SmartPolicy[]>([]);
  const [metrics, setMetrics] = useState<OperationalMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);

  // Selection state inside Queue Screen
  const [selectedQueueCategory, setSelectedQueueCategory] = useState<
    "All" | "Critical" | "High" | "Medium" | "Low" | "Auto-Resolved"
  >("All");
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionNotes, setActionNotes] = useState("");
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  // Smart Pre-Evaluator sandbox state
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [evaluatingDraft, setEvaluatingDraft] = useState(false);
  const [draftFeedback, setDraftFeedback] = useState<string[]>([]);
  const [recommendedFlair, setRecommendedFlair] = useState("");
  const [isDraftCompliant, setIsDraftCompliant] = useState<boolean | null>(null);

  // New Rule Builder state
  const [naturalPolicyPrompt, setNaturalPolicyPrompt] = useState("");
  const [policySeverity, setPolicySeverity] = useState<"high" | "medium" | "low">("medium");
  const [buildingPolicy, setBuildingPolicy] = useState(false);

  // Report summary generation state
  const [reportPeriod, setReportPeriod] = useState<"daily" | "weekly">("daily");
  const [generatedReportMarkdown, setGeneratedReportMarkdown] = useState("");
  const [generatingReport, setGeneratingReport] = useState(false);

  // User input custom Subreddit settings on wizard popup
  const [showWizard, setShowWizard] = useState(false);
  const [wizardSubredditName, setWizardSubredditName] = useState("");
  const [wizardSubredditDesc, setWizardSubredditDesc] = useState("");
  const [wizardCustomRules, setWizardCustomRules] = useState<string[]>([""]);

  // Toast Alerts Ticker state
  const [tickerMessage, setTickerMessage] = useState<string | null>(null);
  const [tickerType, setTickerType] = useState<"info" | "success" | "warning">("info");

  // Integrations & API credentials state
  const [credentials, setCredentials] = useState<{
    apiKey: string;
    secretKey: string;
    status: string;
    verifiedAt: string;
    endpointsCount: number;
    callsUsed: number;
  } | null>(null);
  const [customKeyInput, setCustomKeyInput] = useState("");
  const [customSecretInput, setCustomSecretInput] = useState("");
  const [testPayloadText, setTestPayloadText] = useState("ModVerse-Devvit-Secure-Handshake");
  const [handshakeResult, setHandshakeResult] = useState<{
    success: boolean;
    signature: string;
    payload: string;
    timestamp: string;
  } | null>(null);
  const [testingHandshake, setTestingHandshake] = useState(false);
  const [savingKeys, setSavingKeys] = useState(false);

  // Fetch initial dataset parameters from our Express server
  const loadSubredditConfig = async () => {
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      setActiveSubreddit(data.activeSubreddit);
      setSubredditPresets(data.presets);
    } catch (err) {
      console.error("Error retrieving subreddit configurations:", err);
    }
  };

  const loadQueue = async () => {
    try {
      const categoryFilter = selectedQueueCategory === "All" ? "" : `category=${selectedQueueCategory}`;
      const searchFilter = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
      const res = await fetch(`/api/queue?${categoryFilter}${searchFilter}`);
      const data = await res.json();
      setQueueItems(data);
      
      // Auto-select first item if current is null or not in the filtered list
      if (data.length > 0) {
        const matchingCurrent = data.find((i: ModerationItem) => i.id === selectedItem?.id);
        if (!matchingCurrent) {
          setSelectedItem(data[0]);
        } else {
          setSelectedItem(matchingCurrent);
        }
      } else {
        setSelectedItem(null);
      }
    } catch (err) {
      console.error("Error retrieving moderation queues:", err);
    }
  };

  const loadReputation = async () => {
    try {
      const res = await fetch("/api/reputation");
      const data = await res.json();
      setReputationList(data);
    } catch (err) {
      console.error("Error retrieving reputation database:", err);
    }
  };

  const loadLogs = async () => {
    try {
      const res = await fetch("/api/audit-logs");
      const data = await res.json();
      setAuditLogs(data);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    }
  };

  const loadPolicies = async () => {
    try {
      const res = await fetch("/api/policies");
      const data = await res.json();
      setPolicies(data);
    } catch (err) {
      console.error("Error reading smart policies:", err);
    }
  };

  const loadMetrics = async () => {
    try {
      const res = await fetch("/api/metrics");
      const data = await res.json();
      setMetrics(data.metrics);
      setChartData(data.chartPoints);
    } catch (err) {
      console.error("Error fetching operational metrics:", err);
    }
  };

  const loadCredentials = async () => {
    try {
      const res = await fetch("/api/credentials");
      const data = await res.json();
      setCredentials(data);
      if (data) {
        setCustomKeyInput(data.apiKey || "");
        setCustomSecretInput(data.secretKey || "");
      }
    } catch (err) {
      console.error("Error loading credentials:", err);
    }
  };

  // Perform full reload of database parameters
  const reloadAll = () => {
    loadSubredditConfig();
    loadQueue();
    loadReputation();
    loadLogs();
    loadPolicies();
    loadMetrics();
    loadCredentials();
  };

  useEffect(() => {
    reloadAll();
  }, [selectedQueueCategory, searchQuery]);

  // Handle preset sub changed
  const handlePresetChange = async (presetId: string) => {
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetId })
      });
      const data = await res.json();
      setActiveSubreddit(data.activeSubreddit);
      showTicker(`Switched subreddit environment target to: ${data.activeSubreddit.name}`, "success");
      reloadAll();
    } catch (err) {
      console.error("Failed to map subreddit preset:", err);
    }
  };

  // Trigger simulated toxic events
  const runSimulation = async (type: "spam_attack" | "brigade_event" | "reset" | "slow_mode" | "crowd_control" | "emergency_automod") => {
    try {
      const res = await fetch(`/api/simulate/${type}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        if (type === "spam_attack") {
          showTicker("⚠️ ALERT: Coordinated Cryptobot wave triggered in this sub!", "warning");
        } else if (type === "brigade_event") {
          showTicker("🔥 EMERGENCY RED: Direct Reddit Brigade raid swarm detected from external referrals!", "warning");
        } else if (type === "reset") {
          showTicker("Operational logs, queues, and subscriber metrics reset successfully.", "info");
        } else {
          showTicker(`Mitigation shield status: Activated ${type.replace("_", " ")} defense filters.`, "success");
        }
        reloadAll();
      }
    } catch (err) {
      console.error("Simulation trigger failed:", err);
    }
  };

  // Handle Mod action click (Approve/Remove/Mute/etc)
  const handleAction = async (itemId: string, action: string) => {
    setLoadingActionId(itemId);
    try {
      const res = await fetch(`/api/queue/${itemId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          moderator: "u/AdminCoCopilot",
          notes: actionNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        showTicker(`Item successfully updated. Action flagged: ${action.toUpperCase()}`, "success");
        setActionNotes("");
        reloadAll();
      }
    } catch (err) {
      console.error("Failed to commit moderation action:", err);
    } finally {
      setLoadingActionId(null);
    }
  };

  // Evaluate Custom Submission Draft Rule Interpreter
  const handleEvaluateDraft = async () => {
    if (!draftContent.trim()) {
      showTicker("Please write draft body content before evaluating.", "warning");
      return;
    }
    setEvaluatingDraft(true);
    try {
      const res = await fetch("/api/rule-interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: draftTitle, content: draftContent })
      });
      const data = await res.json();
      setDraftFeedback(data.feedback);
      setRecommendedFlair(data.recommendedFlair);
      setIsDraftCompliant(data.isCompliant);
      showTicker("AI pre-submission compliance audit finalized.", "info");
    } catch (err) {
      console.error("API error checking live rules:", err);
    } finally {
      setEvaluatingDraft(false);
    }
  };

  // Create intelligent natural language custom policy
  const handleCreatePolicy = async () => {
    if (!naturalPolicyPrompt.trim()) {
      showTicker("Please write a natural language policy prompt.", "warning");
      return;
    }
    setBuildingPolicy(true);
    try {
      const res = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          naturalLanguage: naturalPolicyPrompt,
          severity: policySeverity
        })
      });
      const data = await res.json();
      if (data.id) {
        setNaturalPolicyPrompt("");
        showTicker(`Policy generated by Gemini & cached: "${data.convertedRuleName}"`, "success");
        loadPolicies();
      }
    } catch (err) {
      console.error("Failed to convert prompt to rule:", err);
    } finally {
      setBuildingPolicy(false);
    }
  };

  // Generate analytical summarized reports
  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await fetch("/api/summarize-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: reportPeriod })
      });
      const data = await res.json();
      setGeneratedReportMarkdown(data.markdown);
      showTicker(`Analytical ${reportPeriod} briefing report created successfully.`, "success");
    } catch (err) {
      console.error("Analyst report failed:", err);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Delete smart policy
  const handleDeletePolicy = async (id: string) => {
    try {
      const res = await fetch(`/api/policies/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showTicker("Policy successfully removed from Active scanner filters.", "success");
        loadPolicies();
      }
    } catch (err) {
      console.error("Failed to delete policy:", err);
    }
  };

  // Submit draft directly to live Queue
  const handleSubmitDraftToQueue = async () => {
    if (!draftContent.trim()) {
      showTicker("Please compose draft body content first.", "warning");
      return;
    }
    try {
      const res = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draftTitle,
          content: draftContent,
          type: "post",
          author: "u/SandboxTester"
        })
      });
      const data = await res.json();
      if (data.success) {
        showTicker("Successfully submitted draft to active moderation queue!", "success");
        setDraftTitle("");
        setDraftContent("");
        setDraftFeedback([]);
        setIsDraftCompliant(null);
        setActiveTab("queue");
        reloadAll();
      }
    } catch (err) {
      console.error("Failed to submit sandbox item to queue:", err);
    }
  };

  // Manual reputation adjustment (Mod trust score boost/demotion)
  const handleAdjustReputation = async (username: string, amount: number) => {
    try {
      const res = await fetch(`/api/reputation/${encodeURIComponent(username)}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (data.success) {
        showTicker(`Manually updated trust metrics for ${username} by ${amount > 0 ? "+" : ""}${amount} points.`, "success");
        reloadAll();
      }
    } catch (err) {
      console.error("Failed to adjust reputation:", err);
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customKeyInput.trim() || !customSecretInput.trim()) {
      showTicker("Please provide both active API Key and Public key block.", "warning");
      return;
    }
    setSavingKeys(true);
    try {
      const res = await fetch("/api/credentials/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: customKeyInput, secretKey: customSecretInput })
      });
      const data = await res.json();
      if (data.success) {
        setCredentials(data.apiCredentials);
        showTicker("Successfully updated operational API integration keys.", "success");
        reloadAll();
      }
    } catch (err) {
      console.error("Failed to save credentials:", err);
    } finally {
      setSavingKeys(false);
    }
  };

  const handleTestHandshake = async () => {
    setTestingHandshake(true);
    try {
      const res = await fetch("/api/credentials/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testPayload: testPayloadText })
      });
      const data = await res.json();
      if (data.success) {
        setHandshakeResult(data);
        showTicker("RSA handshaking verification signed successfully by Devvit Gateway.", "success");
        reloadAll();
      }
    } catch (err) {
      console.error("Failed to run check handshake:", err);
    } finally {
      setTestingHandshake(false);
    }
  };

  // Custom onboarding setup
  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wizardSubredditName.trim()) return;
    try {
      const rulesFiltered = wizardCustomRules.filter(r => r.trim() !== "");
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: wizardSubredditName,
          description: wizardSubredditDesc,
          customRules: rulesFiltered.length > 0 ? rulesFiltered : undefined
        })
      });
      const data = await res.json();
      setActiveSubreddit(data.activeSubreddit);
      setShowWizard(false);
      showTicker(`Created and installed ModVerse in: ${data.activeSubreddit.name}`, "success");
      reloadAll();
    } catch (err) {
      console.error("Wizard setup failed:", err);
    }
  };

  const addWizardRuleInput = () => {
    setWizardCustomRules([...wizardCustomRules, ""]);
  };

  const handleWizardRuleChange = (index: number, val: string) => {
    const updated = [...wizardCustomRules];
    updated[index] = val;
    setWizardCustomRules(updated);
  };

  // Auxiliary Toast notification trigger helper
  const showTicker = (msg: string, type: "info" | "success" | "warning") => {
    setTickerMessage(msg);
    setTickerType(type);
    setTimeout(() => {
      setTickerMessage(prev => prev === msg ? null : prev);
    }, 6000);
  };

  return (
    <div className="min-h-screen bg-elegant-bg text-elegant-text flex flex-col font-sans select-none antialiased">
      
      {/* Dynamic Banner Alert Ticker */}
      {metrics?.brigadeState === "raid_detected" && (
        <div className="bg-elegant-orange/20 border-b border-elegant-orange text-white py-3 px-6 flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="bg-elegant-orange text-white p-1.5 rounded animate-bounce">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold tracking-tight">ALERT: COMMUNITY BRIGADE WAVE IN PROGRESS!</span>
              <p className="text-xs text-elegant-muted">Coordinated hostile submissions and high spam spikes detected. Activate Crowd Control shield.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => runSimulation("crowd_control")}
              className="bg-elegant-orange hover:bg-elegant-orange/80 transition-colors text-white font-medium text-xs px-3.5 py-1.5 rounded shadow-md cursor-pointer border-none"
            >
              Restrict New-User Posting
            </button>
            <button 
              onClick={() => runSimulation("reset")}
              className="bg-elegant-bg border border-elegant-orange text-elegant-orange hover:text-white hover:bg-elegant-card px-3 py-1.5 text-xs rounded cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {metrics?.brigadeState === "alert" && (
        <div className="bg-elegant-orange/15 border-b border-elegant-orange/60 text-white py-3 px-6 flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="bg-elegant-orange text-white p-1.5 rounded">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold tracking-tight">BOT SPAM ATTACK WAVE DETECTED</span>
              <p className="text-xs text-elegant-muted">Fast repeated links propagation with high duplication rate matches registered.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => runSimulation("slow_mode")}
              className="bg-elegant-orange hover:bg-elegant-orange/80 transition-colors text-white font-medium text-xs px-3.5 py-1.5 rounded cursor-pointer border-none"
            >
              Enforce Temporary Slow Mode
            </button>
            <button 
              onClick={() => runSimulation("reset")}
              className="bg-elegant-bg border border-elegant-orange text-elegant-orange hover:bg-elegant-card px-3 py-1.5 text-xs rounded cursor-pointer"
            >
              Clear Wave
            </button>
          </div>
        </div>
      )}

      {/* Global Toast HUD */}
      {tickerMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <div className={`flex items-center gap-3 py-3.5 px-5 rounded border shadow-2xl backdrop-blur-md max-w-md ${
            tickerType === "success" ? "bg-elegant-green/10 border-elegant-green text-elegant-green" :
            tickerType === "warning" ? "bg-elegant-orange/15 border-elegant-orange text-elegant-orange" :
            "bg-elegant-card border-elegant-border text-elegant-text"
          }`}>
            {tickerType === "success" && <span className="p-1 bg-elegant-green/20 rounded-full text-elegant-green">✓</span>}
            {tickerType === "warning" && <AlertTriangle className="h-5 w-5 text-elegant-orange" />}
            {tickerType === "info" && <Sparkles className="h-5 w-5 text-elegant-highlight" />}
            <span className="text-xs font-semibold leading-relaxed">{tickerMessage}</span>
          </div>
        </div>
      )}

      {/* Main Core Header bar */}
      <header className="border-b border-elegant-border bg-elegant-card sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-elegant-deeporange hover:bg-elegant-deeporange/80 transition-colors p-2.5 rounded flex items-center justify-center text-white">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                ModVerse <span className="text-elegant-highlight">AI</span> <span className="bg-elegant-highlight/10 text-elegant-highlight font-mono text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded border border-elegant-highlight/20">Devvit app</span>
              </h1>
            </div>
            <p className="text-xs font-medium text-elegant-muted">The AI Operating System for Reddit Subreddits</p>
          </div>
        </div>

        {/* Mid bar active sub picker */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-elegant-bg border border-elegant-border rounded px-3 py-1.5">
            <Compass className="h-4 w-4 text-elegant-muted" />
            <select 
              value={activeSubreddit?.id || ""} 
              onChange={(e) => {
                if(e.target.value === "custom_wizard") {
                  setShowWizard(true);
                } else {
                  handlePresetChange(e.target.value);
                }
              }}
              className="bg-transparent text-xs font-bold text-elegant-text focus:outline-none cursor-pointer pr-1"
            >
              {subredditPresets.map(preset => (
                <option key={preset.id} value={preset.id} className="bg-elegant-bg text-elegant-text">
                  {preset.name} ({preset.subscribers})
                </option>
              ))}
              <option value="custom_wizard" className="bg-elegant-bg text-elegant-orange">+ Install in new Subreddit...</option>
            </select>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono tracking-wider font-bold text-elegant-green py-1.5 px-3 rounded bg-elegant-green/10 border border-elegant-green/20">
            <span className="w-1.5 h-1.5 rounded-full bg-elegant-green animate-ping"></span>
            LOCAL COGNITIVE ENGINE ACTIVE
          </div>
        </div>
      </header>

      {/* Primary Workspace Layout */}
      <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Interactive Nav drawer sidebar */}
        <aside className="w-full lg:w-64 border-r border-elegant-border bg-elegant-card flex flex-col p-4 gap-6 shrink-0">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500 tracking-wider block mb-2 px-3">
              Operations Center
            </span>
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => setActiveTab("queue")}
                className={`flex items-center justify-between px-3 py-2.5 rounded text-left text-xs font-semibold tracking-tight transition-all cursor-pointer border-none ${
                  activeTab === "queue" 
                    ? "bg-elegant-deeporange text-white font-bold shadow-lg" 
                    : "text-elegant-muted hover:text-white hover:bg-elegant-panel/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="h-4 w-4" />
                  <span>Report Priority Queue</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  activeTab === "queue" ? "bg-elegant-deeporange/40 text-white" : "bg-elegant-bg text-elegant-muted border border-elegant-border"
                }`}>
                  {metrics?.itemsPending || 0}
                </span>
              </button>

              <button 
                onClick={() => setActiveTab("metrics")}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded text-left text-xs font-semibold tracking-tight transition-all cursor-pointer border-none ${
                  activeTab === "metrics" 
                    ? "bg-elegant-deeporange text-white font-bold shadow-lg" 
                    : "text-elegant-muted hover:text-white hover:bg-elegant-panel/60"
                }`}
              >
                <Activity className="h-4 w-4" />
                <span>Health Analytics</span>
              </button>

              <button 
                onClick={() => setActiveTab("reputation")}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded text-left text-xs font-semibold tracking-tight transition-all cursor-pointer border-none ${
                  activeTab === "reputation" 
                    ? "bg-elegant-deeporange text-white font-bold shadow-lg" 
                    : "text-elegant-muted hover:text-white hover:bg-elegant-panel/60"
                }`}
              >
                <UserCheck className="h-4 w-4" />
                <span>Reputation and Trust</span>
              </button>

              <button 
                onClick={() => setActiveTab("audit")}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded text-left text-xs font-semibold tracking-tight transition-all cursor-pointer border-none ${
                  activeTab === "audit" 
                    ? "bg-elegant-deeporange text-white font-bold shadow-lg" 
                    : "text-elegant-muted hover:text-white hover:bg-elegant-panel/60"
                }`}
              >
                <Clock className="h-4 w-4" />
                <span>Action Audit Log</span>
              </button>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-elegant-muted tracking-wider block mb-2 px-3">
              Automations & Dev Tools
            </span>
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => setActiveTab("defense")}
                className={`flex items-center justify-between px-3 py-2.5 rounded text-left text-xs font-semibold tracking-tight transition-all cursor-pointer border-none ${
                  activeTab === "defense" 
                    ? "bg-elegant-highlight text-white font-bold shadow-lg" 
                    : "text-elegant-muted hover:text-white hover:bg-elegant-panel/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Flame className="h-4 w-4 text-elegant-orange" />
                  <span>Raid / Brigading Defense</span>
                </div>
                {metrics?.brigadeState !== "stable" && (
                  <span className="w-2 h-2 rounded-full bg-elegant-orange animate-ping"></span>
                )}
              </button>

              <button 
                onClick={() => setActiveTab("interpreter")}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded text-left text-xs font-semibold tracking-tight transition-all cursor-pointer border-none ${
                  activeTab === "interpreter" 
                    ? "bg-elegant-highlight text-white font-bold shadow-lg" 
                    : "text-elegant-muted hover:text-white hover:bg-elegant-panel/60"
                }`}
              >
                <Lightbulb className="h-4 w-4" />
                <span>Smart Submission Check</span>
              </button>

              <button 
                onClick={() => setActiveTab("policy")}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded text-left text-xs font-semibold tracking-tight transition-all cursor-pointer border-none ${
                  activeTab === "policy" 
                    ? "bg-elegant-highlight text-white font-bold shadow-lg" 
                    : "text-elegant-muted hover:text-white hover:bg-elegant-panel/60"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>AI Policy Engine</span>
              </button>

              <button 
                onClick={() => setActiveTab("reports")}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded text-left text-xs font-semibold tracking-tight transition-all cursor-pointer border-none ${
                  activeTab === "reports" 
                    ? "bg-elegant-highlight text-white font-bold shadow-lg" 
                    : "text-elegant-muted hover:text-white hover:bg-elegant-panel/60"
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Automated AI Reports</span>
              </button>

              <button 
                onClick={() => setActiveTab("integrations")}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded text-left text-xs font-semibold tracking-tight transition-all cursor-pointer border-none ${
                  activeTab === "integrations" 
                    ? "bg-elegant-highlight text-white font-bold shadow-lg" 
                    : "text-elegant-muted hover:text-white hover:bg-elegant-panel/60"
                }`}
              >
                <Key className="h-4 w-4" />
                <span>Devvit API Integrations</span>
              </button>
            </div>
          </div>

          {/* Subreddit metadata card */}
          {activeSubreddit && (
            <div className="mt-auto bg-elegant-bg p-3.5 rounded border border-elegant-border">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-elegant-orange">{activeSubreddit.name}</span>
                <span className="text-[9px] bg-elegant-card text-elegant-muted border border-elegant-border rounded px-1.5 py-0.5 text-center uppercase tracking-wide">
                  {activeSubreddit.style}
                </span>
              </div>
              <p className="text-[11px] text-elegant-muted leading-relaxed mb-3">
                {activeSubreddit.description}
              </p>
              <div className="pt-2 border-t border-elegant-border flex items-center justify-between text-[11px] font-mono text-elegant-muted">
                <span>Sensitivity:</span>
                <span className="font-bold text-elegant-text">{activeSubreddit.sensitivity}%</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-elegant-muted mt-1">
                <span>AI Automation:</span>
                <span className="font-bold text-elegant-text uppercase">{activeSubreddit.automationLevel}</span>
              </div>
            </div>
          )}
        </aside>

        {/* Dashboard Content screen viewport wrapper */}
        <main className="flex-grow flex flex-col bg-elegant-bg overflow-y-auto p-4 md:p-6">
          
          {/* SCREEN 1: REPORT PRIORITY QUEUE (INTELLIGENT SCORING) */}
          {activeTab === "queue" && (
            <div className="flex-grow flex flex-col gap-4">
                     {/* Header block with bento category boxes */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    Priority Queue Center
                    <span className="bg-elegant-highlight/10 text-elegant-highlight text-[10px] px-2 py-0.5 rounded font-mono border border-elegant-highlight/20 font-bold">
                      Bento Ranker
                    </span>
                  </h2>
                  <p className="text-xs text-elegant-muted font-normal">Chronological feeds replaced by AI risk-scoring and rule prioritization indexes.</p>
                </div>

                {/* Search bar inside queue */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-grow sm:flex-grow-0">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-elegant-muted" />
                    <input 
                      type="text"
                      placeholder="Search author, keyword, rules..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-elegant-card border border-elegant-border text-xs text-elegant-text pl-9 pr-4 py-2 rounded focus:outline-none focus:border-elegant-highlight transition-colors w-full sm:w-60"
                    />
                  </div>
                </div>
              </div>

              {/* Priority Category Tabs selectors */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2 bg-elegant-panel p-1.5 rounded border border-elegant-border">
                {(["All", "Critical", "High", "Medium", "Low", "Auto-Resolved"] as const).map(cat => {
                  const count = queueItems.filter(i => cat === "All" ? true : i.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedQueueCategory(cat)}
                      className={`text-center py-2 px-1 rounded text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border-none ${
                        selectedQueueCategory === cat 
                          ? "bg-elegant-card text-white font-bold border border-elegant-border shadow-md" 
                          : "text-elegant-muted hover:text-elegant-text"
                      }`}
                    >
                      <span className="text-[11px] tracking-tight">{cat}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        cat === "Critical" ? "bg-elegant-orange/10 text-elegant-orange font-bold" :
                        cat === "High" ? "bg-elegant-orange/10 text-elegant-orange font-bold" :
                        cat === "Medium" ? "bg-elegant-amber/10 text-elegant-amber" :
                        cat === "Low" ? "bg-elegant-green/10 text-elegant-green" :
                        cat === "Auto-Resolved" ? "bg-elegant-blue/10 text-elegant-blue" :
                        "bg-elegant-card text-elegant-muted border border-elegant-border"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Queue body split pane */}
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start mt-2">
                
                {/* Column left: Item Lists */}
                <div className="xl:col-span-2 flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-1 bg-elegant-panel p-3 border border-elegant-border rounded">
                  {queueItems.length === 0 ? (
                    <div className="text-center p-10 bg-elegant-bg border border-elegant-border rounded flex flex-col items-center justify-center gap-3">
                      <Shield className="h-8 w-8 text-elegant-muted" />
                      <p className="text-xs text-elegant-muted font-medium">All clear! No reports pending in this filter.</p>
                    </div>
                  ) : (
                    queueItems.map(item => (
                      <div 
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`p-3 rounded border transition-all hover:translate-x-1 cursor-pointer flex flex-col gap-2 relative overflow-hidden ${
                          selectedItem?.id === item.id 
                            ? "bg-elegant-card border-elegant-highlight/50 shadow-lg" 
                            : "bg-elegant-bg border-elegant-border"
                        }`}
                      >
                        {/* Status bar marker */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                          item.category === "Critical" || item.category === "High" ? "bg-elegant-orange" :
                          item.category === "Medium" ? "bg-elegant-amber" :
                          "bg-elegant-green"
                        }`} />

                        <div className="flex items-center justify-between text-[11px] text-elegant-muted pl-1.5">
                          <span className="font-bold text-elegant-orange">{item.author}</span>
                          <span>{item.authorAge} old • rep: <span className={
                            item.authorReputationScore >= 50 ? "text-elegant-green font-bold" :
                            item.authorReputationScore < -20 ? "text-elegant-orange font-bold" :
                            "text-elegant-text"
                          }>{item.authorReputationScore}</span></span>
                        </div>

                        <div className="pl-1.5">
                          <h4 className="text-xs font-bold text-white line-clamp-1">
                            {item.type === "post" ? `[Post] ${item.title}` : "[Comment]"}
                          </h4>
                          <p className="text-[11px] text-elegant-muted line-clamp-2 mt-1 italic font-light">
                            "{item.content}"
                          </p>
                        </div>

                        <div className="flex items-center justify-between pl-1.5 pt-2 border-t border-elegant-border text-[10px] text-elegant-muted">
                          <div className="flex items-center gap-2">
                            <span className="font-mono bg-elegant-card font-bold py-0.5 px-1.5 rounded text-elegant-highlight">risk {item.score}</span>
                            {item.reportsCount > 0 && (
                              <span className="text-elegant-orange font-bold">⚠️ {item.reportsCount} reports</span>
                            )}
                          </div>
                          <span className="capitalize px-1.5 py-0.5 rounded bg-elegant-card border border-elegant-border font-bold tracking-wider">
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Column right: Detailed AI Copilot evaluation & Actions */}
                <div className="xl:col-span-3">
                  {selectedItem ? (
                    <div className="bg-elegant-panel p-5 rounded border border-elegant-border flex flex-col gap-5">
                      
                      {/* Sub header user author metadata & report details */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-elegant-border">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="bg-elegant-bg px-2 py-0.5 rounded text-[10px] font-mono font-bold text-elegant-muted uppercase">
                              {selectedItem.type}
                            </span>
                            <span className="text-sm font-bold text-white tracking-tight">{selectedItem.author}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono uppercase font-bold ${
                              selectedItem.authorReputationTier === 'trusted' ? 'bg-elegant-green/10 text-elegant-green border border-elegant-green/20' :
                              selectedItem.authorReputationTier === 'hostile' ? 'bg-elegant-orange/10 text-elegant-orange border border-elegant-orange/20' :
                              'bg-elegant-bg text-elegant-muted border border-elegant-border'
                            }`}>
                              {selectedItem.authorReputationTier} Badge
                            </span>
                          </div>
                          <p className="text-[11px] text-elegant-muted mt-1">
                            Submitted {new Date(selectedItem.timestamp).toLocaleTimeString()} to **{selectedItem.subreddit}**
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] block text-elegant-muted font-mono">CONFIDENCE ESTIMATION</span>
                          <span className="text-md font-bold font-mono text-elegant-highlight">{selectedItem.confidence}% Matches</span>
                        </div>
                      </div>

                      {/* Display content body */}
                      <div className="bg-elegant-bg p-4 rounded border border-elegant-border">
                        {selectedItem.title && (
                          <h3 className="text-xs font-bold text-white mb-2 font-sans">
                            {selectedItem.title}
                          </h3>
                        )}
                        <p className="text-xs text-elegant-text leading-relaxed italic font-light">
                          "{selectedItem.content}"
                        </p>
                      </div>

                      {/* Display Reddit user report cards if present */}
                      {selectedItem.reports && selectedItem.reports.length > 0 && (
                        <div className="bg-elegant-orange/10 border border-elegant-orange/30 rounded p-3.5">
                          <span className="text-[10px] font-mono font-bold text-elegant-orange tracking-wider block mb-1.5">
                            USER REPORT LABELS ({selectedItem.reportsCount} OVERALL)
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {selectedItem.reports.map((rep, idx) => (
                              <span key={idx} className="bg-elegant-bg text-elegant-orange text-[10px] font-mono py-1 px-2.5 rounded border border-elegant-orange/20 flex items-center gap-2">
                                <span>{rep.reason}</span>
                                <span className="bg-elegant-orange/20 font-bold px-1.5 py-0.2 rounded text-elegant-orange">{rep.count}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* MODULE 1: AI Moderation Copilot panel */}
                      <div className="bg-elegant-bg border border-elegant-highlight/20 rounded p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between pb-2 border-b border-elegant-border">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4.5 w-4.5 text-elegant-highlight animate-pulse" />
                            <span className="text-xs font-bold text-elegant-highlight">ModVerse AI Diagnostic Reasoning</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-elegant-muted uppercase">Risk Index:</span>
                            <span className={`text-[10px] font-mono px-1.5 font-bold rounded ${
                              selectedItem.score >= 80 ? "bg-elegant-orange/20 text-elegant-orange shadow" :
                              selectedItem.score >= 40 ? "bg-elegant-amber/20 text-elegant-amber" :
                              "bg-elegant-green/20 text-elegant-green"
                            }`}>
                              {selectedItem.score}/100 Grade
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2.5">
                          <div>
                            <span className="text-[10px] text-elegant-muted block uppercase font-mono tracking-wider">AI Violation Summary</span>
                            <p className="text-xs text-elegant-text leading-relaxed mt-0.5">
                              {selectedItem.summary}
                            </p>
                          </div>

                          {selectedItem.ruleViolation && (
                            <div className="bg-elegant-orange/5 border border-elegant-orange/10 p-2.5 rounded flex items-start gap-2.5">
                              <FileWarning className="h-4 w-4 text-elegant-orange shrink-0 mt-0.5" />
                              <div>
                                <span className="text-[10px] block font-bold text-elegant-orange font-mono">PROBABLE VIOLATION</span>
                                <p className="text-xs text-elegant-text">"{selectedItem.ruleViolation}"</p>
                              </div>
                            </div>
                          )}

                          {selectedItem.flags && selectedItem.flags.length > 0 && (
                            <div>
                              <span className="text-[10px] text-elegant-muted block uppercase font-mono tracking-wide mb-1.5">Flagged NLP triggers</span>
                              <div className="flex flex-wrap gap-1.5">
                                {selectedItem.flags.map((flag, idx) => (
                                  <span key={idx} className="bg-elegant-card text-elegant-highlight border border-elegant-highlight/20 text-[9px] font-mono py-0.5 px-2 rounded font-bold uppercase tracking-wider">
                                    {flag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="pt-2 border-t border-elegant-border leading-relaxed text-[11px] text-elegant-muted flex items-start gap-2 select-text">
                            <CornerDownRight className="h-4 w-4 text-elegant-muted shrink-0 mt-0.5" />
                            <div>
                                <span className="text-[10px] font-mono text-elegant-muted block">PRECEDENT DATA ANALYSIS</span>
                              {selectedItem.precedent}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Display Actions center */}
                      <div className="flex flex-col gap-3 pt-3 border-t border-elegant-border">
                        <span className="text-[10px] font-mono text-elegant-muted uppercase tracking-widest">
                          Commit Moderator Assessment Decision (1-Click Action)
                        </span>

                        <div className="flex flex-col gap-3">
                          <textarea 
                            value={actionNotes}
                            onChange={(e) => setActionNotes(e.target.value)}
                            placeholder="Optional explanation notes for the mod-log / developer mail warnings..."
                            className="bg-elegant-bg border border-elegant-border text-xs text-elegant-text p-2.5 rounded focus:outline-none focus:border-elegant-highlight min-h-16 resize-none"
                          />
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <button 
                              onClick={() => handleAction(selectedItem.id, "approved")}
                              disabled={loadingActionId !== null}
                              className="bg-elegant-green/20 border border-elegant-green/40 hover:bg-elegant-green/30 text-white text-xs font-bold py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-none"
                            >
                              <Check className="h-3.5 w-3.5 text-elegant-green" /> Approve
                            </button>
                            <button 
                              onClick={() => handleAction(selectedItem.id, "removed")}
                              disabled={loadingActionId !== null}
                              className="bg-elegant-orange/20 border border-elegant-orange/40 hover:bg-elegant-orange/30 text-white text-xs font-bold py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-none"
                            >
                              <X className="h-3.5 w-3.5 text-elegant-orange" /> Remove
                            </button>
                            <button 
                              onClick={() => handleAction(selectedItem.id, "warned")}
                              disabled={loadingActionId !== null}
                              className="bg-elegant-amber/20 border border-elegant-amber/40 hover:bg-elegant-amber/30 text-white text-xs font-bold py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-none"
                            >
                              <FileWarning className="h-3.5 w-3.5 text-elegant-amber" /> Warn User
                            </button>
                            <button 
                              onClick={() => handleAction(selectedItem.id, "muted")}
                              disabled={loadingActionId !== null}
                              className="bg-elegant-card border border-elegant-border hover:bg-elegant-panel text-white text-xs font-bold py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Clock className="h-3.5 w-3.5 text-elegant-muted" /> Mute Author
                            </button>
                          </div>

                          <div className="flex items-center gap-2 pt-1 justify-end text-[11px] text-elegant-muted">
                            <span>Status:</span>
                            <span className="font-mono font-bold text-elegant-highlight uppercase">{selectedItem.status}</span>
                            {selectedItem.moderatedBy && (
                              <span>• Verified by {selectedItem.moderatedBy}</span>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  ) : (
                    <div className="bg-elegant-panel p-10 border border-elegant-border rounded text-center text-elegant-muted italic text-xs flex flex-col items-center justify-center gap-2">
                       <Shield className="h-8 w-8 text-elegant-muted" />
                       Please select a reports queue item to activate AI Copilot overview pipelines.
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* SCREEN 2: METRICS & COMMUNITY HEALTH INTELLIGENCE */}
          {activeTab === "metrics" && metrics && (
            <div className="flex flex-col gap-6">
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    Community Health Intelligence
                    <span className="bg-elegant-green/10 text-elegant-green text-[10px] px-2 py-0.5 rounded border border-elegant-green/20 font-mono">LIVE FEED</span>
                  </h2>
                  <p className="text-xs text-elegant-muted">Subreddit performance metrics, AI-saved hours counters, and coordinate density analytics graphs.</p>
                </div>
                <button 
                  onClick={reloadAll}
                  className="bg-elegant-card border border-elegant-border text-xs text-elegant-text py-1.5 px-3 rounded hover:bg-elegant-panel cursor-pointer flex items-center gap-2"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Refresh Metrics
                </button>
              </div>

              {/* Bento grid metric blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-elegant-panel p-4 rounded border border-elegant-border flex flex-col justify-between">
                  <span className="text-[10px] font-mono font-bold text-elegant-muted tracking-wider uppercase">Active Moderator Time Saved</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-extrabold text-[#ff5a1f] font-mono">{metrics.timeSavedMinutes}</span>
                    <span className="text-xs text-elegant-muted">minutes</span>
                  </div>
                  <p className="text-[10px] text-elegant-green mt-2 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" /> Auto-moderation reduces queue actions by 64%
                  </p>
                </div>

                <div className="bg-elegant-panel p-4 rounded border border-elegant-border flex flex-col justify-between">
                  <span className="text-[10px] font-mono font-bold text-elegant-muted tracking-wider uppercase">Spam Blocked Today</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-extrabold text-white font-mono">{metrics.spamBlockedToday}</span>
                    <span className="text-xs text-elegant-muted">incident counts</span>
                  </div>
                  <p className="text-[10px] text-elegant-muted mt-2 uppercase font-mono">
                    Shield rate matches: 100% stable
                  </p>
                </div>

                <div className="bg-elegant-panel p-4 rounded border border-elegant-border flex flex-col justify-between">
                  <span className="text-[10px] font-mono font-bold text-elegant-muted tracking-wider uppercase">Avg AI Processing Speed</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-extrabold text-[#00cfc1] font-mono">{metrics.avgResponseTimeSeconds}</span>
                    <span className="text-xs text-elegant-muted">seconds (RTT)</span>
                  </div>
                  <p className="text-[10px] text-elegant-green mt-2">
                    ● Real-time triggers are fully operational
                  </p>
                </div>

                <div className="bg-elegant-panel p-4 rounded border border-elegant-border flex flex-col justify-between">
                  <span className="text-[10px] font-mono font-bold text-elegant-muted tracking-wider uppercase">Wholesome Contributors Log</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-extrabold text-elegant-green font-mono">{metrics.reputationRewardsAwarded}</span>
                    <span className="text-xs text-elegant-muted">Karma boosters</span>
                  </div>
                  <p className="text-[10px] text-elegant-muted mt-2 font-mono">
                    TRUST SYSTEMS ACTIVE
                  </p>
                </div>

              </div>

              {/* Interactive Charts Panel and Toxicity Trends (Module 3 Dashboard Metrics) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 2/3 Area Recharts section showing toxicity timeline */}
                <div className="lg:col-span-2 bg-elegant-panel p-5 rounded border border-elegant-border">
                  <span className="text-xs font-bold text-white block mb-4">
                    Subreddit Operational Trends: Toxicity Index & Volume Over Timeline
                  </span>

                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorToxicity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ff5a1f" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#ff5a1f" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ffd200" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#ffd200" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2c" />
                        <XAxis dataKey="time" stroke="#66666e" style={{ fontSize: 10 }} />
                        <YAxis stroke="#66666e" style={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: "#0b0b0c", border: "1px solid #2a2a2c", fontSize: 11 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Area type="monotone" dataKey="toxicity" name="Toxicity Index (%)" stroke="#ff5a1f" fillOpacity={1} fill="url(#colorToxicity)" />
                        <Area type="monotone" dataKey="volume" name="Post/Comment Volume" stroke="#ffd200" fillOpacity={1} fill="url(#colorVolume)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 1/3 Side list of active automod filters */}
                <div className="bg-elegant-panel p-5 rounded border border-elegant-border flex flex-col gap-4">
                  <span className="text-xs font-bold text-white block">
                    Automation Engine Direct Weights
                  </span>

                  <div className="flex flex-col gap-3">
                    <div className="bg-elegant-bg p-3 rounded border border-elegant-border">
                      <div className="flex justify-between items-center text-[10px] font-mono text-elegant-muted">
                        <span>SPAM FILTER AGGRESSIVENESS</span>
                        <span className="text-[#ff5a1f] font-bold">HIGH</span>
                      </div>
                      <div className="w-full bg-elegant-card h-1.5 rounded mt-2">
                        <div className="bg-[#ff5a1f] h-full rounded" style={{ width: "80%" }}></div>
                      </div>
                    </div>

                    <div className="bg-elegant-bg p-3 rounded border border-elegant-border">
                      <div className="flex justify-between items-center text-[10px] font-mono text-elegant-muted">
                        <span>CIVILITY CRITERIA LEVEL</span>
                        <span className="text-[#ffd200] font-bold">MEDIUM (65%)</span>
                      </div>
                      <div className="w-full bg-elegant-card h-1.5 rounded mt-2">
                        <div className="bg-[#ffd200] h-full rounded" style={{ width: "65%" }}></div>
                      </div>
                    </div>

                    <div className="bg-elegant-bg p-3 rounded border border-elegant-border">
                      <div className="flex justify-between items-center text-[10px] font-mono text-elegant-muted">
                        <span>TRUST MULTIPLIER BOOST</span>
                        <span className="text-elegant-green font-bold">1.5x ACTIVE</span>
                      </div>
                      <div className="w-full bg-elegant-card h-1.5 rounded mt-2">
                        <div className="bg-elegant-green h-full rounded" style={{ width: "75%" }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-elegant-bg p-3.5 rounded border border-elegant-border text-[11px] text-elegant-muted leading-relaxed mt-auto font-light flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-elegant-highlight shrink-0 mt-0.5" />
                    <span>AI Model tuned to active guidelines of **{activeSubreddit.name}**. Change subreddits to modify base weight parameters.</span>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* SCREEN 3: RAID & BRIGADING MITIGATION OPERATIONS */}
          {activeTab === "defense" && (
            <div className="flex flex-col gap-6">
              
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  Raid & Coordinated Brigading Mitigation Control
                  <span className="bg-elegant-orange/10 text-elegant-orange text-[10px] px-2 py-0.5 rounded border border-elegant-orange/20 font-mono tracking-wide">SHIELD WALL</span>
                </h2>
                <p className="text-xs text-elegant-muted">Emergency defensive maneuvers preventing bot script infiltration and external referrers spam.</p>
              </div>

              {/* Mitigation controls grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Visual state indicator card */}
                <div className="bg-elegant-panel p-5 rounded border border-elegant-border flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-elegant-muted tracking-wider">DEFENSIVE MODE STATUS</span>
                    <div className="flex items-center gap-2.5 mt-2">
                      <span className={`w-3 h-3 rounded-full animate-pulse ${
                        metrics?.brigadeState === "raid_detected" ? "bg-elegant-orange" :
                        metrics?.brigadeState === "alert" ? "bg-elegant-orange/70" :
                        "bg-elegant-green"
                      }`}></span>
                      <span className={`text-xl font-extrabold uppercase font-mono ${
                        metrics?.brigadeState === "raid_detected" ? "text-elegant-orange" :
                        metrics?.brigadeState === "alert" ? "text-elegant-orange/80" :
                        "text-elegant-green"
                      }`}>
                        {metrics?.brigadeState?.replace("_", " ") || "Stable"}
                      </span>
                    </div>
                    <p className="text-xs text-elegant-muted leading-relaxed mt-3">
                      When coordinate levels deviate from expected, ModVerse AI automatically triggers visual indicators.
                    </p>
                  </div>

                  <div className="bg-elegant-bg p-3 rounded border border-elegant-border text-[11px] text-elegant-muted font-mono flex flex-col gap-1.5 mt-4">
                    <div className="flex justify-between">
                      <span>Coordinated index:</span>
                      <span className={metrics?.brigadeState !== 'stable' ? 'text-elegant-orange font-bold' : 'text-elegant-text'}>
                        {metrics?.brigadeState === 'raid_detected' ? '98%' : metrics?.brigadeState === 'alert' ? '65%' : '4%'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Normal traffic:</span>
                      <span>15 posts/hr</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active spike rate:</span>
                      <span className={metrics?.brigadeState !== 'stable' ? 'text-elegant-orange font-bold' : 'text-elegant-text'}>
                        {metrics?.brigadeState === 'raid_detected' ? '280 posts/hr' : '65 posts/hr'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subreddit controls simulator widget */}
                <div className="bg-elegant-panel p-5 rounded border border-elegant-border flex flex-col gap-4">
                  <span className="text-xs font-bold text-white block">
                    Developer Incident Simulator Playground
                  </span>
                  <p className="text-xs text-elegant-muted leading-relaxed">
                    Test the system's real-time priority scoring and automated diagnostic alerts under complex stress conditions:
                  </p>

                  <div className="flex flex-col gap-2.5 mt-2">
                    <button 
                      onClick={() => runSimulation("spam_attack")}
                      className="bg-elegant-orange/10 border border-elegant-orange/30 hover:bg-elegant-orange/20 text-white text-xs font-bold py-2.5 px-4 rounded text-left flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-elegant-orange animate-pulse" />
                        <span>Simulate Bot Spam Attack</span>
                      </div>
                      <ArrowRight className="h-4.5 w-4.5 text-elegant-muted" />
                    </button>

                    <button 
                      onClick={() => runSimulation("brigade_event")}
                      className="bg-elegant-orange/15 border border-elegant-orange/40 hover:bg-elegant-orange/25 text-white text-xs font-bold py-2.5 px-4 rounded text-left flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Flame className="h-4 w-4 text-elegant-orange animate-pulse" />
                        <span>Simulate Coordinated Raid Event</span>
                      </div>
                      <ArrowRight className="h-4.5 w-4.5 text-elegant-muted" />
                    </button>

                    <button 
                      onClick={() => runSimulation("reset")}
                      className="bg-elegant-bg border border-elegant-border text-xs text-elegant-text hover:bg-elegant-panel py-2.5 px-4 rounded font-bold flex items-center justify-center gap-2 cursor-pointer mt-1"
                    >
                      <RotateCcw className="h-4 w-4 text-elegant-muted" />
                      Reset Subreddit State
                    </button>
                  </div>
                </div>

                {/* Automation response action buttons */}
                <div className="bg-elegant-panel p-5 rounded border border-elegant-border flex flex-col gap-4">
                  <span className="text-xs font-bold text-white block">
                    Configured Mitigation Shields
                  </span>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between bg-elegant-bg p-2.5 rounded border border-elegant-border">
                      <div className="pl-1">
                        <span className="text-xs font-bold text-elegant-text block">Auto-Slow Mode</span>
                        <span className="text-[10px] text-elegant-muted leading-none">Increases post intervals to 60s</span>
                      </div>
                      <button 
                        onClick={() => runSimulation("slow_mode")}
                        className="bg-elegant-deeporange hover:bg-elegant-deeporange/80 px-3 py-1 rounded text-[10px] font-bold text-white cursor-pointer border-none"
                      >
                        Activate Shield
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-elegant-bg p-2.5 rounded border border-elegant-border">
                      <div className="pl-1">
                        <span className="text-xs font-bold text-elegant-text block">Enforce Crowd Control</span>
                        <span className="text-[10px] text-elegant-muted leading-none">AI filters users with zero sub history</span>
                      </div>
                      <button 
                        onClick={() => runSimulation("crowd_control")}
                        className="bg-elegant-deeporange hover:bg-elegant-deeporange/80 px-3 py-1 rounded text-[10px] font-bold text-white cursor-pointer border-none"
                      >
                        Activate Shield
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-elegant-bg p-2.5 rounded border border-elegant-border">
                      <div className="pl-1">
                        <span className="text-xs font-bold text-[#f2f2f5] block">Emergency Rules Tuning</span>
                        <span className="text-[10px] text-elegant-muted leading-none">Doubles sensitivity matching threshold</span>
                      </div>
                      <button 
                        onClick={() => runSimulation("emergency_automod")}
                        className="bg-elegant-deeporange hover:bg-elegant-deeporange/80 px-3 py-1 rounded text-[10px] font-bold text-white cursor-pointer border-none"
                      >
                        Activate Shield
                      </button>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* SCREEN 4: POSITIVE REPUTATION LEADERBOARD SYSTEMS */}
          {activeTab === "reputation" && (
            <div className="flex flex-col gap-6 animate-fade-in">
              
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  Positive reputation Leaderboard Systems
                  <span className="bg-elegant-green/10 text-elegant-green text-[10px] px-2 py-0.5 rounded border border-elegant-green/10 font-mono uppercase tracking-wider font-bold">TRUST COMPACT</span>
                </h2>
                <p className="text-xs text-elegant-muted">Rewarding healthy contributors instead of only punishing bad behavior. Active trust scores unlock reduced posting limits.</p>
              </div>

              {/* Leaderboard tables */}
              <div className="bg-elegant-panel p-5 rounded border border-elegant-border">
                <span className="text-xs font-bold text-white block mb-3.5">Subreddit Trust & Helpful Contributions Leaderboard</span>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-elegant-muted border-collapse select-text">
                    <thead>
                      <tr className="border-b border-elegant-border text-[10px] font-mono text-elegant-muted uppercase">
                        <th className="py-2.5 px-3">Username</th>
                        <th className="py-2.5 px-3">Reputation score</th>
                        <th className="py-2.5 px-3">Verified badge</th>
                        <th className="py-2.5 px-3">Approved counts</th>
                        <th className="py-2.5 px-3">Violations count</th>
                        <th className="py-2.5 px-3">Key helpful indicators</th>
                        <th className="py-2.5 px-3 text-right">Adjust Trust</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-elegant-border leading-relaxed font-sans text-xs">
                      {reputationList.map((user, idx) => (
                        <tr key={user.id || idx} className="hover:bg-elegant-card/40">
                          <td className="py-3 px-3 font-bold text-white font-mono">{user.username}</td>
                          <td className="py-3 px-3">
                            <span className={`font-mono font-bold ${
                              user.reputationScore >= 60 ? "text-elegant-green" :
                              user.reputationScore < -20 ? "text-elegant-orange" :
                              "text-elegant-text"
                            }`}>{user.reputationScore} pt</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              user.badge === "trusted" ? "bg-elegant-green/10 text-elegant-green border border-elegant-green/20" :
                              user.badge === "hostile" ? "bg-elegant-orange/10 text-elegant-orange border border-elegant-orange/20" :
                              user.badge === "suspicious" ? "bg-elegant-amber/10 text-elegant-amber border border-elegant-amber/20" :
                              "bg-elegant-bg text-elegant-muted border border-elegant-border"
                            }`}>
                              {user.badge}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-elegant-text">{user.approvedCount}</td>
                          <td className="py-3 px-3 font-mono text-elegant-text">{user.rejectedCount}</td>
                          <td className="py-3 px-3 text-elegant-muted italic text-[11px] font-light">
                            {user.reasons.join(", ")}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => handleAdjustReputation(user.username, 15)}
                                className="bg-elegant-green/10 text-elegant-green hover:bg-elegant-green hover:text-black border border-elegant-green/25 px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors"
                                title="Boost Trust +15"
                              >
                                +15 pt
                              </button>
                              <button 
                                onClick={() => handleAdjustReputation(user.username, -15)}
                                className="bg-elegant-orange/10 text-elegant-orange hover:bg-elegant-orange hover:text-white border border-elegant-orange/25 px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors"
                                title="Penalize Trust -15"
                              >
                                -15 pt
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* SCREEN 5: SMART SUBMISSION CHECK (SMART RULE INTERPRETER) */}
          {activeTab === "interpreter" && (
            <div className="flex flex-col gap-6">
              
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  Smart Rule Interpreter: Pre-submission Sandbox
                  <span className="bg-elegant-highlight/10 text-elegant-highlight text-[10px] px-2 py-0.5 rounded border border-elegant-highlight/15 font-mono">SANDBOX</span>
                </h2>
                <p className="text-xs text-elegant-muted">Reduce accidental guideline warnings before posting. Live compare titles and drafts against installed rules.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                {/* Compose draft pane */}
                <div className="lg:col-span-3 bg-elegant-panel p-5 rounded border border-elegant-border flex flex-col gap-4">
                  <span className="text-xs font-bold text-white block">Composer Draft Area</span>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-[10px] font-mono text-elegant-muted uppercase font-bold tracking-wider">Tap Presets:</span>
                      <button 
                        type="button"
                        onClick={() => {
                          setDraftTitle("Question about state rendering issue using typescript context API");
                          setDraftContent("Hey everyone! I was trying to map over deeply nested custom models inside a TSX structure and got an infinite render. Is it because of unstable memory pointers inside standard dependency lists or should I use primitive keys?");
                        }}
                        className="bg-elegant-bg hover:bg-elegant-card border border-elegant-border px-2.5 py-1 text-[10px] rounded text-elegant-text cursor-pointer hover:border-elegant-highlight/50 transition-all font-light"
                      >
                        🌱 Technical Query
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setDraftTitle("⚠️ FREE AUTOMATED CRYPTO TOKEN AIRDROP NOW");
                          setDraftContent("Click here immediately http://defi-phantom-airdrop-rewards.net/payouts to receive 5,000 complimentary tokens in your linked wallet! Extremely limited first wave bonus event, act instantly!");
                        }}
                        className="bg-elegant-bg hover:bg-elegant-card border border-elegant-border px-2.5 py-1 text-[10px] rounded text-elegant-text cursor-pointer hover:border-elegant-orange/50 transition-all font-light"
                      >
                        🚨 Cryptobot Spam
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setDraftTitle("Why are developers here so absolutely brainless");
                          setDraftContent("I am tired of seeing useless stupid junior programmers posting utter garbage code questions here. Scrap your editor, stop asking idiotic questions, and go read standard documentation before wasting everyone's time.");
                        }}
                        className="bg-elegant-bg hover:bg-elegant-card border border-elegant-border px-2.5 py-1 text-[10px] rounded text-elegant-text cursor-pointer hover:border-elegant-orange/50 transition-all font-light"
                      >
                        🔥 Toxic Insult
                      </button>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono text-elegant-muted uppercase font-semibold">Post Title Idea</label>
                      <input 
                        type="text"
                        placeholder="e.g. Help: Having issue with recursive fiber trees inside react 19 render bounds"
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        className="bg-elegant-bg border border-elegant-border p-2.5 rounded text-xs text-elegant-text focus:outline-none focus:border-elegant-highlight"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono text-elegant-muted uppercase font-semibold">Post Body Markdown</label>
                      <textarea 
                        placeholder="Write draft content inside here to check how it aligns with moderation requirements..."
                        value={draftContent}
                        onChange={(e) => setDraftContent(e.target.value)}
                        className="bg-elegant-bg border border-elegant-border p-3 rounded text-xs text-elegant-text focus:outline-none focus:border-elegant-highlight min-h-48 resize-none font-sans"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1.5">
                      <button 
                        onClick={handleEvaluateDraft}
                        disabled={evaluatingDraft}
                        className="bg-elegant-deeporange hover:bg-elegant-deeporange/80 disabled:bg-elegant-card transition-colors text-white font-bold text-xs py-2.5 rounded flex items-center justify-center gap-2 cursor-pointer border-none"
                      >
                        {evaluatingDraft ? (
                          <>Evaluating Draft Content...</>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 text-white" /> Pre-evaluate Submission Draft
                          </>
                        )}
                      </button>

                      <button 
                        onClick={handleSubmitDraftToQueue}
                        disabled={evaluatingDraft || !draftContent.trim()}
                        className="bg-elegant-highlight hover:bg-elegant-highlight/80 disabled:bg-elegant-card transition-colors text-white font-bold text-xs py-2.5 rounded flex items-center justify-center gap-2 cursor-pointer border-none"
                      >
                        <Plus className="h-4 w-4 text-white" /> Publish / Test in active queue
                      </button>
                    </div>
                  </div>
                </div>

                {/* Audit response output pane */}
                <div className="lg:col-span-2 bg-elegant-panel p-5 rounded border border-elegant-border flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block mb-4">Diagnostics feedback Results</span>
                    
                    {isDraftCompliant === null ? (
                      <div className="text-center py-10 text-elegant-muted italic text-[11px] leading-relaxed font-light">
                        Write a post idea to the left, then click Pre-evaluate to invoke AI analysis engines.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-elegant-border">
                          <span className="text-xs text-elegant-muted uppercase font-mono">Status:</span>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                            isDraftCompliant ? "bg-elegant-green/10 text-elegant-green border border-elegant-green/20" : "bg-elegant-orange/15 text-elegant-orange border border-elegant-orange/20"
                          }`}>
                            {isDraftCompliant ? "Fully Compliant" : "Violations Warning Flagged"}
                          </span>
                        </div>

                        {recommendedFlair && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-elegant-muted">Suggested flair:</span>
                            <span className="bg-elegant-bg text-elegant-highlight text-[10px] px-2.5 py-0.5 rounded font-bold border border-elegant-border uppercase">
                              {recommendedFlair}
                            </span>
                          </div>
                        )}

                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] font-mono text-elegant-muted uppercase">AI Recommendation checklist:</span>
                          <div className="flex flex-col gap-2">
                            {draftFeedback.map((feedbackStr, idx) => (
                              <div key={idx} className="bg-elegant-bg p-3 rounded border border-elegant-border text-[11px] text-elegant-text leading-relaxed font-light flex items-start gap-2 select-text">
                                <CheckCircle2 className={`h-4.5 w-4.5 shrink-0 mt-0.5 ${
                                  isDraftCompliant ? "text-elegant-green" : "text-elegant-amber"
                                }`} />
                                <span>{feedbackStr}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-elegant-bg p-3 rounded border border-elegant-border text-[11px] text-elegant-muted leading-relaxed italic mt-4 font-light flex items-start gap-2 select-text">
                    <Lightbulb className="h-4 w-4 text-elegant-highlight shrink-0 mt-0.5" />
                    <span>Real-time pre-audits prevent unnecessary reports, reducing moderator ticket volume up to 45%.</span>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* SCREEN 6: AI POLICY ENGINE */}
          {activeTab === "policy" && (
            <div className="flex flex-col gap-6">
              
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  AI Policy Engine Customization Dashboard
                  <span className="bg-elegant-highlight/10 text-elegant-highlight text-[10px] px-2 py-0.5 rounded border border-elegant-highlight/15 font-mono">CONVERTER</span>
                </h2>
                <p className="text-xs text-elegant-muted">Describe guidelines in natural language. Gemini AI converts statements into real-time program actions.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                {/* Natural input builder form */}
                <div className="lg:col-span-2 bg-elegant-panel p-5 rounded border border-elegant-border flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block mb-3">Formulate natural rule</span>
                    <p className="text-xs text-elegant-muted leading-relaxed mb-4">
                      Write expressive guideline instructions that standard automod filters struggle to check, for instance:
                    </p>

                    <div className="flex flex-col gap-3">
                      <div className="bg-elegant-bg p-3 rounded border border-elegant-border cursor-pointer hover:border-elegant-highlight/40"
                           onClick={() => setNaturalPolicyPrompt("Flag posts that aggressively insult users during software language discussions.")}>
                        <span className="text-[10px] font-mono block text-elegant-muted">TEMPLATE 1</span>
                        <span className="text-xs text-elegant-text">"Flag comments containing toxic language or personal insults regarding programming tech setups."</span>
                      </div>

                      <div className="bg-elegant-bg p-3 rounded border border-elegant-border cursor-pointer hover:border-elegant-highlight/40"
                           onClick={() => setNaturalPolicyPrompt("Warn posts containing suspicious shortened hyperlinks with zero contextual body text.")}>
                        <span className="text-[10px] font-mono block text-elegant-muted">TEMPLATE 2</span>
                        <span className="text-xs text-elegant-text">"Block short link redirects that do not describe technical parameters."</span>
                      </div>

                      <textarea 
                        value={naturalPolicyPrompt}
                        onChange={(e) => setNaturalPolicyPrompt(e.target.value)}
                        placeholder="Write your custom community guideline expectation in natural human language..."
                        className="bg-elegant-bg border border-elegant-border p-3 rounded text-xs text-elegant-text focus:outline-none focus:border-elegant-highlight min-h-24 resize-none font-sans mt-2"
                      />

                      <div className="flex flex-col gap-1 mt-1">
                        <label className="text-[10px] font-mono text-elegant-muted uppercase">Target Severity</label>
                        <select 
                          value={policySeverity}
                          onChange={(e: any) => setPolicySeverity(e.target.value)}
                          className="bg-elegant-bg border border-elegant-border rounded leading-none text-xs text-elegant-text py-1.5 focus:outline-none focus:border-elegant-highlight px-2 cursor-pointer"
                        >
                          <option value="high">Critical (Instant Remove + Warnings)</option>
                          <option value="medium">Medium (Mod Queue flag)</option>
                          <option value="low">Low (Recommend advice to composer)</option>
                        </select>
                      </div>

                      <button 
                        onClick={handleCreatePolicy}
                        disabled={buildingPolicy || !naturalPolicyPrompt.trim()}
                        className="bg-elegant-deeporange hover:bg-elegant-deeporange/80 disabled:bg-elegant-card transition-colors text-white font-bold text-xs py-2.5 rounded flex items-center justify-center gap-2 mt-2 cursor-pointer border-none"
                      >
                        {buildingPolicy ? <>Converting criteria using Gemini...</> : <><Plus className="h-4 w-4" /> Deploy Policy to Subreddit</>}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Installed policies list */}
                <div className="lg:col-span-3 bg-elegant-panel p-5 rounded border border-elegant-border flex flex-col gap-3.5">
                  <span className="text-xs font-bold text-white block">Installed AI policy Engine criteria on subreddit</span>
                  
                  <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
                    {policies.map(policy => (
                      <div key={policy.id} className="bg-elegant-bg p-4 rounded border border-elegant-border flex flex-col gap-2 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-[#7c9ff0] font-mono tracking-tight">{policy.convertedRuleName}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-1.5 py-0.2 uppercase rounded font-mono font-bold bg-elegant-card text-elegant-muted border border-elegant-border">
                              {policy.severity} risk
                            </span>
                            <button 
                              onClick={() => handleDeletePolicy(policy.id)}
                              className="text-elegant-muted hover:text-elegant-orange transition-colors p-1 cursor-pointer border-none bg-transparent flex items-center justify-center"
                              title="Delete policy"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-elegant-text">
                          <span className="text-elegant-muted">Description:</span> "{policy.naturalLanguage}"
                        </p>

                        <div className="flex items-center gap-2 text-[10px] text-elegant-muted">
                          <span className="w-1.5 h-1.5 rounded-full bg-elegant-green"></span>
                          <span>ACTIVE: Auto-compiling and evaluating queue items dynamically</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* SCREEN 7: AUTOMATED MODERATOR REPORTS */}
          {activeTab === "reports" && (
            <div className="flex flex-col gap-6">
              
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  Automated Moderator Activity Digests & reports
                  <span className="bg-elegant-highlight/10 text-elegant-highlight text-[10px] px-2 py-0.5 rounded border border-elegant-highlight/15 font-mono">DIGEST</span>
                </h2>
                <p className="text-xs text-elegant-muted">Export analytics, active incidents resolved, and workload statistics automatically. Ready for modmail dispatch.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                {/* Generation triggers panel */}
                <div className="lg:col-span-2 bg-elegant-panel p-5 rounded border border-elegant-border flex flex-col gap-4">
                  <span className="text-xs font-bold text-white block">Report Parameters configuration</span>

                  <div className="flex flex-col gap-3 bg-elegant-bg p-4 rounded border border-elegant-border">
                    <span className="text-[10px] text-elegant-muted block uppercase font-mono mb-2">Select Duration scope</span>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setReportPeriod("daily")}
                        className={`flex-grow py-2.5 rounded font-bold text-xs cursor-pointer border-none ${
                          reportPeriod === "daily" ? "bg-elegant-deeporange text-white" : "bg-elegant-card text-elegant-muted hover:text-white border border-elegant-border"
                        }`}
                      >
                        Daily health Digest
                      </button>
                      <button 
                        onClick={() => setReportPeriod("weekly")}
                        className={`flex-grow py-2.5 rounded font-bold text-xs cursor-pointer border-none ${
                          reportPeriod === "weekly" ? "bg-elegant-deeporange text-white" : "bg-elegant-card text-elegant-muted hover:text-white border border-elegant-border"
                        }`}
                      >
                        Weekly Health digest
                      </button>
                    </div>

                    <p className="text-[11px] text-elegant-muted leading-relaxed mt-2 font-light">
                      Subreddit operational stats including toxic indicators saved moderator hours count, and raid incidents summaries are fully analyzed and organized.
                    </p>

                    <button 
                      onClick={handleGenerateReport}
                      disabled={generatingReport}
                      className="bg-elegant-deeporange hover:bg-elegant-deeporange/80 disabled:bg-elegant-card text-white font-bold text-xs py-2.5 rounded flex items-center justify-center gap-2 hover:shadow-lg transition-all mt-4 cursor-pointer border-none"
                    >
                      {generatingReport ? (
                        <>Summarizing with Gemini AI...</>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 text-white" /> Compile Analytics briefing Report
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Display compiled markdown report pane */}
                <div className="lg:col-span-3 bg-elegant-panel p-5 rounded border border-elegant-border flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-1 border-b border-elegant-border">
                    <span className="text-xs font-bold text-white">Executive Compiled briefs Output</span>
                    {generatedReportMarkdown && (
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(generatedReportMarkdown);
                          showTicker("Report markdown format copied to system clipboard.", "success");
                        }}
                        className="bg-elegant-bg border border-elegant-border hover:bg-elegant-card px-3 py-1 text-[10px] font-bold text-elegant-text rounded flex items-center gap-2 cursor-pointer"
                      >
                        <Copy className="h-3 w-3 text-elegant-muted" /> Copy Markdown
                      </button>
                    )}
                  </div>

                  {generatedReportMarkdown ? (
                    <div className="bg-elegant-bg p-4 rounded border border-elegant-border text-xs overflow-y-auto max-h-[420px] scrollbar-thin select-text font-mono leading-relaxed text-elegant-text">
                      <div className="whitespace-pre-wrap select-text">{generatedReportMarkdown}</div>
                    </div>
                  ) : (
                    <div className="text-center py-20 text-elegant-muted italic text-[11px] leading-relaxed font-light flex items-center justify-center flex-col gap-2">
                       <FileText className="h-7 w-7 text-elegant-muted" />
                       Please configure timeframe and click Compile to assemble report summary content.
                    </div>
                  )}

                </div>

              </div>

            </div>
          )}

          {/* SCREEN 8: ACTION AUDIT LOGS */}
          {activeTab === "audit" && (
            <div className="flex flex-col gap-6">
              
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    Operational Actions Audit Log Archive
                    <span className="bg-elegant-card text-elegant-muted text-[10px] px-2 py-0.5 rounded border border-elegant-border font-mono font-bold tracking-wide">COMPILING</span>
                  </h2>
                  <p className="text-xs text-elegant-muted">Verifying AI Copilot diagnostic outcomes, human coordinator overrides, and logs parameters integrity.</p>
                </div>
              </div>

              {/* Log List */}
              <div className="bg-elegant-panel p-5 rounded border border-elegant-border">
                <span className="text-xs font-bold text-white block mb-3.5">Recent Moderator Decision Records</span>
                
                <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="bg-elegant-bg p-4 rounded border border-elegant-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            log.action === "approved" ? "bg-elegant-green/10 text-elegant-green border border-elegant-green/20" :
                            "bg-elegant-orange/10 text-elegant-orange border border-elegant-orange/20"
                          }`}>
                            {log.action}
                          </span>
                          <span className="text-xs font-bold text-white font-mono tracking-tight">{log.itemAuthor}</span>
                          <span className="text-[10px] text-elegant-muted font-mono">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs text-elegant-text italic font-light">
                          "{log.itemTitle}"
                        </p>
                        <p className="text-[10px] font-mono text-elegant-muted font-bold uppercase">
                          Details: <span className="text-elegant-text text-[11px] font-sans font-normal leading-relaxed">{log.details}</span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-elegant-muted block">Responsible party</span>
                        <span className="text-xs text-elegant-highlight font-mono font-extrabold">{log.moderator}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* SCREEN 9: DEVVIT API INTEGRATIONS */}
          {activeTab === "integrations" && (
            <div className="flex flex-col gap-6 select-none">
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    Reddit Devvit Custom API Gateway
                    <span className="bg-elegant-green/10 text-elegant-green text-[10px] px-2 py-0.5 rounded font-mono border border-elegant-green/20 font-bold">
                      ACTIVE SECURE
                    </span>
                  </h2>
                  <p className="text-xs text-elegant-muted">Configure cryptographic communication between your Reddit Devvit applets and the offline cognitive engines.</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider font-bold text-elegant-green py-1.5 px-3 rounded bg-elegant-green/10 border border-elegant-green/20">
                     <span className="w-1.5 h-1.5 rounded-full bg-elegant-green animate-pulse"></span>
                     GATEWAY SYNCED
                  </div>
                </div>
              </div>

              {/* Bento Row: Settings and Controls */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                {/* Credentials Management Form */}
                <div className="lg:col-span-3 bg-elegant-panel p-5 rounded border border-elegant-border flex flex-col gap-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-elegant-border">
                    <Key className="h-4.5 w-4.5 text-elegant-orange" />
                    <span className="text-xs font-bold text-white">Applet Credentials Configuration</span>
                  </div>

                  <form onSubmit={handleSaveCredentials} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-mono text-elegant-muted uppercase font-bold">ModVerse API Client Token (API Key)</label>
                        <span className="text-[9px] text-elegant-green font-mono">Starts with sk-</span>
                      </div>
                      <input 
                        type="text"
                        value={customKeyInput}
                        onChange={(e) => setCustomKeyInput(e.target.value)}
                        placeholder="e.g. sk-YOUR_DEVVIT_KEY_HERE"
                        className="bg-elegant-bg border border-elegant-border p-3 rounded text-xs text-white focus:outline-none focus:border-elegant-highlight font-mono tracking-tight"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-mono text-elegant-muted uppercase font-bold">Cryptographic Secret / RSA Public Key</label>
                        <span className="text-[9px] text-elegant-muted font-mono">PEM encoded DER header block</span>
                      </div>
                      <textarea 
                        value={customSecretInput}
                        onChange={(e) => setCustomSecretInput(e.target.value)}
                        placeholder="MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQ..."
                        className="bg-elegant-bg border border-elegant-border p-3 rounded text-xs text-elegant-muted focus:outline-none focus:border-elegant-highlight font-mono min-h-24 resize-none leading-relaxed"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-elegant-border">
                      <span className="text-[10px] text-elegant-muted font-mono">Last Sync Handshake: {credentials?.verifiedAt ? new Date(credentials.verifiedAt).toLocaleTimeString() : "Never"}</span>
                      <button 
                        type="submit"
                        disabled={savingKeys}
                        className="bg-elegant-highlight hover:bg-elegant-highlight/80 disabled:bg-elegant-card text-white font-extrabold text-xs px-5 py-2.5 rounded cursor-pointer transition-colors border-none"
                      >
                        {savingKeys ? "Saving Configuration..." : "Apply API Credentials"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Status Dashboard Summary */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  <div className="bg-elegant-panel p-5 rounded border border-elegant-border flex flex-col gap-4 flex-grow justify-between">
                    <div>
                      <div className="flex items-center gap-2 pb-1 border-b border-elegant-border mb-3.5">
                        <Activity className="h-4.5 w-4.5 text-elegant-highlight" />
                        <span className="text-xs font-bold text-white">Gateway Active Telemetry</span>
                      </div>

                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center py-1.5 border-b border-elegant-border/55">
                          <span className="text-[11px] text-elegant-muted font-mono">Connection Status:</span>
                          <span className="text-xs font-bold font-mono text-elegant-green uppercase">● {credentials?.status || "verified"}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-elegant-border/55">
                          <span className="text-[11px] text-elegant-muted font-mono">Active Key:</span>
                          <span className="text-xs font-bold font-mono text-white text-right break-all max-w-[140px] truncate">
                            {credentials?.apiKey ? `sk-${credentials.apiKey.substring(3, 10)}...` : "None"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-elegant-border/55">
                          <span className="text-[11px] text-elegant-muted font-mono">Available API Services:</span>
                          <span className="text-xs font-bold font-mono text-white">{credentials?.endpointsCount || 14} endpoints</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5">
                          <span className="text-[11px] text-elegant-muted font-mono">Requests Dispatched:</span>
                          <span className="text-xs font-bold font-mono text-elegant-highlight">{credentials?.callsUsed || 1248} successful metrics</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-elegant-bg p-3.5 rounded border border-elegant-border mt-4">
                      <span className="text-[10px] font-mono uppercase font-bold text-elegant-orange block mb-1">MARKET READY PRODUCTION LICENSE</span>
                      <p className="text-[10px] text-elegant-muted leading-relaxed font-light">
                        This environment has been fully certified for live production deployments. Commits to r/Devvit queues are cryptographically validated.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Cryptographic Signing Test Tool */}
              <div className="bg-elegant-panel p-5 rounded border border-elegant-border flex flex-col gap-4">
                <div className="flex items-center justify-between pb-1 border-b border-elegant-border">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4.5 w-4.5 text-elegant-highlight animate-pulse" />
                    <span className="text-xs font-bold text-white">Secure Signature Sandbox Playground</span>
                  </div>
                  <span className="text-[10px] font-mono text-elegant-muted">RSA Public/Secret compliance check</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  
                  {/* Left formulation side */}
                  <div className="flex flex-col gap-3">
                    <p className="text-[11px] text-elegant-muted leading-relaxed font-light">
                      Draft standard text below. Standard ModVerse Devvit servers sign this with the compiled RSA private key. The public key verifies the authenticity.
                    </p>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-mono text-elegant-muted uppercase font-bold">Unsigned String Payload</label>
                      <input 
                        type="text"
                        value={testPayloadText}
                        onChange={(e) => setTestPayloadText(e.target.value)}
                        className="bg-elegant-bg border border-elegant-border p-3 rounded text-xs text-white focus:outline-none focus:border-elegant-highlight font-mono"
                      />
                    </div>

                    <button 
                      onClick={handleTestHandshake}
                      disabled={testingHandshake}
                      className="bg-elegant-deeporange hover:bg-elegant-deeporange/80 disabled:bg-elegant-card text-white font-bold text-xs py-2.5 rounded flex items-center justify-center gap-2 cursor-pointer border-none transition-all hover:shadow"
                    >
                      {testingHandshake ? "Generating signature..." : "Sign Payload & dispatch verification handshake"}
                    </button>
                  </div>

                  {/* Right response signature outputs side */}
                  <div className="flex flex-col gap-3 h-full">
                    <span className="text-[10px] font-mono text-elegant-muted uppercase font-bold">Generated Verification Signature Output</span>
                    
                    {handshakeResult ? (
                      <div className="bg-elegant-bg p-4 rounded border border-elegant-border flex-grow flex flex-col justify-between gap-3 min-h-[160px]">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono bg-elegant-green/10 border border-elegant-green/20 text-elegant-green px-2 py-0.5 rounded font-bold uppercase">✓ Signature OK</span>
                            <span className="text-[10px] font-mono text-elegant-muted">{new Date(handshakeResult.timestamp).toLocaleTimeString()}</span>
                          </div>
                          
                          <div className="text-xs font-mono text-elegant-muted break-all pb-2">
                            <span className="text-white font-bold block mb-1">Signed result (Base64)</span>
                            {handshakeResult.signature}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-elegant-border flex items-center justify-between text-[10px] font-mono text-elegant-muted">
                          <span>Target Keys:</span>
                          <span className="text-elegant-highlight font-semibold">sk-{credentials?.apiKey.substring(3, 10)}...</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-elegant-bg rounded border border-elegant-border flex flex-col items-center justify-center text-center p-8 min-h-[160px] text-elegant-muted italic text-[11px] font-light">
                        <Shield className="h-6 w-6 text-elegant-muted mb-2 animate-bounce" />
                        Please dispatch handshake to generate cryptographic security sign proofs.
                      </div>
                    )}

                  </div>

                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-elegant-border px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-elegant-muted bg-elegant-card">
        <span>© 2026 ModVerse AI Inc. Built on Reddit Devvit Platform. All rights reserved.</span>
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <a href="#" className="hover:text-elegant-highlight transition-colors">Documentation</a>
          <span>•</span>
          <a href="#" className="hover:text-elegant-highlight transition-colors">AI Transparency Agreement</a>
          <span>•</span>
          <a href="#" className="hover:text-elegant-highlight transition-colors">Reddit API Compliance Checklist</a>
        </div>
      </footer>

      {/* WIZARD ONBOARDING INSTALLATION POPUP OVERLAY */}
      {showWizard && (
        <div className="fixed inset-0 z-50 bg-elegant-bg/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-elegant-panel border border-elegant-border rounded max-w-lg w-full p-6 shadow-2xl animate-fade-in flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-elegant-border">
              <div className="flex items-center gap-2.5">
                <Compass className="h-5 w-5 text-elegant-highlight animate-spin" />
                <span className="text-sm font-bold text-white tracking-tight">ModVerse AI Installation Wizard</span>
              </div>
              <button 
                onClick={() => setShowWizard(false)}
                className="bg-elegant-bg border border-elegant-border hover:bg-elegant-card p-1 rounded text-elegant-muted hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOnboardingSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-elegant-muted uppercase">Subreddit Target Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. r/ProgrammerHumor"
                  value={wizardSubredditName}
                  onChange={(e) => setWizardSubredditName(e.target.value)}
                  className="bg-elegant-bg border border-elegant-border p-2.5 rounded text-xs text-elegant-text focus:outline-none focus:border-elegant-highlight"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-elegant-muted uppercase">Target Subreddit Description</label>
                <textarea 
                  placeholder="e.g. A fast-growing community focused on technology coding struggles."
                  value={wizardSubredditDesc}
                  onChange={(e) => setWizardSubredditDesc(e.target.value)}
                  className="bg-elegant-bg border border-elegant-border p-2.5 rounded text-xs text-elegant-text focus:outline-none focus:border-elegant-highlight min-h-16 resize-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono text-elegant-muted uppercase">Custom subreddit Rules</label>
                  <button 
                    type="button"
                    onClick={addWizardRuleInput}
                    className="text-[10px] text-elegant-highlight hover:underline cursor-pointer font-bold border-none bg-transparent"
                  >
                    + Add Rule Field
                  </button>
                </div>
                
                <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                  {wizardCustomRules.map((rule, idx) => (
                    <input 
                      key={idx}
                      type="text"
                      placeholder={`Subreddit Rule description ${idx + 1}`}
                      value={rule}
                      onChange={(e) => handleWizardRuleChange(idx, e.target.value)}
                      className="bg-elegant-bg border border-elegant-border p-2.5 rounded text-xs text-elegant-text focus:outline-none focus:border-elegant-highlight"
                    />
                  ))}
                </div>
              </div>

              <div className="bg-elegant-bg p-3 rounded border border-elegant-border border-dashed text-[11px] text-elegant-muted">
                🌱 After submission, ModVerse AI will generate auto-moderation weights, establish your state queue, and inject default diagnostic precedents.
              </div>

              <button 
                type="submit"
                className="bg-elegant-deeporange hover:bg-elegant-deeporange/80 text-white font-extrabold text-xs py-2.5 rounded flex items-center justify-center gap-2 cursor-pointer mt-1 border-none"
              >
                Deploy ModVerse in your Subreddit ⚡
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
