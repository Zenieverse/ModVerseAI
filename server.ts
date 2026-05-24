import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { 
  SubredditPreset, 
  ModerationItem, 
  ReputationEvent, 
  OperationalMetrics, 
  ChartPoint, 
  AuditLog, 
  SmartPolicy,
  ReportItem,
  ModerationStatus
} from "./src/types";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API Client successfully initialized.");
  } catch (err) {
    console.error("Failed to initialize Gemini API client:", err);
  }
} else {
  console.log("No GEMINI_API_KEY found. Running on highly polished offline fallback simulation mode.");
}

// Global In-Memory Subreddit Operations Database
let activeSubreddit: SubredditPreset = {
  id: "r-asktech",
  name: "r/AskTech",
  description: "A large high-growth community discussing modern software, gadgets, and programming questions.",
  subscribers: "1.4M members",
  style: "growth",
  automationLevel: "medium",
  sensitivity: 65,
  reputationSystemEnabled: true,
  rules: [
    { id: "rule-1", name: "No Spam or Self-Promotion", description: "Do not post promotional links, referral codes, or affiliate trackers. Self-made product links must follow 9-to-1 ratios.", severity: "high" },
    { id: "rule-2", name: "Be Civil & Respectful", description: "No toxic behavior, name-calling, slurs, doxxing, harassment, or flame-baiting.", severity: "high" },
    { id: "rule-3", name: "Descriptive Technical Questions", description: "Titles must clearly ask a question or formulate a hardware/software problem. Avoid vague or single-word headers.", severity: "medium" },
    { id: "rule-4", name: "Cite Sources & Verify Claims", description: "Provide valid technical citation or specify testing environments when stating disputed arguments.", severity: "low" }
  ]
};

// Available Presets
const SUBREDDIT_PRESETS: SubredditPreset[] = [
  {
    id: "r-asktech",
    name: "r/AskTech",
    description: "A large high-growth community discussing modern software, gadgets, and programming questions.",
    subscribers: "1.4M members",
    style: "growth",
    automationLevel: "medium",
    sensitivity: 65,
    reputationSystemEnabled: true,
    rules: [
      { id: "rule-1", name: "No Spam or Self-Promotion", description: "Do not post promotional links, referral codes, or affiliate trackers.", severity: "high" },
      { id: "rule-2", name: "Be Civil & Respectful", description: "No toxic behavior, name-calling, slurs, doxxing, harassment, or flame-baiting.", severity: "high" },
      { id: "rule-3", name: "Descriptive Technical Questions", description: "Titles must clearly ask a question. Avoid vague headers.", severity: "medium" },
      { id: "rule-4", name: "Cite Sources & Verify Claims", description: "Provide valid technical sources for contested claims.", severity: "low" }
    ]
  },
  {
    id: "r-blockchain",
    name: "r/BlockchainDeepDive",
    description: "A strict environment focused on cryptoeconomics and technology, frequently targeted by bots and scams.",
    subscribers: "420K members",
    style: "strict",
    automationLevel: "high",
    sensitivity: 85,
    reputationSystemEnabled: true,
    rules: [
      { id: "bc-rule-1", name: "No Scams, Airdrops or Shilling", description: "Strictly ban user tokens promotion, random bot address copy-pastes, and referral telegram links.", severity: "high" },
      { id: "bc-rule-2", name: "Original Technological Research", description: "Posts must dive deep into source protocols, consensus architectures, or mathematics.", severity: "high" },
      { id: "bc-rule-3", name: "No Low-Effort Price Chat", description: "No simple stock market tickers, pump charts, or emoji waves. Price talk is contained to weekly megathreads.", severity: "medium" }
    ]
  },
  {
    id: "r-casualcoding",
    name: "r/CasualCoding",
    description: "A warm, supportive learning playground for new coders with soft rules and conversational tone.",
    subscribers: "85K members",
    style: "discussion",
    automationLevel: "low",
    sensitivity: 30,
    reputationSystemEnabled: true,
    rules: [
      { id: "cc-rule-1", name: "Be Kind & Support Peers", description: "Never belittle developers who ask basic syntax questions. Encourage alternative patterns constructively.", severity: "high" },
      { id: "cc-rule-2", name: "Share Code Context", description: "Always paste formatting block markers or Github links. No screenshots of compiler errors without text.", severity: "medium" }
    ]
  },
  {
    id: "r-gamedevmemes",
    name: "r/GameDevMemes",
    description: "A rapid meme community prioritizing image engagement, formatting templates, and humorous rants.",
    subscribers: "980K members",
    style: "meme",
    automationLevel: "medium",
    sensitivity: 45,
    reputationSystemEnabled: false,
    rules: [
      { id: "gm-rule-1", name: "Original Meme Creation", description: "No copy-pasting other subreddits within the past 48 hours. Reverse image checks enforced.", severity: "medium" },
      { id: "gm-rule-2", name: "Game Development Topic", description: "Content must directly relate to game engines, artist pipelines, design patterns, compiler struggles, or publisher deals.", severity: "medium" }
    ]
  }
];

// In-Memory Live Moderation State Queue
let initialModerationItems: ModerationItem[] = [
  {
    id: "mod-1",
    type: "post",
    subreddit: "r/AskTech",
    author: "u/CodeWizard99",
    authorAge: "2 years",
    authorReputationScore: 82,
    authorReputationTier: "trusted",
    title: "How does the virtual DOM reconcile nested components with key attributes in React 19?",
    content: "I have been testing React 18 versus 19 fiber tree reconcilation. When key updates occur sequentially inside nested grid maps, performance stays linear, but custom lazy loaders cause full sub-tree mount points to trigger again. Has anyone noticed if custom batch state transitions behave differently?",
    category: "Low",
    score: 8,
    flags: [],
    confidence: 96,
    ruleViolation: undefined,
    summary: "Clear, highly technical developer question about React 19 internals. No rule violations. Very healthy contribution.",
    precedent: "No toxic or rule violations flagged in past 15 tech research posts.",
    suggestions: ["Approve post immediately", "Grant reputation points booster (+5) for technical helpfulness"],
    reportsCount: 0,
    reports: [],
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    status: "pending"
  },
  {
    id: "mod-2",
    type: "post",
    subreddit: "r/AskTech",
    author: "u/BotCryptoScanner3",
    authorAge: "2 hours",
    authorReputationScore: -89,
    authorReputationTier: "hostile",
    title: "⚡⚡ LEGIT GEM! GET FREE $1000 AIRDROP IMMEDIATELY - SIGN IN RIGHT NOW ⚡⚡",
    content: "Hey tech community! Check out this newly launched testnet protocol that's giving away a thousand dollars worth of tokens to the first 400 visits. Click here: http://get-rich-airdrop-scam.net/wallet-connect/login. Make sure you import your mnemonic seed phrase, it's 100% vetted by tech leaders!",
    category: "Critical",
    score: 98,
    flags: ["potential scam", "spam link", "hostile brand", "mnemonic safety risk"],
    confidence: 99,
    ruleViolation: "No Spam or Self-Promotion",
    summary: "High risk cryptocurrency phishing exploit attempts steal user credentials. Blatant automatic block triggered.",
    precedent: "User has 3 previous post removals in blockchain forums under identical templates.",
    suggestions: ["Remove permanently", "Ban author", "Notify anti-bot operations immediately", "Establish network IP blockade"],
    reportsCount: 8,
    reports: [
      { reason: "Spam link / Phishing exploit", count: 5 },
      { reason: "Unrelated / Harmful guidelines violation", count: 3 }
    ],
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
    status: "pending"
  },
  {
    id: "mod-3",
    type: "comment",
    subreddit: "r/AskTech",
    author: "u/AngeredUser456",
    authorAge: "3 days",
    authorReputationScore: -45,
    authorReputationTier: "suspicious",
    content: "You are literally a brainless monkey who doesn't understand simple compiler loops. How did you even manage to get hired as a junior dev? Delete your Github account and crawl back into your hole, idiot.",
    category: "High",
    score: 87,
    flags: ["harassment", "offensive insult", "severe toxicity"],
    confidence: 94,
    ruleViolation: "Be Civil & Respectful",
    summary: "Severe targeted harassment containing insults and demeaning language, directly breaking community guidelines on civility.",
    precedent: "User u/AngeredUser456 received a caution 24 hours ago for vulgar insult comments under programming threads.",
    suggestions: ["Remove comment", "Issue a 3-day temporary mute", "Warn user with automated guidelines link"],
    reportsCount: 4,
    reports: [
      { reason: "Harassment and personal attacks", count: 4 }
    ],
    timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString(), // 22 mins ago
    status: "pending"
  },
  {
    id: "mod-4",
    type: "post",
    subreddit: "r/AskTech",
    author: "u/StartupCEO_Fast",
    authorAge: "1 month",
    authorReputationScore: -12,
    authorReputationTier: "neutral",
    title: "How we scaled our background task processor using my new tool ServerlessGoat (50% cheaper)",
    content: "Building on top of Serverless architecture, we found out Lambda pricing was too unpredictable for big databases. So we designed ServerlessGoat! It provides auto-warm pools. Please check out our website and join our discord here: https://serverlessgoat-saas.co and subscribe to our newsletter for free credits!",
    category: "Medium",
    score: 52,
    flags: ["self-promotion links", "potential low effort SAAS ad"],
    confidence: 78,
    ruleViolation: "No Spam or Self-Promotion",
    summary: "Boundary self-promotion post sharing educational task scaling steps but ending with direct newsletter product marketing.",
    precedent: "No history of flag reports: user behaves as active startup founder.",
    suggestions: ["Keep content as discussion input but require flair removal", "Suggest moderator warn author about promotional count levels"],
    reportsCount: 2,
    reports: [
      { reason: "Excessive self promotion and ad", count: 2 }
    ],
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    status: "pending"
  },
  {
    id: "mod-5",
    type: "comment",
    subreddit: "r/AskTech",
    author: "u/CuriousCoder",
    authorAge: "5 months",
    authorReputationScore: 35,
    authorReputationTier: "neutral",
    content: "I recommend checking out MDN or the official TS playground before writing these nested types. I recall reading that React's internal fiber types are better understood with strict null checking enabled. Hope this helps!",
    category: "Low",
    score: 5,
    flags: [],
    confidence: 98,
    ruleViolation: undefined,
    summary: "Helpful, civil developer comment offering troubleshooting directions. Fully compliant.",
    precedent: "Author has multiple constructive responses inside help channels.",
    suggestions: ["Approve comment", "Increase helpful contributor metric"],
    reportsCount: 0,
    reports: [],
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 mins ago
    status: "approved",
    moderatedBy: "AutoMod AI",
    moderatedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString()
  }
];

let itemsQueue: ModerationItem[] = [...initialModerationItems];

// Core Persistent Metrics State
let operationalMetrics: OperationalMetrics = {
  activeModeratorsOnline: 3,
  itemsPending: 3,
  timeSavedMinutes: 142,
  avgResponseTimeSeconds: 42,
  spamBlockedToday: 18,
  reputationRewardsAwarded: 12,
  brigadeState: "stable" // 'stable' | 'alert' | 'raid_detected'
};

// Reputation System Leaderboard Simulated Users
let reputationList: ReputationEvent[] = [
  { id: "rep-1", username: "u/CodeWizard99", reputationScore: 82, badge: "trusted", reasons: ["Exceptional detailed responses inside nested framework maps", "Approved content ratio is 100% over 12 submissions"], approvedCount: 15, rejectedCount: 0 },
  { id: "rep-2", username: "u/CuriousCoder", reputationScore: 35, badge: "neutral", reasons: ["Consistent polite comments", "Received multiple upvotes inside beginner tutorials"], approvedCount: 8, rejectedCount: 1 },
  { id: "rep-3", username: "u/TechArch101", reputationScore: 94, badge: "trusted", reasons: ["High helpful comment density", "Subreddit longevity of 4 years"], approvedCount: 42, rejectedCount: 0 },
  { id: "rep-4", username: "u/BotCryptoScanner3", reputationScore: -89, badge: "hostile", reasons: ["Repeated immediate link distribution", "Spam filter matches in 5 separate posts"], approvedCount: 0, rejectedCount: 14 },
  { id: "rep-5", username: "u/AngeredUser456", reputationScore: -45, badge: "suspicious", reasons: ["Hostility language matching toxic index score"], approvedCount: 1, rejectedCount: 5 }
];

// Audit logs
let auditLogs: AuditLog[] = [
  { id: "log-1", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), itemTitle: "Is this graphics card genuine?", itemAuthor: "u/BargainBuyer", action: "approved", moderator: "AutoMod AI", details: "Auto-approved using medium-sensitivity tech pattern matching. (Toxicity: 4%)", score: 4 },
  { id: "log-2", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), itemTitle: "CHEAPEST VPN REVEALED CLICK NOW", itemAuthor: "u/SpamPromo99", action: "removed", moderator: "Copilot suggestion (Verified by u/ModAlpha)", details: "Flagged high spam risk. Removed VPN affiliate links.", score: 95 }
];

// Custom NLP Smart Policies
let smartPolicies: SmartPolicy[] = [
  { id: "policy-1", naturalLanguage: "Flag posts that aggressively insult users during software language discussions.", convertedRuleName: "Tech Insult Automod Pattern", status: "active", severity: "high" },
  { id: "policy-2", naturalLanguage: "Warn posts containing suspicious web addresses with zero technical body context.", convertedRuleName: "Blind External Links Guard", status: "active", severity: "medium" }
];

// Operational metrics tracker for Charting (Last 8 Hours)
let chartPoints: ChartPoint[] = [
  { time: "10:00", toxicity: 15, volume: 24, spam: 2 },
  { time: "11:00", toxicity: 22, volume: 38, spam: 5 },
  { time: "12:00", toxicity: 18, volume: 30, spam: 1 },
  { time: "13:00", toxicity: 42, volume: 55, spam: 8 },
  { time: "14:00", toxicity: 25, volume: 40, spam: 3 },
  { time: "15:00", toxicity: 14, volume: 28, spam: 0 },
  { time: "16:00", toxicity: 30, volume: 35, spam: 4 },
  { time: "17:00", toxicity: 20, volume: 29, spam: 2 }
];


// --- API ENDPOINTS ---

// GET Subreddit configurations
app.get("/api/config", (req, res) => {
  res.json({
    activeSubreddit,
    presets: SUBREDDIT_PRESETS
  });
});

// POST Subreddit Preset Selection/Onboarding Wizard updates
app.post("/api/config", (req, res) => {
  const { presetId, automationLevel, sensitivity, customRules, name, description } = req.body;
  
  if (presetId) {
    const selected = SUBREDDIT_PRESETS.find(p => p.id === presetId);
    if (selected) {
      activeSubreddit = { 
        ...selected,
        automationLevel: automationLevel || selected.automationLevel,
        sensitivity: sensitivity !== undefined ? sensitivity : selected.sensitivity
      };
    }
  } else if (name) {
    // Custom setup
    activeSubreddit = {
      id: "r-custom",
      name: name.startsWith("r/") ? name : `r/${name}`,
      description: description || "Custom subrules community setup.",
      subscribers: "1 member",
      style: "strict",
      automationLevel: automationLevel || "medium",
      sensitivity: sensitivity !== undefined ? sensitivity : 50,
      reputationSystemEnabled: true,
      rules: customRules ? customRules.map((ruleText: string, idx: number) => ({
        id: `rule-custom-${idx}`,
        name: `Sub-Rule ${idx + 1}`,
        description: ruleText,
        severity: "medium" as const
      })) : [
        { id: "rule-1", name: "Constructive Conversations", description: "Maintain clear and polite contributions.", severity: "high" }
      ]
    };
  }
  
  // Re-adjust pending queue categories count
  const pendingCount = itemsQueue.filter(i => i.status === "pending").length;
  operationalMetrics.itemsPending = pendingCount;
  
  res.json({ status: "success", activeSubreddit });
});

// GET report queues
app.get("/api/queue", (req, res) => {
  const { category, type, search } = req.query;
  
  let list = itemsQueue;
  
  if (category) {
    list = list.filter(i => i.category.toLowerCase() === String(category).toLowerCase());
  }
  if (type) {
    list = list.filter(i => i.type.toLowerCase() === String(type).toLowerCase());
  }
  if (search) {
    const s = String(search).toLowerCase();
    list = list.filter(i => 
      i.author.toLowerCase().includes(s) || 
      i.content.toLowerCase().includes(s) || 
      (i.title && i.title.toLowerCase().includes(s)) ||
      i.summary.toLowerCase().includes(s)
    );
  }
  
  res.json(list);
});

// POST action on items
app.post("/api/queue/:id/action", (req, res) => {
  const { id } = req.params;
  const { action, moderator, notes } = req.body as { action: ModerationStatus; moderator: string; notes?: string };
  
  const itemIndex = itemsQueue.findIndex(i => i.id === id);
  if (itemIndex === -1) {
    return res.status(404).json({ error: "Moderation item not found" });
  }
  
  const item = itemsQueue[itemIndex];
  const oldStatus = item.status;
  
  // Update item
  item.status = action;
  item.moderatedBy = moderator || "u/ModeratorAI";
  item.moderatedAt = new Date().toISOString();
  if (notes) item.notes = notes;
  
  // Update Reputation profile
  let repUser = reputationList.find(u => u.username === item.author);
  if (!repUser) {
    const isHarmfulOrSpam = action === 'removed' || action === 'muted' || action === 'warned';
    repUser = {
      id: `rep-${Date.now()}`,
      username: item.author,
      reputationScore: isHarmfulOrSpam ? -20 : 10,
      badge: isHarmfulOrSpam ? "suspicious" : "neutral",
      reasons: [isHarmfulOrSpam ? "Flagged post removal" : "First content approval"],
      approvedCount: isHarmfulOrSpam ? 0 : 1,
      rejectedCount: isHarmfulOrSpam ? 1 : 0
    };
    reputationList.push(repUser);
  } else {
    if (action === "approved") {
      repUser.approvedCount += 1;
      repUser.reputationScore = Math.min(100, repUser.reputationScore + 4);
      if (repUser.reputationScore >= 60) repUser.badge = "trusted";
      else if (repUser.reputationScore >= -20) repUser.badge = "neutral";
    } else if (action === "removed" || action === "muted" || action === "warned") {
      repUser.rejectedCount += 1;
      repUser.reputationScore = Math.max(-100, repUser.reputationScore - 15);
      if (repUser.reputationScore <= -60) repUser.badge = "hostile";
      else if (repUser.reputationScore <= -20) repUser.badge = "suspicious";
    }
  }

  // Adjust operational saved counts
  if (oldStatus === "pending" && action !== "pending") {
    operationalMetrics.itemsPending = Math.max(0, operationalMetrics.itemsPending - 1);
    operationalMetrics.timeSavedMinutes = operationalMetrics.timeSavedMinutes + 4; // Add 4 minutes saved per action
  }
  if (action === "removed" && item.category === "Critical") {
    operationalMetrics.spamBlockedToday += 1;
  }
  
  // Create audit log entry
  const logItem: AuditLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    itemTitle: item.title || "Comment response content",
    itemAuthor: item.author,
    action: action,
    moderator: moderator || "u/ModeratorAI",
    details: `${action.toUpperCase()} - Confidence Score: ${item.confidence}%. ${notes ? `Notes: ${notes}` : ""}`,
    score: item.score
  };
  auditLogs.unshift(logItem);
  
  res.json({
    success: true,
    item,
    metrics: operationalMetrics,
    auditLogs
  });
});

// GET reputation contributors
app.get("/api/reputation", (req, res) => {
  res.json(reputationList);
});

// POST reputation adjustment (Manual trust score tuning)
app.post("/api/reputation/:username/adjust", (req, res) => {
  const { username } = req.params;
  const { amount } = req.body;
  const user = reputationList.find(r => r.username === username);
  if (user) {
    user.reputationScore = Math.max(-100, Math.min(100, user.reputationScore + amount));
    if (user.reputationScore >= 60) {
      user.badge = "trusted";
    } else if (user.reputationScore <= -60) {
      user.badge = "hostile";
    } else if (user.reputationScore <= -20) {
      user.badge = "suspicious";
    } else {
      user.badge = "neutral";
    }
    
    // Create audit log entry for this action
    const logItem: AuditLog = {
      id: `log-rep-${Date.now()}`,
      timestamp: new Date().toISOString(),
      itemTitle: `Trust Score manual adjustment for ${username}`,
      itemAuthor: username,
      action: amount > 0 ? "approved" : "warned",
      moderator: "u/AdminCoCopilot",
      details: `MANUAL REPUTATION CHANGE - Adjusted by ${amount > 0 ? "+" : ""}${amount} points. Current Score: ${user.reputationScore} pt.`,
      score: Math.abs(user.reputationScore)
    };
    auditLogs.unshift(logItem);
    
    res.json({ success: true, user });
  } else {
    res.status(404).json({ error: "Contributor profile not found." });
  }
});

// GET Audit Logs
app.get("/api/audit-logs", (req, res) => {
  res.json(auditLogs);
});

// GET Policies
app.get("/api/policies", (req, res) => {
  res.json(smartPolicies);
});

// POST Policy create
app.post("/api/policies", async (req, res) => {
  const { naturalLanguage, severity } = req.body;
  if (!naturalLanguage) {
    return res.status(400).json({ error: "Policy description is required." });
  }

  let convertedRuleName = "NLP Generated Constraint Rule";
  let interpretation = "No toxic harassment behaviors flagged inside thread bounds.";
  
  // Use Gemini strictly server side
  if (ai) {
    try {
      const prompt = `You are a Reddit Devvit moderation parser. Convert the following natural language moderation request into a structured configuration.
Request: "${naturalLanguage}"

Return a single JSON object (with no wrapper markdown, just pure JSON) formatted exactly like this:
{
  "ruleName": "Short descriptive rule name in camelCase or hyphens or capitalized",
  "explanation": "Brief explanation of how this should check posts and comments for violations"
}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      
      const resultText = response.text || "";
      const parsed = JSON.parse(resultText.trim());
      convertedRuleName = parsed.ruleName || convertedRuleName;
      interpretation = parsed.explanation || interpretation;
    } catch (e) {
      console.error("Gemini policy generation error, continuing with fallback rules:", e);
      // Fallback generator
      convertedRuleName = naturalLanguage.split(" ").slice(0, 4).join("-") + "-automod";
    }
  } else {
    // Highly elegant offline mock parser
    convertedRuleName = "RegEx-" + naturalLanguage.split(" ").slice(0, 3).join("-").replace(/[^a-zA-Z-]/g, "");
    interpretation = `Auto-interpreting natural-language policy: Flag patterns matching keywords: ${naturalLanguage}`;
  }

  const newPolicy: SmartPolicy = {
    id: `policy-${Date.now()}`,
    naturalLanguage,
    convertedRuleName,
    status: "active",
    severity: severity || "medium"
  };

  smartPolicies.push(newPolicy);
  res.json(newPolicy);
});

// DELETE Policy
app.delete("/api/policies/:id", (req, res) => {
  const { id } = req.params;
  const index = smartPolicies.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Policy not found." });
  }
  smartPolicies.splice(index, 1);
  res.json({ success: true });
});

// POST Custom Item to Priority Queue (AI Copilot evaluation and inserts dynamically)
app.post("/api/queue", async (req, res) => {
  const { title, content, type, author } = req.body;
  if (!content) {
    return res.status(400).json({ error: "No target item content provided for evaluation." });
  }

  const postAuthor = author || "u/UserSandbox";
  let summary = "Custom user-generated sandboxed draft.";
  let confidence = 92;
  let severity: "Critical" | "High" | "Medium" | "Low" | "Auto-Resolved" = "Low";
  let ruleViolation = "";
  let suggestions = ["Approve draft immediately", "Grant reputation points"];
  let flags: string[] = [];

  const combined = ((title || "") + " " + content).toLowerCase();

  if (ai) {
    try {
      const prompt = `You are a Reddit Devvit automated intelligence assistant named ModVerse AI Copilot.
Analyze this user submission to determine if it violates rules or carries high community safety risks.
Subreddit: ${activeSubreddit.name}
Active Rules:
${activeSubreddit.rules.map(r => `- ${r.name}: ${r.description}`).join("\n")}

Submission Detail:
Type: ${type || 'post'}
Text content to evaluate:
${title ? `Title: ${title}\n` : ''}Body: ${content}

Analyze the content and respond with a single valid JSON object (no markdown, just raw JSON) using this format:
{
  "summary": "Short 1-sentence analytical violation summary of content context",
  "confidence": 95, // number
  "severity": "Critical/High/Medium/Low/Auto-Resolved",
  "ruleViolation": "Rule name matched exactly or empty",
  "flags": ["list", "of", "trigger", "flags"],
  "suggestions": ["suggestion actionable list 1", "suggestion 2"]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const parsed = JSON.parse(response.text?.trim() || "{}");
      summary = parsed.summary || summary;
      confidence = parsed.confidence || confidence;
      severity = parsed.severity || severity;
      ruleViolation = parsed.ruleViolation || ruleViolation;
      suggestions = parsed.suggestions || suggestions;
      flags = parsed.flags || flags;
    } catch(e) {
      console.error("Gemini Custom queue API error, triggering backup heuristic parser:", e);
    }
  }

  if (flags.length === 0) {
    if (combined.includes("cheat") || combined.includes("airdrops") || combined.includes("fucking") || combined.includes("idiot") || combined.includes("scam")) {
      severity = "High";
      confidence = 90;
      ruleViolation = combined.includes("idiot") || combined.includes("fucking") ? "Be Civil & Respectful" : "No Spam or Self-Promotion";
      summary = `High toxicity indicators or referral triggers found in custom mock post.`;
      flags = combined.includes("idiot") ? ["harassment", "offensive phrase"] : ["scam link", "unverified website"];
      suggestions = ["Remove post immediately", "Warn user via template"];
    } else {
      summary = "Constructive input draft. Compliance validation passed perfectly.";
      severity = "Low";
      flags = ["sandbox text"];
    }
  }

  const riskScore = severity === "Critical" ? 95 :
                    severity === "High" ? 82 :
                    severity === "Medium" ? 50 : 12;

  const newItem: ModerationItem = {
    id: `custom-usr-${Date.now()}`,
    type: type || "post",
    subreddit: activeSubreddit.name,
    author: postAuthor,
    authorAge: "6 months",
    authorReputationScore: 15,
    authorReputationTier: "neutral",
    title: type === "post" ? (title || "User Sandboxed Post Design") : undefined,
    content,
    category: severity,
    score: riskScore,
    flags,
    confidence,
    ruleViolation: ruleViolation || undefined,
    summary,
    precedent: "Sandbox simulation records show 100% stable matching trends of developer comments.",
    suggestions,
    reportsCount: severity === "Critical" || severity === "High" ? 1 : 0,
    reports: severity === "Critical" || severity === "High" ? [{ reason: "Sandbox AI Trigger Alert", count: 1 }] : [],
    timestamp: new Date().toISOString(),
    status: "pending"
  };

  itemsQueue.unshift(newItem);
  operationalMetrics.itemsPending = itemsQueue.filter(i => i.status === "pending").length;

  res.json({
    success: true,
    item: newItem,
    metrics: operationalMetrics
  });
});

// GET credentials config
let apiCredentials = {
  apiKey: "sk-SbR61GRDMhXpIgKbZpXVEqWa56490_HsQxy8zF-2m6AoG21lB_n6TyplglCRCfoq",
  secretKey: "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCnnF54mRNIY0l+18tmu2Gt35ZWY8897GoDlUoLQ80yjZesM5qDZ2Xu4m0wdoS7vhl+wbQHQ+aLFSIwr685iU79n79gFVIa66tkX3JlhaSvAu5d/Iz9cfxKgN+dYl1Ti+i7GSic+B74YeAhhVWS59vtl04uqTL7klkvMbGJSSElkwIDAQAB",
  status: "verified",
  verifiedAt: "2026-05-24T06:07:38Z",
  endpointsCount: 14,
  callsUsed: 1248
};

app.get("/api/credentials", (req, res) => {
  res.json(apiCredentials);
});

// POST update credentials
app.post("/api/credentials/update", (req, res) => {
  const { apiKey, secretKey } = req.body;
  apiCredentials.apiKey = apiKey || apiCredentials.apiKey;
  apiCredentials.secretKey = secretKey || apiCredentials.secretKey;
  apiCredentials.status = "verified";
  apiCredentials.verifiedAt = new Date().toISOString();
  apiCredentials.callsUsed += 1;
  res.json({ success: true, apiCredentials });
});

// POST test/handshake keys signing simulation
app.post("/api/credentials/test", (req, res) => {
  const { testPayload } = req.body;
  const payloadToSign = String(testPayload || "ModVerse-Devvit-Secure-Handshake");
  
  // Deterministic simulation hash signatures
  const sum = Array.from(payloadToSign).reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const truncatedSig = "MIGfM-" + Buffer.from(`${payloadToSign}-sig-${sum}`).toString("base64").slice(0, 48) + "...";
  
  apiCredentials.callsUsed += 1;
  
  const logItem: AuditLog = {
    id: `log-api-${Date.now()}`,
    timestamp: new Date().toISOString(),
    itemTitle: `Security signature validation for sk-${apiCredentials.apiKey.substring(3, 10)}...`,
    itemAuthor: "r/Devvit Gateway API",
    action: "approved",
    moderator: "u/AdminCoCopilot",
    details: `API EVENT - Validated cryptographic payload signature. Signed payload: "${payloadToSign}"`,
    score: 100
  };
  auditLogs.unshift(logItem);

  res.json({
    success: true,
    signature: truncatedSig,
    payload: payloadToSign,
    timestamp: new Date().toISOString(),
    apiCredentials
  });
});

// GET metrics
app.get("/api/metrics", (req, res) => {
  // Update counts
  operationalMetrics.itemsPending = itemsQueue.filter(i => i.status === "pending").length;
  res.json({
    metrics: operationalMetrics,
    chartPoints
  });
});

// POST trigger simulation situations
app.post("/api/simulate/:type", (req, res) => {
  const { type } = req.params;
  
  if (type === "spam_attack") {
    operationalMetrics.brigadeState = "alert";
    
    const spamItems: ModerationItem[] = [
      {
        id: `spam-sim-1`,
        type: "post",
        subreddit: activeSubreddit.name,
        author: "u/BotSpammerFast_1",
        authorAge: "10 minutes",
        authorReputationScore: -95,
        authorReputationTier: "hostile",
        title: "🔥🔥 INVESTMENT BONUS! EARN 500% WITH NO DEPOSIT required",
        content: "Check out this crazy investment slot system that yields 500% daily returns fully backed. Click here to claim your VIP access right now: http://extreme-returns-scambot.xyz. Guaranteed fully secure, no delays!",
        category: "Critical",
        score: 99,
        flags: ["scam link", "coordinated voting pattern", "bulk automated distribution"],
        confidence: 99,
        ruleViolation: "No Spam or Self-Promotion",
        summary: "Bot network propagation distributing cryptocurrency referral scams and financial fraud links.",
        precedent: "IP-matched to verified bot wave incident 3 days ago.",
        suggestions: ["Ban user", "Filter domain http://extreme-returns-scambot.xyz", "Blackhole account creation IP"],
        reportsCount: 12,
        reports: [{ reason: "Spam link / Crypto scam bots", count: 12 }],
        timestamp: new Date().toISOString(),
        status: "pending"
      },
      {
        id: `spam-sim-2`,
        type: "post",
        subreddit: activeSubreddit.name,
        author: "u/BotSpammerFast_2",
        authorAge: "15 minutes",
        authorReputationScore: -92,
        authorReputationTier: "hostile",
        title: "🔥🔥 INVESTMENT BONUS! EARN 500% WITH NO DEPOSIT required",
        content: "Check out this crazy investment slot system that yields 500% daily returns fully backed. Click here to claim your VIP access right now: http://extreme-returns-scambot.xyz. Guaranteed fully secure, no delays!",
        category: "Critical",
        score: 99,
        flags: ["scam link", "coordinated voting pattern", "bulk automated distribution"],
        confidence: 99,
        ruleViolation: "No Spam or Self-Promotion",
        summary: "Identical repeat bot propagation containing high-threat financial scams.",
        precedent: "Identical duplicate post detected within nested 30-second timestamp.",
        suggestions: ["Auto-remove with Spam Filter", "IP temporary shadow exclusion"],
        reportsCount: 9,
        reports: [{ reason: "Spam / Duplicate distribution", count: 9 }],
        timestamp: new Date().toISOString(),
        status: "pending"
      },
      {
        id: `spam-sim-3`,
        type: "comment",
        subreddit: activeSubreddit.name,
        author: "u/BotSpammerFast_3",
        authorAge: "1 minute",
        authorReputationScore: -90,
        authorReputationTier: "hostile",
        content: "VISIT http://extreme-returns-scambot.xyz immediately for the cash output payout bonus pool!! Immediate transfer!",
        category: "Critical",
        score: 98,
        flags: ["duplicate comments", "links in footer", "scam domain match"],
        confidence: 99,
        ruleViolation: "No Spam or Self-Promotion",
        summary: "Bot thread hijacks promoting malicious scam domains.",
        precedent: "Repeated account registrations bypass under mock proxies.",
        suggestions: ["Remove permanently", "Ban author"],
        reportsCount: 4,
        reports: [{ reason: "Bots propagation / Spam comments", count: 4 }],
        timestamp: new Date().toISOString(),
        status: "pending"
      }
    ];

    // Inject items into Queue
    itemsQueue = [...spamItems, ...itemsQueue];
    
    // Add point of spike in chart
    chartPoints.push({
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      toxicity: 45,
      volume: 75,
      spam: 25
    });

  } else if (type === "brigade_event") {
    operationalMetrics.brigadeState = "raid_detected";
    
    const raidItems: ModerationItem[] = [
      {
        id: `raid-sim-1`,
        type: "post",
        subreddit: activeSubreddit.name,
        author: "u/HostileBrigader_Alpha",
        authorAge: "4 days",
        authorReputationScore: -88,
        authorReputationTier: "hostile",
        title: "YOUR COMMUNITY MODERATORS ARE VIZIRS OF SLANDER AND CENSORS",
        content: "This absolute jokes forum of power-tripping soy mods keeps hiding critical code reports because they are bought and paid for by big corporations! We are flooding this subreddit tonight to expose the garbage developers who lead this space. Eat glass you pathetic hacks!",
        category: "Critical",
        score: 96,
        flags: ["targeted brigade", "harassment", "major toxicity swarms"],
        confidence: 98,
        ruleViolation: "Be Civil & Respectful",
        summary: "Organized raid post from coordinated Discord servers aiming to troll moderators and disrupt local community discussion.",
        precedent: "No direct precedent: sudden targeted link brigading wave detected.",
        suggestions: ["Ban user", "Remove post", "Activate strict Community Lock mode"],
        reportsCount: 15,
        reports: [
          { reason: "Brigade disruption and harassment", count: 10 },
          { reason: "Toxic language/insult targeting mods", count: 5 }
        ],
        timestamp: new Date().toISOString(),
        status: "pending"
      },
      {
        id: `raid-sim-2`,
        type: "comment",
        subreddit: activeSubreddit.name,
        author: "u/HostileBrigader_Beta",
        authorAge: "1 day",
        authorReputationScore: -75,
        authorReputationTier: "hostile",
        content: "MODS ARE GAY CLOWNS, THIS ENTIRE FORUM IS RUINED! SWARM THE THREADS! GO BACK TO MICROSOFT JUNIORS!",
        category: "Critical",
        score: 92,
        flags: ["toxicity", "slur keyword matching", "coordinated brigade"],
        confidence: 97,
        ruleViolation: "Be Civil & Respectful",
        summary: "Hostile raid comment distributed under active brigading waves containing targeted insults.",
        precedent: "Sudden wave of accounts registered under 48 hours posting identical slurs.",
        suggestions: ["Instant remove", "Activate Crowd Control restricted access"],
        reportsCount: 10,
        reports: [{ reason: "Toxic community disturbance / Brigade", count: 10 }],
        timestamp: new Date().toISOString(),
        status: "pending"
      }
    ];

    itemsQueue = [...raidItems, ...itemsQueue];
    
    // Alert in chart points
    chartPoints.push({
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      toxicity: 92,
      volume: 98,
      spam: 42
    });

  } else if (type === "reset") {
    operationalMetrics.brigadeState = "stable";
    operationalMetrics.spamBlockedToday = 18;
    operationalMetrics.itemsPending = 3;
    itemsQueue = [...initialModerationItems];
    chartPoints = [
      { time: "10:00", toxicity: 15, volume: 24, spam: 2 },
      { time: "11:00", toxicity: 22, volume: 38, spam: 5 },
      { time: "12:00", toxicity: 18, volume: 30, spam: 1 },
      { time: "13:00", toxicity: 42, volume: 55, spam: 8 },
      { time: "14:00", toxicity: 25, volume: 40, spam: 3 },
      { time: "15:00", toxicity: 14, volume: 28, spam: 0 },
      { time: "16:00", toxicity: 30, volume: 35, spam: 4 },
      { time: "17:00", toxicity: 20, volume: 29, spam: 2 }
    ];
  } else if (type === "slow_mode" || type === "crowd_control" || type === "emergency_automod" || type === "new_user_approval") {
    // Enable mitigation strategies on the dashboard simulation
    operationalMetrics.brigadeState = "stable"; // mitigate
    operationalMetrics.timeSavedMinutes += 12;
  }
  
  operationalMetrics.itemsPending = itemsQueue.filter(i => i.status === "pending").length;
  res.json({ success: true, queue: itemsQueue, metrics: operationalMetrics, chartPoints });
});


// POST Rule Evaluation (Before submitting - Module 6 Smart Rule Interpreter)
app.post("/api/rule-interpreter", async (req, res) => {
  const { title, content } = req.body;
  if (!content) {
    return res.status(400).json({ error: "Post body content is required for AI rule evaluation." });
  }

  const promptText = `Title: "${title || ""}"\nContent: "${content}"`;
  let feedback: string[] = [];
  let isCompliant = true;
  let recommendedFlair = "Discussion";

  if (ai) {
    try {
      const prompt = `You are a Reddit Devvit Smart Rule Interpreter checking a draft post before submission.
Subreddit: "${activeSubreddit.name}" - ${activeSubreddit.description}
Subreddit Rules:
${activeSubreddit.rules.map(r => `- ${r.name}: ${r.description}`).join("\n")}

Post draft to analyze:
${promptText}

Check if this post triggers any rule violations or could be formatted better.
Return a pure JSON response (no markdown wrappers) matching this schema structure:
{
  "isCompliant": true/false,
  "violations": ["Rule violation description or empty"],
  "formattingHelp": "Suggestion line like 'Your title is excellent!' or 'Avoid vague phrasing.'",
  "suggestedFlair": "Flair appropriate for the content (e.g. Help, Discussion, Tutorial, Meme, Meta)"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      
      const parsed = JSON.parse(response.text?.trim() || "{}");
      isCompliant = parsed.isCompliant !== undefined ? parsed.isCompliant : true;
      feedback = parsed.violations || [];
      if (parsed.formattingHelp) {
        feedback.push(parsed.formattingHelp);
      }
      recommendedFlair = parsed.suggestedFlair || "Discussion";
    } catch (e) {
      console.error("Gemini pre-validation interpreter error, calling fallback regex matcher:", e);
    }
  }

  // Robust Fallback Analysis heuristics
  if (feedback.length === 0) {
    const combined = (title + " " + content).toLowerCase();
    
    // Rule 1 check: Spam
    if (combined.includes("http://") || combined.includes("https://") || combined.includes("click now") || combined.includes("sign up") || combined.includes("discord.gg/")) {
      feedback.push("Rule Check Warning: Contains external hyperlinks. Subreddit has strict guidelines against self-promotion and unverified referral URLs.");
      isCompliant = false;
      recommendedFlair = "Promo/Link";
    }
    
    // Rule 2 check: Civility
    if (combined.includes("idiot") || combined.includes("stupid") || combined.includes("dumb") || combined.includes("fuck") || combined.includes("crap") || combined.includes("power tripp")) {
      feedback.push("Guideline Warning: Detected emotionally charged keywords or offensive insults which directly breach 'Be Civil' policies.");
      isCompliant = false;
      recommendedFlair = "Meta";
    }

    // Rule 3 check: Title length
    if (title && title.trim().length < 15) {
      feedback.push("Form Improvement: Title appears too vague or short. Add specific tech environment clues (e.g. 'Node 22 issue with imports').");
      recommendedFlair = "Question";
    }

    if (combined.includes("react") || combined.includes("typescript") || combined.includes("js")) {
      recommendedFlair = "WebDev/React";
    } else if (combined.includes("crypto") || combined.includes("coin") || combined.includes("btc")) {
      recommendedFlair = "Cryptotech";
    }

    if (feedback.length === 0) {
      feedback.push("Subreddit Analyzer: Clean submission! Fully complies with post title standards and formatting criteria.");
    }
  }

  res.json({
    isCompliant,
    feedback,
    recommendedFlair
  });
});

// POST Automated reports markdown summary generator
app.post("/api/summarize-report", async (req, res) => {
  const { period } = req.body; // 'daily' | 'weekly'
  const dateStr = new Date().toDateString();

  const mockOverviewStats = `
### ModVerse AI ${period === 'weekly' ? 'Weekly' : 'Daily'} Digest Summary - Subreddit: **${activeSubreddit.name}**
**Generated Date:** ${dateStr}

- **Total Posts and Comments Evaluated:** ${itemsQueue.length + 35}
- **Auto-resolved Items by AI Rules Engine:** ${operationalMetrics.spamBlockedToday + 12}
- **Active Moderator Working Hours Saved:** ${operationalMetrics.timeSavedMinutes} minutes
- **Subreddit Status:** ${operationalMetrics.brigadeState.toUpperCase()}
- **Trust Metric Awards Granted:** ${reputationList.filter(u => u.badge === 'trusted').length} contributors recognized
  `;

  let markdownSummary = mockOverviewStats + `

#### Active Incident Summaries
1. **Cryptocurrency spambots wave neutralized:** Automated scanners detected bot addresses deploying links and blocked 100% of registrations.
2. **Civility metrics stability score:** Increased by 18% following targeted AI warnings. The automated mute features have restricted troll accounts.

#### Actionable Recommendations
- Keep **Community Sensitivity** at ${activeSubreddit.sensitivity}% to reduce false reporting.
- Set a custom policy trigger monitoring affiliate referrals.
  `;

  if (ai) {
    try {
      const prompt = `You are a Reddit Devvit moderation analyst. Write an executive summary report for Reddit moderation team.
Subreddit: "${activeSubreddit.name}" (${activeSubreddit.description})
Metrics:
- Time Saved: ${operationalMetrics.timeSavedMinutes} minutes
- Active brigade incident state: ${operationalMetrics.brigadeState}
- Spam blocked today: ${operationalMetrics.spamBlockedToday}
- Subreddit style preset: ${activeSubreddit.style}

Please write a highly polished, detailed reddit-markdown format report including sections for executive logs, rule alignment trends, positive reputation awards granted, and critical warnings. Return standard, clean Markdown layout syntax.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });
      
      markdownSummary = response.text || markdownSummary;
    } catch (e) {
      console.error("Gemini summarizer error, sending backup markdown configuration report:", e);
    }
  }

  res.json({
    markdown: markdownSummary
  });
});

// POST AI Copilot interactive prediction analyst (Module 1 AI Moderation Copilot)
app.post("/api/copilot-ai", async (req, res) => {
  const { title, content, type } = req.body;
  if (!content) {
    return res.status(400).json({ error: "No target item content provided for Copilot assessment." });
  }

  let summary = "Analytically parsed content showing normal developer discussion patterns.";
  let confidence = 92;
  let severity: "Critical" | "High" | "Medium" | "Low" | "Auto-Resolved" = "Low";
  let suggestedCategory = "Low";
  let ruleViolation = "";
  let suggestions = ["Approve content", "Upvote author helpful contributions"];
  let flags: string[] = [];

  const combined = (title + " " + content).toLowerCase();

  if (ai) {
    try {
      const prompt = `You are a Reddit Devvit automated intelligence assistant named ModVerse AI Copilot.
Analyze this user submission to determine if it violates rules or carries high community safety risks.
Subreddit: ${activeSubreddit.name}
Active Rules:
${activeSubreddit.rules.map(r => `- ${r.name}: ${r.description}`).join("\n")}

Submission Detail:
Type: ${type || 'post'}
Text content to evaluate:
${title ? `Title: ${title}\n` : ''}Body: ${content}

Analyze the content and respond with a single valid JSON object (no markdown, just raw JSON) using this format:
{
  "summary": "Short 1-sentence analytical violation summary of content context",
  "confidence": 95, // number
  "severity": "Critical/High/Medium/Low/Auto-Resolved",
  "ruleViolation": "Rule name matched exactly or empty",
  "flags": ["list", "of", "trigger", "flags"],
  "suggestions": ["suggestion actionable list 1", "suggestion 2"]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const parsed = JSON.parse(response.text?.trim() || "{}");
      summary = parsed.summary || summary;
      confidence = parsed.confidence || confidence;
      severity = parsed.severity || severity;
      ruleViolation = parsed.ruleViolation || ruleViolation;
      suggestions = parsed.suggestions || suggestions;
      flags = parsed.flags || flags;
    } catch(e) {
      console.error("Gemini Copilot API error, triggering backup heuristic parser:", e);
    }
  }

  if (flags.length === 0) {
    // Robust fallbacks
    if (combined.includes("cheat") || combined.includes("airdrops") || combined.includes("fucking") || combined.includes("idiot") || combined.includes("scam")) {
      severity = "High";
      confidence = 88;
      ruleViolation = combined.includes("idiot") || combined.includes("fucking") ? "Be Civil & Respectful" : "No Spam or Self-Promotion";
      summary = `High toxicity indicators or referral triggers found. Content risks community health alignment parameters.`;
      flags = combined.includes("idiot") ? ["harassment", "offensive phrase"] : ["scam link", "unverified website"];
      suggestions = ["Remove post immediately", "Warn user via generic mail template", "Block domain links"];
    } else {
      summary = "Helpful conversation contribution with balanced parameters and standard styling formatting.";
      flags = [];
      severity = "Low";
      ruleViolation = "";
      suggestions = ["Approve and permit visibility in main feeds"];
    }
  }

  res.json({
    summary,
    confidence,
    severity,
    ruleViolation,
    suggestions,
    flags,
    precedent: `Precedent Analysis: User records show 98% rule compliance over historical comments. Same category approved continuously.`
  });
});


// Express server production asset mapping & Vite development servers bindings
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ModVerse AI backend operational on http://localhost:${PORT}`);
  });
}

startServer();
