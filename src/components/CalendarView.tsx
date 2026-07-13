import React, { useState } from 'react';
import { Exam, Assignment, TimeSlot } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, AlertCircle, Plus, CheckCircle2, Bookmark } from 'lucide-react';
import { motion } from 'motion/react';

interface CalendarViewProps {
  exams: Exam[];
  assignments: Assignment[];
  timeSlots: TimeSlot[];
  onAddExam: (exam: Exam) => void;
  onAddAssignment: (assignment: Assignment) => void;
  onToggleAssignment: (id: string) => void;
  activeTheme?: string;
}

export default function CalendarView({
  exams,
  assignments,
  timeSlots,
  onAddExam,
  onAddAssignment,
  onToggleAssignment,
  activeTheme
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [view, setView] = useState<'month' | 'agenda'>('month');

  // Dialog states for fast additions
  const [showExamForm, setShowExamForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);

  // New item inputs
  const [newExam, setNewExam] = useState<Partial<Exam>>({
    subject: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    priority: 'high'
  });

  const [newAssignment, setNewAssignment] = useState<Partial<Assignment>>({
    title: '',
    subject: '',
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'medium'
  });

  const isLightTheme = activeTheme === 'light' || activeTheme === 'apple';

  // Master Priority Colors Adapter for Theme Consistency
  const getPriorityColors = (priority: string, isLight: boolean) => {
    switch (priority) {
      case 'critical':
        return isLight
          ? {
              badge: 'bg-red-100 border border-red-200 text-red-700 font-semibold',
              dot: 'bg-red-500',
              text: 'text-red-700',
              card: 'bg-red-50/70 border border-red-100 text-red-950',
            }
          : {
              badge: 'bg-rose-500/25 border border-rose-500/40 text-rose-300 font-semibold',
              dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
              text: 'text-rose-400',
              card: 'bg-rose-950/20 border border-rose-900/40 text-rose-200',
            };
      case 'high':
        return isLight
          ? {
              badge: 'bg-amber-100 border border-amber-200 text-amber-800 font-semibold',
              dot: 'bg-amber-500',
              text: 'text-amber-800',
              card: 'bg-amber-50/70 border border-amber-100 text-amber-950',
            }
          : {
              badge: 'bg-amber-500/25 border border-amber-500/40 text-amber-300 font-semibold',
              dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
              text: 'text-amber-400',
              card: 'bg-amber-950/20 border border-amber-900/40 text-amber-200',
            };
      case 'medium':
        return isLight
          ? {
              badge: 'bg-indigo-100 border border-indigo-200 text-indigo-700 font-semibold',
              dot: 'bg-indigo-500',
              text: 'text-indigo-700',
              card: 'bg-indigo-50/70 border border-indigo-100 text-indigo-950',
            }
          : {
              badge: 'bg-indigo-500/25 border border-indigo-500/40 text-indigo-300 font-semibold',
              dot: 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]',
              text: 'text-indigo-400',
              card: 'bg-indigo-950/20 border border-indigo-900/40 text-indigo-200',
            };
      case 'low':
      default:
        return isLight
          ? {
              badge: 'bg-emerald-100 border border-emerald-200 text-emerald-800 font-semibold',
              dot: 'bg-emerald-500',
              text: 'text-emerald-800',
              card: 'bg-emerald-50/70 border border-emerald-100 text-emerald-950',
            }
          : {
              badge: 'bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-semibold',
              dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
              text: 'text-emerald-400',
              card: 'bg-emerald-950/20 border border-emerald-900/40 text-emerald-200',
            };
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: Date[] = [];

    // Pad starting day of week
    const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Align to Mon
    for (let i = startDayOfWeek; i > 0; i--) {
      days.push(new Date(year, month, 1 - i));
    }

    // Add actual days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    // Pad remaining end days to form full grid (rows of 7)
    const totalSlots = 42;
    const remaining = totalSlots - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const isSameDay = (d1: Date, d2String: string): boolean => {
    const d2 = new Date(d2String);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const handleAddExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExam.subject || !newExam.date) return;
    onAddExam({
      id: Math.random().toString(36).substr(2, 9),
      subject: newExam.subject,
      date: newExam.date,
      description: newExam.description || '',
      priority: newExam.priority || 'high'
    });
    setNewExam({
      subject: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      priority: 'high'
    });
    setShowExamForm(false);
  };

  const handleAddAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.title || !newAssignment.subject || !newAssignment.dueDate) return;
    onAddAssignment({
      id: Math.random().toString(36).substr(2, 9),
      title: newAssignment.title,
      subject: newAssignment.subject,
      dueDate: newAssignment.dueDate,
      priority: newAssignment.priority || 'medium',
      completed: false
    });
    setNewAssignment({
      title: '',
      subject: '',
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'medium'
    });
    setShowAssignmentForm(false);
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6">
      {/* Left 2 Columns: Main Calendar Grid */}
      <div className="lg:col-span-2 glass-panel-dark rounded-2xl p-6 shadow-xl">
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 mb-4 gap-4 ${isLightTheme ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className="flex items-center gap-2">
            <CalendarIcon className="text-indigo-400 w-5 h-5" />
            <h2 className={`text-xl font-display font-semibold ${isLightTheme ? 'text-slate-800' : 'text-white'}`}>{monthName}</h2>
          </div>

          <div className="flex items-center gap-3">
            {/* View selectors */}
            <div className={`flex border p-1 rounded-xl ${isLightTheme ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-850'}`}>
              <button
                onClick={() => setView('month')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  view === 'month'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isLightTheme
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Month Grid
              </button>
              <button
                onClick={() => setView('agenda')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  view === 'agenda'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isLightTheme
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Agenda List
              </button>
            </div>

            {/* Navigation buttons */}
            {view === 'month' && (
              <div className="flex gap-1">
                <button
                  onClick={handlePrevMonth}
                  className={`p-1.5 rounded-lg border transition ${
                    isLightTheme
                      ? 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-950 border-slate-200'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-450 hover:text-white border-slate-850'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className={`p-1.5 rounded-lg border transition ${
                    isLightTheme
                      ? 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-950 border-slate-200'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-450 hover:text-white border-slate-850'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {view === 'month' ? (
          <div>
            {/* Weekday headers */}
            <div className={`grid grid-cols-7 gap-1 text-center mb-1.5 text-[10px] uppercase tracking-wider font-semibold font-mono ${isLightTheme ? 'text-slate-500' : 'text-slate-500'}`}>
              {weekdays.map(d => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, idx) => {
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const isToday = isSameDay(day, new Date().toISOString());

                // Find exams and assignments for this day
                const dayExams = exams.filter(e => isSameDay(day, e.date));
                const dayAssignments = assignments.filter(a => isSameDay(day, a.dueDate));
                const totalWorkload = dayExams.length + dayAssignments.length;

                // Color Intensity level mapping (Heatmap style) adapted to priority colors and theme
                let heatColor = isLightTheme
                  ? 'bg-white/40 hover:bg-slate-50 border-slate-200 text-slate-800'
                  : 'hover:bg-slate-900/40 border-slate-850/50 text-slate-300';

                if (totalWorkload > 0) {
                  const hasCriticalOrHigh = dayExams.some(e => e.priority === 'critical' || e.priority === 'high') || 
                                            dayAssignments.some(a => a.priority === 'critical' || a.priority === 'high');
                  const hasMedium = dayExams.some(e => e.priority === 'medium') || 
                                    dayAssignments.some(a => a.priority === 'medium');

                  if (hasCriticalOrHigh) {
                    heatColor = isLightTheme
                      ? 'bg-rose-50/50 border-rose-200 text-rose-900 hover:bg-rose-100/50'
                      : 'bg-rose-500/10 border-rose-500/25 text-rose-400 hover:bg-rose-500/15';
                  } else if (hasMedium) {
                    heatColor = isLightTheme
                      ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900 hover:bg-indigo-100/50'
                      : 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400 hover:bg-indigo-500/15';
                  } else {
                    heatColor = isLightTheme
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900 hover:bg-emerald-100/50'
                      : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/15';
                  }
                }

                const colIdx = idx % 7;
                const rowIdx = Math.floor(idx / 7);

                // Determine horizontal alignment of tooltip
                let tooltipAlignClass = 'left-1/2 -translate-x-1/2';
                if (colIdx < 2) {
                  tooltipAlignClass = 'left-0';
                } else if (colIdx > 4) {
                  tooltipAlignClass = 'right-0';
                }

                // Determine vertical alignment of tooltip (avoid clipping at top/bottom)
                const tooltipVerticalClass = rowIdx < 3 ? 'top-full mt-2' : 'bottom-full mb-2';

                return (
                  <div
                    key={idx}
                    className={`min-h-[64px] border rounded-xl p-1.5 flex flex-col justify-between transition relative group ${heatColor} ${
                      isCurrentMonth ? '' : 'opacity-25'
                    } ${isToday ? (isLightTheme ? 'ring-1.5 ring-indigo-500 ring-offset-white ring-offset-2' : 'ring-1.5 ring-indigo-500 ring-offset-slate-950 ring-offset-2') : ''}`}
                  >
                    <span className={`text-[10px] font-semibold font-mono ${isLightTheme ? 'text-slate-600' : 'text-slate-400'}`}>{day.getDate()}</span>

                    {/* Tiny Event badges based on Priority */}
                    <div className="mt-1 space-y-0.5">
                      {dayExams.map(ex => {
                        const colors = getPriorityColors(ex.priority, isLightTheme);
                        return (
                          <div
                            key={ex.id}
                            className={`text-[8px] px-1 py-0.5 rounded border truncate max-w-full ${colors.badge}`}
                            title={`Exam: ${ex.subject} (${ex.priority} priority)`}
                          >
                            EX: {ex.subject}
                          </div>
                        );
                      })}
                      {dayAssignments.map(asg => {
                        const colors = getPriorityColors(asg.priority, isLightTheme);
                        return (
                          <div
                            key={asg.id}
                            className={`text-[8px] px-1 py-0.5 rounded border truncate max-w-full ${colors.badge}`}
                            title={`Due: ${asg.title} (${asg.priority} priority)`}
                          >
                            HW: {asg.title}
                          </div>
                        );
                      })}
                    </div>

                    {/* Detailed Hover Tooltip */}
                    {totalWorkload > 0 && (
                      <div
                        className={`absolute ${tooltipAlignClass} ${tooltipVerticalClass} opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-200 z-50 w-72 p-4 rounded-xl shadow-2xl border text-xs leading-normal backdrop-blur-xl ${
                          isLightTheme
                            ? 'bg-white/95 text-slate-850 border-slate-200/85 shadow-slate-300/60'
                            : 'bg-slate-900/95 text-slate-100 border-slate-700/80 shadow-black/80'
                        }`}
                      >
                        <div className={`border-b pb-1.5 mb-2 flex justify-between items-center ${isLightTheme ? 'border-slate-100' : 'border-slate-800'}`}>
                          <span className="font-bold tracking-tight">
                            {day.toLocaleDateString('default', { month: 'short', day: 'numeric', weekday: 'short' })}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                            isLightTheme ? 'bg-slate-100 text-slate-650' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {totalWorkload} {totalWorkload === 1 ? 'task' : 'tasks'}
                          </span>
                        </div>

                        <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                          {dayExams.map(ex => {
                            const colors = getPriorityColors(ex.priority, isLightTheme);
                            return (
                              <div key={ex.id} className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`font-semibold ${isLightTheme ? 'text-rose-700' : 'text-rose-400'}`}>
                                    Exam: {ex.subject}
                                  </span>
                                  <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 rounded-full font-mono scale-90 ${colors.badge}`}>
                                    {ex.priority}
                                  </span>
                                </div>
                                {ex.description && (
                                  <p className={`text-[11px] leading-relaxed ${isLightTheme ? 'text-slate-600' : 'text-slate-450'}`}>
                                    {ex.description}
                                  </p>
                                )}
                              </div>
                            );
                          })}

                          {dayAssignments.map(asg => {
                            const colors = getPriorityColors(asg.priority, isLightTheme);
                            return (
                              <div key={asg.id} className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`font-semibold ${isLightTheme ? 'text-indigo-700' : 'text-indigo-400'} ${asg.completed ? 'line-through opacity-60' : ''}`}>
                                    HW: {asg.title}
                                  </span>
                                  <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 rounded-full font-mono scale-90 ${colors.badge}`}>
                                    {asg.priority}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className={isLightTheme ? 'text-slate-550' : 'text-slate-400'}>
                                    Subject: {asg.subject}
                                  </span>
                                  <span className={`font-semibold flex items-center gap-1 ${asg.completed ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${asg.completed ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                    {asg.completed ? 'Completed' : 'Pending'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Agenda list view with Theme Consistency and Priority Colors */
          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
            <h3 className={`text-xs uppercase font-bold tracking-wider mb-2 font-mono ${isLightTheme ? 'text-slate-650' : 'text-slate-500'}`}>Upcoming Milestones & Tasks</h3>
            {exams.map(ex => {
              const colors = getPriorityColors(ex.priority, isLightTheme);
              return (
                <div key={ex.id} className={`border rounded-xl p-3 flex justify-between items-center transition shadow-sm ${colors.card}`}>
                  <div className="flex gap-3 items-center">
                    <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${colors.dot}`} />
                    <div>
                      <h4 className={`text-xs font-semibold ${isLightTheme ? 'text-slate-900' : 'text-white'}`}>Exam: {ex.subject}</h4>
                      <p className={`text-[10px] mt-0.5 ${isLightTheme ? 'text-slate-600' : 'text-slate-400'}`}>{ex.description || 'No description provided.'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[9px] font-mono border px-2 py-0.5 rounded-lg ${colors.badge}`}>{ex.date}</span>
                    <div className={`text-[9px] uppercase tracking-wide font-bold mt-1 ${colors.text}`}>{ex.priority} priority</div>
                  </div>
                </div>
              );
            })}

            {assignments.map(asg => {
              const colors = getPriorityColors(asg.priority, isLightTheme);
              return (
                <div key={asg.id} className={`border rounded-xl p-3 flex justify-between items-center transition shadow-sm ${colors.card}`}>
                  <div className="flex gap-3 items-center">
                    <button onClick={() => onToggleAssignment(asg.id)} className={`${isLightTheme ? 'text-slate-400 hover:text-indigo-600' : 'text-slate-500 hover:text-indigo-400'} transition`}>
                      <CheckCircle2 className={`w-4 h-4 ${asg.completed ? 'text-emerald-500 fill-emerald-500/10' : ''}`} />
                    </button>
                    <div>
                      <h4 className={`text-xs font-semibold ${asg.completed ? 'line-through opacity-50' : isLightTheme ? 'text-slate-900' : 'text-white'}`}>Assignment: {asg.title}</h4>
                      <p className={`text-[10px] mt-0.5 ${isLightTheme ? 'text-slate-600' : 'text-slate-400'}`}>Subject: {asg.subject}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[9px] font-mono border px-2 py-0.5 rounded-lg ${colors.badge}`}>{asg.dueDate}</span>
                    <div className={`text-[9px] uppercase tracking-wide font-bold mt-1 ${colors.text}`}>{asg.priority}</div>
                  </div>
                </div>
              );
            })}

            {exams.length === 0 && assignments.length === 0 && (
              <div className={`text-center py-12 text-xs border border-dashed rounded-xl ${isLightTheme ? 'text-slate-500 border-slate-300' : 'text-slate-500 border-slate-800'}`}>
                No active exams or homework assignments listed on the agenda.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Column: Adding / Managing Exams & Assignments */}
      <div className="space-y-4">
        {/* Rapid addition action box */}
        <div className={`glass-panel-dark rounded-2xl p-5 border shadow-xl ${isLightTheme ? 'border-slate-200' : 'border-slate-800'}`}>
          <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isLightTheme ? 'text-slate-800' : 'text-white'}`}>
            <Bookmark className="text-indigo-400 w-4 h-4" />
            Quick Planner Additions
          </h3>
          <p className={`text-xs mb-4 ${isLightTheme ? 'text-slate-600' : 'text-slate-400'}`}>Add homework or exams to make the daily timetable dynamically adjust study weights.</p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setShowExamForm(true); setShowAssignmentForm(false); }}
              className={`text-xs py-2 px-3 rounded-xl font-medium transition flex items-center justify-center gap-1.5 ${
                isLightTheme
                  ? 'bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-200'
                  : 'bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-400'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Exam
            </button>
            <button
              onClick={() => { setShowAssignmentForm(true); setShowExamForm(false); }}
              className={`text-xs py-2 px-3 rounded-xl font-medium transition flex items-center justify-center gap-1.5 ${
                isLightTheme
                  ? 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border border-indigo-200'
                  : 'bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 text-indigo-400'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Homework
            </button>
          </div>
        </div>

        {/* Dynamic Exam Addition Form */}
        {showExamForm && (
          <form onSubmit={handleAddExamSubmit} className={`glass-panel-dark rounded-2xl p-5 border shadow-xl space-y-3.5 ${isLightTheme ? 'border-rose-200' : 'border-rose-500/10'}`}>
            <div className={`flex justify-between items-center border-b pb-2 ${isLightTheme ? 'border-slate-200' : 'border-slate-800'}`}>
              <span className={`text-xs font-semibold ${isLightTheme ? 'text-rose-600' : 'text-rose-400'}`}>Add Exam Milestone</span>
              <button type="button" onClick={() => setShowExamForm(false)} className={`text-xs ${isLightTheme ? 'text-slate-450 hover:text-slate-800' : 'text-slate-500 hover:text-white'}`}>×</button>
            </div>
            <div>
              <label className={`block text-[10px] mb-1 ${isLightTheme ? 'text-slate-600' : 'text-slate-400'}`}>Subject Name</label>
              <input
                type="text"
                value={newExam.subject}
                onChange={e => setNewExam({ ...newExam, subject: e.target.value })}
                className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none ${
                  isLightTheme
                    ? 'bg-white border-slate-200 text-slate-800 focus:border-rose-500'
                    : 'bg-slate-950 border-slate-800 text-white focus:border-rose-500'
                }`}
                placeholder="e.g. Physics Mechanics"
                required
              />
            </div>
            <div>
              <label className={`block text-[10px] mb-1 ${isLightTheme ? 'text-slate-600' : 'text-slate-400'}`}>Exam Date</label>
              <input
                type="date"
                value={newExam.date}
                onChange={e => setNewExam({ ...newExam, date: e.target.value })}
                className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none font-mono ${
                  isLightTheme
                    ? 'bg-white border-slate-200 text-slate-800 focus:border-rose-500'
                    : 'bg-slate-950 border-slate-850 text-white focus:border-rose-500'
                }`}
                required
              />
            </div>
            <div>
              <label className={`block text-[10px] mb-1 ${isLightTheme ? 'text-slate-600' : 'text-slate-400'}`}>Priority Level</label>
              <select
                value={newExam.priority}
                onChange={e => setNewExam({ ...newExam, priority: e.target.value as any })}
                className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none ${
                  isLightTheme
                    ? 'bg-white border-slate-200 text-slate-800 focus:border-rose-500'
                    : 'bg-slate-950 border-slate-850 text-white focus:border-rose-500'
                }`}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical (Needs Daily Study)</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-medium py-2 rounded-xl text-xs transition"
            >
              Confirm Exam Date
            </button>
          </form>
        )}

        {/* Dynamic Assignment Addition Form */}
        {showAssignmentForm && (
          <form onSubmit={handleAddAssignmentSubmit} className={`glass-panel-dark rounded-2xl p-5 border shadow-xl space-y-3.5 ${isLightTheme ? 'border-indigo-200' : 'border-indigo-500/10'}`}>
            <div className={`flex justify-between items-center border-b pb-2 ${isLightTheme ? 'border-slate-200' : 'border-slate-800'}`}>
              <span className={`text-xs font-semibold ${isLightTheme ? 'text-indigo-600' : 'text-indigo-400'}`}>Add Homework / Assignment</span>
              <button type="button" onClick={() => setShowAssignmentForm(false)} className={`text-xs ${isLightTheme ? 'text-slate-450 hover:text-slate-800' : 'text-slate-500 hover:text-white'}`}>×</button>
            </div>
            <div>
              <label className={`block text-[10px] mb-1 ${isLightTheme ? 'text-slate-600' : 'text-slate-400'}`}>Assignment Title</label>
              <input
                type="text"
                value={newAssignment.title}
                onChange={e => setNewAssignment({ ...newAssignment, title: e.target.value })}
                className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none ${
                  isLightTheme
                    ? 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
                    : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500'
                }`}
                placeholder="e.g. Solve Chapter 4 Problems"
                required
              />
            </div>
            <div>
              <label className={`block text-[10px] mb-1 ${isLightTheme ? 'text-slate-600' : 'text-slate-400'}`}>Subject</label>
              <input
                type="text"
                value={newAssignment.subject}
                onChange={e => setNewAssignment({ ...newAssignment, subject: e.target.value })}
                className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none ${
                  isLightTheme
                    ? 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
                    : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500'
                }`}
                placeholder="e.g. Calculus"
                required
              />
            </div>
            <div>
              <label className={`block text-[10px] mb-1 ${isLightTheme ? 'text-slate-600' : 'text-slate-400'}`}>Due Date</label>
              <input
                type="date"
                value={newAssignment.dueDate}
                onChange={e => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none font-mono ${
                  isLightTheme
                    ? 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
                    : 'bg-slate-950 border-slate-850 text-white focus:border-indigo-500'
                }`}
                required
              />
            </div>
            <div>
              <label className={`block text-[10px] mb-1 ${isLightTheme ? 'text-slate-600' : 'text-slate-400'}`}>Priority Level</label>
              <select
                value={newAssignment.priority}
                onChange={e => setNewAssignment({ ...newAssignment, priority: e.target.value as any })}
                className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none ${
                  isLightTheme
                    ? 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500'
                    : 'bg-slate-950 border-slate-850 text-white focus:border-indigo-500'
                }`}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-xl text-xs transition"
            >
              Add Assignment Task
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
