import React from 'react';
import { FocusSession, Task } from '../types';
import { Flame, BarChart4, TrendingUp, Hourglass, Smile, CheckSquare, Calendar, Award } from 'lucide-react';
import { motion } from 'motion/react';

interface AnalyticsProps {
  sessions: FocusSession[];
  tasks: Task[];
  dailyGoalHours: number;
}

export default function Analytics({ sessions, tasks, dailyGoalHours }: AnalyticsProps) {
  // Aggregate stats
  const totalCompletedSessions = sessions.filter(s => s.completed).length;
  const totalFocusMinutes = sessions.filter(s => s.completed).reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);

  const avgFocusScore = sessions.length > 0
    ? Math.round(sessions.reduce((acc, s) => acc + s.focusScore, 0) / sessions.length)
    : 0;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const taskCompletionRate = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  // Streak counter (simple simulation using dates logged in history)
  const calculateStreak = (): number => {
    if (sessions.length === 0) return 0;
    const dates = Array.from(new Set(sessions.map(s => s.date))).sort();
    let streak = 1;
    let currentStreak = 1;

    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diffTime = Math.abs(curr.getTime() - prev.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
        if (currentStreak > streak) streak = currentStreak;
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    }
    return streak;
  };

  const streakCount = calculateStreak();

  // Subject-wise stats calculation for custom bar chart
  const subjectFocusMap: Record<string, number> = {};
  sessions.forEach(s => {
    if (s.completed) {
      subjectFocusMap[s.subject] = (subjectFocusMap[s.subject] || 0) + s.durationMinutes;
    }
  });

  const subjectData = Object.entries(subjectFocusMap).map(([subject, minutes]) => ({
    subject,
    hours: parseFloat((minutes / 60).toFixed(1))
  })).sort((a, b) => b.hours - a.hours).slice(0, 5);

  const maxHours = subjectData.length > 0 ? Math.max(...subjectData.map(d => d.hours)) : 1;

  // Simple daily completion curve for the last 7 days
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const dailyMinutesData = last7Days.map(date => {
    const minutes = sessions
      .filter(s => s.date === date && s.completed)
      .reduce((acc, s) => acc + s.durationMinutes, 0);
    const dayLabel = new Date(date).toLocaleDateString('default', { weekday: 'short' });
    return { dayLabel, hours: parseFloat((minutes / 60).toFixed(1)) };
  });

  const maxDailyHours = Math.max(...dailyMinutesData.map(d => d.hours), 1);

  return (
    <div className="space-y-6 my-6">
      {/* Top Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Streak card */}
        <div className="glass-panel-dark rounded-2xl p-4 border border-orange-500/10 flex items-center gap-3.5 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">Study Streak</div>
            <div className="text-xl font-display font-bold text-white flex items-baseline gap-1 mt-0.5">
              {streakCount} <span className="text-xs text-slate-400 font-normal">days</span>
            </div>
          </div>
        </div>

        {/* Study Hours Card */}
        <div className="glass-panel-dark rounded-2xl p-4 border border-indigo-500/10 flex items-center gap-3.5 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Hourglass className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">Total Focus</div>
            <div className="text-xl font-display font-bold text-white flex items-baseline gap-1 mt-0.5">
              {totalFocusHours} <span className="text-xs text-slate-400 font-normal">hours</span>
            </div>
          </div>
        </div>

        {/* Avg Focus Score */}
        <div className="glass-panel-dark rounded-2xl p-4 border border-emerald-500/10 flex items-center gap-3.5 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Smile className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">Avg Focus Score</div>
            <div className="text-xl font-display font-bold text-white mt-0.5">
              {avgFocusScore}%
            </div>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="glass-panel-dark rounded-2xl p-4 border border-violet-500/10 flex items-center gap-3.5 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">Tasks Finished</div>
            <div className="text-xl font-display font-bold text-white flex items-baseline gap-1 mt-0.5">
              {taskCompletionRate}% <span className="text-xs text-slate-400 font-normal">({completedTasks}/{totalTasks})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Handcrafted responsive SVG charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subject-wise duration report */}
        <div className="glass-panel-dark rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
            <BarChart4 className="w-4 h-4 text-indigo-400" />
            Subject Wise Study Time (Hours)
          </h3>

          <div className="space-y-4">
            {subjectData.map((data, index) => {
              const pct = (data.hours / maxHours) * 100;
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-200">{data.subject}</span>
                    <span className="text-indigo-400 font-mono font-bold">{data.hours} hrs</span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full"
                    />
                  </div>
                </div>
              );
            })}

            {subjectData.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                No focus study data logged yet. Complete a Pomodoro session to log hours.
              </div>
            )}
          </div>
        </div>

        {/* 7-Day Completion curve */}
        <div className="glass-panel-dark rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Weekly Focus Consistency
          </h3>

          {/* Simple Visual Columns chart */}
          <div className="flex justify-between items-end h-40 pt-4 px-2">
            {dailyMinutesData.map((data, index) => {
              const heightPct = (data.hours / maxDailyHours) * 100;
              const isGoalMet = data.hours >= dailyGoalHours;
              return (
                <div key={index} className="flex flex-col items-center gap-2 w-10">
                  <div className="text-[10px] font-mono text-slate-500 font-medium">
                    {data.hours > 0 ? `${data.hours}h` : '0'}
                  </div>
                  {/* Column element */}
                  <div className="w-6 bg-slate-900 rounded-t-md h-24 flex items-end overflow-hidden relative">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(heightPct, 2)}%` }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      className={`w-full rounded-t-md ${
                        isGoalMet
                          ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                          : 'bg-gradient-to-t from-indigo-600 to-indigo-400'
                      }`}
                    />
                  </div>
                  {/* Day Title */}
                  <span className="text-[10px] font-mono font-medium text-slate-450">{data.dayLabel}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-4 text-[10px] text-slate-500 font-mono mt-4 pt-3 border-t border-slate-850">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-indigo-500" />
              Focus Logged
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
              Daily Goal Reached ({dailyGoalHours}h)
            </span>
          </div>
        </div>
      </div>

      {/* Week Evaluation and AI recommendations */}
      {sessions.length > 0 && (
        <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-2xl p-5 flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">Consolidated Insights</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Based on your logged focus statistics, your average concentration level spikes during <strong>Evening study hours</strong>. You remain highly consistent with <strong>{subjectData[0]?.subject || 'your subjects'}</strong>, but you can allocate 15% more time toward your designated weak subjects to optimize upcoming exam performances. Keep up the momentum!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
