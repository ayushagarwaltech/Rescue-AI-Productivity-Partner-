/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { customFetch as fetch } from '../lib/api';
import Markdown from 'react-markdown';
import { 
  Sparkles, 
  Clock, 
  Brain, 
  Zap, 
  Calendar as CalendarIcon, 
  Play, 
  Pause, 
  Plus, 
  Trash2, 
  Upload, 
  MessageSquare, 
  CheckSquare, 
  Volume2, 
  Award, 
  Activity, 
  RotateCcw, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  ShieldAlert, 
  Gauge, 
  User, 
  Send,
  VolumeX,
  Target,
  Smile,
  LogOut,
  Flame,
  Check,
  Settings as SettingsIcon,
  Search,
  Bell,
  Mic,
  ListTodo,
  TrendingUp,
  Inbox,
  AlertCircle,
  Clock3,
  Sparkle,
  Menu,
  Edit2
} from 'lucide-react';
import { Task, TimeBlock, FocusSession, ProcrastinationLog, ChatMessage, RescueModePlan, ProductivityMetrics, SubTask } from '../types';

export default function Dashboard() {
  const { currentUser, settings, logout, updateSettings } = useAuth();
  const isGuest = currentUser?.uid === 'guest_user_123' || localStorage.getItem('rescue_ai_guest') !== null;

  // Layout View State
  const [activeView, setActiveView] = useState<'dashboard' | 'tasks' | 'planner' | 'goals' | 'focus' | 'insights' | 'notifications' | 'settings'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Sidebar Toggle State
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebar_open');
    if (saved !== null) return JSON.parse(saved);
    return window.innerWidth >= 768;
  });

  useEffect(() => {
    localStorage.setItem('sidebar_open', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Floating Voice Assistant State
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceReply, setVoiceReply] = useState('');

  const getDynamicAISuggestions = () => {
    const active = tasks.filter(t => !t.completed);
    const userRole = settings?.role || 'professional';
    const suggestions = [];

    // 1. Role-based overarching priority modeling
    if (userRole === 'student') {
      suggestions.push({
        taskTitle: "🎓 Semester Pace Strategy",
        suggestion: "Syllabus dates parsed. Balance intense conceptual courses with active checklist sprints to optimize cognitive throughput."
      });
    } else if (userRole === 'entrepreneur') {
      suggestions.push({
        taskTitle: "🚀 Venture Sprint Modeling",
        suggestion: "High-stake targets identified. Group non-linear milestones together and use micro-focus blocks to build initial momentum."
      });
    } else {
      suggestions.push({
        taskTitle: "💼 Deep Focus Protection",
        suggestion: "Avoid consecutive meetings fatigue. Defend a 2-hour blocks interval today to make progress on heavy engineering/creative items."
      });
    }

    // 2. Task-specific suggestions
    const activeTasks = active.filter(t => t.title && !t.completed);
    if (activeTasks.length > 0) {
      const sorted = [...activeTasks].sort((a, b) => (b.overallPriorityScore || 0) - (a.overallPriorityScore || 0));
      if (sorted[0]) {
        let recommendation = "";
        if (userRole === 'student') {
          recommendation = `This academic deliverable has a peak priority rating of ${sorted[0].overallPriorityScore || 85}. Read or scan references, then break it into 15-minute high-energy actions to bypass start-paralysis.`;
        } else if (userRole === 'entrepreneur') {
          recommendation = `Crucial founder pivot path! Rated at ${sorted[0].overallPriorityScore || 85}. Run a mini-sprint to create a prototype or validate constraints first.`;
        } else {
          recommendation = `Critical workspace project! Rated at ${sorted[0].overallPriorityScore || 85}. Schedule a silent focus block to bypass team notification noise.`;
        }
        suggestions.push({
          taskTitle: sorted[0].title,
          suggestion: recommendation
        });
      }

      if (sorted[1]) {
        let rec2 = "";
        if (userRole === 'student') {
          rec2 = `Allocate a solid 30-minute block for this study item. Revise active flashcards or summaries.`;
        } else if (userRole === 'entrepreneur') {
          rec2 = `Fast-track execution! Break this milestone down for delegate support or automate.`;
        } else {
          rec2 = `Integrate this professional item into your afternoon focus list with strict focus intervals.`;
        }
        suggestions.push({
          taskTitle: sorted[1].title,
          suggestion: rec2
        });
      }
    } else {
      if (userRole === 'student') {
        suggestions.push({
          taskTitle: "📚 Syllabus Scan Ready",
          suggestion: "Ready to start a new term? Upload a course syllabus PDF in standard tasks to create your initial term schedule instantly."
        });
      } else if (userRole === 'entrepreneur') {
        suggestions.push({
          taskTitle: "📈 Founder Workspace Calibrated",
          suggestion: "Use high-stakes timeline goals to set major deliverable milestones and design your venture sprints."
        });
      } else {
        suggestions.push({
          taskTitle: "👔 Professional Focus Calibrated",
          suggestion: "Connect your weekly targets to set active task lists and track your mental cognitive fatigue levels."
        });
      }
    }

    // 3. Mental state / Coaching recommendation based on role
    if (userRole === 'student') {
      suggestions.push({
        taskTitle: "🧘 Procrastination Defense",
        suggestion: "Academic burnout is real. Press 'Rescue Mode' at the first sign of fatigue or high anxiety to scale back deliverables."
      });
    } else if (userRole === 'entrepreneur') {
      suggestions.push({
        taskTitle: "⚖️ Founder Overwhelm Block",
        suggestion: "Prevent decision paralysis. Triage your top 3 items, delegate or pause remaining tasks, and ignore non-critical notifications."
      });
    } else {
      suggestions.push({
        taskTitle: "🔋 Diurnal Circadian Recharge",
        suggestion: "Integrate standard 5-minute active recharges between focus blocks to defend against mental fog and cognitive stress."
      });
    }

    return suggestions;
  };

  // Calendar Integration Connection Simulation State
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isConnectingCalendar, setIsConnectingCalendar] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  // Goals & Habits Tracker State
  const [goals, setGoals] = useState([
    { id: 'g1', title: 'Complete CS50 slide deck submission', progress: 75, category: 'Academics' },
    { id: 'g2', title: 'Deploy Hackathon frontend', progress: 40, category: 'Personal' },
    { id: 'g3', title: 'Read 2 research articles on AI', progress: 100, category: 'Research' }
  ]);
  const [habits, setHabits] = useState([
    { id: 'h1', title: 'Wake up at 6 AM', completedToday: true, streak: 8, frequency: 'Daily' },
    { id: 'h2', title: 'Code for 2 hours', completedToday: false, streak: 4, frequency: 'Daily' },
    { id: 'h3', title: '30-minute afternoon walk', completedToday: true, streak: 12, frequency: 'Daily' },
    { id: 'h4', title: 'Check deadlines before bed', completedToday: false, streak: 5, frequency: 'Daily' }
  ]);

  // Ambient sound state for Focus Mode
  const [ambientSound, setAmbientSound] = useState<'none' | 'binaural' | 'lofi' | 'rain'>('none');
  const [ambientVolume, setAmbientVolume] = useState(50);

  // Application State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [procrastinationLogs, setProcrastinationLogs] = useState<ProcrastinationLog[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [metrics, setMetrics] = useState<ProductivityMetrics | null>(null);
  const [rescueMode, setRescueMode] = useState<RescueModePlan>({ isActive: false, fastestStrategy: '', scheduleChanges: [] });

  // UI State
  const [loading, setLoading] = useState<boolean>(true);
  const [submittingTask, setSubmittingTask] = useState<boolean>(false);
  const [schedulingRoadmap, setSchedulingRoadmap] = useState<boolean>(false);
  const [sendingChat, setSendingChat] = useState<boolean>(false);
  const [rescuing, setRescuing] = useState<boolean>(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [copilotLoadingId, setCopilotLoadingId] = useState<string | null>(null);
  const [copilotAction, setCopilotAction] = useState<string | null>(null);
  const [plannerActionLoading, setPlannerActionLoading] = useState<string | null>(null);
  const [showAddTask, setShowAddTask] = useState<boolean>(false);
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<string>('All');

  // New Task Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newHours, setNewHours] = useState('2');
  const [newCategory, setNewCategory] = useState('Study');

  // Task Editing & AI Suggestion State
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [savingEditedTask, setSavingEditedTask] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editHours, setEditHours] = useState('2');
  const [editCategory, setEditCategory] = useState('Study');
  
  const [aiPromptText, setAiPromptText] = useState('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [editPromptText, setEditPromptText] = useState('');
  const [editAiLoading, setEditAiLoading] = useState<boolean>(false);

  useEffect(() => {
    if (editingTask) {
      setEditTitle(editingTask.title);
      setEditDesc(editingTask.description || '');
      setEditCategory(editingTask.category || 'Study');
      setEditPromptText(editingTask.title);
      
      if (editingTask.deadline) {
        try {
          const d = new Date(editingTask.deadline);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const hours = String(d.getHours()).padStart(2, '0');
          const minutes = String(d.getMinutes()).padStart(2, '0');
          setEditDeadline(`${year}-${month}-${day}T${hours}:${minutes}`);
        } catch (e) {
          setEditDeadline('');
        }
      } else {
        setEditDeadline('');
      }
      setEditHours(String(editingTask.estimatedHours || 2));
    }
  }, [editingTask]);

  // Interactive Focus Timer State
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [featuredTaskId, setFeaturedTaskId] = useState<string>('');
  const [focusMode, setFocusMode] = useState<'study' | 'work' | 'rescue'>('study');
  const [focusMood, setFocusMood] = useState<'focused' | 'anxious' | 'tired' | 'energetic' | 'neutral'>('focused');
  
  // Custom chatbot inputs
  const [chatInput, setChatInput] = useState('');
  const [isVoiceInput, setIsVoiceInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Task processing and ADHD preferences local state
  const [taskPreferences, setTaskPreferences] = useState('');
  const [customNeeds, setCustomNeeds] = useState('');
  const [role, setRole] = useState<'student' | 'professional' | 'entrepreneur'>('professional');
  const [settingsSaved, setSettingsSaved] = useState<boolean>(false);
  const [settingsError, setSettingsError] = useState<boolean>(false);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  // Sync settings when fetched or loaded
  useEffect(() => {
    if (settings) {
      setTaskPreferences(settings.taskPreferences || '');
      setCustomNeeds(settings.customNeeds || '');
      if (settings.role) setRole(settings.role as any);
    }
  }, [settings]);

  // Dynamically update default goals and habits when the workspace role changes
  useEffect(() => {
    const activeRole = settings?.role || role;
    if (activeRole === 'student') {
      setGoals([
        { id: 'g1', title: 'Complete Academic Syllabus exam outline', progress: 65, category: 'Academics' },
        { id: 'g2', title: 'Draft research paper bibliography', progress: 30, category: 'Research' },
        { id: 'g3', title: 'Revise Mathematics Lesson 4 notes', progress: 100, category: 'Academics' }
      ]);
      setHabits([
        { id: 'h1', title: 'Active recall learning session', completedToday: false, streak: 5, frequency: 'Daily' },
        { id: 'h2', title: 'Break study into 25-minute study sprints', completedToday: true, streak: 9, frequency: 'Daily' },
        { id: 'h3', title: 'Walk outside to decompress brain', completedToday: false, streak: 3, frequency: 'Daily' },
        { id: 'h4', title: 'Log tomorrow\'s syllabus assignments before bed', completedToday: true, streak: 11, frequency: 'Daily' }
      ]);
    } else if (activeRole === 'entrepreneur') {
      setGoals([
        { id: 'g1', title: 'Finalize Series A product slide deck', progress: 80, category: 'Funding' },
        { id: 'g2', title: 'Interview lead fullstack engineer candidates', progress: 20, category: 'Recruiting' },
        { id: 'g3', title: 'Validate product landing page signup rate', progress: 100, category: 'Growth' }
      ]);
      setHabits([
        { id: 'h1', title: 'Define the ONE highest-leverage growth metric', completedToday: false, streak: 14, frequency: 'Daily' },
        { id: 'h2', title: 'Delegate 3 non-core administrative tasks', completedToday: true, streak: 4, frequency: 'Daily' },
        { id: 'h3', title: 'Circadian brain firewall check', completedToday: false, streak: 9, frequency: 'Daily' },
        { id: 'h4', title: 'Sync with lead engineer on technical blocker', completedToday: true, streak: 11, frequency: 'Daily' }
      ]);
    } else {
      setGoals([
        { id: 'g1', title: 'Deploy technical design system architecture', progress: 75, category: 'Technical' },
        { id: 'g2', title: 'Refactor backend OAuth credential handling', progress: 40, category: 'Engineering' },
        { id: 'g3', title: 'Prepare weekly product engineering sync documentation', progress: 100, category: 'Management' }
      ]);
      setHabits([
        { id: 'h1', title: '90-minute morning deep work focus', completedToday: true, streak: 12, frequency: 'Daily' },
        { id: 'h2', title: 'Close all non-essential communication tabs', completedToday: false, streak: 8, frequency: 'Daily' },
        { id: 'h3', title: 'Decompress & stretch between heavy meetings', completedToday: true, streak: 6, frequency: 'Daily' },
        { id: 'h4', title: 'Clear and organize the active sprint backlog', completedToday: false, streak: 7, frequency: 'Daily' }
      ]);
    }
  }, [settings?.role, role]);

  // Achievements data
  const achievements = [
    { id: 'ach-1', title: 'Crisis Averted', description: 'Complete a critical risk task before deadline', unlocked: true, xpReward: 150, icon: 'ShieldAlert' },
    { id: 'ach-2', title: 'Deep Work Master', description: 'Record three 45+ minute Focus Sessions', unlocked: true, xpReward: 200, icon: 'Brain' },
    { id: 'ach-3', title: 'Procrastination Shield', description: 'Interact with AI Coach during delay warning', unlocked: false, xpReward: 100, icon: 'Zap' },
    { id: 'ach-4', title: 'Unstoppable Momentum', description: 'Maintain a 5-day task completion streak', unlocked: true, xpReward: 300, icon: 'Flame' }
  ];

  // Fetch full state from full-stack server
  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        setTimeBlocks(data.timeBlocks || []);
        setFocusSessions(data.focusSessions || []);
        setProcrastinationLogs(data.procrastinationLogs || []);
        setChatMessages(data.chatMessages || []);
        setMetrics(data.metrics || null);
        setRescueMode(data.rescueMode || { isActive: false, fastestStrategy: '', scheduleChanges: [] });
        
        // Auto select first critical or uncompleted task for focus timer if none selected
        if (data.tasks && data.tasks.length > 0 && !selectedTaskId) {
          const urgentTask = data.tasks.find((t: Task) => !t.completed && t.riskLevel === 'critical') || data.tasks.find((t: Task) => !t.completed);
          if (urgentTask) {
            setSelectedTaskId(urgentTask.id);
          }
        }
        if (data.tasks && data.tasks.length > 0) {
          const urgentTask = data.tasks.find((t: Task) => !t.completed && t.riskLevel === 'critical') || data.tasks.find((t: Task) => !t.completed) || data.tasks[0];
          if (urgentTask) {
            setFeaturedTaskId(urgentTask.id);
          }
        }
      }
    } catch (e) {
      console.error('Error fetching state from API:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // Sync settings dynamically with the server whenever they change
  useEffect(() => {
    if (settings) {
      fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings })
      }).catch(err => console.error("Error syncing settings with server:", err));
    }
  }, [settings]);

  // Countdown timer clock logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) {
      interval = setInterval(() => {
        if (timerSeconds > 0) {
          setTimerSeconds(timerSeconds - 1);
        } else if (timerMinutes > 0) {
          setTimerMinutes(timerMinutes - 1);
          setTimerSeconds(59);
        } else {
          setTimerRunning(false);
          // Handle timer completion - reward XP!
          handleTimerComplete();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerMinutes, timerSeconds]);

  // Timer complete reward trigger
  const handleTimerComplete = async () => {
    try {
      await fetch('/api/focus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          durationMinutes: focusMode === 'study' ? 25 : focusMode === 'work' ? 45 : 20,
          mood: focusMood,
          mode: focusMode,
          taskId: selectedTaskId || undefined
        })
      });
      alert(`🏆 Amazing Focus Session Complete! Claimed focus XP rewards.`);
      fetchState();
    } catch (e) {
      console.error(e);
    }
  };

  // Timer reset handler
  const resetTimerPreset = (mode: 'study' | 'work' | 'rescue') => {
    setTimerRunning(false);
    setFocusMode(mode);
    setTimerSeconds(0);
    if (mode === 'study') setTimerMinutes(25);
    else if (mode === 'work') setTimerMinutes(45);
    else setTimerMinutes(20);
  };

  // Call AI suggest endpoint to draft task details for Add Form
  const handleGetAISuggestions = async () => {
    if (!aiPromptText.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/suggest-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ promptText: aiPromptText })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.title) setNewTitle(data.title);
        if (data.description) setNewDesc(data.description);
        if (data.category) setNewCategory(data.category);
        if (data.estimatedHours) setNewHours(String(data.estimatedHours));
      }
    } catch (e) {
      console.error('Error fetching AI suggestions:', e);
    } finally {
      setAiLoading(false);
    }
  };

  // Call AI suggest endpoint to draft task details for Edit Form
  const handleGetAIEditSuggestions = async () => {
    if (!editPromptText.trim()) return;
    setEditAiLoading(true);
    try {
      const res = await fetch('/api/ai/suggest-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ promptText: editPromptText })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.title) setEditTitle(data.title);
        if (data.description) setEditDesc(data.description);
        if (data.category) setEditCategory(data.category);
        if (data.estimatedHours) setEditHours(String(data.estimatedHours));
      }
    } catch (e) {
      console.error('Error fetching AI edit suggestions:', e);
    } finally {
      setEditAiLoading(false);
    }
  };

  // Save the edited task using PUT /api/tasks/:id
  const handleSaveEditedTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTitle.trim() || !editDeadline) return;
    setSavingEditedTask(true);
    try {
      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDesc,
          category: editCategory,
          deadline: new Date(editDeadline).toISOString(),
          estimatedHours: Number(editHours)
        })
      });
      if (res.ok) {
        setEditingTask(null);
        await fetchState();
      }
    } catch (e) {
      console.error('Error saving edited task:', e);
    } finally {
      setSavingEditedTask(false);
    }
  };

  // Create Task Submission
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDeadline) return;
    setSubmittingTask(true);
    try {
      // 1. Submit basic details
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          deadline: new Date(newDeadline).toISOString(),
          estimatedHours: Number(newHours),
          category: newCategory
        })
      });

      if (res.ok) {
        const addedTask = await res.json();
        
        // 2. Trigger high-end Gemini analysis for dynamic priority, risks & subtask generation!
        const aiRes = await fetch('/api/ai/analyze-priority', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task: addedTask })
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          // Update task details with real or fallback AI priority payload
          await fetch(`/api/tasks/${addedTask.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              urgencyScore: aiData.urgencyScore,
              deadlineScore: aiData.deadlineScore,
              importanceScore: aiData.importanceScore,
              energyRequirement: aiData.energyRequirement,
              riskLevel: aiData.riskLevel,
              probabilityOfMissing: aiData.probabilityOfMissing,
              overallPriorityScore: aiData.overallPriorityScore,
              description: addedTask.description + `\n\nAI Insights: ${aiData.whyExplanation}`,
              subTasks: aiData.microTasks ? aiData.microTasks.map((mt: any, i: number) => ({
                id: `sub-${addedTask.id}-${i}`,
                title: mt.title,
                estimatedMinutes: mt.estimatedMinutes,
                completed: false,
                order: i + 1
              })) : []
            })
          });
        }
        
        // Reset states
        setNewTitle('');
        setNewDesc('');
        setNewDeadline('');
        setNewHours('2');
        setShowAddTask(false);
        fetchState();
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setSubmittingTask(false);
    }
  };

  // Delete Task Helper
  const handleDeleteTask = async (id: string) => {
    if (confirm('Are you sure you want to discard this task?')) {
      try {
        await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        fetchState();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Toggle Task Completion
  const handleToggleTask = async (id: string, completed: boolean) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      });
      fetchState();
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Subtask Completion
  const handleToggleSubtask = async (taskId: string, subTaskId: string, completed: boolean) => {
    try {
      await fetch(`/api/tasks/${taskId}/subtasks/${subTaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      });
      fetchState();
    } catch (e) {
      console.error(e);
    }
  };

  // Smart Scheduler Roadmap Generation via Gemini AI
  const handleGenerateRoadmap = async () => {
    setSchedulingRoadmap(true);
    try {
      const hourStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      const res = await fetch('/api/ai/generate-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentHour: hourStr })
      });
      if (res.ok) {
        fetchState();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSchedulingRoadmap(false);
    }
  };

  // Toggle Time Block Completion
  const handleToggleTimeBlock = async (id: string, completed: boolean) => {
    try {
      await fetch(`/api/schedule/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      });
      fetchState();
    } catch (e) {
      console.error(e);
    }
  };

  // Reset Demo State Helper (For Hackathon Judges)
  const handleResetDemoState = async () => {
    if (confirm('Reset Rescue AI to initial interactive mock data for live demonstration?')) {
      try {
        const res = await fetch('/api/state/reset', { method: 'POST' });
        if (res.ok) {
          fetchState();
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  // --- Task Copilot Action Handlers ---
  const handleTaskCopilotAction = async (taskId: string, actionType: 'break-steps' | 'estimate-time' | 'reprioritize' | 'generate-checklist') => {
    setCopilotLoadingId(taskId);
    setCopilotAction(actionType);
    try {
      const res = await fetch(`/api/ai/${actionType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      });
      if (res.ok) {
        fetchState();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCopilotLoadingId(null);
      setCopilotAction(null);
    }
  };

  // --- Planner Action Handlers ---
  const handlePlannerAction = async (actionType: 'optimize-schedule' | 'auto-schedule' | 'sync-calendar') => {
    setPlannerActionLoading(actionType);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const body: Record<string, any> = {};
      
      if (actionType === 'sync-calendar' && googleAccessToken) {
        headers['Authorization'] = `Bearer ${googleAccessToken}`;
        body['accessToken'] = googleAccessToken;
      }
      
      const res = await fetch(`/api/ai/${actionType}`, {
        method: 'POST',
        headers,
        body: actionType === 'sync-calendar' ? JSON.stringify(body) : undefined
      });
      if (res.ok) {
        fetchState();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPlannerActionLoading(null);
    }
  };

  const handleGoogleCalendarConnect = async () => {
    setCalendarError(null);
    if (calendarConnected) {
      // Disconnect
      setCalendarConnected(false);
      setGoogleAccessToken(null);
      return;
    }

    setIsConnectingCalendar(true);
    try {
      const { auth, googleProvider } = await import('../firebase');
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      
      // Ensure provider has the required scopes
      googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
      googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');

      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGoogleAccessToken(credential.accessToken);
        setCalendarConnected(true);
        // Automatically fetch and sync calendar
        setPlannerActionLoading('sync-calendar');
        const res = await fetch(`/api/ai/sync-calendar`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${credential.accessToken}`
          },
          body: JSON.stringify({ accessToken: credential.accessToken })
        });
        if (res.ok) {
          fetchState();
        }
      } else {
        setCalendarError("Failed to get Google access token. Please ensure you are logged in using Google Auth.");
      }
    } catch (err: any) {
      console.error("Google Calendar connection error:", err);
      const errorMsg = err.message || String(err);
      if (errorMsg.includes('popup-closed-by-user') || errorMsg.includes('popup-blocked')) {
        setCalendarError(
          "The authorization popup was closed or blocked. Since you are in a preview iframe, your browser might have blocked the pop-up. " +
          "Please open the app in a new tab (using the button in the top right corner) to link Google Calendar, or allow popups in your browser settings."
        );
      } else {
        setCalendarError("Failed to connect Google Calendar: " + errorMsg);
      }
    } finally {
      setIsConnectingCalendar(false);
      setPlannerActionLoading(null);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSettingsSaved(false);
    setSettingsError(false);
    try {
      await updateSettings({ role, taskPreferences, customNeeds });
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings: { role, taskPreferences, customNeeds } })
      });
      if (res.ok) {
        setSettingsSaved(true);
        fetchState();
        setTimeout(() => setSettingsSaved(false), 3000);
      } else {
        setSettingsError(true);
        setTimeout(() => setSettingsError(false), 3000);
      }
    } catch (e) {
      console.error(e);
      setSettingsError(true);
      setTimeout(() => setSettingsError(false), 3000);
    } finally {
      setSavingSettings(false);
    }
  };

  // Chat Submission (Text / OCR Upload)
  const handleSendChat = async (fileDataString?: string, fileNameString?: string) => {
    if (!chatInput.trim() && !fileDataString) return;
    
    const messageToSend = chatInput;
    setChatInput('');
    setSendingChat(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          isVoice: isVoiceInput,
          fileData: fileDataString,
          fileName: fileNameString
        })
      });

      if (res.ok) {
        fetchState();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSendingChat(false);
      setIsVoiceInput(false);
    }
  };

  // Voice coaching micro feedback simulation
  const handleSimulateVoiceInput = () => {
    setIsVoiceInput(true);
    setChatInput("I have a critical study exam and team presentation this Friday.");
  };

  // Floating Voice Assistant Simulate Commands
  const triggerVoiceCommand = (commandText: string) => {
    setVoiceStatus('listening');
    setVoiceTranscript(commandText);
    
    setTimeout(() => {
      setVoiceStatus('processing');
      
      // Call the server chat endpoint or simulate local coaching feedback
      setTimeout(async () => {
        try {
          const res = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: commandText,
              isVoice: true
            })
          });
          
          if (res.ok) {
            const freshStateRes = await fetch('/api/state');
            if (freshStateRes.ok) {
              const freshData = await freshStateRes.json();
              setChatMessages(freshData.chatMessages || []);
              // Get the last assistant message as the verbal response
              const assistants = (freshData.chatMessages || []).filter((m: any) => m.role === 'assistant');
              if (assistants.length > 0) {
                setVoiceReply(assistants[assistants.length - 1].content);
              } else {
                setVoiceReply("No problem! I have recalibrated your schedule to accommodate your requests.");
              }
            }
          } else {
            setVoiceReply("I've aligned your tasks and scheduled focus time blocks. Start with UI Design, I am here to help!");
          }
        } catch (e) {
          setVoiceReply("Calibrating schedule blocks. Let's do a short 25 minute session first to establish momentum!");
        }
        setVoiceStatus('speaking');
      }, 1500);
    }, 1000);
  };

  // File OCR scanning handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      if (result) {
        handleSendChat(result, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // Crisis / Emergency Rescue Activation
  const handleActivateRescueMode = async (taskId: string) => {
    setRescuing(true);
    try {
      const res = await fetch('/api/ai/rescue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      });
      if (res.ok) {
        fetchState();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRescuing(false);
    }
  };

  // Deactivate Rescue Mode
  const handleDeactivateRescueMode = async () => {
    try {
      const res = await fetch('/api/ai/rescue/deactivate', { method: 'POST' });
      if (res.ok) {
        fetchState();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Helpers for styling task status levels
  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-50 text-red-600 border border-red-200';
      case 'warning': return 'bg-amber-50 text-amber-600 border border-amber-200';
      default: return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Work': return 'text-sky-600';
      case 'Study': return 'text-purple-600';
      case 'Finance': return 'text-amber-600';
      default: return 'text-pink-600';
    }
  };

  // Toggle habit completion
  const handleToggleHabit = (id: string) => {
    setHabits(habits.map(h => {
      if (h.id === id) {
        const nextCompleted = !h.completedToday;
        return {
          ...h,
          completedToday: nextCompleted,
          streak: nextCompleted ? h.streak + 1 : Math.max(0, h.streak - 1)
        };
      }
      return h;
    }));
  };

  // Calculated values
  const activeTasks = tasks.filter(t => !t.completed);
  const criticalTasks = activeTasks.filter(t => t.riskLevel === 'critical');
  const finishedTasks = tasks.filter(t => t.completed);

  // Filter tasks by search query and category
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = taskCategoryFilter === 'All' || t.category === taskCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Calculate greeting depending on current local time
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formattedUser = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Ayush';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* 1. TOP NAVIGATION BAR */}
      <nav id="top-nav" className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        
        {/* Left: Brand Logo & Title & Sidebar Toggle */}
        <div className="flex items-center gap-3">
          {/* Sidebar Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-indigo-600 border border-slate-200/60 hover:border-indigo-200/50 transition-all flex items-center justify-center cursor-pointer shadow-xs"
            title={sidebarOpen ? "Minimize Sidebar" : "Expand Sidebar"}
            id="sidebar-toggle-btn"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/10">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-md tracking-tight text-slate-900 font-display">RescueAI</span>
                <span className="text-[9px] uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100 px-1 py-0.2 rounded-md font-mono font-bold">
                  v2.5
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block">Cognitive Task Flow Guard</p>
            </div>
          </div>
        </div>

        {/* Center: Interactive Search box */}
        <div className="flex-1 max-w-md mx-6 hidden md:block relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input 
            type="text" 
            placeholder="Search tasks, priorities, roadmap events, insights..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl pl-9 pr-4 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Right: Quick Settings, Demo Reset, Notification Badge, Profile */}
        <div className="flex items-center gap-3">
          
          <button 
            onClick={handleResetDemoState}
            className="hidden sm:inline-flex items-center px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-600 border border-slate-200 font-mono transition-all"
            title="Reset to initial mock data"
          >
            Reset Demo
          </button>

          {/* Quick Notification Bell (jumps to notifications view) */}
          <button 
            onClick={() => setActiveView('notifications')}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200/50 hover:border-slate-300 transition-all relative"
            title="AI Alerts & Reminders"
          >
            <Bell className="w-4.5 h-4.5" />
            {procrastinationLogs.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>

          {/* User Profile Info & Log out */}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center border border-indigo-200 font-bold text-xs uppercase" title={currentUser?.email || ''}>
              {formattedUser.slice(0, 2)}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-none">{formattedUser}</div>
              <div className="text-[9px] text-slate-400 font-mono">{currentUser?.email || 'Guest Mode'}</div>
            </div>
            <button 
              onClick={() => logout()}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* 2. SIDEBAR + MAIN WORKSPACE WRAPPER */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Sidebar Backdrop for Mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden transition-all duration-300"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar Menu */}
        <aside 
          id="sidebar-menu" 
          className={`bg-white border-r border-slate-200 py-6 px-4 flex flex-col justify-between shrink-0 transition-all duration-300 z-50 md:z-30 ${
            sidebarOpen 
              ? 'translate-x-0 w-64 opacity-100' 
              : '-translate-x-full md:translate-x-0 md:w-0 md:p-0 md:border-r-0 overflow-hidden opacity-0 md:opacity-100'
          } fixed md:static inset-y-0 left-0 h-full md:h-auto`}
        >
          
          <div className="space-y-6">
            <div className="px-2">
              <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400 font-bold block">
                Command Workspace
              </span>
            </div>

            <nav className="space-y-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: Zap },
                { id: 'tasks', label: 'My Tasks', icon: ListTodo },
                { id: 'planner', label: 'Planner', icon: CalendarIcon },
                { id: 'goals', label: 'Goals & Habits', icon: Target },
                { id: 'focus', label: 'Focus Mode', icon: Clock3 },
                { id: 'insights', label: 'Insights', icon: TrendingUp },
                { id: 'notifications', label: 'Notifications', icon: Inbox, badgeCount: procrastinationLogs.length },
                { id: 'settings', label: 'Settings', icon: SettingsIcon }
              ].map((item) => {
                const IconComponent = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id as any)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badgeCount && item.badgeCount > 0 ? (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-white text-indigo-600 font-bold' : 'bg-red-100 text-red-600'}`}>
                        {item.badgeCount}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Proactive Coaching Advice Footer inside Sidebar */}
          {metrics && (
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-3.5 rounded-xl border border-indigo-100 space-y-2">
              <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-[10px]">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>AI EXECUTIVE RECOMMENDATION</span>
              </div>
              <p className="text-[10px] text-slate-700 leading-snug">
                "Start UI Design work before 10 AM to capitalize on your peak diurnal energy curve."
              </p>
            </div>
          )}
        </aside>

        {/* Mobile bottom navigation bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-1 z-40 flex justify-around">
          {[
            { id: 'dashboard', label: 'Home', icon: Zap },
            { id: 'tasks', label: 'Tasks', icon: ListTodo },
            { id: 'planner', label: 'Planner', icon: CalendarIcon },
            { id: 'focus', label: 'Focus', icon: Clock3 },
            { id: 'notifications', label: 'Alerts', icon: Inbox }
          ].map((item) => {
            const IconComponent = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as any)}
                className={`flex flex-col items-center p-1.5 rounded-lg text-[9px] ${isActive ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}
              >
                <IconComponent className="w-4 h-4 mb-0.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Workspace Stage */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-12 bg-slate-50 relative">

          {/* Emergency Crisis / Rescue Banner: accessible in workspace */}
          {criticalTasks.length > 0 && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-4.5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] tracking-widest uppercase font-mono text-red-600 font-bold">
                        🚨 Critical Deadline Threat (Failure probability: {criticalTasks[0].probabilityOfMissing}%)
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                      {criticalTasks[0].title}
                    </h3>
                    <p className="text-xs text-slate-600 max-w-2xl mt-0.5">
                      {rescueMode.isActive ? (
                        <span><strong className="text-indigo-600 font-bold">Rescue Mode Engaged: </strong>{rescueMode.fastestStrategy}</span>
                      ) : (
                        "You postponed this task twice. Energy calculations predict high cognitive overload. Click below to re-budget slots."
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {rescueMode.isActive ? (
                    <button 
                      onClick={handleDeactivateRescueMode}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-xs font-mono text-slate-700 font-bold transition-all"
                    >
                      Disable Rescue
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleActivateRescueMode(criticalTasks[0].id)}
                      disabled={rescuing}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-xs font-mono text-white font-bold transition-all shadow-md shadow-red-600/10"
                    >
                      {rescuing ? 'CALCULATING STRATEGY...' : '🚀 DEPLOY EMERGENCY RESCUE'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* VIEW: DASHBOARD (HOME) */}
          {/* ---------------------------------------------------- */}
          {activeView === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Header greeting */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 pb-4">
                <div>
                  <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center flex-wrap gap-2">
                    {getGreeting()}, {formattedUser}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      (settings?.role || 'professional') === 'student' 
                        ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                        : (settings?.role || 'professional') === 'entrepreneur'
                        ? 'bg-amber-50 text-amber-600 border border-amber-200'
                        : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                    }`}>
                      {(settings?.role || 'professional') === 'student' ? '🎓 Student' : (settings?.role || 'professional') === 'entrepreneur' ? '🚀 Entrepreneur' : '💼 Professional'}
                    </span>
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} | Focus mode optimized for {(settings?.role || 'professional')} targets
                  </p>
                </div>
                
                {/* Summary row widget */}
                <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5 text-xs text-slate-600 font-medium">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <strong>{activeTasks.length}</strong> Tasks
                  </span>
                  <span className="h-4 w-px bg-slate-200" />
                  <span className="flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4 text-blue-500" />
                    <strong>{timeBlocks.filter(tb => tb.type === 'meeting').length || 2}</strong> Meetings
                  </span>
                  <span className="h-4 w-px bg-slate-200" />
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
                    <strong>{criticalTasks.length || 1}</strong> Deadline Today
                  </span>
                </div>
              </div>

              {/* Compact Workspace Role Switcher */}
              <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60 max-w-lg">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-2.5 pr-1.5 font-mono">Active Workspace:</span>
                {[
                  { id: 'student', label: '🎓 Student' },
                  { id: 'professional', label: '💼 Professional' },
                  { id: 'entrepreneur', label: '🚀 Entrepreneur' }
                ].map((item) => {
                  const isActive = (settings?.role || 'professional') === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={async () => {
                        setRole(item.id as any);
                        await updateSettings({
                          role: item.id as any,
                          taskPreferences: taskPreferences || 'Break items down automatically',
                          customNeeds: customNeeds || 'Visual and textual support'
                        });
                      }}
                      className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isActive 
                          ? 'bg-white text-slate-950 shadow-sm border border-slate-200' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* ---------------------------------------------------- */}
              {/* INTERACTIVE RESCUE AI COGNITIVE CORE CAPABILITIES SUITE */}
              {/* ---------------------------------------------------- */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                      <Sparkles className="w-4.5 h-4.5 text-indigo-600 animate-spin-slow" />
                      Rescue AI Core Capabilities Suite
                    </h2>
                    <p className="text-xs text-slate-500">Explore, test, and run the 8 core cognitive accommodation modules of our system.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* CARD 1: Intelligent Task Prioritization */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                          <TrendingUp className="w-4 h-4" />
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold font-mono">
                          PRIORITY
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-800">1. Intelligent Prioritization</h3>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                        Weights tasks automatically based on ADHD cognitive urgency, start-friction, and high-stake deadlines.
                      </p>
                      
                      <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block font-mono">Highest Urgent Target</span>
                        <span className="text-[10px] font-bold text-slate-700 block truncate">
                          {tasks.filter(t => !t.completed).sort((a,b) => (b.overallPriorityScore || 0) - (a.overallPriorityScore || 0))[0]?.title || 'No active tasks found'}
                        </span>
                        <span className="text-[10px] font-semibold text-indigo-600 mt-0.5 block font-mono">
                          Score: {tasks.filter(t => !t.completed).sort((a,b) => (b.overallPriorityScore || 0) - (a.overallPriorityScore || 0))[0]?.overallPriorityScore || 0} pts
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={async () => {
                          const active = tasks.filter(t => !t.completed);
                          if (active.length > 0) {
                            await handleTaskCopilotAction(active[0].id, 'reprioritize');
                          }
                        }}
                        disabled={copilotAction === 'reprioritize'}
                        className="text-[10px] px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-100 transition-colors cursor-pointer flex-1 text-center"
                      >
                        {copilotAction === 'reprioritize' ? 'Recalculating...' : '⚡ Recalculate'}
                      </button>
                      <button 
                        onClick={() => setActiveView('tasks')}
                        className="text-[10px] text-slate-600 font-bold hover:underline"
                      >
                        Tasks →
                      </button>
                    </div>
                  </div>

                  {/* CARD 2: AI-Powered Scheduling Assistance */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                          <Clock3 className="w-4 h-4" />
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-bold font-mono">
                          SCHEDULER
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-800">2. Scheduling Assistance</h3>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                        Sequences task actions into sequential, eye-safe, focus-guarded schedule intervals.
                      </p>
                      
                      <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block font-mono">Internal Focus Block Feed</span>
                        <span className="text-[10px] font-bold text-slate-700 block truncate">
                          {timeBlocks.length} planned blocks
                        </span>
                        <span className="text-[9px] text-slate-500 mt-0.5 block">
                          Intervals mapped for {(settings?.role || 'professional')}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handlePlannerAction('auto-schedule')}
                        disabled={plannerActionLoading === 'auto-schedule'}
                        className="text-[10px] px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg border border-blue-100 transition-colors cursor-pointer flex-1 text-center"
                      >
                        {plannerActionLoading === 'auto-schedule' ? 'Scheduling...' : '🎯 Auto-Schedule'}
                      </button>
                      <button 
                        onClick={() => setActiveView('planner')}
                        className="text-[10px] text-slate-600 font-bold hover:underline"
                      >
                        Planner →
                      </button>
                    </div>
                  </div>

                  {/* CARD 3: Personalized Productivity Recommendations */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                          <Brain className="w-4 h-4" />
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold font-mono">
                          ADVICE
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-800">3. Productivity Recommendations</h3>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                        Friction-deflection tips customized to your active role and cognitive stamina levels.
                      </p>
                      
                      <div className="mt-3 space-y-2">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block font-mono">Role-Tailored Tips</span>
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                          {(settings?.role || 'professional') === 'student' ? (
                            <>
                              <div className="p-2 bg-blue-50/50 border border-blue-100/50 rounded-lg">
                                <h4 className="text-[10px] font-bold text-blue-900 flex items-center gap-1">
                                  <span>📚</span> Feynman Retention Technique
                                </h4>
                                <p className="text-[9px] text-slate-600 leading-snug mt-0.5">
                                  Explain your lesson outline aloud to an imaginary 5-year-old to spot retention gaps immediately.
                                </p>
                              </div>
                              <div className="p-2 bg-blue-50/50 border border-blue-100/50 rounded-lg">
                                <h4 className="text-[10px] font-bold text-blue-900 flex items-center gap-1">
                                  <span>⏱️</span> Syllabus Micro-Slicing
                                </h4>
                                <p className="text-[9px] text-slate-600 leading-snug mt-0.5">
                                  Deconstruct massive study guide chapters into ultra-focused 15-minute intervals with 3-minute quick dopamine breaks.
                                </p>
                              </div>
                              <div className="p-2 bg-blue-50/50 border border-blue-100/50 rounded-lg">
                                <h4 className="text-[10px] font-bold text-blue-900 flex items-center gap-1">
                                  <span>🎓</span> Post-Study Cool Down
                                </h4>
                                <p className="text-[9px] text-slate-600 leading-snug mt-0.5">
                                  Practice 5 minutes of mindful box breathing immediately after study sessions to shield memory consolidation.
                                </p>
                              </div>
                            </>
                          ) : (settings?.role || 'professional') === 'entrepreneur' ? (
                            <>
                              <div className="p-2 bg-amber-50/50 border border-amber-100/50 rounded-lg">
                                <h4 className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                                  <span>🚀</span> The One Leverage Rule
                                </h4>
                                <p className="text-[9px] text-slate-600 leading-snug mt-0.5">
                                  Triage founders' chaos by locking in strictly one primary growth objective per week. Filter out the rest.
                                </p>
                              </div>
                              <div className="p-2 bg-amber-50/50 border border-amber-100/50 rounded-lg">
                                <h4 className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                                  <span>⚖️</span> Delegation Audit Triage
                                </h4>
                                <p className="text-[9px] text-slate-600 leading-snug mt-0.5">
                                  Examine your action list. Outsource or delay everything that doesn't demand direct founder-level signature.
                                </p>
                              </div>
                              <div className="p-2 bg-amber-50/50 border border-amber-100/50 rounded-lg">
                                <h4 className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                                  <span>🧘</span> Cognitive Fatigue Shield
                                </h4>
                                <p className="text-[9px] text-slate-600 leading-snug mt-0.5">
                                  Establish uniform decision-saving presets for minor tasks (meals, outfits) to reserve peak executive logic.
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="p-2 bg-indigo-50/50 border border-indigo-100/50 rounded-lg">
                                <h4 className="text-[10px] font-bold text-indigo-900 flex items-center gap-1">
                                  <span>💼</span> Deep Diurnal Focus Protect
                                </h4>
                                <p className="text-[9px] text-slate-600 leading-snug mt-0.5">
                                  Lock in a 90-minute morning deep work focus with total workspace Do Not Disturb active before processing emails.
                                </p>
                              </div>
                              <div className="p-2 bg-indigo-50/50 border border-indigo-100/50 rounded-lg">
                                <h4 className="text-[10px] font-bold text-indigo-900 flex items-center gap-1">
                                  <span>☕</span> Post-Meeting Recharge
                                </h4>
                                <p className="text-[9px] text-slate-600 leading-snug mt-0.5">
                                  Enforce a strict 5-minute cognitive screen-free break between consecutive corporate calls to decompress neural tension.
                                </p>
                              </div>
                              <div className="p-2 bg-indigo-50/50 border border-indigo-100/50 rounded-lg">
                                <h4 className="text-[10px] font-bold text-indigo-900 flex items-center gap-1">
                                  <span>🎯</span> Start-Friction Deflection
                                </h4>
                                <p className="text-[9px] text-slate-600 leading-snug mt-0.5">
                                  Leave your primary working tabs and document editors open when logging off today, so starting tomorrow is friction-free.
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setChatInput("Give me a specialized focus strategy for my " + (settings?.role || 'professional') + " workload");
                          setActiveView('dashboard');
                          setVoiceOpen(true);
                        }}
                        className="text-[10px] px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-100 transition-colors cursor-pointer flex-1 text-center"
                      >
                        💡 Ask Coach
                      </button>
                      <button 
                        onClick={() => setActiveView('insights')}
                        className="text-[10px] text-slate-600 font-bold hover:underline"
                      >
                        Insights →
                      </button>
                    </div>
                  </div>

                  {/* CARD 4: Context-Aware Reminders */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                          <Bell className="w-4 h-4" />
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-rose-600 font-bold font-mono">
                          REMINDERS
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-800">4. Context-Aware Reminders</h3>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                        Real-time alerts triggered by deadline proximity, attention exhaustion, or focus fatigue.
                      </p>
                      
                      <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block font-mono">Active Listeners</span>
                        <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {procrastinationLogs.length > 0 ? '⚠️ Drift warning issued' : '✓ Attention shield active'}
                        </span>
                        <span className="text-[9px] text-slate-500 mt-0.5 block">
                          Reminders bound to deadlines
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/tasks', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                title: "⚠️ Simulated Procrastination Warning",
                                description: "The system detected extreme cognitive hesitation. Switch views or start the micro checklists.",
                                deadline: new Date(Date.now() + 3600000).toISOString(),
                                category: "Work",
                                estimatedHours: 1
                              })
                            });
                            if (res.ok) {
                              fetchState();
                              setActiveView('notifications');
                            }
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="text-[10px] px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-100 transition-colors cursor-pointer flex-1 text-center"
                      >
                        🚨 Inject Alert
                      </button>
                      <button 
                        onClick={() => setActiveView('notifications')}
                        className="text-[10px] text-slate-600 font-bold hover:underline"
                      >
                        Alerts →
                      </button>
                    </div>
                  </div>

                  {/* CARD 5: Calendar Integration */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="p-1.5 bg-cyan-50 text-cyan-600 rounded-lg">
                          <CalendarIcon className="w-4 h-4" />
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-600 font-bold font-mono">
                          CALENDAR
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-800">5. Calendar Integration</h3>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                        Fuses internal agenda blocks with Google Calendar events. Highlights blocker overlaps.
                      </p>
                      
                      <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block font-mono">Calendar Connection</span>
                        <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                          <span className={`h-1.5 w-1.5 rounded-full ${calendarConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {calendarConnected ? '✓ Linked & Synced' : '🔌 Sandboxed Simulation'}
                        </span>
                        <span className="text-[9px] text-slate-500 mt-0.5 block truncate">
                          {calendarConnected ? 'Auto conflict scan active' : 'Disconnected from real calendar'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={handleGoogleCalendarConnect}
                        disabled={isConnectingCalendar}
                        className="text-[10px] px-2.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-bold rounded-lg border border-cyan-100 transition-colors cursor-pointer flex-1 text-center disabled:opacity-50"
                      >
                        {isConnectingCalendar ? 'Connecting...' : calendarConnected ? '🔌 Disconnect' : '🔌 Sync Calendar'}
                      </button>
                      <button 
                        onClick={() => setActiveView('planner')}
                        className="text-[10px] text-slate-600 font-bold hover:underline"
                      >
                        Sync →
                      </button>
                    </div>
                  </div>

                  {/* CARD 6: Goal and Habit Tracking */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                          <Target className="w-4 h-4" />
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-amber-600 font-bold font-mono">
                          HABITS
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-800">6. Goal & Habit Tracking</h3>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                        Tracks and visualizes daily micro-commitments with leveling rewards.
                      </p>
                      
                      <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block font-mono">Quick Streak Log</span>
                        {habits.length > 0 ? (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-700 truncate max-w-[80px]">{habits[0].title}</span>
                            <button
                              onClick={() => {
                                setHabits(habits.map((h, idx) => idx === 0 ? { ...h, completedToday: !h.completedToday } : h));
                              }}
                              className={`text-[9px] px-1.5 py-0.5 rounded border font-mono font-bold shrink-0 transition-colors cursor-pointer ${
                                habits[0].completedToday 
                                  ? 'bg-emerald-600 border-emerald-500 text-white' 
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {habits[0].completedToday ? 'DONE (+50XP)' : 'LOG DONE'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500">No habits configured</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button 
                        onClick={() => setActiveView('goals')}
                        className="text-[10px] px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-lg border border-amber-100 transition-colors cursor-pointer flex-1 text-center"
                      >
                        🏆 Goals Hub
                      </button>
                      <button 
                        onClick={() => setActiveView('goals')}
                        className="text-[10px] text-slate-600 font-bold hover:underline"
                      >
                        Streaks →
                      </button>
                    </div>
                  </div>

                  {/* CARD 7: Voice-Enabled Assistance */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="p-1.5 bg-violet-50 text-violet-600 rounded-lg">
                          <Mic className="w-4 h-4" />
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-50 border border-violet-100 text-violet-600 font-bold font-mono">
                          VOICE
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-800">7. Voice Assistance</h3>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                        Interactive audio verbalizations and instant task transcription filters.
                      </p>
                      
                      <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block font-mono">Quick Audio Presets</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {(settings?.role || 'professional') === 'student' ? (
                            <>
                              <button
                                onClick={() => {
                                  setVoiceOpen(true);
                                  setVoiceStatus('listening');
                                  setVoiceTranscript("I feel overwhelmed with study materials");
                                  setTimeout(() => {
                                    setVoiceStatus('processing');
                                    setTimeout(() => {
                                      setVoiceStatus('speaking');
                                      setVoiceReply("No problem, scholar. Let's slice the syllabus into tiny 10-minute micro active-recall check-blocks. Deep breath—we've got this!");
                                    }, 1200);
                                  }, 1200);
                                }}
                                className="text-[9px] px-1.5 py-1 bg-white border border-slate-200 hover:border-blue-300 text-blue-700 rounded font-medium cursor-pointer transition-colors"
                              >
                                🎓 Study Overload
                              </button>
                              <button
                                onClick={() => {
                                  setVoiceOpen(true);
                                  setVoiceStatus('listening');
                                  setVoiceTranscript("Deconstruct my exam syllabus prep");
                                  setTimeout(() => {
                                    setVoiceStatus('processing');
                                    setTimeout(() => {
                                      setVoiceStatus('speaking');
                                      setVoiceReply("Let's break down your syllabus prep: 1) Scan study guide, 2) Set up a 15-minute active recall study sprint, 3) 5-minute hydration block.");
                                    }, 1200);
                                  }, 1200);
                                }}
                                className="text-[9px] px-1.5 py-1 bg-white border border-slate-200 hover:border-blue-300 text-blue-700 rounded font-medium cursor-pointer transition-colors"
                              >
                                📚 Sift Syllabus
                              </button>
                            </>
                          ) : (settings?.role || 'professional') === 'entrepreneur' ? (
                            <>
                              <button
                                onClick={() => {
                                  setVoiceOpen(true);
                                  setVoiceStatus('listening');
                                  setVoiceTranscript("I have too many founder decisions to make today");
                                  setTimeout(() => {
                                    setVoiceStatus('processing');
                                    setTimeout(() => {
                                      setVoiceStatus('speaking');
                                      setVoiceReply("Let's activate decision-fatigue protection. We will triage your active workload and focus strictly on one primary traction milestone today. Noise canceled!");
                                    }, 1200);
                                  }, 1200);
                                }}
                                className="text-[9px] px-1.5 py-1 bg-white border border-slate-200 hover:border-amber-300 text-amber-700 rounded font-medium cursor-pointer transition-colors"
                              >
                                🚀 Founder Triage
                              </button>
                              <button
                                onClick={() => {
                                  setVoiceOpen(true);
                                  setVoiceStatus('listening');
                                  setVoiceTranscript("Pitch deck slide preparation stress");
                                  setTimeout(() => {
                                    setVoiceStatus('processing');
                                    setTimeout(() => {
                                      setVoiceStatus('speaking');
                                      setVoiceReply("Let's outline your pitch deck slides into 3 simple sections: 1) Value prop, 2) Market traction, 3) Team execution plan. We do them one by one.");
                                    }, 1200);
                                  }, 1200);
                                }}
                                className="text-[9px] px-1.5 py-1 bg-white border border-slate-200 hover:border-amber-300 text-amber-700 rounded font-medium cursor-pointer transition-colors"
                              >
                                ⚖️ Pitch Triage
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setVoiceOpen(true);
                                  setVoiceStatus('listening');
                                  setVoiceTranscript("I just finished a 4-hour meeting marathon");
                                  setTimeout(() => {
                                    setVoiceStatus('processing');
                                    setTimeout(() => {
                                      setVoiceStatus('speaking');
                                      setVoiceReply("Welcome back, builder. Let's start with a 5-minute screen-free decompression. Hydrate, roll your shoulders, and I'll queue up some lofi.");
                                    }, 1200);
                                  }, 1200);
                                }}
                                className="text-[9px] px-1.5 py-1 bg-white border border-slate-200 hover:border-indigo-300 text-indigo-700 rounded font-medium cursor-pointer transition-colors"
                              >
                                💼 Post-Meeting Care
                              </button>
                              <button
                                onClick={() => {
                                  setVoiceOpen(true);
                                  setVoiceStatus('listening');
                                  setVoiceTranscript("Break this design document block down");
                                  setTimeout(() => {
                                    setVoiceStatus('processing');
                                    setTimeout(() => {
                                      setVoiceStatus('speaking');
                                      setVoiceReply("Sure! Let's slice this technical doc into: 1) System block diagram, 2) API endpoint interfaces, 3) Local verification checklist.");
                                    }, 1200);
                                  }, 1200);
                                }}
                                className="text-[9px] px-1.5 py-1 bg-white border border-slate-200 hover:border-indigo-300 text-indigo-700 rounded font-medium cursor-pointer transition-colors"
                              >
                                ⚙️ Doc Breakdown
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button 
                        onClick={() => setVoiceOpen(true)}
                        className="text-[10px] px-2.5 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold rounded-lg border border-violet-100 transition-colors cursor-pointer flex-1 text-center"
                      >
                        🎙 Open Coach Voice
                      </button>
                    </div>
                  </div>

                  {/* CARD 8: Autonomous Task Planning and Execution */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="p-1.5 bg-fuchsia-50 text-fuchsia-600 rounded-lg">
                          <Sparkle className="w-4 h-4" />
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-fuchsia-50 border border-fuchsia-100 text-fuchsia-600 font-bold font-mono">
                          AUTONOMOUS
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-800">8. Autonomous Roadmaps</h3>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                        Generates checklist checkpoints and atomic step roadmaps autonomously via Gemini.
                      </p>
                      
                      <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block font-mono">Target Task</span>
                        <select
                          value={featuredTaskId}
                          onChange={(e) => setFeaturedTaskId(e.target.value)}
                          className="w-full text-[10px] bg-white border border-slate-200 rounded p-1 font-semibold text-slate-700 focus:outline-hidden"
                        >
                          {tasks.map(t => (
                            <option key={t.id} value={t.id}>{t.title}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={async () => {
                          if (featuredTaskId) {
                            await handleTaskCopilotAction(featuredTaskId, 'break-steps');
                          }
                        }}
                        disabled={copilotLoadingId === featuredTaskId && copilotAction === 'break-steps'}
                        className="text-[10px] px-2.5 py-1.5 bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 font-bold rounded-lg border border-fuchsia-100 transition-colors cursor-pointer flex-1 text-center font-semibold"
                      >
                        {copilotLoadingId === featuredTaskId && copilotAction === 'break-steps' ? 'Building...' : '⚙️ Plan Checkpoints'}
                      </button>
                      <button 
                        onClick={() => setActiveView('focus')}
                        className="text-[10px] text-slate-600 font-bold hover:underline"
                      >
                        Focus →
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Bento Grid layout of exact components requested */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* [ Today's Schedule ] */}
                <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4.5 h-4.5 text-blue-500" />
                        <h2 className="text-sm font-bold text-slate-900">Today's Schedule</h2>
                      </div>
                      <button 
                        onClick={() => setActiveView('planner')}
                        className="text-[10px] text-indigo-600 font-bold hover:underline"
                      >
                        Go to Planner →
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {timeBlocks.length > 0 ? (
                        timeBlocks.map((block) => (
                          <div 
                            key={block.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                              block.completed 
                                ? 'bg-slate-50 border-slate-100 opacity-60' 
                                : block.type === 'focus' 
                                  ? 'bg-blue-50/70 border-blue-100' 
                                  : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleToggleTimeBlock(block.id, !block.completed)}
                                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                  block.completed ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-300 bg-white'
                                }`}
                              >
                                {block.completed && <Check className="w-3 h-3 text-white" />}
                              </button>
                              <div>
                                <span className="text-[10px] text-slate-400 block font-mono leading-none">{block.start} - {block.end}</span>
                                <span className={`font-bold text-slate-800 ${block.completed ? 'line-through text-slate-400' : ''}`}>{block.title}</span>
                              </div>
                            </div>
                            <span className="text-[9px] font-mono uppercase bg-slate-200/50 px-1.5 py-0.5 rounded text-slate-600">{block.type}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 my-2">
                          <Clock className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                          <p className="text-slate-600 font-bold text-xs font-mono">No blocks scheduled</p>
                          <p className="text-slate-400 text-[9px] font-mono mt-0.5">Your dynamic agenda appears here once tasks are assigned.</p>
                          <button 
                            type="button"
                            onClick={() => setActiveView('planner')}
                            className="mt-2 px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-[9px] font-mono font-bold hover:bg-slate-50 shadow-xs cursor-pointer"
                          >
                            📅 Go to Planner
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={handleGenerateRoadmap}
                    className="w-full mt-4 py-2 rounded-xl border border-dashed border-indigo-200 hover:bg-indigo-50 text-indigo-600 text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>DYNAMIZE AND RE-GENERATE ROADMAP</span>
                  </button>
                </div>

                {/* [ High Priority ] */}
                <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4.5 h-4.5 text-red-500" />
                        <h2 className="text-sm font-bold text-slate-900">High Priority</h2>
                      </div>
                      <button 
                        onClick={() => setActiveView('tasks')}
                        className="text-[10px] text-indigo-600 font-bold hover:underline"
                      >
                        All Tasks ({tasks.length})
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {tasks.filter(t => !t.completed).length > 0 ? (
                        tasks.filter(t => !t.completed).slice(0, 4).map((task) => (
                          <div 
                            key={task.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                              task.riskLevel === 'critical' ? 'bg-red-50/60 border-red-100' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleToggleTask(task.id, true)}
                                className="w-4 h-4 rounded border border-slate-300 bg-white hover:border-indigo-500 flex items-center justify-center"
                              >
                                <Check className="w-3 h-3 text-transparent hover:text-indigo-500" />
                              </button>
                              <div>
                                <span className={`font-bold text-slate-800`}>{task.title}</span>
                                <span className="text-[9px] font-mono text-slate-400 block">Priority: {task.overallPriorityScore}/100</span>
                              </div>
                            </div>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${getRiskBadgeColor(task.riskLevel)}`}>{task.riskLevel}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 my-2">
                          <Check className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                          <p className="text-slate-600 font-bold text-xs font-mono">Clean slate! No active tasks</p>
                          <p className="text-slate-400 text-[9px] font-mono mt-0.5">Add a task and let the AI compute its overall priority rating.</p>
                          <button 
                            type="button"
                            onClick={() => {
                              setActiveView('tasks');
                              setShowAddTask(true);
                            }}
                            className="mt-2 px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-mono font-bold hover:bg-indigo-500 shadow-sm cursor-pointer"
                          >
                            ➕ Add First Task
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => setActiveView('tasks')}
                    className="w-full mt-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-xs font-mono font-bold transition-all"
                  >
                    Manage & Prioritize Assignments
                  </button>
                </div>

                {/* [ Productivity Score & Habit streak tracker ] */}
                <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4.5 h-4.5 text-emerald-500" />
                        <h2 className="text-sm font-bold text-slate-900">Productivity Score</h2>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center py-2.5">
                      <div className="relative w-28 h-28 flex items-center justify-center">
                        {/* Circular track */}
                        <svg className="absolute w-full h-full transform -rotate-95">
                          <circle cx="56" cy="56" r="48" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                          <circle cx="56" cy="56" r="48" stroke="#10b981" strokeWidth="8" fill="transparent" strokeDasharray="301.6" strokeDashoffset={301.6 * (1 - (metrics?.productivityScore || 82) / 100)} />
                        </svg>
                        <div className="text-center z-10">
                          <span className="text-2xl font-mono font-bold text-slate-900 leading-none">{metrics?.productivityScore || 82}%</span>
                          <span className="text-[9px] text-slate-400 font-mono block mt-1">Consistency Rating</span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span>Weekly Streak: <strong className="font-bold text-slate-900">{metrics?.streakDays || 5} Days</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3.5 text-center">
                    <span className="text-[9px] text-slate-400 font-mono uppercase block">Active Habit Peak Routine</span>
                    <span className="text-xs font-bold text-indigo-600 mt-1 block">Wake Up: 6:00 AM</span>
                  </div>
                </div>

                {/* [ AI Suggestions ] */}
                <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3.5">
                      <Sparkles className="w-4.5 h-4.5 text-indigo-600" />
                      <h2 className="text-sm font-bold text-slate-900">AI Suggestions</h2>
                    </div>

                    <div className="space-y-3">
                      {getDynamicAISuggestions().map((s, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                          <p className="text-slate-700 leading-snug">
                            <strong>{s.taskTitle}</strong>: {s.suggestion}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center text-[10px] font-mono text-slate-500">
                    Calculated via active cognitive circadian profiling
                  </div>
                </div>

                {/* [ Upcoming Deadlines ] */}
                <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3.5">
                      <CalendarIcon className="w-4.5 h-4.5 text-indigo-600" />
                      <h2 className="text-sm font-bold text-slate-900">Upcoming Deadlines</h2>
                    </div>

                    <div className="space-y-3 font-mono text-xs">
                      {tasks.filter(t => !t.completed).length > 0 ? (
                        tasks.filter(t => !t.completed).slice(0, 3).map((task) => {
                          const diff = new Date(task.deadline).getTime() - Date.now();
                          const hours = diff / (1000 * 60 * 60);
                          let badgeText = "Soon";
                          let badgeColor = "bg-indigo-50 border-indigo-200 text-indigo-600";
                          if (hours < 0) {
                            badgeText = "Overdue";
                            badgeColor = "bg-rose-50 border-rose-200 text-rose-600 font-bold animate-pulse";
                          } else if (hours < 24) {
                            badgeText = "Tomorrow";
                            badgeColor = "bg-red-50 border-red-200 text-red-600 font-bold";
                          } else if (hours < 48) {
                            badgeText = "In 2 days";
                            badgeColor = "bg-amber-50 border-amber-200 text-amber-600 font-bold";
                          } else if (hours < 168) {
                            badgeText = "This week";
                            badgeColor = "bg-blue-50 border-blue-200 text-blue-600";
                          }
                          return (
                            <div key={task.id} className="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors">
                              <div>
                                <span className="font-bold text-slate-800 text-[11px] truncate block max-w-[120px]">{task.title}</span>
                                <span className="text-[9px] text-slate-400 block mt-0.5">{task.category}</span>
                              </div>
                              <span className={`text-[9px] ${badgeColor} px-1.5 py-0.5 rounded shrink-0`}>
                                {badgeText}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                          <Inbox className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                          <p className="text-slate-600 font-bold text-xs font-mono">All caught up</p>
                          <p className="text-slate-400 text-[9px] font-mono mt-0.5">Upcoming delivery parameters automatically track in this workspace.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => setActiveView('planner')}
                    className="w-full mt-4 py-2 text-center text-xs font-mono font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    View Interactive Calendar Timeline
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* VIEW: MY TASKS (Intelligent Prioritization) */}
          {/* ---------------------------------------------------- */}
          {activeView === 'tasks' && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-xl font-bold font-display text-slate-900">Intelligent Task Prioritization</h1>
                  <p className="text-xs text-slate-500">Active tasks automatically scored on Urgency, Importance, and Cognitive Overload potential.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    onClick={() => handleTaskCopilotAction('', 'reprioritize')}
                    disabled={copilotLoadingId === ''}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono font-bold rounded-xl transition-all shadow-md shadow-slate-900/10 cursor-pointer disabled:opacity-50"
                    title="Run priority recalculation with AI on all active tasks"
                  >
                    {copilotLoadingId === '' ? (
                      <RotateCcw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                    <span>⚡ AI REPRIORITIZE ALL</span>
                  </button>

                  <button 
                    onClick={() => setShowAddTask(!showAddTask)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold rounded-xl transition-all shadow-md shadow-indigo-600/10"
                  >
                    <Plus className="w-4 h-4" />
                    <span>LOG NEW ASSIGNMENT</span>
                  </button>
                </div>
              </div>

              {/* Task Form */}
              {showAddTask && (
                <form onSubmit={handleAddTask} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-md space-y-4">
                  {/* AI Suggestion Generator */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 font-display">
                      <Sparkle className="w-4 h-4 text-indigo-600 animate-pulse" />
                      <span>AI Task Architect Suggestions</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Have a rough idea of what you need to do? Type it below and let the AI automatically generate a polished title, category, description, and time budget.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. math test preparation or write quarterly report"
                        value={aiPromptText}
                        onChange={(e) => setAiPromptText(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleGetAISuggestions}
                        disabled={aiLoading || !aiPromptText.trim()}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {aiLoading ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Sparkle className="w-3.5 h-3.5" />
                        )}
                        <span>Draft with AI</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Title / Deliverable</label>
                      <input 
                        type="text" 
                        placeholder="e.g. CS50 Slide deck submission"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Category</label>
                      <select 
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Study">Study / Academics</option>
                        <option value="Work">Professional / Work</option>
                        <option value="Finance">Finance / Bills</option>
                        <option value="Personal">Personal Routine</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Exact Deadline Date & Time</label>
                      <input 
                        type="datetime-local" 
                        value={newDeadline}
                        onChange={(e) => setNewDeadline(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Estimated Hours Required</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="40" 
                        value={newHours}
                        onChange={(e) => setNewHours(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Description / Notes</label>
                    <textarea 
                      placeholder="Provide syllabus notes, required tools, rubrics, or instructions..."
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Syllabus upload / screenshot scan simulator helper */}
                  <div className="border border-dashed border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-col items-center text-center">
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">📂 SYLLABUS DOCUMENT OCR SCANNER</span>
                    <p className="text-[9px] text-slate-400 max-w-sm mt-0.5">Have a class PDF or screenshot of deadlines? Drop it here to parse into deconstructed micro-checklists immediately!</p>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden" 
                    />
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 text-xs font-mono text-indigo-600 bg-white border border-slate-200 px-3 py-1 rounded-lg hover:bg-slate-100 flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload Syllabus PDF or Image
                    </button>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button 
                      type="button" 
                      onClick={() => setShowAddTask(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-xs font-mono hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={submittingTask}
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5"
                    >
                      {submittingTask ? 'ANALYZING & SAVING...' : '✨ DISCOVER PRIORITY & SAVE'}
                    </button>
                  </div>
                </form>
              )}

              {/* Filtering Controls */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-3">
                <div className="flex items-center gap-1.5">
                  {['All', 'Study', 'Work', 'Finance', 'Personal'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setTaskCategoryFilter(cat)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                        taskCategoryFilter === cat 
                          ? 'bg-slate-900 text-white border-slate-900 font-bold' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="text-xs font-mono text-slate-500">
                  Showing {filteredTasks.length} total deliverables
                </div>
              </div>

              {/* Task Cards Stack */}
              <div className="space-y-4">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl">
                    <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600 font-bold text-xs font-mono">No tasks match your selection.</p>
                    <p className="text-slate-400 text-[10px] font-mono mt-1">Try adding a new assignment above or resetting the interactive demo data.</p>
                  </div>
                ) : (
                  filteredTasks.map((task) => {
                    const isExpanded = expandedTaskId === task.id;
                    const timeStr = new Date(task.deadline).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                    const completedSubtasks = task.subTasks ? task.subTasks.filter(s => s.completed).length : 0;
                    const totalSubtasks = task.subTasks ? task.subTasks.length : 0;
                    
                    return (
                      <div 
                        key={task.id} 
                        className={`rounded-2xl border bg-white transition-all duration-300 ${
                          task.completed 
                            ? 'border-slate-200/40 opacity-55 shadow-xs' 
                            : task.riskLevel === 'critical'
                              ? 'border-red-200 bg-red-50/20 shadow-md shadow-red-500/5'
                              : 'border-slate-200 hover:border-slate-800 shadow-xs'
                        }`}
                      >
                        {/* Task Header info */}
                        <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            <button 
                              onClick={() => handleToggleTask(task.id, !task.completed)}
                              className={`w-5.5 h-5.5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                task.completed 
                                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm' 
                                  : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                              }`}
                            >
                              {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-mono font-bold uppercase ${getCategoryColor(task.category)}`}>
                                  {task.category}
                                </span>
                                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${getRiskBadgeColor(task.riskLevel)}`}>
                                  RISK: {task.riskLevel.toUpperCase()}
                                </span>
                                {task.postponeCount > 0 && (
                                  <span className="text-[9px] font-mono bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full">
                                    Postponed {task.postponeCount}x
                                  </span>
                                )}
                              </div>
                              <h3 className={`text-sm font-bold mt-1 text-slate-900 ${task.completed ? 'line-through text-slate-400 font-normal' : ''}`}>
                                {task.title}
                              </h3>
                              <div className="flex items-center gap-3 text-slate-500 text-xs font-mono mt-1 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  Deadline: {timeStr}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Activity className="w-3.5 h-3.5" />
                                  Budget: {task.estimatedHours}h
                                </span>
                                {totalSubtasks > 0 && (
                                  <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-600 font-bold">
                                    AI Subtasks: {completedSubtasks}/{totalSubtasks}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Task Actions + Score display */}
                          <div className="flex items-center gap-4 justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                            <div className="text-right">
                              <span className="text-[9px] text-slate-400 font-mono block">PRIORITY SCORE</span>
                              <div className="flex items-baseline gap-0.5 justify-end">
                                <span className="text-lg font-mono font-bold text-slate-800">{task.overallPriorityScore}</span>
                                <span className="text-[10px] text-slate-400 font-mono">/100</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button 
                                onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                                className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-mono border border-slate-200 transition-all"
                              >
                                {isExpanded ? 'Hide Steps' : 'Deconstruct'}
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedTaskId(task.id);
                                  setActiveView('focus');
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                                  selectedTaskId === task.id
                                    ? 'bg-indigo-600 border-indigo-500 text-white font-bold shadow-sm'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200'
                                }`}
                                title="Load target in Focus Timer"
                              >
                                Focus
                              </button>
                              <button 
                                onClick={() => setEditingTask(task)}
                                className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all"
                                title="Edit Task"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Expandable subtasks breakdown drawer */}
                        {isExpanded && (
                          <div className="border-t border-slate-100 bg-slate-50/50 p-4.5 space-y-4 rounded-b-2xl">
                            {task.description && (
                              <div className="text-xs text-slate-600 border-l-2 border-indigo-500 pl-3 py-1 bg-white rounded-r-lg shadow-2xs">
                                {task.description}
                              </div>
                            )}

                            {/* Scoring Parameters grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                              <div className="bg-white p-2 rounded-xl border border-slate-200/50 text-center">
                                <div className="text-[9px] font-mono text-slate-400 uppercase">Urgency Rating</div>
                                <div className="text-xs font-mono font-bold text-slate-800 mt-0.5">{task.urgencyScore}%</div>
                              </div>
                              <div className="bg-white p-2 rounded-xl border border-slate-200/50 text-center">
                                <div className="text-[9px] font-mono text-slate-400 uppercase">Proximity Factor</div>
                                <div className="text-xs font-mono font-bold text-slate-800 mt-0.5">{task.deadlineScore}%</div>
                              </div>
                              <div className="bg-white p-2 rounded-xl border border-slate-200/50 text-center">
                                <div className="text-[9px] font-mono text-slate-400 uppercase">Impact Index</div>
                                <div className="text-xs font-mono font-bold text-slate-800 mt-0.5">{task.importanceScore}%</div>
                              </div>
                              <div className="bg-white p-2 rounded-xl border border-slate-200/50 text-center">
                                <div className="text-[9px] font-mono text-slate-400 uppercase">Energy Required</div>
                                <div className="text-xs font-mono font-bold text-slate-700 capitalize mt-0.5">{task.energyRequirement}</div>
                              </div>
                            </div>

                            {/* AI Task Copilot Action Panel */}
                            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-3.5 border border-indigo-500/20 space-y-2">
                              <div className="flex items-center gap-1.5 text-[10px] text-indigo-200 font-mono uppercase tracking-wider">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                                <span>AI Coach Task Copilot</span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleTaskCopilotAction(task.id, 'break-steps')}
                                  disabled={copilotLoadingId === task.id}
                                  className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono font-bold rounded-lg border border-indigo-500/10 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200 hover:text-white transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                                >
                                  {copilotLoadingId === task.id && copilotAction === 'break-steps' ? (
                                    <RotateCcw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                                  ) : (
                                    <ListTodo className="w-3.5 h-3.5 text-indigo-400" />
                                  )}
                                  <span>Break into Steps</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleTaskCopilotAction(task.id, 'estimate-time')}
                                  disabled={copilotLoadingId === task.id}
                                  className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono font-bold rounded-lg border border-indigo-500/10 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200 hover:text-white transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                                >
                                  {copilotLoadingId === task.id && copilotAction === 'estimate-time' ? (
                                    <RotateCcw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                                  ) : (
                                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                  )}
                                  <span>Estimate Time</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleTaskCopilotAction(task.id, 'reprioritize')}
                                  disabled={copilotLoadingId === task.id}
                                  className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono font-bold rounded-lg border border-indigo-500/10 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200 hover:text-white transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                                >
                                  {copilotLoadingId === task.id && copilotAction === 'reprioritize' ? (
                                    <RotateCcw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                                  ) : (
                                    <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                                  )}
                                  <span>Reprioritize</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleTaskCopilotAction(task.id, 'generate-checklist')}
                                  disabled={copilotLoadingId === task.id}
                                  className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono font-bold rounded-lg border border-indigo-500/10 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200 hover:text-white transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                                >
                                  {copilotLoadingId === task.id && copilotAction === 'generate-checklist' ? (
                                    <RotateCcw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                                  ) : (
                                    <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                                  )}
                                  <span>Generate Checklist</span>
                                </button>
                              </div>
                            </div>

                            {/* Subtask micro checklists */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                                <span>AI-Generated Micro Steps Breakdown</span>
                                <span>Time Estimates</span>
                              </div>

                              {task.subTasks && task.subTasks.length > 0 ? (
                                <div className="space-y-1.5">
                                  {task.subTasks.map((sub) => (
                                    <div 
                                      key={sub.id} 
                                      className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200/40 hover:border-slate-300 transition-all"
                                    >
                                      <div className="flex items-center gap-2.5 text-xs">
                                        <button 
                                          onClick={() => handleToggleSubtask(task.id, sub.id, !sub.completed)}
                                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                                            sub.completed 
                                              ? 'bg-emerald-600 border-emerald-500 text-white' 
                                              : 'border-slate-300 bg-white hover:border-indigo-500'
                                          }`}
                                        >
                                          {sub.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                        </button>
                                        <span className={`${sub.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                          {sub.title}
                                        </span>
                                      </div>
                                      <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                                        {sub.estimatedMinutes} mins
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-5 bg-white border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                                  No subtask checkpoints deconstructed. Try adding a detailed description so the Coach can break it down.
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* VIEW: PLANNER (Roadmap, Schedules, Sync Calendar) */}
          {/* ---------------------------------------------------- */}
          {activeView === 'planner' && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-xl font-bold font-display text-slate-900">Today's Autonomous Roadmap</h1>
                  <p className="text-xs text-slate-500">Hourly schedule blocks automatically mapped around your high priority deadlines to avoid cognitive burnout.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    onClick={handleGenerateRoadmap}
                    disabled={schedulingRoadmap}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
                  >
                    {schedulingRoadmap ? (
                      <span className="pulse-dot bg-white animate-pulse" />
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                        <span>DYNAMIZE ROADMAP</span>
                      </>
                    )}
                  </button>

                  <button 
                    onClick={() => handlePlannerAction('optimize-schedule')}
                    disabled={plannerActionLoading === 'optimize-schedule'}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono font-bold rounded-xl transition-all shadow-md shadow-slate-900/10 cursor-pointer disabled:opacity-50"
                  >
                    {plannerActionLoading === 'optimize-schedule' ? (
                      <RotateCcw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                    <span>OPTIMIZE SCHEDULE</span>
                  </button>

                  <button 
                    onClick={() => handlePlannerAction('auto-schedule')}
                    disabled={plannerActionLoading === 'auto-schedule'}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-mono font-bold rounded-xl transition-all shadow-md shadow-indigo-950/10 cursor-pointer disabled:opacity-50"
                  >
                    {plannerActionLoading === 'auto-schedule' ? (
                      <RotateCcw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    ) : (
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                    <span>AUTO SCHEDULE</span>
                  </button>

                  <button 
                    onClick={() => handlePlannerAction('sync-calendar')}
                    disabled={plannerActionLoading === 'sync-calendar'}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold rounded-xl transition-all shadow-md shadow-blue-600/10 cursor-pointer disabled:opacity-50"
                  >
                    {plannerActionLoading === 'sync-calendar' ? (
                      <RotateCcw className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      <CalendarIcon className="w-3.5 h-3.5 text-white" />
                    )}
                    <span>SYNC CALENDAR</span>
                  </button>
                </div>
              </div>

              {/* Calendar Integration component block */}
              <div className="bg-white p-4.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Google Calendar Integration</h3>
                    <p className="text-[11px] text-slate-500 max-w-lg mt-0.5">Keep external appointments synced. When toggled, we automatically scan and resolve conflicts dynamically.</p>
                  </div>
                </div>

                <button
                  onClick={handleGoogleCalendarConnect}
                  disabled={isConnectingCalendar}
                  className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all disabled:opacity-50 ${
                    calendarConnected 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {isConnectingCalendar ? 'CONNECTING...' : calendarConnected ? '✓ GOOGLE CALENDAR CONNECTED' : '🔌 CONNECT GOOGLE CALENDAR'}
                </button>
              </div>

              {/* Google Calendar Connection Error Notice */}
              {calendarError && (
                <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-fade-in">
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-rose-500" />
                  <div className="flex-1">
                    <strong className="block font-semibold text-rose-800 mb-0.5 font-display text-[11px]">Google Calendar Connection Notice</strong>
                    <p className="text-[11px] leading-relaxed text-rose-700/90">{calendarError}</p>
                  </div>
                  <button 
                    onClick={() => setCalendarError(null)} 
                    className="text-[10px] uppercase font-mono font-bold tracking-wider text-rose-500 hover:text-rose-700 transition-colors cursor-pointer shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Mock external schedule conflict notice if connected */}
              {calendarConnected && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-700 animate-fade-in">
                  <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                  <p>
                    <strong>Schedule Conflict Detected:</strong> Standard Sync found a mock calendar blocker at 11:00 AM. 
                    DynaMize scheduler has re-budgeted your API Integration work to 12:30 PM to clear the block.
                  </p>
                </div>
              )}

              {/* Time Blocks hourly sequence */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Chronological Schedule Block</span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Completion</span>
                </div>

                <div className="space-y-3">
                  {timeBlocks.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
                      <p className="text-slate-500 text-xs font-mono">No active timetable. Hit the "DYNAMIZE ROADMAP" button above to auto-create standard focus periods!</p>
                    </div>
                  ) : (
                    timeBlocks.map((block) => (
                      <div 
                        key={block.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                          block.completed 
                            ? 'bg-slate-50 border-slate-100 opacity-60 shadow-xs'
                            : block.type === 'focus' 
                              ? 'bg-blue-50/70 border-blue-100 hover:border-blue-200' 
                              : block.type === 'break'
                                ? 'bg-emerald-50/70 border-emerald-100 hover:border-emerald-200'
                                : block.type === 'meeting'
                                  ? 'bg-amber-50/70 border-amber-100 hover:border-amber-200'
                                  : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button 
                            onClick={() => handleToggleTimeBlock(block.id, !block.completed)}
                            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                              block.completed 
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm' 
                                : 'border-slate-300 bg-white hover:border-indigo-500'
                            }`}
                          >
                            {block.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>
                          
                          <div className="min-w-0">
                            <span className="text-[10px] font-mono text-slate-400 block leading-none">
                              {block.start} - {block.end}
                            </span>
                            <h4 className={`text-xs font-bold text-slate-800 mt-1 truncate ${block.completed ? 'line-through text-slate-400' : ''}`}>
                              {block.title}
                            </h4>
                          </div>
                        </div>

                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold shrink-0 ${
                          block.type === 'focus' 
                            ? 'bg-blue-100 text-blue-600' 
                            : block.type === 'break' 
                              ? 'bg-emerald-100 text-emerald-600' 
                              : block.type === 'meeting' 
                                ? 'bg-amber-100 text-amber-600' 
                                : 'bg-slate-200 text-slate-600'
                        }`}>
                          {block.type}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Interactive Calendar event addition helper */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 font-mono">📅 QUICK SCHEDULE EVENT DRAFT</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input type="text" placeholder="e.g. Brainstorming" className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg" />
                  <input type="text" placeholder="Start (HH:MM)" className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg" />
                  <input type="text" placeholder="End (HH:MM)" className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg" />
                  <button 
                    onClick={() => alert("Event mock added! Hit DynaMize to blend into your daily cognitive budget.")}
                    className="py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-mono font-bold"
                  >
                    Draft Event Block
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* VIEW: GOALS & HABITS (Goals, Habits, Streaks, Badges) */}
          {/* ---------------------------------------------------- */}
          {activeView === 'goals' && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold font-display text-slate-900">Goals & Habit Tracker</h1>
                  <p className="text-xs text-slate-500">Form lasting habits, complete complex goals, and unlock gamified XP Achievements.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Major Goals Section */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Target className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-sm font-bold text-slate-900">Long-Term Milestones</h2>
                  </div>

                  <div className="space-y-4">
                    {goals.map((g) => (
                      <div key={g.id} className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{g.title}</span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded uppercase">{g.category}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full transition-all" style={{ width: `${g.progress}%` }} />
                          </div>
                          <span className="font-mono text-[10px] text-slate-600 w-8 text-right font-bold">{g.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => alert("Milestone goal creator is a Premium flow feature. For now, you can create tasks inside the Task Vault!")}
                    className="w-full py-2 border border-dashed border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-mono text-slate-500 font-bold transition-all"
                  >
                    + ADD NEW MILESTONE GOAL
                  </button>
                </div>

                {/* Daily Habits Consistency Tracker */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <h2 className="text-sm font-bold text-slate-900">Daily Habits & Routines</h2>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Streak multipliers active</span>
                  </div>

                  <div className="space-y-3">
                    {habits.map((h) => (
                      <div 
                        key={h.id}
                        className="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-all text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <button 
                            onClick={() => handleToggleHabit(h.id)}
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                              h.completedToday 
                                ? 'bg-emerald-600 border-emerald-500 text-white' 
                                : 'border-slate-300 bg-white hover:border-emerald-500'
                            }`}
                          >
                            {h.completedToday && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>
                          <div>
                            <span className={`font-bold text-slate-800 ${h.completedToday ? 'line-through text-slate-400 font-normal' : ''}`}>
                              {h.title}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400 block">Frequency: {h.frequency}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded-lg text-[10px] font-mono">
                          <Flame className="w-3.5 h-3.5" />
                          <span>{h.streak}d streak</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Achievements Vault */}
                <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-sm font-bold text-slate-900">Gamified Achievements</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {achievements.map((ach) => (
                      <div 
                        key={ach.id} 
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                          ach.unlocked 
                            ? 'bg-slate-50 border-slate-200' 
                            : 'bg-white border-slate-100 opacity-40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 border ${
                            ach.unlocked 
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-xs' 
                              : 'bg-slate-100 border-slate-200 text-slate-400'
                          }`}>
                            {ach.icon === 'ShieldAlert' ? <ShieldAlert className="w-4.5 h-4.5" /> :
                             ach.icon === 'Brain' ? <Brain className="w-4.5 h-4.5" /> :
                             ach.icon === 'Flame' ? <Flame className="w-4.5 h-4.5" /> :
                             <Zap className="w-4.5 h-4.5" />}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 leading-none">{ach.title}</h4>
                            <p className="text-[10px] text-slate-500 mt-1 leading-tight">{ach.description}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-mono font-bold shrink-0 ${ach.unlocked ? 'text-amber-600' : 'text-slate-500'}`}>
                          +{ach.xpReward} XP
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* VIEW: FOCUS MODE (Timer, Presets, Soundscape) */}
          {/* ---------------------------------------------------- */}
          {activeView === 'focus' && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold font-display text-slate-900">Deep Work Focus Space</h1>
                  <p className="text-xs text-slate-500">Block out distractions, study with ambient auditory cues, and earn dynamic executive rewards.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Main countdown clock */}
                <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-6">
                  
                  {/* Preset Buttons */}
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl">
                    <button 
                      onClick={() => resetTimerPreset('study')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                        focusMode === 'study' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Study Block (25m)
                    </button>
                    <button 
                      onClick={() => resetTimerPreset('work')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                        focusMode === 'work' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Deep Work (45m)
                    </button>
                    <button 
                      onClick={() => resetTimerPreset('rescue')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                        focusMode === 'rescue' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Rescue Dash (20m)
                    </button>
                  </div>

                  {/* Gigantic Display Numbers */}
                  <div className="relative w-48 h-48 rounded-full border border-slate-200/50 flex items-center justify-center shadow-lg bg-slate-50/50">
                    <div className="text-center">
                      <div className="text-5xl font-mono font-bold text-slate-900 select-none">
                        {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
                      </div>
                      <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block mt-1 leading-none font-bold">
                        {focusMode}ing interval
                      </span>
                    </div>
                  </div>

                  {/* Associate target selector */}
                  <div className="w-full max-w-sm space-y-1 text-center">
                    <label className="block text-[10px] font-mono uppercase text-slate-500">Associate active task</label>
                    <select 
                      value={selectedTaskId}
                      onChange={(e) => setSelectedTaskId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 text-center font-bold"
                    >
                      <option value="">-- Generic Focus Session --</option>
                      {tasks.filter(t => !t.completed).map((t) => (
                        <option key={t.id} value={t.id}>{t.title} ({t.category})</option>
                      ))}
                    </select>
                  </div>

                  {/* Control switches */}
                  <div className="flex items-center gap-3.5 w-full max-w-xs justify-center">
                    <button 
                      onClick={() => setTimerRunning(!timerRunning)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all w-full justify-center ${
                        timerRunning 
                          ? 'bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold' 
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10'
                      }`}
                    >
                      {timerRunning ? (
                        <>
                          <Pause className="w-4 h-4" />
                          <span>PAUSE</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>START FOCUS BLOCK</span>
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => resetTimerPreset(focusMode)}
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-all shrink-0"
                      title="Reset countdown"
                    >
                      <RotateCcw className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                {/* Ambient Sounds / Mood tracking */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* sound scape selection */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4.5 h-4.5 text-indigo-600" />
                        <h3 className="text-xs font-bold text-slate-900 font-mono">AMBIENT SOUNDSCAPE</h3>
                      </div>
                      {ambientSound !== 'none' && (
                        <span className="text-[10px] text-emerald-600 font-mono font-bold animate-pulse">PLAYING</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'none', label: '🔇 Silent Mode' },
                        { id: 'binaural', label: '🎧 Binaural Beats' },
                        { id: 'lofi', label: '☕ Study Lofi' },
                        { id: 'rain', label: '🌧️ Zen Rain' }
                      ].map((sound) => (
                        <button
                          key={sound.id}
                          onClick={() => setAmbientSound(sound.id as any)}
                          className={`p-2.5 rounded-xl border text-xs text-center transition-all ${
                            ambientSound === sound.id 
                              ? 'bg-indigo-50 text-indigo-600 border-indigo-200 font-bold shadow-xs' 
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {sound.label}
                        </button>
                      ))}
                    </div>

                    {ambientSound !== 'none' && (
                      <div className="space-y-1 pt-1 text-xs">
                        <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono">
                          <span>Soundscape Volume</span>
                          <span>{ambientVolume}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={ambientVolume} 
                          onChange={(e) => setAmbientVolume(Number(e.target.value))}
                          className="w-full accent-indigo-600" 
                        />
                      </div>
                    )}
                  </div>

                  {/* mood tracking selector */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3.5 shadow-sm">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 font-mono">COGNITIVE MOOD SCAN</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Let the AI coach track your focus energy levels to warning against impending mental fatigue.</p>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { id: 'focused', label: 'Focused', color: 'bg-emerald-50 text-emerald-600 border-emerald-200 font-bold' },
                        { id: 'energetic', label: 'Energized', color: 'bg-sky-50 text-sky-600 border-sky-200 font-bold' },
                        { id: 'neutral', label: 'Neutral', color: 'bg-slate-50 text-slate-600 border-slate-200 font-bold' },
                        { id: 'tired', label: 'Tired', color: 'bg-amber-50 text-amber-600 border-amber-200 font-bold' },
                        { id: 'anxious', label: 'Anxious', color: 'bg-red-50 text-red-600 border-red-200' }
                      ].map((m) => (
                        <button 
                          key={m.id}
                          onClick={() => setFocusMood(m.id as any)}
                          className={`py-1 text-[10px] font-mono rounded-lg border text-center transition-all ${
                            focusMood === m.id ? m.color + ' ring-2 ring-indigo-500/20' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* VIEW: INSIGHTS (Metrics & Procrastination Interventions) */}
          {/* ---------------------------------------------------- */}
          {activeView === 'insights' && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold font-display text-slate-900">Habit Intelligence Insights</h1>
                  <p className="text-xs text-slate-500">Visual analytical logs and warnings calculated by the Coach scanning engine.</p>
                </div>
              </div>

              {/* Procrastination detector trigger widget */}
              {procrastinationLogs.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 shadow-sm animate-pulse">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-amber-600 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>COGNITIVE PROCRASTINATION SCAN: ACTIVE THREAT</span>
                  </div>
                  <p className="text-xs text-slate-800 leading-snug font-medium">
                    "{procrastinationLogs[0].interventionText}"
                  </p>
                  <div className="text-[9px] font-mono text-amber-500 text-right leading-none">
                    Trigger event detected just now • Real-time coach feedback
                  </div>
                </div>
              )}

              {/* Metrics blocks */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Productivity Rating</span>
                  <span className="text-xl font-mono font-bold text-slate-900 mt-1 block">{metrics?.productivityScore || 82}%</span>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">Consolidated study profile</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Circadian Peak Focus</span>
                  <span className="text-xs font-mono font-bold text-indigo-600 mt-1 block">
                    {metrics?.bestFocusHour || "10:00 AM"}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">Highest mental throughput</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Weekly Completion Rate</span>
                  <span className="text-xl font-mono font-bold text-emerald-600 mt-1 block">{metrics?.completionRate || 91}%</span>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">Of all logged assignments</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Work Consistency</span>
                  <span className="text-xl font-mono font-bold text-blue-600 mt-1 block">{metrics?.workConsistency || 85}%</span>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">Syllabus block integrity</p>
                </div>
              </div>

              {/* Chat companion sandbox */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold font-mono text-slate-900 uppercase">Interactive AI Reframing Coach Chat</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Struggling with task friction? Type your struggle or record your mood, and obtain quick focus calibration.</p>
                </div>

                {/* Chat Bubble Thread */}
                <div className="h-44 overflow-y-auto pr-1 space-y-3 bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/50">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-slate-400 text-xs font-mono py-12">
                      Speak or chat with the coach to map task deconstruction steps!
                    </div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        <div className={`p-2.5 rounded-2xl text-xs ${
                          msg.role === 'user' 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                        }`}>
                          <div className="markdown-body">
                            <Markdown>{msg.content}</Markdown>
                          </div>
                        </div>
                        <span className="text-[8px] text-slate-400 font-mono mt-0.5">{msg.isVoice ? '🎤 Voice Request' : '💬 Typed'}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Text input prompt */}
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Tell AI coach why you are putting off presentation..." 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    className="flex-1 bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                  <button 
                    onClick={() => handleSendChat()}
                    disabled={sendingChat}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-mono font-bold transition-all"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* VIEW: NOTIFICATIONS (Context Reminders & Alerts) */}
          {/* ---------------------------------------------------- */}
          {activeView === 'notifications' && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold font-display text-slate-900">Context-Aware AI Alerts & Reminders</h1>
                  <p className="text-xs text-slate-500">Real-time alerts generated automatically through cognitive schedule auditing and deadline tracking.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                
                <div className="space-y-3.5">
                  
                  {/* High urgency alert */}
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3.5">
                    <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[9px] font-mono font-bold text-red-600 bg-red-100/50 border border-red-200 px-1.5 py-0.2 rounded uppercase">CRITICAL THREAT</span>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">Hackathon Prototype Deadline Fast Approaching</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-snug">
                        AI Calculations predict a 78% failure probability unless you engage <strong>Emergency Rescue Mode</strong> or deconstruct your tasks into 20 min interval blocks.
                      </p>
                    </div>
                  </div>

                  {/* Delay warning notification */}
                  {procrastinationLogs.length > 0 && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3.5">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[9px] font-mono font-bold text-amber-600 bg-amber-100/50 border border-amber-200 px-1.5 py-0.2 rounded uppercase">PROCRASTINATION DETECTED</span>
                        <h4 className="text-xs font-bold text-slate-900 mt-1">Checklist friction audit alert</h4>
                        <p className="text-xs text-slate-600 mt-1 leading-snug">
                          "{procrastinationLogs[0].interventionText}"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Circadian recommendations */}
                  <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3.5">
                    <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0 animate-pulse" />
                    <div>
                      <span className="text-[9px] font-mono font-bold text-indigo-600 bg-indigo-100 border border-indigo-200 px-1.5 py-0.2 rounded uppercase">CIRCADIAN ENERGY REC</span>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">Schedule complex blocks before 10:00 AM</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-snug">
                        Your historical deep work logs indicate that you complete mathematical tasks with 34% more focus accuracy in early morning slots. Try launching a study focus block now!
                      </p>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* VIEW: SETTINGS (ADHD Accommodations, Sync) */}
          {/* ---------------------------------------------------- */}
          {activeView === 'settings' && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold font-display text-slate-900">Account & Workspace Settings</h1>
                  <p className="text-xs text-slate-500">Manage your profile, primary focus role, and AI coaching preferences.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                
                <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 max-w-xl">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{currentUser?.displayName || 'Active User'}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{currentUser?.email}</div>
                  </div>
                </div>

                <div className="space-y-4 max-w-xl">
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                      Primary Workspace Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="student">🎓 Student / Learner</option>
                      <option value="professional">💼 Professional / Builder</option>
                      <option value="entrepreneur">🚀 Entrepreneur / Founder</option>
                    </select>
                    <span className="text-[10px] text-slate-400 font-mono mt-1 block">Dynamically tailors your dashboard views, modules, and AI coach recommendations.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                      Task breakdown preferences (ADHD friendly)
                    </label>
                    <select 
                      value={taskPreferences}
                      onChange={(e) => setTaskPreferences(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                    >
                      <option value="Deconstruct into highly detailed 15 minute micro checklist blocks">Deconstruct into highly detailed 15 minute micro checklist blocks</option>
                      <option value="Deconstruct into standard 30 minute focus study blocks">Deconstruct into standard 30 minute focus study blocks</option>
                      <option value="Provide big conceptual roadmap blocks only">Provide big conceptual roadmap blocks only</option>
                      <option value="Break items down automatically">Break items down automatically</option>
                      {taskPreferences && !["Deconstruct into highly detailed 15 minute micro checklist blocks", "Deconstruct into standard 30 minute focus study blocks", "Provide big conceptual roadmap blocks only", "Break items down automatically"].includes(taskPreferences) && (
                        <option value={taskPreferences}>{taskPreferences}</option>
                      )}
                    </select>
                    <span className="text-[10px] text-slate-400 font-mono mt-1 block">Tuning this value changes how the Coach splits logged assignments on task creation.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                      Custom coaching tone & anxiety support needs
                    </label>
                    <textarea 
                      value={customNeeds}
                      onChange={(e) => setCustomNeeds(e.target.value)}
                      placeholder="e.g. Speak empathetically, provide heavy visual lists, reduce alarm tone, ADHD focus coaching..."
                      rows={3}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 font-mono mt-1 block">Help the reframing conversational AI align its psychological feedback.</span>
                  </div>

                  <div className="pt-4 flex flex-wrap items-center gap-3">
                    <button 
                      onClick={handleSaveSettings}
                      disabled={savingSettings}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                    >
                      {savingSettings ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Save Preferences</span>
                      )}
                    </button>
                    {settingsSaved && (
                      <span className="text-xs font-mono text-emerald-600 font-bold flex items-center gap-1 animate-pulse">
                        ✓ Preferences saved & synced!
                      </span>
                    )}
                    {settingsError && (
                      <span className="text-xs font-mono text-rose-500 font-bold">
                        ✗ Failed to save preferences.
                      </span>
                    )}
                  </div>

                </div>

              </div>
            </div>
          )}

        </main>
      </div>

      {/* 3. FLOATING VOICE ASSISTANT MODAL TRIGGER */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => {
            setVoiceOpen(!voiceOpen);
            setVoiceReply('');
            setVoiceTranscript('');
            setVoiceStatus('idle');
          }}
          className="w-13 h-13 rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all"
          title="Rescue AI Voice Companion"
        >
          <Mic className="w-6 h-6 animate-pulse" />
        </button>
      </div>

      {/* Floating Voice Companion Drawer Interface */}
      {voiceOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col p-5 space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900 font-mono">RESCUE AI VOICE COMPANION</h3>
                  <p className="text-[9px] text-slate-400 font-mono">Real-time coaching & de-stress assist</p>
                </div>
              </div>
              <button 
                onClick={() => setVoiceOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-mono font-bold"
              >
                CLOSE
              </button>
            </div>

            {/* Simulated verbal display */}
            <div className="h-44 bg-slate-50 rounded-xl border border-slate-200/50 p-3.5 flex flex-col justify-between">
              
              {voiceStatus === 'idle' && (
                <div className="text-center py-10 text-slate-400 text-xs font-mono">
                  Press one of the voice command suggestions below to speak with the coach!
                </div>
              )}

              {voiceStatus === 'listening' && (
                <div className="space-y-2 text-center py-8 text-xs font-mono">
                  <span className="text-indigo-600 font-bold animate-pulse block">🎙️ Listening to your query...</span>
                  <p className="text-slate-500 italic">"{voiceTranscript}"</p>
                </div>
              )}

              {voiceStatus === 'processing' && (
                <div className="text-center py-12 text-xs font-mono text-slate-500">
                  <div className="pulse-dot bg-indigo-500 mx-auto mb-2" />
                  <span>Coach parsing syllabus & deadlines context...</span>
                </div>
              )}

              {voiceStatus === 'speaking' && (
                <div className="space-y-2.5 text-xs overflow-y-auto max-h-[140px] pr-1">
                  <div className="flex items-center gap-1.5 text-indigo-600 font-bold font-mono text-[9px]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>COACH DE-STRESS RECOMMENDATION</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed font-medium">
                    "{voiceReply}"
                  </p>
                </div>
              )}

              {/* Animated visual wave equalizer */}
              <div className="flex justify-center items-center gap-1 pt-2.5">
                {[...Array(6)].map((_, i) => (
                  <span 
                    key={i} 
                    className={`w-1 bg-indigo-600 rounded-full transition-all duration-300 ${
                      voiceStatus === 'listening' 
                        ? 'h-6 animate-bounce' 
                        : voiceStatus === 'speaking' 
                          ? 'h-4.5 animate-pulse' 
                          : 'h-1.5'
                    }`}
                    style={{ animationDelay: `${i * 120}ms` }}
                  />
                ))}
              </div>
            </div>

            {/* Quick voice suggestion questions */}
            <div className="space-y-2">
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-bold">Or tap suggested prompt:</span>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { label: "🎙️ Help me start UI Design now", prompt: "I need to start on UI Design, but my procrastination energy is high." },
                  { label: "🎙️ Plan my day around CS50", prompt: "How should I structure my chronological schedule blocks today?" },
                  { label: "🎙️ I feel too tired and anxious to code", prompt: "I have low energy and heavy exam anxiety. Refraction recommendation needed." }
                ].map((cmd, i) => (
                  <button
                    key={i}
                    onClick={() => triggerVoiceCommand(cmd.prompt)}
                    className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200/50 hover:border-indigo-200 rounded-xl text-xs font-mono text-slate-600 transition-all"
                  >
                    {cmd.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkle className="w-5 h-5 text-indigo-600 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Edit Task Assignment</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Refine delivery details & urgency profile</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingTask(null)}
                className="text-xs text-slate-400 hover:text-slate-600 font-mono font-bold"
              >
                CLOSE
              </button>
            </div>

            {/* AI suggestion panel in edit too! */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 font-display">
                <Sparkle className="w-4 h-4 text-indigo-600 animate-pulse" />
                <span>AI Suggestion Enhancer</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Let AI automatically update description, category, and estimate hours based on your prompt text.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter a revised topic or title..."
                  value={editPromptText}
                  onChange={(e) => setEditPromptText(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleGetAIEditSuggestions}
                  disabled={editAiLoading || !editPromptText.trim()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {editAiLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkle className="w-3.5 h-3.5" />
                  )}
                  <span>Re-draft with AI</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveEditedTask} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Title / Deliverable</label>
                  <input 
                    type="text" 
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Category</label>
                  <select 
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Study">Study / Academics</option>
                    <option value="Work">Professional / Work</option>
                    <option value="Finance">Finance / Bills</option>
                    <option value="Personal">Personal Routine</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Exact Deadline Date & Time</label>
                  <input 
                    type="datetime-local" 
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Estimated Hours Required</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="40" 
                    value={editHours}
                    onChange={(e) => setEditHours(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-500 mb-1">Description / Notes</label>
                <textarea 
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button 
                  type="button" 
                  onClick={() => setEditingTask(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-xs font-mono hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={savingEditedTask}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5"
                >
                  {savingEditedTask ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
