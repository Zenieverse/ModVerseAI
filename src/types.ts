export interface SubredditRule {
  id: string;
  name: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export interface SubredditPreset {
  id: string;
  name: string;
  description: string;
  subscribers: string;
  style: 'small' | 'growth' | 'strict' | 'discussion' | 'meme' | 'news';
  automationLevel: 'high' | 'medium' | 'low';
  sensitivity: number; // 0-100
  rules: SubredditRule[];
  reputationSystemEnabled: boolean;
}

export type ModerationStatus = 'pending' | 'approved' | 'removed' | 'warned' | 'muted' | 'escalated' | 'ignored';

export interface ReportItem {
  reason: string;
  count: number;
}

export interface ModerationItem {
  id: string;
  type: 'post' | 'comment';
  subreddit: string;
  author: string;
  authorAge: string;
  authorReputationScore: number; // -100 to 100
  authorReputationTier: 'trusted' | 'neutral' | 'suspicious' | 'hostile';
  title?: string;
  content: string;
  category: 'Critical' | 'High' | 'Medium' | 'Low' | 'Auto-Resolved';
  score: number; // risk score 0-100
  flags: string[];
  confidence: number; // AI confidence 0-100
  ruleViolation?: string;
  summary: string;
  precedent: string;
  suggestions: string[];
  reportsCount: number;
  reports: ReportItem[];
  timestamp: string;
  status: ModerationStatus;
  moderatedBy?: string;
  moderatedAt?: string;
  notes?: string;
}

export interface ReputationEvent {
  id: string;
  username: string;
  reputationScore: number;
  badge: 'trusted' | 'neutral' | 'suspicious' | 'hostile';
  reasons: string[];
  approvedCount: number;
  rejectedCount: number;
}

export interface OperationalMetrics {
  activeModeratorsOnline: number;
  itemsPending: number;
  timeSavedMinutes: number;
  avgResponseTimeSeconds: number;
  spamBlockedToday: number;
  reputationRewardsAwarded: number;
  brigadeState: 'stable' | 'alert' | 'raid_detected';
}

export interface ChartPoint {
  time: string;
  toxicity: number;
  volume: number;
  spam: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  itemTitle?: string;
  itemAuthor: string;
  action: ModerationStatus;
  moderator: string;
  details: string;
  score: number;
}

export interface SmartPolicy {
  id: string;
  naturalLanguage: string;
  convertedRuleName: string;
  status: 'active' | 'draft';
  severity: 'high' | 'medium' | 'low';
}
