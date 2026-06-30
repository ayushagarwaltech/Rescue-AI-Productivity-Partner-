/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SubTask {
  id: string;
  title: string;
  estimatedMinutes: number;
  completed: boolean;
  order: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO string
  estimatedHours: number;
  
  // AI calculated priority factors
  urgencyScore: number;       // 1 - 100
  deadlineScore: number;      // 1 - 100
  importanceScore: number;    // 1 - 100
  energyRequirement: 'low' | 'medium' | 'high';
  riskLevel: 'safe' | 'warning' | 'critical';
  probabilityOfMissing: number; // percentage (0 - 100)
  overallPriorityScore: number; // 1 - 100

  // Scheduling and state
  completed: boolean;
  postponeCount: number;
  subTasks: SubTask[];
  
  // Custom categorization
  category: string; // 'Work', 'Study', 'Personal', 'Finance'
  isExternalCalendarConflict?: boolean;
}

export interface TimeBlock {
  id: string;
  taskId?: string;
  title: string;
  start: string; // HH:MM
  end: string;   // HH:MM
  type: 'focus' | 'break' | 'meeting' | 'admin';
  completed: boolean;
}

export interface FocusSession {
  id: string;
  taskId?: string;
  durationMinutes: number;
  timestamp: string; // ISO
  mood: string;      // 'focused' | 'anxious' | 'tired' | 'energetic' | 'neutral'
  mode: 'study' | 'work' | 'rescue';
  productivityRating: number; // 1 - 5
}

export interface ProcrastinationLog {
  id: string;
  timestamp: string;
  detectedTrigger: string; // e.g. "Postponed 'Assignment 1' twice", "Long idle time", "Late night delay"
  interventionText: string; // AI generated encouraging suggestion
  status: 'active' | 'dismissed' | 'resolved';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt?: string; // ISO string
  xpReward: number;
  icon: string; // Lucide icon name
}

export interface ProductivityMetrics {
  productivityScore: number; // 1 - 100
  dailyXp: number;
  totalXp: number;
  streakDays: number;
  bestFocusHour: string; // e.g. "10:00 AM"
  mostProductiveDay: string; // e.g. "Tuesday"
  completionRate: number; // percentage
  workConsistency: number; // percentage
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO
  isVoice?: boolean;
  isDocumentParsed?: boolean;
}

export interface RescueModePlan {
  isActive: boolean;
  activatedAt?: string;
  fastestStrategy: string;
  scheduleChanges: string[];
}
