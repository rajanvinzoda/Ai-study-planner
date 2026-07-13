import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Sparkles, Trash2, HelpCircle, 
  User, Bot, RefreshCw, Sliders, Check, 
  CheckCircle2, AlertTriangle,
  ArrowRight, BookOpen, Clock, Calendar as CalendarIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { StudentProfile, ParsedTimetable, Exam, Assignment, Task } from '../types';
import { cleanErrorMessage } from '../utils/errors';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AiChatProps {
  profile: StudentProfile;
  timetable: ParsedTimetable | null;
  aiTimetable: ParsedTimetable | null;
  exams: Exam[];
  assignments: Assignment[];
  tasks: Task[];
}

export default function AiChat({
  profile,
  timetable,
  aiTimetable,
  exams,
  assignments,
  tasks
}: AiChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested questions
  const suggestions = [
    { label: "📅 Ask about schedule", text: "Can you analyze my weekly schedule and tell me where my best free study slots are?" },
    { label: "✍️ Ask a doubt", text: "Explain the concept of 'Recursion' in programming with a simple real-life analogy." },
    { label: "📝 Exam prep", text: "Suggest an efficient active recall study method to prepare for my upcoming exams." },
    { label: "⏰ Daily overview", text: "What are my study priorities, assignments, and tasks for today?" }
  ];

  // Load chat from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem('ai_study_chat_history');
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error("Error reading saved chat:", e);
      }
    } else {
      // Default welcome message
      const welcomeMsg: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `👋 Hello **${profile.studentName || 'Student'}**! I am **StudyBuddy**, your elite personal academic mentor. \n\nI have synchronized with your study preferences, institutional schedule, upcoming exams, assignments, and tasks. \n\n**Here is what I can do for you:**\n* **Solve Doubts:** Explain complex formulas, coding algorithms, mathematical equations, or historical events with simple analogies.\n* **Schedule Analysis:** Help you find gaps, schedule study slots, and balance your daily commitments.\n* **Study Planning:** Guide you on preparing for upcoming exams and organizing homework.\n\nHow can I assist your learning journey today? Feel free to ask any academic doubt!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([welcomeMsg]);
    }
  }, [profile.studentName]);

  // Save chat to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ai_study_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    const trimmedInput = textToSend.trim();
    if (!trimmedInput) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: trimmedInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setChatError(null);

    try {
      // Map current state to include history up to 10 messages to avoid token bloat
      const historyToSend = [...messages, userMessage].slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: historyToSend,
          profile,
          timetable,
          aiTimetable,
          exams,
          assignments,
          tasks
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const replyMessage: Message = {
          id: Math.random().toString(36).substring(7),
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, replyMessage]);
      } else {
        throw new Error(data.error || "Failed to reach StudyBuddy Assistant.");
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setChatError(cleanErrorMessage(err.message || "An unexpected network error occurred. Please check your key or try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    const welcomeMsg: Message = {
      id: 'welcome-' + Date.now(),
      role: 'assistant',
      content: `👋 Hello **${profile.studentName || 'Student'}**! I am **StudyBuddy**, your elite personal academic mentor. \n\nI have synchronized with your study preferences, institutional schedule, upcoming exams, assignments, and tasks. \n\n**Here is what I can do for you:**\n* **Solve Doubts:** Explain complex formulas, coding algorithms, mathematical equations, or historical events with simple analogies.\n* **Schedule Analysis:** Help you find gaps, schedule study slots, and balance your daily commitments.\n* **Study Planning:** Guide you on preparing for upcoming exams and organizing homework.\n\nHow can I assist your learning journey today? Feel free to ask any academic doubt!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([welcomeMsg]);
    localStorage.setItem('ai_study_chat_history', JSON.stringify([welcomeMsg]));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-display font-semibold text-white tracking-tight">StudyBuddy Academic Tutor</h1>
              <p className="text-xs text-slate-450 mt-0.5">Solve doubts, analyze timetables, and discuss active study plans with your personal mentor.</p>
            </div>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="text-xs font-semibold text-slate-450 hover:text-rose-450 flex items-center gap-1.5 bg-slate-900 border border-slate-850 px-3.5 py-2 rounded-xl transition hover:border-slate-800 cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Conversation</span>
          </button>
        </div>
      </div>

      {/* Main Chat Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Context / Study Stats Dashboard */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-panel-dark rounded-2xl p-5 border border-slate-900 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Active Context</span>
            </h3>

            {/* Profile Overview Card */}
            <div className="bg-slate-950/40 rounded-xl p-3 border border-slate-900 space-y-2">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">User Details</p>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-white">{profile.studentName || 'Student Learner'}</p>
                <p className="text-[11px] text-slate-400 capitalize">{profile.role || 'Learner'} • {profile.course || 'General Study'}</p>
                <p className="text-[11px] text-slate-400">Preferred Hours: <span className="font-bold text-white">{profile.dailyGoalHours}h/day</span></p>
              </div>
            </div>

            {/* Timetable Sync Checklist */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">Synchronized Data</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/20 border border-slate-900/50">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-slate-300 text-[11px]">Institution Timetable</span>
                  </div>
                  <span className={`text-[10px] font-bold font-mono ${timetable ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {timetable ? `${timetable.timeSlots.length} Slots` : 'Empty'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/20 border border-slate-900/50">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-slate-300 text-[11px]">7-Day Study Timetable</span>
                  </div>
                  <span className={`text-[10px] font-bold font-mono ${aiTimetable ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {aiTimetable ? `${aiTimetable.timeSlots.length} Slots` : 'Empty'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/20 border border-slate-900/50">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-slate-300 text-[11px]">Academic Events</span>
                  </div>
                  <span className="text-[10px] font-bold font-mono text-slate-300">
                    {exams.length + assignments.length} Items
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/20 border border-slate-900/50">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-slate-300 text-[11px]">Pending Tasks</span>
                  </div>
                  <span className="text-[10px] font-bold font-mono text-indigo-400">
                    {tasks.filter(t => !t.completed).length} Tasks
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-indigo-950/10 border border-indigo-900/10 rounded-xl">
              <p className="text-[11px] text-indigo-300/80 leading-relaxed font-mono">
                💡 Speak naturally to me. You can ask "Tell me about my next exam" or "explain gravity like I am 5 years old"!
              </p>
            </div>
          </div>
        </div>

        {/* Right 3 Columns: Active Chat Console */}
        <div className="lg:col-span-3 flex flex-col h-[620px] bg-slate-950/30 border border-slate-900 rounded-2xl overflow-hidden shadow-2xl">
          
          {/* Chat Panel Header */}
          <div className="px-5 py-4 border-b border-slate-900 bg-slate-950/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="p-2 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">StudyBuddy Assistant</h3>
                <p className="text-[10px] text-emerald-400 font-mono mt-0.5">Online & Synced with active schedule</p>
              </div>
            </div>

            <span className="text-[10px] text-indigo-400 font-mono bg-indigo-950/20 border border-indigo-900/40 px-2.5 py-1 rounded-lg">
              Smart Core Engine
            </span>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-950/10">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`flex gap-3.5 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  <div className={`p-2 rounded-xl border shrink-0 h-9 w-9 flex items-center justify-center ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 border-indigo-500 text-white' 
                      : 'bg-slate-900 border-slate-850 text-indigo-400'
                  }`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className="space-y-1">
                    <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-600/10' 
                        : 'glass-panel-dark text-slate-200 border border-slate-850/60 rounded-tl-none shadow-md'
                    }`}>
                      <div className="markdown-body text-slate-100">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    </div>
                    <span className={`block text-[9px] text-slate-550 font-mono ${msg.role === 'user' ? 'text-right' : ''}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3.5 max-w-[80%]"
                >
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-850 text-indigo-400 shrink-0 h-9 w-9 flex items-center justify-center animate-bounce">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="glass-panel-dark text-slate-300 border border-slate-850/60 rounded-2xl rounded-tl-none p-4 shadow-md flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                      <span className="text-xs text-slate-400 font-mono">StudyBuddy is thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {chatError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2 max-w-xl mx-auto">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Chat Connection Issue</p>
                    <p className="mt-0.5 leading-relaxed">{chatError}</p>
                    <button
                      onClick={() => handleSendMessage(messages[messages.length - 1]?.content || '')}
                      className="mt-2 text-rose-300 font-bold hover:underline flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3" /> Retry last prompt
                    </button>
                  </div>
                </div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions area */}
          {messages.length <= 1 && !isLoading && (
            <div className="px-5 py-3 border-t border-slate-900 bg-slate-950/40">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono mb-2">💡 Quick Prompts to try:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(s.text)}
                    className="text-left bg-slate-900 hover:bg-slate-850 border border-slate-850/80 p-2.5 rounded-xl text-[11px] text-slate-300 transition hover:border-indigo-500/30 font-medium cursor-pointer"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input field area */}
          <div className="p-4 bg-slate-950 border-t border-slate-900 flex items-center gap-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(input);
              }}
              className="flex-1 flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask StudyBuddy anything about your schedule, exams, or doubts..."
                disabled={isLoading}
                className="flex-1 bg-slate-900 border border-slate-850 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 rounded-xl px-4 py-3 focus:ring-1 focus:ring-indigo-500/30 transition disabled:opacity-55"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white p-3 rounded-xl transition flex items-center justify-center shrink-0 shadow-lg cursor-pointer"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
