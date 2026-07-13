import React, { useState, useEffect } from 'react';
import { StudentProfile, ParsedTimetable, AISchedule, Exam, Assignment, Task, FocusSession } from './types';
import Onboarding from './components/Onboarding';
import TimetableUpload from './components/TimetableUpload';
import { cleanErrorMessage } from './utils/errors';
import Dashboard from './components/Dashboard';
import FocusMode from './components/FocusMode';
import CalendarView from './components/CalendarView';
import Analytics from './components/Analytics';
import ExportSchedule from './components/ExportSchedule';
import AiChat from './components/AiChat';
import { Calendar, CheckCircle2, Clock, Sparkles, BookOpen, Settings, BarChart4, Flame, Trash2, Sliders, ChevronRight, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'dashboard' | 'timetable' | 'focus' | 'calendar' | 'analytics' | 'export' | 'chat';
type Theme = 'glass' | 'dark' | 'light' | 'cyberpunk' | 'amoled' | 'ocean' | 'forest' | 'sunset' | 'apple';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [activeTheme, setActiveTheme] = useState<Theme>('glass');

  // Persistence State
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [timetable, setTimetable] = useState<ParsedTimetable | null>(null);
  const [aiTimetable, setAiTimetable] = useState<ParsedTimetable | null>(null);
  const [scheduleHistory, setScheduleHistory] = useState<Record<string, AISchedule>>({}); // Key: date string (YYYY-MM-DD)
  const [exams, setExams] = useState<Exam[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessionsHistory, setSessionsHistory] = useState<FocusSession[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Initialize and load from LocalStorage
  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem('ai_study_profile');
      if (storedProfile) setProfile(JSON.parse(storedProfile));

      const storedTimetable = localStorage.getItem('ai_study_timetable');
      if (storedTimetable) setTimetable(JSON.parse(storedTimetable));

      const storedAiTimetable = localStorage.getItem('ai_study_7day_timetable');
      if (storedAiTimetable) setAiTimetable(JSON.parse(storedAiTimetable));

      const storedHistory = localStorage.getItem('ai_study_schedules');
      if (storedHistory) setScheduleHistory(JSON.parse(storedHistory));

      const storedExams = localStorage.getItem('ai_study_exams');
      if (storedExams) setExams(JSON.parse(storedExams));

      const storedAssignments = localStorage.getItem('ai_study_assignments');
      if (storedAssignments) setAssignments(JSON.parse(storedAssignments));

      const storedTasks = localStorage.getItem('ai_study_tasks');
      if (storedTasks) setTasks(JSON.parse(storedTasks));

      const storedSessions = localStorage.getItem('ai_study_sessions');
      if (storedSessions) setSessionsHistory(JSON.parse(storedSessions));

      const storedTheme = localStorage.getItem('ai_study_theme');
      if (storedTheme) setActiveTheme(storedTheme as Theme);
    } catch (e) {
      console.error('Error loading stored data:', e);
    }
  }, []);

  // Sync state functions that update local storage
  const handleUpdateProfile = (newProfile: StudentProfile) => {
    setProfile(newProfile);
    localStorage.setItem('ai_study_profile', JSON.stringify(newProfile));
    setShowProfileModal(false);
  };

  const handleUpdateTimetable = (newTimetable: ParsedTimetable | null) => {
    setTimetable(newTimetable);
    if (newTimetable) {
      localStorage.setItem('ai_study_timetable', JSON.stringify(newTimetable));
    } else {
      localStorage.removeItem('ai_study_timetable');
    }
  };

  const handleUpdateAiTimetable = (newTimetable: ParsedTimetable | null) => {
    setAiTimetable(newTimetable);
    if (newTimetable) {
      localStorage.setItem('ai_study_7day_timetable', JSON.stringify(newTimetable));
    } else {
      localStorage.removeItem('ai_study_7day_timetable');
    }
  };

  const handleAddExam = (exam: Exam) => {
    const updated = [...exams, exam];
    setExams(updated);
    localStorage.setItem('ai_study_exams', JSON.stringify(updated));
  };

  const handleAddAssignment = (assignment: Assignment) => {
    const updated = [...assignments, assignment];
    setAssignments(updated);
    localStorage.setItem('ai_study_assignments', JSON.stringify(updated));
  };

  const handleToggleAssignment = (id: string) => {
    const updated = assignments.map(a => a.id === id ? { ...a, completed: !a.completed } : a);
    setAssignments(updated);
    localStorage.setItem('ai_study_assignments', JSON.stringify(updated));
  };

  const handleAddTask = (task: Task) => {
    const updated = [...tasks, task];
    setTasks(updated);
    localStorage.setItem('ai_study_tasks', JSON.stringify(updated));
  };

  const handleToggleTask = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(updated);
    localStorage.setItem('ai_study_tasks', JSON.stringify(updated));
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    localStorage.setItem('ai_study_tasks', JSON.stringify(updated));
  };

  const handleAddFocusSession = (session: FocusSession) => {
    const updated = [...sessionsHistory, session];
    setSessionsHistory(updated);
    localStorage.setItem('ai_study_sessions', JSON.stringify(updated));
  };

  const handleThemeChange = (theme: Theme) => {
    setActiveTheme(theme);
    localStorage.setItem('ai_study_theme', theme);
  };

  const handleResetAllData = () => {
    setProfile(null);
    setTimetable(null);
    setScheduleHistory({});
    setExams([]);
    setAssignments([]);
    setTasks([]);
    setSessionsHistory([]);
    setActiveTab('dashboard');

    localStorage.removeItem('ai_study_profile');
    localStorage.removeItem('ai_study_timetable');
    localStorage.removeItem('ai_study_schedules');
    localStorage.removeItem('ai_study_exams');
    localStorage.removeItem('ai_study_assignments');
    localStorage.removeItem('ai_study_tasks');
    localStorage.removeItem('ai_study_sessions');
    
    setShowProfileModal(false);
  };

  // Generate customized daily schedule using server-side Gemini API
  const handleGenerateDailySchedule = async () => {
    if (!profile || !timetable) return;
    setIsGenerating(true);
    try {
      const now = new Date();
      const currentDateStr = now.toISOString().split('T')[0];
      const currentDayName = now.toLocaleDateString('default', { weekday: 'long' });

      const res = await fetch('/api/schedule/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(localStorage.getItem('user_gemini_api_key') ? { 'x-gemini-api-key': localStorage.getItem('user_gemini_api_key') || '' } : {})
        },
        body: JSON.stringify({
          profile,
          timetable,
          exams: exams.filter(e => e.date >= currentDateStr), // only pass current/upcoming
          assignments: assignments.filter(a => !a.completed),
          tasks: tasks.filter(t => !t.completed),
          dayOfWeek: currentDayName,
          currentDate: currentDateStr
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Server returned an error generating schedule');
      }

      const generated: AISchedule = await res.json();

      // Ensure all timeline items have unique IDs conforming to ScheduleItem
      if (generated && generated.timeline) {
        generated.timeline = generated.timeline.map((item, idx) => ({
          ...item,
          id: item.id || `schedule-item-${idx}-${Math.random().toString(36).substr(2, 9)}`
        }));
      }

      const updatedHistory = {
        ...scheduleHistory,
        [currentDateStr]: generated
      };
      setScheduleHistory(updatedHistory);
      localStorage.setItem('ai_study_schedules', JSON.stringify(updatedHistory));

      // Append smart AI tasks to todo list automatically
      if (generated.smartTodos && generated.smartTodos.length > 0) {
        const newAiTasks = generated.smartTodos.map(todoText => ({
          id: Math.random().toString(36).substr(2, 9),
          title: todoText,
          priority: 'medium' as const,
          completed: false,
          isAiGenerated: true,
          dueDate: currentDateStr
        }));
        const updatedTasks = [...tasks, ...newAiTasks];
        setTasks(updatedTasks);
        localStorage.setItem('ai_study_tasks', JSON.stringify(updatedTasks));
      }

    } catch (error: any) {
      console.error('Error generating daily study timetable:', error);
      alert(cleanErrorMessage(error?.message || 'An error occurred during schedule optimization. Please check your network and settings.'));
    } finally {
      setIsGenerating(false);
    }
  };

  const todayDateStr = new Date().toISOString().split('T')[0];
  const todaySchedule = scheduleHistory[todayDateStr] || null;

  // Extract list of subjects from timetable to supply Focus Targets
  const getSubjectsList = (): string[] => {
    if (!timetable) return [];
    return Array.from(new Set(timetable.timeSlots.map(s => s.subject)));
  };

  const subjects = getSubjectsList();

  // Theme styling definitions for overall site container
  const getThemeBackground = () => {
    switch (activeTheme) {
      case 'glass': return 'bg-gradient-to-tr from-slate-950 via-indigo-950/40 to-slate-950 text-slate-100 min-h-screen';
      case 'dark': return 'bg-slate-900 text-slate-100 min-h-screen';
      case 'light': return 'bg-slate-50 text-slate-900 min-h-screen light';
      case 'cyberpunk': return 'bg-zinc-950 text-yellow-400 min-h-screen';
      case 'amoled': return 'bg-black text-white min-h-screen';
      case 'ocean': return 'bg-gradient-to-tr from-sky-950 via-slate-950 to-slate-950 text-sky-100 min-h-screen';
      case 'forest': return 'bg-gradient-to-b from-emerald-950 via-slate-950 to-slate-950 text-emerald-100 min-h-screen';
      case 'sunset': return 'bg-gradient-to-b from-orange-950/20 via-slate-950 to-slate-950 text-slate-100 min-h-screen';
      case 'apple': return 'bg-white text-slate-800 min-h-screen light';
      default: return 'bg-slate-950 text-slate-100 min-h-screen';
    }
  };

  // If user is not yet onboarded, show onboarding page
  if (!profile || !profile.isOnboarded) {
    return (
      <div className="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4">
        <Onboarding onComplete={handleUpdateProfile} activeTheme={activeTheme} />
      </div>
    );
  }

  return (
    <div className={getThemeBackground()}>
      {/* Immersive subtle moving ambient light for glassmorphism */}
      {activeTheme === 'glass' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] pulse-bg" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] pulse-bg" />
        </div>
      )}

      {/* Main navigation header */}
      <header className="sticky top-0 z-40 bg-slate-950/60 backdrop-blur-md border-b border-slate-900/80 px-4 py-3.5 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/15 border border-indigo-400/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-md font-display font-bold tracking-tight text-white flex items-center gap-1.5">
                Smart Study Planner
              </h1>
              <p className="text-[10px] text-slate-400 font-medium font-mono uppercase tracking-wider">Your Personal Assistant</p>
            </div>
          </div>

          {/* Quick tab nav anchors */}
          <nav className="flex items-center gap-1 bg-slate-900/90 border border-slate-850 p-1 rounded-xl">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Clock },
              { id: 'chat', label: 'Academic Chat', icon: MessageSquare },
              { id: 'timetable', label: 'Timetable', icon: BookOpen },
              { id: 'focus', label: 'Focus mode', icon: Flame },
              { id: 'calendar', label: 'Calendar', icon: Calendar },
              { id: 'analytics', label: 'Analytics', icon: BarChart4 },
              { id: 'export', label: 'Export', icon: Settings }
            ].map(anchor => (
              <button
                key={anchor.id}
                onClick={() => setActiveTab(anchor.id as Tab)}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold tracking-tight transition ${
                  activeTab === anchor.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <anchor.icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">{anchor.label}</span>
              </button>
            ))}
          </nav>

          {/* Right section: theme triggers & profile config toggle */}
          <div className="flex items-center gap-2">
            {/* Theme switcher list */}
            <div className="relative group">
              <button className="p-2 bg-slate-900 border border-slate-850 text-slate-450 hover:text-white rounded-xl text-xs transition" title="Themes">
                <Sliders className="w-3.5 h-3.5" />
              </button>
              {/* Dropdown on hover */}
              <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block bg-slate-900 border border-slate-850 p-1.5 rounded-xl shadow-2xl w-32 space-y-1">
                {(['glass', 'dark', 'light', 'cyberpunk', 'amoled', 'sunset', 'forest', 'ocean'] as const).map(th => (
                  <button
                    key={th}
                    onClick={() => handleThemeChange(th)}
                    className="w-full text-left px-2 py-1 text-[10px] font-medium capitalize rounded hover:bg-indigo-600/10 hover:text-indigo-400 text-slate-400"
                  >
                    {th}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowProfileModal(true)}
              className="p-2 bg-slate-900 border border-slate-850 text-slate-400 hover:text-white rounded-xl transition"
              title="Edit Profile"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Primary body component display area */}
      <main className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Dashboard
                profile={profile}
                timetable={timetable}
                currentSchedule={todaySchedule}
                exams={exams}
                assignments={assignments}
                tasks={tasks}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
                onGenerateSchedule={handleGenerateDailySchedule}
                isGenerating={isGenerating}
                onEnterFocusMode={() => setActiveTab('focus')}
              />
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <AiChat
                profile={profile}
                timetable={timetable}
                aiTimetable={aiTimetable}
                exams={exams}
                assignments={assignments}
                tasks={tasks}
              />
            </motion.div>
          )}

          {activeTab === 'timetable' && (
            <motion.div
              key="timetable"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TimetableUpload
                onParsed={handleUpdateTimetable}
                initialTimetable={timetable || undefined}
                aiTimetable={aiTimetable || undefined}
                onAiTimetableUpdate={handleUpdateAiTimetable}
                profile={profile}
              />
            </motion.div>
          )}

          {activeTab === 'focus' && (
            <motion.div
              key="focus"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <FocusMode subjects={subjects.length > 0 ? subjects : ['General Study']} onSessionComplete={handleAddFocusSession} />
            </motion.div>
          )}

          {activeTab === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <CalendarView
                exams={exams}
                assignments={assignments}
                timeSlots={timetable?.timeSlots || []}
                onAddExam={handleAddExam}
                onAddAssignment={handleAddAssignment}
                onToggleAssignment={handleToggleAssignment}
                activeTheme={activeTheme}
              />
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Analytics sessions={sessionsHistory} tasks={tasks} dailyGoalHours={profile.dailyGoalHours} />
            </motion.div>
          )}

          {activeTab === 'export' && (
            <motion.div
              key="export"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {timetable || aiTimetable ? (
                <ExportSchedule 
                  timetable={timetable || undefined} 
                  aiTimetable={aiTimetable || undefined} 
                  onClearInstitutional={() => handleUpdateTimetable(null)}
                  onClearAi={() => handleUpdateAiTimetable(null)}
                />
              ) : (
                <div className="text-center py-20 bg-slate-900/40 border border-dashed border-slate-850 rounded-2xl max-w-xl mx-auto space-y-4">
                  <BookOpen className="w-10 h-10 text-indigo-400 mx-auto animate-pulse" />
                  <h3 className="text-sm font-semibold text-white">No Timetable Uploaded or Generated</h3>
                  <p className="text-xs text-slate-450 max-w-xs mx-auto">Please upload your timetable or generate a 7-day study timetable in the Timetable tab before accessing design exports.</p>
                  <button
                    onClick={() => setActiveTab('timetable')}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-xl transition font-semibold"
                  >
                    Go to Timetable Setup
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Editing profile Modal setup */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-slate-850 rounded-2xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white text-lg font-bold"
              >
                ×
              </button>
              <Onboarding 
                onComplete={handleUpdateProfile} 
                initialProfile={profile} 
                onResetAllData={handleResetAllData}
                activeTheme={activeTheme}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
