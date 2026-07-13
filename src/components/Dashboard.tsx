import React, { useState } from 'react';
import { StudentProfile, ParsedTimetable, AISchedule, Exam, Assignment, Task, ScheduleItem } from '../types';
import { Calendar, CheckCircle2, Clock, Play, Sparkles, BookOpen, ChevronRight, Compass, RefreshCw, Plus, Check, Trash2, ArrowUpRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  profile: StudentProfile;
  timetable: ParsedTimetable | null;
  currentSchedule: AISchedule | null;
  exams: Exam[];
  assignments: Assignment[];
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onGenerateSchedule: () => Promise<void>;
  isGenerating: boolean;
  onEnterFocusMode: () => void;
}

export default function Dashboard({
  profile,
  timetable,
  currentSchedule,
  exams,
  assignments,
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onGenerateSchedule,
  isGenerating,
  onEnterFocusMode
}: DashboardProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [newTaskSubject, setNewTaskSubject] = useState('');

  const [activeTimelineFilter, setActiveTimelineFilter] = useState<'all' | 'study' | 'institution'>('all');

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask({
      id: Math.random().toString(36).substr(2, 9),
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
      completed: false,
      subject: newTaskSubject.trim() || undefined,
      dueDate: new Date().toISOString().split('T')[0]
    });
    setNewTaskTitle('');
    setNewTaskSubject('');
  };

  // Find current and upcoming slots
  const getCurrentAndNextLectures = () => {
    if (!timetable || timetable.timeSlots.length === 0) return { current: null, next: null };
    const now = new Date();
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const todayDay = now.toLocaleDateString('default', { weekday: 'long' });

    const todaySlots = timetable.timeSlots
      .filter(s => s.days.includes(todayDay))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    let current: any = null;
    let next: any = null;

    for (let i = 0; i < todaySlots.length; i++) {
      const slot = todaySlots[i];
      if (currentTimeStr >= slot.startTime && currentTimeStr <= slot.endTime) {
        current = slot;
        next = todaySlots[i + 1] || null;
        break;
      } else if (slot.startTime > currentTimeStr) {
        next = slot;
        break;
      }
    }

    return { current, next };
  };

  const { current: currentLecture, next: nextLecture } = getCurrentAndNextLectures();

  // Filter timeline slots
  const filteredTimeline = currentSchedule?.timeline.filter(item => {
    if (activeTimelineFilter === 'all') return true;
    if (activeTimelineFilter === 'study') return item.type === 'study' || item.type === 'revision' || item.type === 'homework';
    if (activeTimelineFilter === 'institution') return item.type === 'school_college';
    return true;
  }) || [];

  // Motivation quotes
  const quotes = [
    "Focus on progress, not perfection.",
    "Your future self will thank you for studying today.",
    "Small steps every single day add up to massive results.",
    "The secret of getting ahead is getting started.",
    "Concentrate all your thoughts upon the work at hand."
  ];
  const dailyQuote = quotes[new Date().getDate() % quotes.length];

  // Helper to get timing type colors
  const getTimelineTypeBadge = (type: string) => {
    switch (type) {
      case 'study': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'school_college': return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      case 'revision': return 'bg-violet-500/10 text-violet-400 border border-violet-500/20';
      case 'homework': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'break': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'sleep': return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
      default: return 'bg-slate-900 text-slate-400 border border-slate-800';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6">
      {/* Left 2 Columns: Main Daily Schedule Cockpit */}
      <div className="lg:col-span-2 space-y-6">
        {/* Status ticker block */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-slate-850/80 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 font-mono">Today's Focus Outlook</span>
            </div>
            <h2 className="text-lg font-display font-semibold text-white flex items-center gap-2">
              {profile.studentName ? `Hello, ${profile.studentName}` : 'Welcome Back'}
              {profile.role && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold capitalize tracking-tight font-mono">
                  {profile.role === 'other' ? 'Learner' : profile.role}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-450 italic">"{dailyQuote}"</p>
          </div>

          <div className="flex gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={onGenerateSchedule}
              disabled={isGenerating || !timetable}
              className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition flex items-center justify-center gap-1.5"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Smart Rebalance Planner
                </>
              )}
            </button>

            <button
              onClick={onEnterFocusMode}
              className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Focus Mode
            </button>
          </div>
        </div>

        {/* Current Lecture & Next Lecture Row */}
        {timetable && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Current Class */}
            <div className="glass-panel-dark rounded-xl p-4 border border-slate-850">
              <div className="flex justify-between items-center text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-2 font-mono">
                <span>Happening Now</span>
                <Clock className="w-3 h-3" />
              </div>
              {currentLecture ? (
                <div>
                  <h4 className="text-sm font-semibold text-white">{currentLecture.subject}</h4>
                  <div className="flex gap-2 text-[10px] text-slate-450 mt-1 font-mono uppercase">
                    <span>{currentLecture.startTime} - {currentLecture.endTime}</span>
                    {currentLecture.room && <span>• {currentLecture.room}</span>}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No school or college class currently scheduled.</p>
              )}
            </div>

            {/* Next Class */}
            <div className="glass-panel-dark rounded-xl p-4 border border-slate-850">
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 font-mono">
                <span>Coming Up Next</span>
                <ChevronRight className="w-3 h-3 text-slate-400" />
              </div>
              {nextLecture ? (
                <div>
                  <h4 className="text-sm font-semibold text-white">{nextLecture.subject}</h4>
                  <div className="flex gap-2 text-[10px] text-slate-450 mt-1 font-mono uppercase">
                    <span>{nextLecture.startTime} - {nextLecture.endTime}</span>
                    {nextLecture.room && <span>• {nextLecture.room}</span>}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 font-mono text-slate-605">Clear schedule ahead.</p>
              )}
            </div>
          </div>
        )}

        {/* Vertical Optimized Timetable list */}
        <div className="glass-panel-dark rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-800 pb-3 gap-2">
            <div>
              <h3 className="text-sm font-semibold text-white">Daily Optimized Schedule</h3>
              <p className="text-[10px] text-slate-450 mt-0.5">Optimized balancing self-study, homework, exams, and proper rest cycles.</p>
            </div>

            {/* Filtering chips */}
            {currentSchedule && (
              <div className="flex bg-slate-900 border border-slate-850 p-1 rounded-lg">
                {(['all', 'study', 'institution'] as const).map(flt => (
                  <button
                    key={flt}
                    onClick={() => setActiveTimelineFilter(flt)}
                    className={`px-2 py-1 rounded text-[10px] font-mono capitalize transition ${
                      activeTimelineFilter === flt ? 'bg-indigo-600 text-white font-medium' : 'text-slate-500 hover:text-slate-350'
                    }`}
                  >
                    {flt === 'institution' ? 'Classes' : flt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {currentSchedule ? (
            <div className="relative border-l-2 border-slate-850/80 pl-5 space-y-5 py-2 max-h-[480px] overflow-y-auto scrollbar-thin">
              {filteredTimeline.map((item, index) => (
                <div key={item.id || `timeline-item-${item.startTime}-${item.endTime}-${index}`} className="relative group">
                  {/* Circle Indicator */}
                  <span className={`absolute -left-[27px] top-1 w-3 h-3 rounded-full border-2 border-slate-950 transition ${
                    item.type === 'study' || item.type === 'revision' ? 'bg-indigo-500' :
                    item.type === 'school_college' ? 'bg-sky-500' :
                    item.type === 'break' ? 'bg-emerald-500' : 'bg-slate-700'
                  }`} />

                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{item.label}</span>
                        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-md ${getTimelineTypeBadge(item.type)}`}>
                          {item.type}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed max-w-md">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0">
                      {item.startTime} - {item.endTime}
                    </span>
                  </div>
                </div>
              ))}
              {filteredTimeline.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-500">
                  No slots match your active filter.
                </div>
              )}
            </div>
          ) : (
            /* Empty state asking to parse timetable and generate daily plan */
            <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-xl space-y-3">
              <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center mx-auto">
                <Compass className="w-5 h-5 animate-spin" />
              </div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">No Daily Plan Generated Yet</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Once you finish uploading your timetable and setting up your goals, click the button above to generate a customized, optimized day plan.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Smart Interactive Todo list */}
      <div className="space-y-4">
        {/* Metric panel */}
        {currentSchedule && (
          <div className="glass-panel-dark rounded-2xl p-5 border border-slate-800/80 shadow-xl space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              Focus Strategy Report
            </h4>
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs text-slate-450 mb-1">
                  <span>Daily Goal Net Focus</span>
                  <span className="font-mono text-indigo-400 font-bold">{profile.dailyGoalHours}h target</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '40%' }} />
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider font-mono">Suggested focus blocks</div>
                <p className="text-xs text-slate-450 mt-1 leading-relaxed">
                  {currentSchedule.focusPlan}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        {currentSchedule && currentSchedule.recommendations.length > 0 && (
          <div className="glass-panel-dark rounded-2xl p-5 border border-slate-800/80 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5 font-mono">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Tailored Study Recommendations
            </h3>
            <ul className="space-y-2">
              {currentSchedule.recommendations.slice(0, 3).map((rec, i) => (
                <li key={i} className="text-xs text-slate-400 flex items-start gap-2 leading-relaxed">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Task Checklist Panel */}
        <div className="glass-panel-dark rounded-2xl p-5 border border-slate-800/80 shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-850 pb-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="text-emerald-400 w-4 h-4" />
              {profile.role === 'teacher' ? 'Smart Prep & Grading Tasks' :
               profile.role === 'parent' ? 'Smart Support & Activities' :
               profile.role === 'other' ? 'Smart Focused Tasks' : 'Smart Study Todo List'}
            </h3>
            <span className="bg-slate-900 text-slate-400 font-mono text-[10px] px-2 py-0.5 rounded-full">
              {tasks.filter(t => t.completed).length}/{tasks.length}
            </span>
          </div>

          {/* Quick task form */}
          <form onSubmit={handleAddTaskSubmit} className="flex gap-1.5">
            <input
              type="text"
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              placeholder="Add micro-task for today..."
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 rounded-xl transition text-xs font-semibold shrink-0"
            >
              Add
            </button>
          </form>

          {/* Tasks List */}
          <div className="space-y-2 max-h-[280px] overflow-y-auto scrollbar-thin">
            {tasks.map(task => (
              <div
                key={task.id}
                className="group flex items-center justify-between bg-slate-900/40 hover:bg-slate-900/70 border border-slate-850/60 rounded-xl p-2.5 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className="text-slate-500 hover:text-indigo-400 transition shrink-0"
                  >
                    <div className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition ${
                      task.completed ? 'bg-indigo-500 border-indigo-500' : 'border-slate-800'
                    }`}>
                      {task.completed && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                    </div>
                  </button>
                  <div className="min-w-0">
                    <span className={`text-xs block truncate ${
                      task.completed ? 'line-through text-slate-500' : 'text-slate-200'
                    }`}>
                      {task.title}
                    </span>
                    {task.subject && (
                      <span className="text-[9px] text-indigo-400/80 uppercase font-mono tracking-wider">
                        {task.subject}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded ${
                    task.priority === 'critical' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                    task.priority === 'high' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-slate-900 text-slate-500'
                  }`}>
                    {task.priority}
                  </span>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="text-slate-500 hover:text-rose-400 transition opacity-0 group-hover:opacity-100"
                    title="Delete Task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {tasks.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                No tasks for today yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
