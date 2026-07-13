import React, { useState, useEffect, useRef } from 'react';
import { ParsedTimetable, TimeSlot, StudentProfile } from '../types';
import { cleanErrorMessage } from '../utils/errors';
import { 
  Upload, FileText, Plus, Trash2, CheckCircle2, AlertTriangle, 
  RefreshCw, Clipboard, Sparkles, Sliders, Check, BookOpen, 
  HelpCircle, UserCheck, Calendar, ArrowRight, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TimetableUploadProps {
  onParsed: (timetable: ParsedTimetable) => void;
  initialTimetable?: ParsedTimetable;
  aiTimetable?: ParsedTimetable;
  onAiTimetableUpdate?: (timetable: ParsedTimetable) => void;
  profile: StudentProfile | null;
}

export default function TimetableUpload({ 
  onParsed, 
  initialTimetable, 
  aiTimetable, 
  onAiTimetableUpdate,
  profile 
}: TimetableUploadProps) {
  // Institutional Timetable uploader state
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'manual'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsingError, setParsingError] = useState<string | null>(null);

  // Active review state (when user is editing/verifying parsed OCR results)
  const [reviewedTimetable, setReviewedTimetable] = useState<ParsedTimetable | null>(null);

  // AI 7-Day Timetable state
  const [customSubject, setCustomSubject] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load draft timetable if it exists in localStorage
  useEffect(() => {
    const draft = localStorage.getItem('ai_study_draft_timetable');
    if (draft) {
      try {
        setReviewedTimetable(JSON.parse(draft));
      } catch (e) {
        console.error('Error parsing draft timetable:', e);
      }
    }
  }, []);

  // Auto-save draft timetable to localStorage whenever it changes
  useEffect(() => {
    if (reviewedTimetable) {
      localStorage.setItem('ai_study_draft_timetable', JSON.stringify(reviewedTimetable));
    } else {
      localStorage.removeItem('ai_study_draft_timetable');
    }
  }, [reviewedTimetable]);

  // Initialize available subjects from profile and timetable
  useEffect(() => {
    const subjectsSet = new Set<string>();
    
    // Add weak and strong subjects from profile
    if (profile) {
      (profile.weakSubjects || []).forEach(s => { if (s.trim()) subjectsSet.add(s.trim()); });
      (profile.strongSubjects || []).forEach(s => { if (s.trim()) subjectsSet.add(s.trim()); });
    }

    // Add subjects from institutional timetable if loaded
    if (initialTimetable && initialTimetable.timeSlots) {
      initialTimetable.timeSlots.forEach(slot => {
        if (slot.subject && slot.subject.trim()) {
          subjectsSet.add(slot.subject.trim());
        }
      });
    }

    const initialList = Array.from(subjectsSet);
    setAvailableSubjects(initialList);
    
    // Auto-select all by default
    setSelectedSubjects(initialList);
  }, [profile, initialTimetable]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setParsingError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setParsingError(null);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64Str = (reader.result as string).split(',')[1];
        resolve(base64Str);
      };
      reader.onerror = error => reject(error);
    });
  };

  const triggerUploadAPI = async (base64Data?: string, mimeType?: string, text?: string) => {
    setIsParsing(true);
    setParsingError(null);
    try {
      const res = await fetch('/api/timetable/parse', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileBase64: base64Data,
          mimeType: mimeType,
          pastedText: text
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to parse timetable.');
      }

      const parsed: ParsedTimetable = await res.json();
      setReviewedTimetable(parsed);
    } catch (err: any) {
      setParsingError(cleanErrorMessage(err.message || 'An error occurred during OCR parsing.'));
    } finally {
      setIsParsing(false);
    }
  };

  const handleUploadSubmit = async () => {
    if (!file) {
      setParsingError('Please select or drag-and-drop a file first.');
      return;
    }
    try {
      const base64 = await convertToBase64(file);
      await triggerUploadAPI(base64, file.type);
    } catch (err) {
      setParsingError('Failed to read and process the selected file.');
    }
  };

  const handlePasteSubmit = async () => {
    if (!pastedText.trim()) {
      setParsingError('Please paste your timetable text first.');
      return;
    }
    await triggerUploadAPI(undefined, undefined, pastedText);
  };

  const handleInitializeManual = () => {
    setReviewedTimetable({
      institution: '',
      department: '',
      semester: '',
      division: '',
      timeSlots: [
        { subject: 'Mathematics', startTime: '09:00', endTime: '10:00', days: ['Monday'], type: 'lecture' }
      ],
      confidence: 'high'
    });
  };

  // Modify slots directly in reviewed table
  const addSlot = () => {
    if (!reviewedTimetable) return;
    const newSlot: TimeSlot = {
      subject: 'New Subject',
      startTime: '10:00',
      endTime: '11:00',
      days: ['Monday'],
      type: 'lecture'
    };
    setReviewedTimetable({
      ...reviewedTimetable,
      timeSlots: [...reviewedTimetable.timeSlots, newSlot]
    });
  };

  const updateSlot = (index: number, updated: Partial<TimeSlot>) => {
    if (!reviewedTimetable) return;
    const updatedSlots = [...reviewedTimetable.timeSlots];
    updatedSlots[index] = { ...updatedSlots[index], ...updated };
    setReviewedTimetable({
      ...reviewedTimetable,
      timeSlots: updatedSlots
    });
  };

  const removeSlot = (index: number) => {
    if (!reviewedTimetable) return;
    setReviewedTimetable({
      ...reviewedTimetable,
      timeSlots: reviewedTimetable.timeSlots.filter((_, i) => i !== index)
    });
  };

  const handleDayToggle = (index: number, day: string) => {
    if (!reviewedTimetable) return;
    const slot = reviewedTimetable.timeSlots[index];
    const updatedDays = slot.days.includes(day)
      ? slot.days.filter(d => d !== day)
      : [...slot.days, day];
    updateSlot(index, { days: updatedDays });
  };

  const handleSaveAndConfirm = () => {
    if (!reviewedTimetable || reviewedTimetable.timeSlots.length === 0) return;
    onParsed(reviewedTimetable);
    setReviewedTimetable(null);
  };

  // Auto-select weak/strong subjects from profile
  const handleAutoSelectFromProfile = () => {
    if (!profile) return;
    const profileSubjects = new Set<string>();
    (profile.weakSubjects || []).forEach(s => { if (s.trim()) profileSubjects.add(s.trim()); });
    (profile.strongSubjects || []).forEach(s => { if (s.trim()) profileSubjects.add(s.trim()); });
    
    const profileList = Array.from(profileSubjects);
    if (profileList.length === 0) {
      setAiError("Your profile doesn't have weak or strong subjects specified yet.");
      return;
    }

    // Add any that aren't already in available list
    const newAvailable = Array.from(new Set([...availableSubjects, ...profileList]));
    setAvailableSubjects(newAvailable);
    setSelectedSubjects(profileList);
    setAiError(null);
  };

  // Add custom personal subject
  const handleAddCustomSubject = () => {
    if (!customSubject.trim()) return;
    const subjectName = customSubject.trim();
    if (!availableSubjects.includes(subjectName)) {
      setAvailableSubjects([...availableSubjects, subjectName]);
    }
    if (!selectedSubjects.includes(subjectName)) {
      setSelectedSubjects([...selectedSubjects, subjectName]);
    }
    setCustomSubject('');
  };

  const toggleSubjectSelection = (subj: string) => {
    if (selectedSubjects.includes(subj)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subj));
    } else {
      setSelectedSubjects([...selectedSubjects, subj]);
    }
  };

  // Call API to generate 7-Day AI study timetable
  const handleGenerate7DayTimetable = async () => {
    if (selectedSubjects.length === 0) {
      setAiError("Please select at least one subject to plan.");
      return;
    }
    setIsGeneratingAi(true);
    setAiError(null);
    try {
      const res = await fetch('/api/schedule/generate-7day', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profile,
          selectedSubjects,
          institutionalTimetable: initialTimetable || { timeSlots: [] }
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to generate 7-day master timetable.');
      }

      const generated: ParsedTimetable = await res.json();
      if (onAiTimetableUpdate) {
        onAiTimetableUpdate(generated);
      }
    } catch (err: any) {
      setAiError(cleanErrorMessage(err.message || 'An error occurred while generating the 7-day study timetable.'));
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const getSlotsForDay = (timetableObj: ParsedTimetable, day: string): TimeSlot[] => {
    if (!timetableObj || !timetableObj.timeSlots) return [];
    return timetableObj.timeSlots
      .filter(slot => slot.days.includes(day))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  // Render the review editor screen (full width for ideal space)
  if (reviewedTimetable) {
    return (
      <div className="max-w-4xl mx-auto my-6 p-1">
        <div className="glass-panel-dark rounded-2xl p-6 md:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-800 pb-4 mb-6 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-display font-semibold text-white">Review & Verify Timetable</h2>
                <span className="flex items-center gap-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] px-2 py-0.5 rounded-full font-medium">
                  <Sliders className="w-3 h-3" />
                  Standardize Commitments
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Adjust class times, subjects, room codes, or weekdays if any typos exist.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setReviewedTimetable(null)}
                className="border border-slate-800 text-slate-450 hover:text-white px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Cancel
              </button>
              <button
                onClick={addSlot}
                className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Class
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1">Institution</label>
              <input
                type="text"
                value={reviewedTimetable.institution || ''}
                onChange={e => setReviewedTimetable({ ...reviewedTimetable, institution: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                placeholder="e.g. Stanford University"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1">Department</label>
              <input
                type="text"
                value={reviewedTimetable.department || ''}
                onChange={e => setReviewedTimetable({ ...reviewedTimetable, department: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                placeholder="e.g. CS / Engineering"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1">Semester</label>
              <input
                type="text"
                value={reviewedTimetable.semester || ''}
                onChange={e => setReviewedTimetable({ ...reviewedTimetable, semester: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                placeholder="e.g. 3rd Semester"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1">Division/Section</label>
              <input
                type="text"
                value={reviewedTimetable.division || ''}
                onChange={e => setReviewedTimetable({ ...reviewedTimetable, division: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                placeholder="e.g. Div-A"
              />
            </div>
          </div>

          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
            {reviewedTimetable.timeSlots.map((slot, index) => (
              <div key={index} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 relative group">
                <button
                  onClick={() => removeSlot(index)}
                  className="absolute top-3 right-3 text-slate-550 hover:text-rose-400 transition"
                  title="Remove Class"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-slate-400 mb-1">Subject / Activity Name</label>
                    <input
                      type="text"
                      value={slot.subject}
                      onChange={e => updateSlot(index, { subject: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={e => updateSlot(index, { startTime: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">End Time</label>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={e => updateSlot(index, { endTime: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Slot Category</label>
                    <select
                      value={slot.type}
                      onChange={e => updateSlot(index, { type: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="lecture">Lecture</option>
                      <option value="lab">Lab / Practical</option>
                      <option value="tutorial">Tutorial</option>
                      <option value="seminar">Seminar</option>
                      <option value="break">Short Break</option>
                      <option value="lunch">Lunch break</option>
                      <option value="activity">Extracurricular</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-850/40">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-550 mb-0.5">Room Code (Opt)</label>
                      <input
                        type="text"
                        value={slot.room || ''}
                        onChange={e => updateSlot(index, { room: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-indigo-500"
                        placeholder="e.g. LH-201"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-550 mb-0.5">Faculty Name (Opt)</label>
                      <input
                        type="text"
                        value={slot.teacher || ''}
                        onChange={e => updateSlot(index, { teacher: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-indigo-500"
                        placeholder="e.g. Prof. Smith"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-550 mb-1">Weekdays (Selected)</label>
                    <div className="flex flex-wrap gap-1">
                      {weekdays.map(day => {
                        const isSelected = slot.days.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => handleDayToggle(index, day)}
                            className={`px-2 py-0.5 text-[10px] font-mono rounded-md transition ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-950 border border-slate-850 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            {day.substring(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-800 mt-6">
            <button
              onClick={() => setReviewedTimetable(null)}
              className="px-4 py-2 text-xs font-medium border border-slate-850 text-slate-400 hover:text-white rounded-xl transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndConfirm}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/10"
            >
              <CheckCircle2 className="w-4 h-4" />
              Save Institutional Timetable
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dual layout: left card (Institutional commitment timetable) + right card (AI 7-day master study plan)
  return (
    <div className="w-full max-w-7xl mx-auto my-4 px-1 space-y-6">
      {/* Top Welcome info */}
      <div className="text-center md:text-left max-w-2xl">
        <h1 className="text-2xl font-display font-bold text-white tracking-tight flex items-center justify-center md:justify-start gap-2">
          <BookOpen className="text-indigo-400 w-6 h-6 animate-pulse" />
          Master Planning Center
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Combine your fixed college lectures with a personalized weekly study plan. The scheduler fills your extra free time seamlessly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Card: Provide / View Your Fixed Timetable */}
        <div className="glass-panel-dark rounded-2xl p-6 shadow-xl border border-slate-900 flex flex-col min-h-[500px]">
          <div className="flex justify-between items-center border-b border-slate-850 pb-4 mb-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="text-indigo-400 w-4 h-4" />
                1. Institutional Timetable
              </h2>
              <p className="text-[11px] text-slate-450 mt-0.5">Your fixed university lectures, classes, & labs.</p>
            </div>
            
            {initialTimetable && (
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Active commits
              </span>
            )}
          </div>

          {!initialTimetable ? (
            /* Upload / Import options */
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850 mb-4 max-w-xs">
                  {(['upload', 'paste', 'manual'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setParsingError(null);
                        if (tab === 'manual') handleInitializeManual();
                      }}
                      className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                        activeTab === tab
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tab === 'manual' ? 'Manual' : tab}
                    </button>
                  ))}
                </div>

                {parsingError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl p-3 mb-4 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{parsingError}</span>
                  </div>
                )}

                {activeTab === 'upload' && (
                  <div className="space-y-4">
                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-850 hover:border-indigo-500/60 bg-slate-900/10 hover:bg-slate-900/30 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition text-center group"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*,application/pdf"
                      />
                      <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 mb-3 group-hover:scale-110 transition">
                        <Upload className="w-5 h-5" />
                      </div>
                      <h3 className="text-xs font-semibold text-slate-200">Drag & drop your timetable image</h3>
                      <p className="text-[10px] text-slate-500 mt-1">Supports PNG, JPG, JPEG, WEBP or PDF</p>
                      {file && (
                        <div className="mt-3 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-[10px] font-mono max-w-xs truncate mx-auto">
                          {file.name}
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={handleUploadSubmit}
                      disabled={isParsing || !file}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2"
                    >
                      {isParsing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Smart OCR Parsing File...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Extract From Image/PDF
                        </>
                      )}
                    </button>
                  </div>
                )}

                {activeTab === 'paste' && (
                  <div className="space-y-3">
                    <textarea
                      value={pastedText}
                      onChange={e => setPastedText(e.target.value)}
                      className="w-full h-36 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs font-mono transition"
                      placeholder="Paste timetable text (e.g. classes, times, room numbers) here..."
                    />
                    <button
                      onClick={handlePasteSubmit}
                      disabled={isParsing || !pastedText.trim()}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2"
                    >
                      {isParsing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Extracting Commitments...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Parse Pasted Text
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-850/40 text-[11px] text-slate-500 leading-relaxed bg-slate-950/20 p-3 rounded-lg">
                <strong>💡 Extra Time Management:</strong> By providing your college commitments first, the scheduler learns your exact free times so it can schedule personalized focus blocks in between classes!
              </div>
            </div>
          ) : (
            /* Timetable Summarized List View */
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                {/* School meta header */}
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850/80">
                  <div className="text-xs font-semibold text-slate-200">
                    {initialTimetable.institution || "Personal Institution"}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-mono flex flex-wrap gap-2">
                    {initialTimetable.department && <span>{initialTimetable.department}</span>}
                    {initialTimetable.semester && <span>• {initialTimetable.semester}</span>}
                    {initialTimetable.division && <span>• Div {initialTimetable.division}</span>}
                  </div>
                </div>

                {/* Day-by-day summaries */}
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {weekdays.map(day => {
                    const daySlots = getSlotsForDay(initialTimetable, day);
                    if (daySlots.length === 0) return null;

                    return (
                      <div key={day} className="border border-slate-850/60 rounded-xl p-2.5 bg-slate-900/30">
                        <div className="text-[11px] font-bold text-indigo-400 flex justify-between">
                          <span>{day}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({daySlots.length} classes)</span>
                        </div>
                        <div className="mt-1.5 space-y-1">
                          {daySlots.map((slot, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[11px] py-1 border-b border-slate-850/30 last:border-0">
                              <span className="text-slate-300 font-medium max-w-[150px] truncate">{slot.subject}</span>
                              <div className="text-slate-500 font-mono text-[10px] flex gap-2">
                                <span>{slot.startTime}-{slot.endTime}</span>
                                {slot.room && <span className="text-indigo-400/80">[{slot.room}]</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-850 mt-4 flex gap-2">
                <button
                  onClick={() => {
                    // Force uploader back open
                    onParsed({ timeSlots: [], confidence: 'high' });
                    setReviewedTimetable(null);
                  }}
                  className="w-full border border-slate-850 hover:border-indigo-500/30 hover:bg-slate-900 text-slate-400 hover:text-white py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Re-Upload / Edit Timetable
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Card: AI 7-Day Timetable Generator */}
        <div className="glass-panel-dark rounded-2xl p-6 shadow-xl border border-slate-900 flex flex-col min-h-[500px]">
          <div className="border-b border-slate-850 pb-4 mb-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="text-indigo-400 w-4 h-4" />
              2. 7-Day Study Planner
            </h2>
            <p className="text-[11px] text-slate-450 mt-0.5">Generate a custom full-week learning & focus schedule.</p>
          </div>

          {aiError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl p-3 mb-4 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{aiError}</span>
            </div>
          )}

          {isGeneratingAi ? (
            /* Loading state */
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse" />
                <div className="w-16 h-16 rounded-full bg-slate-950 border border-indigo-500/40 flex items-center justify-center relative">
                  <Sparkles className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
              </div>
              <div className="max-w-xs space-y-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Master Scheduler Active</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Mapping learning blocks, placing review intervals, and syncing with your free hours perfectly...
                </p>
                {/* Fake moving loading bar */}
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-850">
                  <motion.div 
                    className="bg-indigo-500 h-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 10, ease: 'easeInOut', repeat: Infinity }}
                  />
                </div>
              </div>
            </div>
          ) : !aiTimetable ? (
            /* Subject selector and generate trigger */
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-slate-300">Choose Subjects to Plan:</label>
                  <button
                    onClick={handleAutoSelectFromProfile}
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 bg-indigo-500/5 px-2 py-0.5 rounded-md flex items-center gap-1 transition"
                  >
                    <UserCheck className="w-3 h-3" />
                    Profile Auto-Select
                  </button>
                </div>

                {/* Available subject list */}
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 min-h-[150px] max-h-[180px] overflow-y-auto space-y-1.5">
                  {availableSubjects.map(subj => {
                    const isSelected = selectedSubjects.includes(subj);
                    return (
                      <button
                        key={subj}
                        onClick={() => toggleSubjectSelection(subj)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                          isSelected 
                            ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/20' 
                            : 'text-slate-450 hover:bg-slate-900 border border-transparent'
                        }`}
                      >
                        <span className="truncate">{subj}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </button>
                    );
                  })}
                  {availableSubjects.length === 0 && (
                    <div className="text-center text-[11px] text-slate-500 py-10">
                      No subjects available. Add custom personal subjects below.
                    </div>
                  )}
                </div>

                {/* Custom personal subject inputs */}
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">
                    Add Personal Subject / Topic
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customSubject}
                      onChange={e => setCustomSubject(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddCustomSubject(); }}
                      className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. Physics Prep, UI/UX Design..."
                    />
                    <button
                      onClick={handleAddCustomSubject}
                      className="bg-slate-900 border border-slate-850 hover:bg-slate-800 text-white px-3 rounded-xl text-xs transition"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-850 mt-6">
                <button
                  onClick={handleGenerate7DayTimetable}
                  disabled={selectedSubjects.length === 0}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  Create 7-Day Study Timetable
                </button>
              </div>
            </div>
          ) : (
            /* AI Timetable Successfully Generated */
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white">7-Day Study Plan Generated!</h4>
                    <p className="text-[10px] text-slate-450 mt-0.5">
                      Your master schedule contains {aiTimetable.timeSlots.length} personalized focus sessions mapped across 7 days.
                    </p>
                  </div>
                </div>

                {/* Days Overview */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {weekdays.map(day => {
                    const daySlots = getSlotsForDay(aiTimetable, day);
                    if (daySlots.length === 0) return null;

                    return (
                      <div key={day} className="border border-slate-850/60 rounded-xl p-2 bg-slate-900/30">
                        <div className="text-[11px] font-bold text-violet-400 flex justify-between">
                          <span>{day}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({daySlots.length} sessions)</span>
                        </div>
                        <div className="mt-1 space-y-1">
                          {daySlots.map((slot, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[10px] py-0.5">
                              <span className="text-slate-300 truncate max-w-[150px]">{slot.subject}</span>
                              <div className="text-slate-500 font-mono">{slot.startTime} - {slot.endTime}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-850 mt-4 space-y-2">
                <button
                  onClick={() => {
                    // Let them redesign
                    if (onAiTimetableUpdate) {
                      onAiTimetableUpdate(null as any);
                    }
                  }}
                  className="w-full border border-slate-850 hover:border-indigo-500/30 hover:bg-slate-900 text-slate-400 hover:text-white py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Re-plan Subjects
                </button>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <div className="text-left">
                      <div className="text-[10px] font-bold text-white">Export & Print Ready</div>
                      <div className="text-[9px] text-slate-500">Download high-res PDF or print poster</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      // Trigger click of parent navigation to Export tab
                      const exportBtn = document.querySelector('button[title="Themes"]') as HTMLButtonElement;
                      if (exportBtn) {
                        // Find sibling or navigation menu items to switch tab to export
                        const exportNavBtn = Array.from(document.querySelectorAll('button')).find(el => el.textContent?.includes('Export')) as HTMLButtonElement;
                        if (exportNavBtn) exportNavBtn.click();
                      }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition"
                  >
                    View Export
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
