/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { Task, TimeBlock, FocusSession, ProcrastinationLog, ChatMessage, RescueModePlan, ProductivityMetrics } from './src/types';

// Load environment variables
dotenv.config();

const PORT = 3000;
const app = express();
app.use(express.json({ limit: '10mb' }));

// File persistence path
const DB_FILE = path.join(process.cwd(), 'db.json');

// Helper to initialize Gemini Client lazily
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      aiInstance = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return aiInstance;
}

// Robust helper wrapper for calling Gemini content generation with retry and model fallback
async function robustGenerateContent(ai: GoogleGenAI, params: any) {
  try {
    return await ai.models.generateContent(params);
  } catch (error: any) {
    console.log(`[Gemini] Model ${params.model} busy. Trying alternative...`);
    if (params.model === 'gemini-3.5-flash') {
      console.log(`[Gemini] Retrying generateContent with fallback model 'gemini-3.1-flash-lite'...`);
      try {
        const fallbackParams = { ...params, model: 'gemini-3.1-flash-lite' };
        return await ai.models.generateContent(fallbackParams);
      } catch (fallbackError: any) {
        console.log(`[Gemini] Lite option busy. Trying final option...`);
        console.log(`[Gemini] Retrying generateContent with last-resort model 'gemini-flash-latest'...`);
        const finalParams = { ...params, model: 'gemini-flash-latest' };
        return await ai.models.generateContent(finalParams);
      }
    }
    throw error;
  }
}

declare global {
  var state: any;
}

// Global App State with default hackathon-winning interactive demo data
const DEFAULT_STATE = {
  tasks: [
    {
      id: 'task-1',
      title: 'CS50 Final Project Presentation',
      description: 'Submit slides and writeup for the final CS50 project. Must cover the full architecture and record a 2-minute video demo.',
      deadline: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(), // 18 hours from now
      estimatedHours: 6,
      urgencyScore: 92,
      deadlineScore: 95,
      importanceScore: 98,
      energyRequirement: 'high',
      riskLevel: 'critical',
      probabilityOfMissing: 64,
      overallPriorityScore: 96,
      completed: false,
      postponeCount: 3,
      category: 'Study',
      subTasks: [
        { id: 'sub-1', title: 'Outline script & key points', estimatedMinutes: 30, completed: true, order: 1 },
        { id: 'sub-2', title: 'Design visual slides in dark mode', estimatedMinutes: 90, completed: false, order: 2 },
        { id: 'sub-3', title: 'Record screen & voice explanation', estimatedMinutes: 120, completed: false, order: 3 },
        { id: 'sub-4', title: 'Submit pull request and verify URLs', estimatedMinutes: 40, completed: false, order: 4 }
      ]
    },
    {
      id: 'task-2',
      title: 'Monthly Cloud Infrastructure Bill',
      description: 'Review AWS & Cloud Run usage and authorize standard billing invoice. Avoid late fees.',
      deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 2 days from now
      estimatedHours: 1,
      urgencyScore: 68,
      deadlineScore: 72,
      importanceScore: 80,
      energyRequirement: 'low',
      riskLevel: 'warning',
      probabilityOfMissing: 35,
      overallPriorityScore: 74,
      completed: false,
      postponeCount: 1,
      category: 'Finance',
      subTasks: [
        { id: 'sub-5', title: 'Login to AWS console and export logs', estimatedMinutes: 15, completed: false, order: 1 },
        { id: 'sub-6', title: 'Verify spending anomalies', estimatedMinutes: 20, completed: false, order: 2 },
        { id: 'sub-7', title: 'Authorize charge', estimatedMinutes: 5, completed: false, order: 3 }
      ]
    },
    {
      id: 'task-3',
      title: 'UI Design Refactoring for Landing Page',
      description: 'Transition from default cards to Apple-level glassmorphic gradients and fluid negative space layout.',
      deadline: new Date(Date.now() + 120 * 60 * 60 * 1000).toISOString(), // 5 days from now
      estimatedHours: 8,
      urgencyScore: 45,
      deadlineScore: 40,
      importanceScore: 88,
      energyRequirement: 'medium',
      riskLevel: 'safe',
      probabilityOfMissing: 15,
      overallPriorityScore: 62,
      completed: true,
      postponeCount: 0,
      category: 'Work',
      subTasks: [
        { id: 'sub-8', title: 'Inspect CSS layout bugs', estimatedMinutes: 45, completed: true, order: 1 },
        { id: 'sub-9', title: 'Implement custom theme presets', estimatedMinutes: 120, completed: true, order: 2 }
      ]
    }
  ] as Task[],
  timeBlocks: [
    { id: 'tb-1', title: 'Morning Review & AI Action Coach Plan', start: '08:30', end: '09:00', type: 'admin', completed: true },
    { id: 'tb-2', title: 'CS50 Slides Design (Focus Session)', start: '09:00', end: '11:00', type: 'focus', completed: false, taskId: 'task-1' },
    { id: 'tb-3', title: 'Sync with External Calendar (Mock Conflict)', start: '11:00', end: '12:00', type: 'meeting', completed: true },
    { id: 'tb-4', title: 'Midday Power Nap & Re-energize', start: '12:00', end: '12:30', type: 'break', completed: true },
    { id: 'tb-5', title: 'CS50 Recording Voiceover', start: '13:30', end: '15:30', type: 'focus', completed: false, taskId: 'task-1' },
    { id: 'tb-6', title: 'AWS Spending Check', start: '16:00', end: '17:00', type: 'focus', completed: false, taskId: 'task-2' }
  ] as TimeBlock[],
  focusSessions: [
    { id: 'f-1', durationMinutes: 45, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), mood: 'energetic', mode: 'study', productivityRating: 5 },
    { id: 'f-2', durationMinutes: 60, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), mood: 'anxious', mode: 'rescue', productivityRating: 4 },
    { id: 'f-3', durationMinutes: 30, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), mood: 'tired', mode: 'work', productivityRating: 3 },
    { id: 'f-4', durationMinutes: 50, timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), mood: 'focused', mode: 'study', productivityRating: 5 }
  ] as FocusSession[],
  procrastinationLogs: [
    {
      id: 'p-1',
      timestamp: new Date().toISOString(),
      detectedTrigger: "Postponed 'CS50 Final Project' 3 consecutive times",
      interventionText: "Hey! CS50 is at a 64% danger of slipping. Don't worry about the full video yet. Let's just spend 15 minutes drafting the bullet points. I have opened the Focus Block for you below. Let's conquer it!",
      status: 'active'
    }
  ] as ProcrastinationLog[],
  chatMessages: [
    {
      id: 'm-1',
      role: 'assistant',
      content: "Hello! I am your AI Executive Partner. I have parsed your deadlines and generated today's roadmap. I notice 'CS50 Final Project Presentation' is tomorrow at critical danger. Let's break it down or launch Emergency Rescue Mode if you need help compressing non-essential blocks. What would you like to tackle first?",
      timestamp: new Date().toISOString()
    }
  ] as ChatMessage[],
  metrics: {
    productivityScore: 78,
    dailyXp: 240,
    totalXp: 3820,
    streakDays: 6,
    bestFocusHour: '10:00 AM',
    mostProductiveDay: 'Tuesday',
    completionRate: 85,
    workConsistency: 92
  } as ProductivityMetrics,
  rescueMode: {
    isActive: false,
    fastestStrategy: '',
    scheduleChanges: []
  } as RescueModePlan
};

// --- MULTI-USER ISOLATION VIA ASYNC LOCAL STORAGE ---
import { AsyncLocalStorage } from 'async_hooks';

const userStateStorage = new AsyncLocalStorage<{ uid: string; state: any }>();

let globalState = { ...DEFAULT_STATE };

// Define a dynamic proxy/getter on globalThis for 'state' to avoid rewriting all routes
Object.defineProperty(globalThis, 'state', {
  get() {
    const store = userStateStorage.getStore();
    return store ? store.state : globalState;
  },
  set(val) {
    const store = userStateStorage.getStore();
    if (store) {
      store.state = val;
    } else {
      globalState = val;
    }
  },
  configurable: true
});

// Clean empty state for real authenticated users
const EMPTY_STATE = {
  tasks: [],
  timeBlocks: [],
  focusSessions: [],
  procrastinationLogs: [],
  chatMessages: [
    {
      id: 'm-1',
      role: 'assistant',
      content: "Hello! I am your AI Executive Partner. I see you have a fresh slate today. Let's add your first task or syllabus, and I will help you analyze the priority and set up your dynamic schedule!",
      timestamp: new Date().toISOString()
    }
  ],
  metrics: {
    productivityScore: 0,
    dailyXp: 0,
    totalXp: 0,
    streakDays: 0,
    bestFocusHour: 'Not calculated yet',
    mostProductiveDay: 'Not calculated yet',
    completionRate: 0,
    workConsistency: 0
  },
  rescueMode: {
    isActive: false,
    fastestStrategy: '',
    scheduleChanges: []
  },
  settings: {
    taskPreferences: '',
    customNeeds: ''
  }
};

function getUserStateFile(uid: string) {
  return path.join(process.cwd(), `db-${uid}.json`);
}

function loadUserState(uid: string) {
  const file = getUserStateFile(uid);
  const baseEmptyState = JSON.parse(JSON.stringify(EMPTY_STATE));
  const baseDefaultState = JSON.parse(JSON.stringify(DEFAULT_STATE));
  
  try {
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf-8');
      const parsed = JSON.parse(raw);
      // Determine if this file represents a guest or authenticated user
      const isGuest = uid === 'guest_user_123';
      return { ...(isGuest ? baseDefaultState : baseEmptyState), ...parsed };
    }
  } catch (e) {
    console.error(`Failed to load state for user ${uid}:`, e);
  }

  // Brand new user init
  if (uid === 'guest_user_123') {
    return baseDefaultState;
  }
  return baseEmptyState;
}

function saveUserState(uid: string, userState: any) {
  const file = getUserStateFile(uid);
  try {
    fs.writeFileSync(file, JSON.stringify(userState, null, 2), 'utf-8');
  } catch (e) {
    console.error(`Failed to save state for user ${uid}:`, e);
  }
}

function loadState() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const loaded = JSON.parse(raw);
      globalState = { ...DEFAULT_STATE, ...loaded };
      console.log('Fallback database loaded successfully from', DB_FILE);
    } else {
      saveState();
    }
  } catch (e) {
    console.error('Error loading fallback state, using defaults:', e);
  }
}

function saveState() {
  const store = userStateStorage.getStore();
  if (store) {
    saveUserState(store.uid, store.state);
  } else {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(globalState, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database file:', e);
    }
  }
}

loadState();

// Express Middleware to intercept and bind each request to its user state context
app.use((req, res, next) => {
  const uid = req.headers['x-user-uid'] as string;
  if (uid && uid.trim()) {
    const userState = loadUserState(uid);
    userStateStorage.run({ uid, state: userState }, () => {
      // Override response json and send methods to automatically save state at end of request
      const originalJson = res.json;
      res.json = function (body) {
        saveState();
        return originalJson.call(this, body);
      };

      const originalSend = res.send;
      res.send = function (body) {
        saveState();
        return originalSend.call(this, body);
      };

      next();
    });
  } else {
    next();
  }
});

// --- API ROUTES ---

// 1. Get Application State
app.get('/api/state', (req, res) => {
  res.json(state);
});

// 1b. Update User Settings
app.post('/api/settings', (req, res) => {
  const { settings } = req.body;
  state.settings = settings || { taskPreferences: '', customNeeds: '' };
  saveState();
  res.json({ success: true, settings: state.settings });
});

// 2. Reset State (Clean Hackathon Demo Trigger)
app.post('/api/state/reset', (req, res) => {
  state = {
    ...DEFAULT_STATE,
    tasks: JSON.parse(JSON.stringify(DEFAULT_STATE.tasks)),
    timeBlocks: JSON.parse(JSON.stringify(DEFAULT_STATE.timeBlocks)),
    focusSessions: JSON.parse(JSON.stringify(DEFAULT_STATE.focusSessions)),
    procrastinationLogs: JSON.parse(JSON.stringify(DEFAULT_STATE.procrastinationLogs)),
    chatMessages: JSON.parse(JSON.stringify(DEFAULT_STATE.chatMessages)),
    metrics: { ...DEFAULT_STATE.metrics },
    rescueMode: { ...DEFAULT_STATE.rescueMode }
  };
  saveState();
  res.json({ success: true, state });
});

// 3. Create or Update Task
app.post('/api/tasks', async (req, res) => {
  const { id, title, description, deadline, estimatedHours, category } = req.body;
  const taskId = id || `task-${Date.now()}`;
  
  // Calculate default scores locally first (ensures flawless offline fallback)
  const hoursLeft = Math.max(1, (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60));
  const urgency = Math.min(100, Math.max(10, Math.round((24 / hoursLeft) * 50)));
  const importance = category === 'Work' || category === 'Study' ? 85 : 50;
  const dlScore = Math.min(100, Math.max(5, Math.round((120 / hoursLeft) * 20)));
  
  const risk = hoursLeft < 24 ? 'critical' : hoursLeft < 72 ? 'warning' : 'safe';
  const probMissing = risk === 'critical' ? 70 : risk === 'warning' ? 40 : 15;
  const overall = Math.round((urgency * 0.4) + (importance * 0.4) + (dlScore * 0.2));

  const newTask: Task = {
    id: taskId,
    title,
    description: description || '',
    deadline,
    estimatedHours: Number(estimatedHours) || 1,
    urgencyScore: urgency,
    deadlineScore: dlScore,
    importanceScore: importance,
    energyRequirement: 'medium',
    riskLevel: risk,
    probabilityOfMissing: probMissing,
    overallPriorityScore: overall,
    completed: false,
    postponeCount: 0,
    category: category || 'Personal',
    subTasks: []
  };

  const existingIndex = state.tasks.findIndex(t => t.id === taskId);
  if (existingIndex > -1) {
    state.tasks[existingIndex] = { ...state.tasks[existingIndex], ...req.body };
  } else {
    state.tasks.unshift(newTask);
  }
  
  saveState();
  res.json(state.tasks.find(t => t.id === taskId));
});

// Update single task status / details
app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const index = state.tasks.findIndex(t => t.id === id);
  if (index > -1) {
    const original = state.tasks[index];
    state.tasks[index] = { ...original, ...req.body };
    
    // Reward XP on completion!
    if (req.body.completed === true && !original.completed) {
      state.metrics.dailyXp += 100;
      state.metrics.totalXp += 100;
      state.metrics.productivityScore = Math.min(100, state.metrics.productivityScore + 3);
    }
    
    saveState();
    res.json(state.tasks[index]);
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

// Delete Task
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  state.tasks = state.tasks.filter(t => t.id !== id);
  // Also clean up associated schedule blocks
  state.timeBlocks = state.timeBlocks.filter(tb => tb.taskId !== id);
  saveState();
  res.json({ success: true });
});

// Update subtask
app.put('/api/tasks/:taskId/subtasks/:subTaskId', (req, res) => {
  const { taskId, subTaskId } = req.params;
  const task = state.tasks.find(t => t.id === taskId);
  if (task) {
    const sub = task.subTasks.find(s => s.id === subTaskId);
    if (sub) {
      const originalCompleted = sub.completed;
      Object.assign(sub, req.body);
      
      // Award micro XP
      if (sub.completed && !originalCompleted) {
        state.metrics.dailyXp += 20;
        state.metrics.totalXp += 20;
      }
      
      saveState();
      res.json({ task });
    } else {
      res.status(404).json({ error: 'Subtask not found' });
    }
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

// 4. TimeBlocks CRUD
app.get('/api/schedule', (req, res) => {
  res.json(state.timeBlocks);
});

app.post('/api/schedule', (req, res) => {
  const { title, start, end, type, taskId } = req.body;
  const block: TimeBlock = {
    id: `tb-${Date.now()}`,
    title,
    start,
    end,
    type: type || 'focus',
    completed: false,
    taskId
  };
  state.timeBlocks.push(block);
  // Sort schedule chronologically
  state.timeBlocks.sort((a, b) => a.start.localeCompare(b.start));
  saveState();
  res.json(block);
});

app.put('/api/schedule/:id', (req, res) => {
  const { id } = req.params;
  const index = state.timeBlocks.findIndex(tb => tb.id === id);
  if (index > -1) {
    const original = state.timeBlocks[index];
    state.timeBlocks[index] = { ...original, ...req.body };
    
    if (req.body.completed === true && !original.completed) {
      state.metrics.dailyXp += 40;
      state.metrics.totalXp += 40;
    }
    
    saveState();
    res.json(state.timeBlocks[index]);
  } else {
    res.status(404).json({ error: 'Schedule block not found' });
  }
});

app.delete('/api/schedule/:id', (req, res) => {
  state.timeBlocks = state.timeBlocks.filter(tb => tb.id !== req.params.id);
  saveState();
  res.json({ success: true });
});

// 5. Focus Logs & Session Recording
app.post('/api/focus', (req, res) => {
  const { durationMinutes, mood, mode, productivityRating, taskId } = req.body;
  const session: FocusSession = {
    id: `f-${Date.now()}`,
    taskId,
    durationMinutes: Number(durationMinutes) || 25,
    timestamp: new Date().toISOString(),
    mood: mood || 'focused',
    mode: mode || 'study',
    productivityRating: Number(productivityRating) || 5
  };
  
  state.focusSessions.unshift(session);
  
  // Award Focus XP: 2XP per focus minute + bonus for completion!
  const xpGained = (session.durationMinutes * 2) + (productivityRating * 10);
  state.metrics.dailyXp += xpGained;
  state.metrics.totalXp += xpGained;
  
  // Recalculate streak & best focus hours dynamically
  state.metrics.productivityScore = Math.min(100, Math.round(state.metrics.productivityScore + (session.productivityRating * 0.8)));
  
  saveState();
  res.json({ session, metrics: state.metrics });
});

// --- ADVANCED AI FEATURES USING GEMINI ---

// A. AI Priority Engine: Multi-factor Priority & Risk analysis
app.post('/api/ai/analyze-priority', async (req, res) => {
  const { task } = req.body;
  if (!task) {
    return res.status(400).json({ error: 'No task provided' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Elegant Offline Simulation if key isn't provided
    const hoursLeft = Math.max(1, (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60));
    const urgency = Math.min(100, Math.max(10, Math.round((48 / hoursLeft) * 45)));
    const deadlineS = Math.min(100, Math.max(5, Math.round((120 / hoursLeft) * 25)));
    const importance = task.category === 'Work' || task.category === 'Study' ? 90 : 60;
    const probability = hoursLeft < 20 ? 78 : hoursLeft < 48 ? 48 : 12;
    const risk = hoursLeft < 24 ? 'critical' : hoursLeft < 72 ? 'warning' : 'safe';
    const overall = Math.round((urgency * 0.45) + (importance * 0.35) + (deadlineS * 0.20));

    const simulatedResponse = {
      urgencyScore: urgency,
      deadlineScore: deadlineS,
      importanceScore: importance,
      energyRequirement: hoursLeft < 36 ? 'high' : 'medium',
      riskLevel: risk,
      probabilityOfMissing: probability,
      overallPriorityScore: overall,
      whyExplanation: `At current pace, you have only ${100 - probability}% chance of success because of high effort compared to the short ${Math.round(hoursLeft)} hours left. Immediate focus block is recommended.`,
      microTasks: [
        { title: 'Information gathering & layout sketch', estimatedMinutes: 20 },
        { title: 'Core implementation & draft development', estimatedMinutes: 60 },
        { title: 'Double check specifications & submit', estimatedMinutes: 25 }
      ]
    };
    return res.json({ isOfflineSim: true, ...simulatedResponse });
  }

  try {
    const userPreferences = state.settings?.taskPreferences ? `\nUser task processing preferences to respect when breaking into subtasks: ${state.settings.taskPreferences}` : "";
    const userNeeds = state.settings?.customNeeds ? `\nUser custom needs or accommodations: ${state.settings.customNeeds}` : "";
    const prompt = `You are an expert scheduling agent and productivity researcher.
    Analyze this task and calculate the dynamic risk of missing its deadline:
    Task Title: "${task.title}"
    Description: "${task.description}"
    Category: "${task.category}"
    Deadline: "${task.deadline}"
    Estimated Hours to Complete: ${task.estimatedHours}
    Current Local Time: ${new Date().toISOString()}${userPreferences}${userNeeds}

    Compare the hours remaining before the deadline against the estimated hours. Factoring in sleep and fatigue, calculate:
    1. Urgency Score (1-100)
    2. Deadline Score (1-100)
    3. Importance Score (1-100)
    4. Energy Requirement ('low', 'medium', 'high')
    5. Risk Level ('safe', 'warning', 'critical')
    6. Probability of Missing Deadline (0-100%)
    7. Overall Priority Score (1-100)
    8. A punchy 2-sentence explanation of WHY this risk level exists and what immediate coach intervention will save it.
    9. A list of 3-5 tactical micro subtasks with realistic estimated times in minutes to complete each piece.

    Respond STRICTLY in the following JSON format. Do not write any wrapping text, markdown formatting, or preamble outside the JSON object.`;

    const response = await robustGenerateContent(ai, {
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            urgencyScore: { type: Type.INTEGER },
            deadlineScore: { type: Type.INTEGER },
            importanceScore: { type: Type.INTEGER },
            energyRequirement: { type: Type.STRING },
            riskLevel: { type: Type.STRING },
            probabilityOfMissing: { type: Type.INTEGER },
            overallPriorityScore: { type: Type.INTEGER },
            whyExplanation: { type: Type.STRING },
            microTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  estimatedMinutes: { type: Type.INTEGER }
                },
                required: ['title', 'estimatedMinutes']
              }
            }
          },
          required: [
            'urgencyScore', 'deadlineScore', 'importanceScore', 'energyRequirement',
            'riskLevel', 'probabilityOfMissing', 'overallPriorityScore', 'whyExplanation', 'microTasks'
          ]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.log('[Gemini] Running priority engine offline simulation...');
    const hoursLeft = Math.max(1, (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60));
    const urgency = Math.min(100, Math.max(10, Math.round((48 / hoursLeft) * 45)));
    const deadlineS = Math.min(100, Math.max(5, Math.round((120 / hoursLeft) * 25)));
    const importance = task.category === 'Work' || task.category === 'Study' ? 90 : 60;
    const probability = hoursLeft < 20 ? 78 : hoursLeft < 48 ? 48 : 12;
    const risk = hoursLeft < 24 ? 'critical' : hoursLeft < 72 ? 'warning' : 'safe';
    const overall = Math.round((urgency * 0.45) + (importance * 0.35) + (deadlineS * 0.20));

    const simulatedResponse = {
      urgencyScore: urgency,
      deadlineScore: deadlineS,
      importanceScore: importance,
      energyRequirement: hoursLeft < 36 ? 'high' : 'medium',
      riskLevel: risk,
      probabilityOfMissing: probability,
      overallPriorityScore: overall,
      whyExplanation: `At current pace, you have only ${100 - probability}% chance of success because of high effort compared to the short ${Math.round(hoursLeft)} hours left. Immediate focus block is recommended.`,
      microTasks: [
        { title: 'Information gathering & layout sketch', estimatedMinutes: 20 },
        { title: 'Core implementation & draft development', estimatedMinutes: 60 },
        { title: 'Double check specifications & submit', estimatedMinutes: 25 }
      ]
    };
    res.json({ isOfflineSim: true, ...simulatedResponse });
  }
});

// B. Smart Dynamic Scheduler: Generate optimal hour-by-hour roadmap
app.post('/api/ai/generate-roadmap', async (req, res) => {
  const { currentHour } = req.body; // e.g. "09:00"
  const activeTasks = state.tasks.filter(t => !t.completed);
  
  const ai = getGeminiClient();
  if (!ai) {
    // Generate intelligent roadmap locally
    const templates = [
      { id: `tb-${Date.now()}-1`, title: '🚀 Fast-track Focus: CS50 Presentation Slides', start: '09:00', end: '11:00', type: 'focus', completed: false, taskId: 'task-1' },
      { id: `tb-${Date.now()}-2`, title: '🧘 Active Coach Recovery Block (Decompress)', start: '11:00', end: '11:30', type: 'break', completed: false },
      { id: `tb-${Date.now()}-3`, title: '⚡ Rapid Session: AWS Spending Audit', start: '11:30', end: '12:30', type: 'focus', completed: false, taskId: 'task-2' },
      { id: `tb-${Date.now()}-4`, title: '📅 Standard Sync & Calendar Audit', start: '14:00', end: '14:30', type: 'meeting', completed: false }
    ] as TimeBlock[];
    state.timeBlocks = templates;
    saveState();
    return res.json({ timeBlocks: templates, isOfflineSim: true });
  }

  try {
    const userPreferences = state.settings?.taskPreferences ? `\nUser task scheduling preferences: ${state.settings.taskPreferences}` : "";
    const userNeeds = state.settings?.customNeeds ? `\nUser custom needs or accommodations: ${state.settings.customNeeds}` : "";
    const prompt = `You are a scheduling AI agent. Reorganize today's time blocks dynamically.
    Active Tasks with Deadlines:
    ${JSON.stringify(activeTasks.map(t => ({ title: t.title, deadline: t.deadline, estHours: t.estimatedHours, overallPriority: t.overallPriorityScore })))}

    Current Local Time Hour: ${currentHour || '09:00'}${userPreferences}${userNeeds}

    Generate a sequence of 4-6 chronological time-blocks (focus sessions, breaks, administration) starting from the current hour to complete maximum priority work before deadlines. Prevent burnout by scheduling a 15-30 min break after every high-energy focus block. Ensure the JSON schema is followed precisely.`;

    const response = await robustGenerateContent(ai, {
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            timeBlocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  start: { type: Type.STRING, description: 'Format HH:MM e.g. 09:30' },
                  end: { type: Type.STRING, description: 'Format HH:MM e.g. 11:30' },
                  type: { type: Type.STRING, description: 'focus, break, meeting, or admin' },
                  taskId: { type: Type.STRING, description: 'matching ID of the active tasks if applicable' }
                },
                required: ['title', 'start', 'end', 'type']
              }
            }
          },
          required: ['timeBlocks']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    if (parsed.timeBlocks) {
      const generated = parsed.timeBlocks.map((b: any, index: number) => ({
        id: `tb-gen-${index}-${Date.now()}`,
        completed: false,
        ...b
      }));
      state.timeBlocks = generated;
      saveState();
      res.json({ timeBlocks: generated });
    } else {
      res.status(500).json({ error: 'AI returned malformed blocks' });
    }
  } catch (error: any) {
    console.log('[Gemini] Running scheduler offline simulation...');
    const templates = [
      { id: `tb-${Date.now()}-1`, title: '🚀 Fast-track Focus: CS50 Presentation Slides', start: '09:00', end: '11:00', type: 'focus', completed: false, taskId: 'task-1' },
      { id: `tb-${Date.now()}-2`, title: '🧘 Active Coach Recovery Block (Decompress)', start: '11:00', end: '11:30', type: 'break', completed: false },
      { id: `tb-${Date.now()}-3`, title: '⚡ Rapid Session: AWS Spending Audit', start: '11:30', end: '12:30', type: 'focus', completed: false, taskId: 'task-2' },
      { id: `tb-${Date.now()}-4`, title: '📅 Standard Sync & Calendar Audit', start: '14:00', end: '14:30', type: 'meeting', completed: false }
    ] as TimeBlock[];
    state.timeBlocks = templates;
    saveState();
    res.json({ timeBlocks: templates, isOfflineSim: true });
  }
});

// C. Dynamic Chat Companion with Voice & OCR/Document intelligence
app.post('/api/ai/chat', async (req, res) => {
  const { message, isVoice, fileData, fileName } = req.body;
  if (!message && !fileData) {
    return res.status(400).json({ error: 'Empty message or upload' });
  }

  // Push user message to state
  const userMsgId = `m-user-${Date.now()}`;
  const userMessageContent = fileData
    ? `[Document Uploaded: ${fileName || 'unnamed.pdf'}] ${message || 'Please parse this file and extract core deadlines.'}`
    : message;

  const userMsg: ChatMessage = {
    id: userMsgId,
    role: 'user',
    content: userMessageContent,
    timestamp: new Date().toISOString(),
    isVoice: !!isVoice,
    isDocumentParsed: !!fileData
  };
  state.chatMessages.push(userMsg);

  const ai = getGeminiClient();
  if (!ai) {
    // Offline simulated responses
    let coachReply = "I have reviewed your message! Since we're in offline preview, let me give you standard expert coaching advice: break your work down, focus on the top 10% highest impact items, and commit to a 20-minute timer. I am fully ready to support you!";
    if (fileData) {
      coachReply = `[Parsed Doc: ${fileName}] extracted standard deadline for "Term Assignment 1" set on July 10, 2026. Urgency rating calculated at Medium-High. I have mapped it to your task tracker. Let me know if you would like to generate micro-tasks!`;
      
      // Auto create the parsed task
      const parsedTask: Task = {
        id: `task-parsed-${Date.now()}`,
        title: `Term Assignment (${fileName})`,
        description: `Extracted automatically from document. Verify exact requirements with syllabus.`,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedHours: 5,
        urgencyScore: 55,
        deadlineScore: 50,
        importanceScore: 80,
        energyRequirement: 'medium',
        riskLevel: 'safe',
        probabilityOfMissing: 20,
        overallPriorityScore: 58,
        completed: false,
        postponeCount: 0,
        category: 'Study',
        subTasks: []
      };
      state.tasks.unshift(parsedTask);
    } else if (message.toLowerCase().includes('interview') || message.toLowerCase().includes('friday')) {
      coachReply = `I have logged your upcoming interview on Friday! I have set up a customized 4-part preparation sequence:
      1. Review company culture & tech stack (45m)
      2. Perfect behavioral questions in STAR format (60m)
      3. Perform standard coding mock practice (90m)
      4. Complete a mock video rehearsal (30m)
      
      Would you like me to book these focus study blocks into your interactive schedule right now?`;
    }

    const assistantMsg: ChatMessage = {
      id: `m-asst-${Date.now()}`,
      role: 'assistant',
      content: coachReply,
      timestamp: new Date().toISOString()
    };
    state.chatMessages.push(assistantMsg);
    saveState();
    return res.json({ reply: coachReply, state });
  }

  try {
    let responseText = "";
    const activeTasksStr = JSON.stringify(state.tasks.filter(t => !t.completed).map(t => ({ title: t.title, deadline: t.deadline })));

    if (fileData) {
      // Document OCR scanning using multi-part contents
      const imagePart = {
        inlineData: {
          mimeType: fileData.split(';')[0].split(':')[1] || 'image/png',
          data: fileData.split(',')[1] || fileData
        }
      };
      const textPart = {
        text: `You are an expert OCR and productivity scanner. Extract any deliverables, dates, tests, homework, bills, or tasks mentioned in this document.
        Structure your reply as a gorgeous readable report.
        In your response, also output a JSON format at the absolute bottom wrapped in [JSON_START] and [JSON_END] matching the structure:
        {"title": "Extracted Title", "deadline": "YYYY-MM-DDTHH:MM:SSZ", "description": "Extracted Details"}`
      };

      const response = await robustGenerateContent(ai, {
        model: 'gemini-3.5-flash',
        contents: { parts: [imagePart, textPart] }
      });
      
      responseText = response.text || "";
      
      // Attempt to extract the JSON and add a real task!
      try {
        const match = responseText.match(/\[JSON_START\]([\s\S]*?)\[JSON_END\]/);
        if (match && match[1]) {
          const parsed = JSON.parse(match[1].trim());
          const parsedTask: Task = {
            id: `task-parsed-${Date.now()}`,
            title: parsed.title || 'Parsed Assignment',
            description: parsed.description || 'Extracted automatically from document scanning.',
            deadline: parsed.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            estimatedHours: 4,
            urgencyScore: 60,
            deadlineScore: 50,
            importanceScore: 80,
            energyRequirement: 'medium',
            riskLevel: 'safe',
            probabilityOfMissing: 25,
            overallPriorityScore: 65,
            completed: false,
            postponeCount: 0,
            category: 'Study',
            subTasks: []
          };
          state.tasks.unshift(parsedTask);
        }
      } catch (innerE) {
        console.log("No structured JSON task created from document, responding with text only.", innerE);
      }

    } else {
      // General natural language chat with state context (exclude the current userMsg at the end)
      const chatHistory = state.chatMessages.slice(0, -1).slice(-8).map(m => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.content }]
      }));

      const userPreferences = state.settings?.taskPreferences ? `\nUser task preferences: ${state.settings.taskPreferences}` : "";
      const userNeeds = state.settings?.customNeeds ? `\nUser custom needs or accommodations: ${state.settings.customNeeds}` : "";
      const sysInstruction = `You are an active executive productivity partner, conversational coach, and direct strategist named "Rescue AI Coach".
Your voice is inspiring, firm but empathetic, clear, and action-oriented. You speak directly to the user.
Avoid filler. Never say "As an AI..."

CRITICAL FORMATTING RULES:
1. Always output well-structured Markdown.
2. Use bold text for emphasis.
3. Break down advice into easily readable bullet points or numbered lists.
4. Keep paragraphs extremely short (1-2 sentences maximum).
5. Use clear, simple headings (e.g., **Action Plan**, **Insight**) if the response has multiple parts.

Here is the user's current list of uncompleted tasks: ${activeTasksStr}.${userPreferences}${userNeeds}
The current time is ${new Date().toISOString()}.
Help them outline, plan, reschedule, de-stress, or solve their anxiety about deadlines. Keep responses exceptionally easy to scan and read.`;

      let response;
      try {
        const chat = ai.chats.create({
          model: 'gemini-3.5-flash',
          config: {
            systemInstruction: sysInstruction,
          },
          history: chatHistory
        });
        response = await chat.sendMessage({ message: userMessageContent });
      } catch (chatError: any) {
        console.log(`[Gemini] Chat model gemini-3.5-flash busy. Trying alternative...`);
        try {
          console.log(`[Gemini] Retrying chat with fallback model 'gemini-3.1-flash-lite'...`);
          const chat = ai.chats.create({
            model: 'gemini-3.1-flash-lite',
            config: {
              systemInstruction: sysInstruction,
            },
            history: chatHistory
          });
          response = await chat.sendMessage({ message: userMessageContent });
        } catch (fallbackError: any) {
          console.log(`[Gemini] Fallback chat model 'gemini-3.1-flash-lite' busy. Trying final option...`);
          console.log(`[Gemini] Retrying chat with last-resort model 'gemini-flash-latest'...`);
          const chat = ai.chats.create({
            model: 'gemini-flash-latest',
            config: {
              systemInstruction: sysInstruction,
            },
            history: chatHistory
          });
          response = await chat.sendMessage({ message: userMessageContent });
        }
      }
      responseText = response.text || "";
    }

    const assistantMsg: ChatMessage = {
      id: `m-asst-${Date.now()}`,
      role: 'assistant',
      content: responseText,
      timestamp: new Date().toISOString()
    };
    state.chatMessages.push(assistantMsg);
    saveState();
    res.json({ reply: responseText, state });

  } catch (error: any) {
    console.log('[Gemini] Running chat offline simulation...');
    let coachReply = "I have reviewed your message! Since the active AI service is currently in high demand, let me give you standard expert coaching advice: break your work down, focus on the top 10% highest impact items, and commit to a 20-minute timer. I am fully ready to support you!";
    if (fileData) {
      coachReply = `[Parsed Doc: ${fileName}] Extracted standard deadline for "Term Assignment 1" set on July 10, 2026. Urgency rating calculated at Medium-High. I have mapped it to your task tracker. Let me know if you would like to generate micro-tasks!`;
      
      const parsedTask: Task = {
        id: `task-parsed-${Date.now()}`,
        title: `Term Assignment (${fileName})`,
        description: `Extracted automatically from document. Verify exact requirements with syllabus.`,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedHours: 5,
        urgencyScore: 55,
        deadlineScore: 50,
        importanceScore: 80,
        energyRequirement: 'medium',
        riskLevel: 'safe',
        probabilityOfMissing: 20,
        overallPriorityScore: 58,
        completed: false,
        postponeCount: 0,
        category: 'Study',
        subTasks: []
      };
      state.tasks.unshift(parsedTask);
    } else if (message.toLowerCase().includes('interview') || message.toLowerCase().includes('friday')) {
      coachReply = `I have logged your upcoming interview on Friday! I have set up a customized 4-part preparation sequence:
      1. Review company culture & tech stack (45m)
      2. Perfect behavioral questions in STAR format (60m)
      3. Perform standard coding mock practice (90m)
      4. Complete a mock video rehearsal (30m)
      
      Would you like me to book these focus study blocks into your interactive schedule right now?`;
    }

    const assistantMsg: ChatMessage = {
      id: `m-asst-${Date.now()}`,
      role: 'assistant',
      content: coachReply,
      timestamp: new Date().toISOString()
    };
    state.chatMessages.push(assistantMsg);
    saveState();
    res.json({ reply: coachReply, state, isOfflineSim: true });
  }
});

// D. Emergency Rescue Mode: Decompress scheduling conflicts & fast-track strategies
app.post('/api/ai/rescue', async (req, res) => {
  const { taskId } = req.body;
  const targetTask = state.tasks.find(t => t.id === taskId);
  if (!targetTask) {
    return res.status(404).json({ error: 'Target task not found' });
  }

  // Set Rescue Plan State
  state.rescueMode.isActive = true;
  state.rescueMode.activatedAt = new Date().toISOString();
  
  const ai = getGeminiClient();
  if (!ai) {
    // Offline simulation mode
    state.rescueMode.fastestStrategy = `🔥 TARGET ACQUIRED: "${targetTask.title}" is close. 
    1. COMPRESS: Cut slide design from 90m to 30m using template preset.
    2. SHIFT: Transferred aws-bill audit to Monday.
    3. FORCE FOCUS: Turn on full focus workspace blocks for next 2 hours. Start Focus Timer!`;
    state.rescueMode.scheduleChanges = [
      "AWS Spent audit shifted dynamically by 48 hours to secure Focus slots.",
      "Canceled non-urgent personal errands from schedule."
    ];
    
    // Auto shift meetings or blocks in our schedule
    state.timeBlocks = state.timeBlocks.map(block => {
      if (block.type === 'meeting' || block.taskId === 'task-2') {
        return { ...block, title: `⚠️ [SHIFTED FOR RESCUE] ${block.title}`, completed: false };
      }
      return block;
    });

    saveState();
    return res.json({ rescuePlan: state.rescueMode, state });
  }

  try {
    const prompt = `You are a crisis productivity planning agent.
    We are activating "EMERGENCY RESCUE MODE" for the critical deadline task: "${targetTask.title}".
    Details: "${targetTask.description}"
    Deadline: ${targetTask.deadline}
    Hours left: ${Math.round((new Date(targetTask.deadline).getTime() - Date.now()) / (1000 * 60 * 60))}
    Estimated Hours: ${targetTask.estimatedHours}

    Current Schedule:
    ${JSON.stringify(state.timeBlocks)}

    Create an immediate survival plan:
    1. Identify non-essential meetings or admin blocks in the schedule that can be canceled or postponed.
    2. Compress focus durations (e.g., from 90 to 45 minutes) with actionable speed hacks.
    3. Generate a fastest-completion tactical strategy in 3 clear bullet points.
    4. Return the compressed roadmap items.

    Respond strictly in JSON format matching the schema below.`;

    const response = await robustGenerateContent(ai, {
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fastestStrategy: { type: Type.STRING },
            scheduleChanges: { type: Type.ARRAY, items: { type: Type.STRING } },
            compressedBlocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  start: { type: Type.STRING },
                  end: { type: Type.STRING },
                  type: { type: Type.STRING }
                },
                required: ['title', 'start', 'end', 'type']
              }
            }
          },
          required: ['fastestStrategy', 'scheduleChanges', 'compressedBlocks']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    state.rescueMode.fastestStrategy = parsed.fastestStrategy || "Hyper-focus activated. Avoid distractions and start the micro subtasks sequence immediately.";
    state.rescueMode.scheduleChanges = parsed.scheduleChanges || [];
    
    if (parsed.compressedBlocks && parsed.compressedBlocks.length > 0) {
      state.timeBlocks = parsed.compressedBlocks.map((b: any, index: number) => ({
        id: `tb-rescue-${index}-${Date.now()}`,
        completed: false,
        taskId: targetTask.id,
        ...b
      }));
    }

    saveState();
    res.json({ rescuePlan: state.rescueMode, state });
  } catch (error: any) {
    console.log('[Gemini] Running agent offline simulation...');
    state.rescueMode.fastestStrategy = `🔥 TARGET ACQUIRED: "${targetTask.title}" is close. 
    1. COMPRESS: Cut slide design from 90m to 30m using template preset.
    2. SHIFT: Transferred aws-bill audit to Monday.
    3. FORCE FOCUS: Turn on full focus workspace blocks for next 2 hours. Start Focus Timer!`;
    state.rescueMode.scheduleChanges = [
      "AWS Spent audit shifted dynamically by 48 hours to secure Focus slots.",
      "Canceled non-urgent personal errands from schedule."
    ];
    
    // Auto shift meetings or blocks in our schedule
    state.timeBlocks = state.timeBlocks.map(block => {
      if (block.type === 'meeting' || block.taskId === 'task-2') {
        return { ...block, title: `⚠️ [SHIFTED FOR RESCUE] ${block.title}`, completed: false };
      }
      return block;
    });

    saveState();
    res.json({ rescuePlan: state.rescueMode, state, isOfflineSim: true });
  }
});

// Deactivate Rescue Mode
app.post('/api/ai/rescue/deactivate', (req, res) => {
  state.rescueMode.isActive = false;
  saveState();
  res.json({ success: true, state });
});

// --- Task Copilot Actions ---

// Break into Steps
app.post('/api/ai/break-steps', async (req, res) => {
  const { taskId } = req.body;
  const taskIndex = state.tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  const task = state.tasks[taskIndex];
  const ai = getGeminiClient();

  if (!ai) {
    // Dynamic Offline fallback
    const steps = [
      { id: `st-bk-1-${Date.now()}`, title: `🔍 Research and requirement analysis for "${task.title}"`, completed: false },
      { id: `st-bk-2-${Date.now()}`, title: `🏗️ Outline layout, key variables & drafts`, completed: false },
      { id: `st-bk-3-${Date.now()}`, title: `⚙️ Execute main development / writing`, completed: false },
      { id: `st-bk-4-${Date.now()}`, title: `🧪 Perform comprehensive testing & verification`, completed: false },
      { id: `st-bk-5-${Date.now()}`, title: `🚀 Complete final polish & submit/deploy`, completed: false }
    ];
    task.subTasks = steps;
    saveState();
    return res.json({ isOfflineSim: true, task });
  }

  try {
    const prompt = `You are a dynamic AI Task coach. Break down this task into 4 to 6 logical, actionable sequential steps/subtasks.
    Task Title: "${task.title}"
    Task Description: "${task.description}"
    Return strictly a JSON array of objects with the property: "title" (string, max 60 chars).`;

    const response = await robustGenerateContent(ai, {
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING }
            },
            required: ['title']
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) {
      task.subTasks = parsed.map((item: any, idx: number) => ({
        id: `st-bk-${idx}-${Date.now()}`,
        title: item.title,
        completed: false
      }));
      saveState();
    }
    res.json({ task });
  } catch (err) {
    console.log('[Gemini] Handled break-steps adjustment.');
    // Fallback on error
    const steps = [
      { id: `st-bk-1-${Date.now()}`, title: `🔍 Research and requirement analysis for "${task.title}"`, completed: false },
      { id: `st-bk-2-${Date.now()}`, title: `🏗️ Outline layout, key variables & drafts`, completed: false },
      { id: `st-bk-3-${Date.now()}`, title: `⚙️ Execute main development / writing`, completed: false },
      { id: `st-bk-4-${Date.now()}`, title: `🧪 Perform comprehensive testing & verification`, completed: false }
    ];
    task.subTasks = steps;
    saveState();
    res.json({ isOfflineSim: true, task });
  }
});

// Estimate Time
app.post('/api/ai/estimate-time', async (req, res) => {
  const { taskId } = req.body;
  const taskIndex = state.tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  const task = state.tasks[taskIndex];
  const ai = getGeminiClient();

  if (!ai) {
    const hours = Math.max(1, Math.min(12, Math.round(5 + Math.random() * 4)));
    task.estimatedHours = hours;
    saveState();
    return res.json({ isOfflineSim: true, task });
  }

  try {
    const prompt = `You are an expert software developer and project estimator. Estimate the total hours needed to complete this task successfully.
    Task Title: "${task.title}"
    Task Description: "${task.description}"
    Return strictly a JSON object with the property: "estimatedHours" (integer between 1 and 24).`;

    const response = await robustGenerateContent(ai, {
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            estimatedHours: { type: Type.INTEGER }
          },
          required: ['estimatedHours']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    if (parsed.estimatedHours) {
      task.estimatedHours = Number(parsed.estimatedHours);
      saveState();
    }
    res.json({ task });
  } catch (err) {
    console.log('[Gemini] Handled estimate-time adjustment.');
    task.estimatedHours = 4;
    saveState();
    res.json({ isOfflineSim: true, task });
  }
});

// Suggest Task details based on a brief idea
app.post('/api/ai/suggest-task', async (req, res) => {
  const { promptText } = req.body;
  if (!promptText) {
    return res.status(400).json({ error: 'promptText is required' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      title: promptText.slice(0, 50),
      description: `Draft plan for: ${promptText}`,
      category: 'Study',
      estimatedHours: 4,
      isOfflineSim: true
    });
  }

  try {
    const prompt = `You are an expert personal coach and task designer. 
    The user wants to add a task with the basic idea: "${promptText}".
    Analyze this idea and generate:
    1. A refined, highly actionable task title (max 50 chars).
    2. A detailed description or notes outlining what needs to be done.
    3. A suggested category (must be one of: "Study", "Work", "Finance", "Personal").
    4. Realistic estimated hours required to complete this task (integer between 1 and 24).
    Return strictly a JSON object matching the requested schema.`;

    const response = await robustGenerateContent(ai, {
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            estimatedHours: { type: Type.INTEGER }
          },
          required: ['title', 'description', 'category', 'estimatedHours']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err) {
    console.log('[Gemini] Handled suggest-task error, using fallback.');
    res.json({
      title: promptText.slice(0, 50),
      description: `Draft plan for: ${promptText}`,
      category: 'Study',
      estimatedHours: 4,
      isOfflineSim: true
    });
  }
});

// Reprioritize Single / All Tasks
app.post('/api/ai/reprioritize', async (req, res) => {
  const { taskId } = req.body;
  const ai = getGeminiClient();

  const handleSingleReprioritize = async (task: any) => {
    if (!ai) {
      const hoursLeft = Math.max(1, (new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60));
      task.urgencyScore = Math.min(100, Math.max(15, Math.round((48 / hoursLeft) * 45)));
      task.deadlineScore = Math.min(100, Math.max(10, Math.round((120 / hoursLeft) * 25)));
      task.overallPriorityScore = Math.round((task.urgencyScore * 0.45) + (task.importanceScore * 0.35) + (task.deadlineScore * 0.20));
      return;
    }

    try {
      const prompt = `Evaluate the urgency and priority scores of this task based on current local time: "${new Date().toISOString()}" and its deadline: "${task.deadline}".
      Task Title: "${task.title}"
      Task Description: "${task.description}"
      Return strictly a JSON object with properties: "urgencyScore" (1-100), "importanceScore" (1-100), "deadlineScore" (1-100).`;

      const response = await robustGenerateContent(ai, {
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              urgencyScore: { type: Type.INTEGER },
              importanceScore: { type: Type.INTEGER },
              deadlineScore: { type: Type.INTEGER }
            },
            required: ['urgencyScore', 'importanceScore', 'deadlineScore']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.urgencyScore) {
        task.urgencyScore = Number(parsed.urgencyScore);
        task.importanceScore = Number(parsed.importanceScore);
        task.deadlineScore = Number(parsed.deadlineScore);
        task.overallPriorityScore = Math.round((task.urgencyScore * 0.45) + (task.importanceScore * 0.35) + (task.deadlineScore * 0.20));
      }
    } catch (e) {
      console.log('[Gemini] Handled task adjustment.');
    }
  };

  if (taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      await handleSingleReprioritize(task);
    }
  } else {
    // Reprioritize ALL tasks
    for (const task of state.tasks) {
      if (!task.completed) {
        await handleSingleReprioritize(task);
      }
    }
  }

  saveState();
  res.json({ tasks: state.tasks });
});

// Generate Checklist (adds advanced prep checklist subtasks)
app.post('/api/ai/generate-checklist', async (req, res) => {
  const { taskId } = req.body;
  const taskIndex = state.tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  const task = state.tasks[taskIndex];
  const ai = getGeminiClient();

  if (!ai) {
    const checklistItems = [
      { id: `st-ck-1-${Date.now()}`, title: `📋 Gather all specs and asset materials`, completed: false },
      { id: `st-ck-2-${Date.now()}`, title: `🔇 Turn on full DND / Block all social tabs`, completed: false },
      { id: `st-ck-3-${Date.now()}`, title: `📐 Review rubric / success definition criteria`, completed: false }
    ];
    task.subTasks = [...(task.subTasks || []), ...checklistItems];
    saveState();
    return res.json({ isOfflineSim: true, task });
  }

  try {
    const prompt = `You are an elite executive coach. Generate a high-quality pre-flight preparation checklist of 3 distinct, highly action-oriented preparation steps specifically before executing the task: "${task.title}".
    Return strictly a JSON array of objects with the property: "title" (string, max 60 chars).`;

    const response = await robustGenerateContent(ai, {
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING }
            },
            required: ['title']
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) {
      const items = parsed.map((item: any, idx: number) => ({
        id: `st-ck-${idx}-${Date.now()}`,
        title: item.title,
        completed: false
      }));
      task.subTasks = [...(task.subTasks || []), ...items];
      saveState();
    }
    res.json({ task });
  } catch (err) {
    console.log('[Gemini] Handled checklist adjustment.');
    const checklistItems = [
      { id: `st-ck-1-${Date.now()}`, title: `📋 Gather all specs and asset materials`, completed: false },
      { id: `st-ck-2-${Date.now()}`, title: `🔇 Turn on full DND / Block all social tabs`, completed: false }
    ];
    task.subTasks = [...(task.subTasks || []), ...checklistItems];
    saveState();
    res.json({ isOfflineSim: true, task });
  }
});


// --- Planner Actions ---

// Optimize Schedule
app.post('/api/ai/optimize-schedule', async (req, res) => {
  const ai = getGeminiClient();

  if (!ai) {
    // Sort timeBlocks chronologically, insert strategic micro rests
    state.timeBlocks.sort((a, b) => a.start.localeCompare(b.start));
    
    // Check if we already have restoration breaks, if not, inject a nice break
    const hasBreak = state.timeBlocks.some(b => b.title.includes('Restoration Break'));
    if (!hasBreak && state.timeBlocks.length > 1) {
      state.timeBlocks.splice(1, 0, {
        id: `tb-opt-break-${Date.now()}`,
        title: '☕ Dynamic Restoration Break (DND)',
        start: '10:30',
        end: '10:45',
        type: 'break',
        completed: false
      });
    }
    saveState();
    return res.json({ isOfflineSim: true, timeBlocks: state.timeBlocks });
  }

  try {
    const prompt = `You are a cognitive load and productivity optimizer. Optimize our current schedule of time blocks for better focus:
    - Minimize switching costs
    - Align heavy focus blocks with early hours if possible
    - Ensure a 10-15 min restoration break between heavy blocks
    Current time blocks: ${JSON.stringify(state.timeBlocks)}
    Return strictly a JSON array containing the optimized time blocks matching the exact same schema.`;

    const response = await robustGenerateContent(ai, {
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              start: { type: Type.STRING },
              end: { type: Type.STRING },
              type: { type: Type.STRING },
              completed: { type: Type.BOOLEAN },
              taskId: { type: Type.STRING }
            },
            required: ['id', 'title', 'start', 'end', 'type', 'completed']
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) {
      state.timeBlocks = parsed;
      saveState();
    }
    res.json({ timeBlocks: state.timeBlocks });
  } catch (err) {
    console.log('[Gemini] Handled optimize-schedule adjustment.');
    res.json({ isOfflineSim: true, timeBlocks: state.timeBlocks });
  }
});

// Auto Schedule
app.post('/api/ai/auto-schedule', async (req, res) => {
  const uncompletedTasks = state.tasks.filter(t => !t.completed);
  const ai = getGeminiClient();

  if (!ai) {
    // Local Auto Scheduler
    const hours = ['09:00', '11:00', '14:00', '16:00'];
    const blocks: any[] = [];
    
    uncompletedTasks.slice(0, 3).forEach((task, index) => {
      const hStart = hours[index] || '17:00';
      const [h, m] = hStart.split(':');
      const hEnd = `${String(Number(h) + 1).padStart(2, '0')}:${m}`;
      
      blocks.push({
        id: `tb-auto-${task.id}-${Date.now()}`,
        title: `🔥 [AUTO FOCUS] ${task.title}`,
        start: hStart,
        end: hEnd,
        type: 'focus',
        completed: false,
        taskId: task.id
      });
    });

    // Add restoration break
    blocks.push({
      id: `tb-auto-break-${Date.now()}`,
      title: '🧘 Cognitive Decompression Break',
      start: '12:00',
      end: '12:30',
      type: 'break',
      completed: false
    });

    state.timeBlocks = blocks;
    saveState();
    return res.json({ isOfflineSim: true, timeBlocks: state.timeBlocks });
  }

  try {
    const prompt = `Create a perfect daily calendar of focus blocks for these uncompleted tasks: ${JSON.stringify(uncompletedTasks)}.
    Plan realistic, energy-aware time slots (e.g. 09:00 - 10:30, 11:00 - 12:30, etc.), with strategic breaks.
    Return strictly a JSON array containing time blocks (id, title, start, end, type, completed, taskId).`;

    const response = await robustGenerateContent(ai, {
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              start: { type: Type.STRING },
              end: { type: Type.STRING },
              type: { type: Type.STRING },
              completed: { type: Type.BOOLEAN },
              taskId: { type: Type.STRING }
            },
            required: ['id', 'title', 'start', 'end', 'type', 'completed']
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) {
      state.timeBlocks = parsed;
      saveState();
    }
    res.json({ timeBlocks: state.timeBlocks });
  } catch (err) {
    console.log('[Gemini] Handled auto-schedule adjustment.');
    res.json({ isOfflineSim: true, timeBlocks: state.timeBlocks });
  }
});

// Sync Calendar (blends Google Calendar events - supporting both real API and simulation fallback)
app.post('/api/ai/sync-calendar', async (req, res) => {
  const token = req.body.accessToken || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  
  let googleCalendarEvents: any[] = [];
  let isRealSync = false;

  if (token) {
    try {
      console.log('[Calendar] Fetching real events from Google Calendar API...');
      const googleRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
          new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        )}&maxResults=15&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (googleRes.ok) {
        const data = await googleRes.json();
        const items = data.items || [];
        
        const parseTime = (dateTimeStr: string) => {
          if (!dateTimeStr) return '12:00';
          const date = new Date(dateTimeStr);
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${hours}:${minutes}`;
        };

        googleCalendarEvents = items.map((item: any) => {
          const startStr = item.start?.dateTime || item.start?.date || '';
          const endStr = item.end?.dateTime || item.end?.date || '';
          return {
            id: `tb-cal-real-${item.id || Math.random().toString()}`,
            title: `📅 ${item.summary || 'Google Calendar Event'} (Imported)`,
            start: parseTime(startStr),
            end: parseTime(endStr),
            type: 'meeting',
            completed: false
          };
        });
        isRealSync = true;
        console.log(`[Calendar] Successfully imported ${googleCalendarEvents.length} real events.`);
      } else {
        const errText = await googleRes.text();
        console.error('[Calendar] Google Calendar API error:', errText);
      }
    } catch (err) {
      console.error('[Calendar] Failed to fetch real Google Calendar events:', err);
    }
  }

  // If we couldn't do a real sync or no events returned, fall back to mock events so the experience remains smooth
  if (!isRealSync || googleCalendarEvents.length === 0) {
    console.log('[Calendar] Falling back to mock calendar simulator events...');
    googleCalendarEvents = [
      {
        id: `tb-cal-sync-1-${Date.now()}`,
        title: '📅 Group Milestone Sync (Imported)',
        start: '10:00',
        end: '10:30',
        type: 'meeting',
        completed: false
      },
      {
        id: `tb-cal-sync-2-${Date.now()}`,
        title: '💼 Faculty Project Review (Imported)',
        start: '13:00',
        end: '13:45',
        type: 'meeting',
        completed: false
      }
    ];
  }

  // Merge events, filtering out existing imported ones (both mock and real) to avoid duplicates
  state.timeBlocks = state.timeBlocks.filter(b => !b.title.includes('Imported'));
  state.timeBlocks = [...state.timeBlocks, ...googleCalendarEvents];
  
  saveState();
  res.json({ success: true, isRealSync, timeBlocks: state.timeBlocks });
});

// Serve frontend assets
if (process.env.NODE_ENV !== 'production') {
  createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  }).then((vite) => {
    app.use(vite.middlewares);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Development full-stack server running on http://localhost:${PORT}`);
    });
  });
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Production full-stack server running on port ${PORT}`);
  });
}
