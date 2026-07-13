import React, { useState } from 'react';
import { StudentProfile } from '../types';
import { BookOpen, Clock, Award, Flame, Compass, ChevronRight, ChevronLeft, Check, Sparkles, AlertTriangle, GraduationCap, Presentation, Users, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SUGGESTIONS_DATA = {
  student: {
    course: [
      'B.Tech Computer Science',
      'B.Tech Information Technology (IT)',
      'Bachelor of Science (B.Sc)',
      'Bachelor of Commerce (B.Com)',
      'Bachelor of Business Administration (BBA)',
      'Class 12 - Science',
      'Class 12 - Commerce',
      'Master of Computer Applications (MCA)',
      'MBBS / Medicine',
      'Civil Engineering'
    ],
    semester: [
      '1st Semester',
      '2nd Semester',
      '3rd Semester',
      '4th Semester',
      '5th Semester',
      '6th Semester',
      '7th Semester',
      '8th Semester',
      '1st Year',
      '2nd Year',
      '3rd Year',
      'Final Year'
    ],
    weak: [
      'Calculus & Linear Algebra',
      'Data Structures & Algorithms',
      'Organic Chemistry',
      'Physics Mechanics',
      'Financial Accounting',
      'Theory of Computation',
      'Machine Learning',
      'Discrete Mathematics',
      'Thermodynamics',
      'Quantitative Aptitude'
    ],
    strong: [
      'English & Communication',
      'Database Management (DBMS)',
      'Web Technology & HTML/CSS',
      'Python Programming',
      'Computer Networks',
      'Environmental Studies',
      'Operating Systems',
      'Software Engineering',
      'Logical Reasoning',
      'Business Communication'
    ]
  },
  teacher: {
    course: [
      'Computer Science Department',
      'Mathematics Faculty',
      'Science Department',
      'English & Humanities',
      'Business & Commerce',
      'Social Studies Faculty',
      'Engineering Department',
      'Art & Design School',
      'Physics Department',
      'Chemistry Department'
    ],
    semester: [
      'Grade 9 & 10',
      'Grade 11 & 12',
      'Undergraduate (UG)',
      'Postgraduate (PG)',
      'Primary School',
      'Middle School',
      'Associate Professor',
      'Senior Lecturer',
      'Visiting Faculty',
      'Academic Year 2026'
    ],
    weak: [
      'Lab Manual & Practical Prep',
      'Grading Exam Papers',
      'Lesson Plan Design',
      'Designing Question Papers',
      'EdTech Tools & LMS Integration',
      'Research Paper Writing',
      'Student Remedial Classes',
      'Project Mentorship',
      'Curriculum Alignment',
      'Parent-Teacher Meeting Notes'
    ],
    strong: [
      'Advanced Calculus',
      'Introduction to Programming',
      'Inorganic Chemistry',
      'English Literature',
      'Macroeconomics',
      'Modern Physics',
      'Data Communication',
      'Software Engineering',
      'Creative Writing',
      'History & Geography'
    ]
  },
  parent: {
    course: [
      'Grade 10 Board Exams',
      'Grade 12 Board Exams',
      'Middle School (Grade 6-8)',
      'Primary School (Grade 1-5)',
      'High School - Science Track',
      'High School - Commerce Track',
      'Engineering Undergraduate',
      'Pre-Medical Entrance Prep',
      'Computer Coding Course',
      'Language & Music Classes'
    ],
    semester: [
      '1st Term Exam Prep',
      '2nd Term Exam Prep',
      'Final Semester Finals',
      'Mid-Term Assessments',
      'Unit Test 1',
      'Unit Test 2',
      'Weekly Evaluation',
      'Summer Vacation Review',
      'Entrance Exam Phase',
      'Year-Round Guidance'
    ],
    weak: [
      'Mathematics & Algebra',
      'Science Practicals & Theory',
      'Grammar & Writing Skills',
      'Time Management Practice',
      'Exam Anxiety Management',
      'Reading Comprehension',
      'Physics Numerical Problems',
      'Chemistry Formulations',
      'Computer Programming Logic',
      'Social Studies Memory Work'
    ],
    strong: [
      'English Reading',
      'Art & Craft Projects',
      'General Knowledge (GK)',
      'Computer Science Basics',
      'Environmental Science (EVS)',
      'Mental Mathematics',
      'Music & Fine Arts',
      'Physical Education',
      'History Storytelling',
      'Moral Science'
    ]
  },
  other: {
    course: [
      'Software Development (Full Stack)',
      'UI/UX Design',
      'Data Science & Analytics',
      'Product Management',
      'Digital Marketing',
      'Finance & Investment',
      'Graphic Design',
      'Content Writing & Copywriting',
      'Entrepreneurship & Startups',
      'Cloud & DevOps Engineering'
    ],
    semester: [
      'Career Transition',
      'AWS/Azure Certification',
      'Build Personal Portfolio',
      'Launch Freelance Business',
      'Get Hired as Developer',
      'Master React & Node.js',
      'Learn Data Science Foundation',
      'Prepare for CFA Exams',
      'Launch Side Project',
      'Improve Public Speaking'
    ],
    weak: [
      'System Design & Architecture',
      'Machine Learning Algorithms',
      'Data Structures & Algorithms',
      'Financial Modeling in Excel',
      'JavaScript Closures & Async',
      'Cloud Security & IAM',
      'Marketing Funnel Setup',
      'Figma Advanced Prototyping',
      'Search Engine Optimization (SEO)',
      'Docker & Kubernetes'
    ],
    strong: [
      'HTML & CSS Layouts',
      'Basic Git & GitHub',
      'Python Scripting Basics',
      'Canva Design Templates',
      'Trello/Notion Project Mgmt',
      'Technical Writing',
      'Excel Data Analysis',
      'Presentations & Slides',
      'SQL Query Writing',
      'API Testing with Postman'
    ]
  }
};

interface OnboardingProps {
  onComplete: (profile: StudentProfile) => void;
  initialProfile?: StudentProfile;
  onResetAllData?: () => void;
  activeTheme?: string;
}

export default function Onboarding({ onComplete, initialProfile, onResetAllData, activeTheme }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<StudentProfile>(() => {
    if (initialProfile) {
      return {
        role: 'student',
        ...initialProfile
      };
    }
    return {
      studentName: '',
      role: 'student',
      course: '',
      semester: '',
      wakeUpTime: '06:00',
      sleepTime: '22:00',
      preferredStudyTime: 'evening',
      dailyGoalHours: 4,
      weakSubjects: [],
      strongSubjects: [],
      travelTimeMinutes: 30,
      homeworkTimeMinutes: 60,
      breakPreference: 'short',
      revisionPreference: 'split',
      isOnboarded: false
    };
  });

  const [newWeakSub, setNewWeakSub] = useState('');
  const [newStrongSub, setNewStrongSub] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'course' | 'semester' | 'weak' | 'strong' | null>(null);

  const isLightTheme = activeTheme === 'light' || activeTheme === 'apple';

  // Master adaptive styling constants based on activeTheme
  const textTitle = isLightTheme ? 'text-slate-900' : 'text-white';
  const textMuted = isLightTheme ? 'text-slate-600' : 'text-slate-400';
  const textSub = isLightTheme ? 'text-slate-500' : 'text-slate-500';
  const borderCol = isLightTheme ? 'border-slate-200' : 'border-slate-850';
  const inputBg = isLightTheme 
    ? 'bg-white border-slate-200 text-slate-800 focus:border-indigo-500' 
    : 'bg-slate-900/60 border-slate-800 text-white focus:border-indigo-500';
  const cardBg = isLightTheme 
    ? 'bg-white border-slate-200/80 shadow-md text-slate-800' 
    : 'glass-panel-dark border-slate-850 text-slate-100';

  const currentRole = profile.role || 'student';

  const roleConfigs = {
    student: {
      title: 'Academic Details',
      nameLabel: 'Your Name (Optional)',
      courseLabel: 'Course / Degree',
      coursePlaceholder: 'e.g. Computer Science, Grade 12',
      semesterLabel: 'Semester / Year',
      semesterPlaceholder: 'e.g. Semester 3, Fall 2026',
      goalLabel: 'Daily Study Goal (Hours)',
      goalSub: 'This represents the net focus time outside of lecture classes.',
      commuteLabel: 'Travel Time to Institution (Mins)',
      homeworkLabel: 'Target Homework Time (Mins)',
      weakLabel: 'Weak/Challenging Subjects',
      weakSub: 'The study schedule will automatically allocate more focus blocks and earlier slots to these.',
      strongLabel: 'Strong/Easy Subjects',
      strongSub: 'The scheduler will allocate moderate study blocks for these.',
    },
    teacher: {
      title: 'Teaching Details',
      nameLabel: 'Teacher Name (Optional)',
      courseLabel: 'Department / Faculty',
      coursePlaceholder: 'e.g. Mathematics Faculty, Science Dept',
      semesterLabel: 'Academic Year / Grade Level',
      semesterPlaceholder: 'e.g. High School Year 2, UG Level',
      goalLabel: 'Daily Prep/Teaching Goal (Hours)',
      goalSub: 'This represents your target active hours for classes and preparations.',
      commuteLabel: 'Travel Time to School / Work (Mins)',
      homeworkLabel: 'Target Grading/Planning Time (Mins)',
      weakLabel: 'Subjects Needing Extra Material Prep',
      weakSub: 'The study schedule will help allocate more preparation, planning, or grading sessions here.',
      strongLabel: 'Primary Subjects Taught',
      strongSub: 'The scheduler will allocate standard slots for teaching or lesson delivery.',
    },
    parent: {
      title: 'Parent Support Details',
      nameLabel: 'Parent Name (Optional)',
      courseLabel: 'Child\'s Grade / Course',
      coursePlaceholder: 'e.g. Middle School, Grade 10',
      semesterLabel: 'Academic Semester / Term',
      semesterPlaceholder: 'e.g. Term 2, Spring 2026',
      goalLabel: 'Daily Guidance/Help Goal (Hours)',
      goalSub: 'This represents the hours you aim to spend helping your child with active studying.',
      commuteLabel: 'Travel/Commute Time (Mins)',
      homeworkLabel: 'Joint Activity / Review Time (Mins)',
      weakLabel: 'Subjects Needing Active Support',
      weakSub: 'The scheduler will place emphasis on parent-led review blocks for these tricky areas.',
      strongLabel: 'Subjects with Independent Study',
      strongSub: 'The scheduler will schedule light guidance or self-directed tasks here.',
    },
    other: {
      title: 'Learner Profile Details',
      nameLabel: 'Your Name (Optional)',
      courseLabel: 'Field of Study / Occupation',
      coursePlaceholder: 'e.g. Software Engineer, Design Learner',
      semesterLabel: 'Primary Goal / Target Year',
      semesterPlaceholder: 'e.g. Certification Prep, 2026 Goals',
      goalLabel: 'Daily Focused Learning Goal (Hours)',
      goalSub: 'This represents your target time for deep focus, learning, or professional dev.',
      commuteLabel: 'Travel/Commute Time (Mins)',
      homeworkLabel: 'Target Practice/Project Time (Mins)',
      weakLabel: 'Challenging Topics / Core Focus Areas',
      weakSub: 'The system will schedule high-priority, early focus sessions for these demanding skill sets.',
      strongLabel: 'Comfortable Topics / Secondary Skills',
      strongSub: 'The system will schedule standard review or practice blocks for these.',
    }
  };

  const config = roleConfigs[currentRole];

  const renderSuggestions = (
    type: 'course' | 'semester' | 'weak' | 'strong',
    currentValue: string,
    onSelect: (val: string) => void
  ) => {
    if (activeDropdown !== type) return null;

    const roleData = SUGGESTIONS_DATA[currentRole] || SUGGESTIONS_DATA['student'];
    const items = roleData[type] || [];
    
    // Filter items based on current typed value
    const filtered = items.filter(item => 
      item.toLowerCase().includes(currentValue.toLowerCase())
    ).slice(0, 10); // Show max 10 suggestions

    if (filtered.length === 0) return null;

    return (
      <div
        className={`absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border shadow-xl p-1 max-h-56 overflow-y-auto ${
          isLightTheme 
            ? 'bg-white border-slate-200 text-slate-800' 
            : 'bg-slate-900 border-slate-800 text-slate-100'
        } scrollbar-thin`}
      >
        <div className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider border-b mb-1 ${
          isLightTheme ? 'text-slate-400 border-slate-100' : 'text-slate-500 border-slate-850'
        }`}>
          Suggestions ({filtered.length})
        </div>
        {filtered.map((item) => (
          <button
            key={item}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault(); // Prevents input blur from firing too early
              onSelect(item);
              setActiveDropdown(null);
            }}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition duration-150 flex items-center justify-between ${
              isLightTheme 
                ? 'hover:bg-slate-50 text-slate-700' 
                : 'hover:bg-slate-850 text-slate-200'
            }`}
          >
            <span>{item}</span>
            <span className={`text-[9px] font-mono opacity-60 ${
              isLightTheme ? 'text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded' : 'text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded'
            }`}>
              Select
            </span>
          </button>
        ))}
      </div>
    );
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleComplete = () => {
    onComplete({
      ...profile,
      isOnboarded: true
    });
  };

  const addWeakSubject = () => {
    if (newWeakSub.trim() && !profile.weakSubjects.includes(newWeakSub.trim())) {
      setProfile(p => ({
        ...p,
        weakSubjects: [...p.weakSubjects, newWeakSub.trim()]
      }));
      setNewWeakSub('');
    }
  };

  const removeWeakSubject = (sub: string) => {
    setProfile(p => ({
      ...p,
      weakSubjects: p.weakSubjects.filter(s => s !== sub)
    }));
  };

  const addStrongSubject = () => {
    if (newStrongSub.trim() && !profile.strongSubjects.includes(newStrongSub.trim())) {
      setProfile(p => ({
        ...p,
        strongSubjects: [...p.strongSubjects, newStrongSub.trim()]
      }));
      setNewStrongSub('');
    }
  };

  const removeStrongSubject = (sub: string) => {
    setProfile(p => ({
      ...p,
      strongSubjects: p.strongSubjects.filter(s => s !== sub)
    }));
  };

  return (
    <div id="onboarding-container" className="max-w-2xl mx-auto my-12 p-1">
      <div className="text-center mb-8">
        <div className={`inline-flex items-center justify-center p-2 rounded-full mb-3 border ${
          isLightTheme 
            ? 'bg-indigo-100 text-indigo-600 border-indigo-200' 
            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
        }`}>
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <h1 className={`text-3xl font-display font-bold tracking-tight ${textTitle}`}>
          Configure Your Study Profile
        </h1>
        <p className={`text-sm mt-2 ${textMuted}`}>
          Tailor the Smart Study Assistant to align perfectly with your circadian rhythm and academic goals.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8 px-4">
        <div className={`flex justify-between text-xs mb-2 font-mono ${isLightTheme ? 'text-slate-500' : 'text-slate-400'}`}>
          <span>STEP {step} OF 4</span>
          <span>{step === 1 ? 'Academic Info' : step === 2 ? 'Daily Routine' : step === 3 ? 'Subject Analysis' : 'Preferences'}</span>
        </div>
        <div className={`h-1.5 w-full rounded-full overflow-hidden ${isLightTheme ? 'bg-slate-200' : 'bg-slate-800'}`}>
          <div 
            className="h-full bg-indigo-500 transition-all duration-300" 
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      <div className={`${cardBg} rounded-2xl p-6 md:p-8 shadow-xl`}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className={`flex items-center gap-3 border-b pb-3 ${borderCol}`}>
                <BookOpen className="text-indigo-400 w-5 h-5" />
                <h3 className={`text-lg font-medium ${textTitle}`}>{config.title}</h3>
              </div>

              <div className="space-y-4">
                {/* Role Selector */}
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${textMuted}`}>
                    I am a / Select Your Role
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(['student', 'teacher', 'parent', 'other'] as const).map((r) => {
                      const isActive = currentRole === r;
                      const Icon = r === 'student' ? GraduationCap : r === 'teacher' ? Presentation : r === 'parent' ? Users : User;
                      const labels = {
                        student: 'Student',
                        teacher: 'Teacher',
                        parent: 'Parent',
                        other: 'Other Learner'
                      };
                      return (
                        <button
                          type="button"
                          key={r}
                          onClick={() => setProfile(p => ({ ...p, role: r }))}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition duration-200 gap-1.5 ${
                            isActive
                              ? 'bg-indigo-505 bg-indigo-500/10 border-indigo-500 text-indigo-500 font-bold'
                              : isLightTheme
                              ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/50 hover:border-slate-350'
                              : 'bg-slate-900/60 border-slate-850 text-slate-400 hover:bg-slate-900/80 hover:border-slate-750 hover:text-white'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-500 animate-pulse' : 'text-slate-450'}`} />
                          <span>{labels[r]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${textMuted}`}>{config.nameLabel}</label>
                  <input
                    type="text"
                    value={profile.studentName || ''}
                    onChange={e => setProfile(p => ({ ...p, studentName: e.target.value }))}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm transition focus:outline-none ${inputBg}`}
                    placeholder="Enter your name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className={`block text-xs font-medium mb-1 ${textMuted}`}>{config.courseLabel}</label>
                    <input
                      type="text"
                      value={profile.course || ''}
                      onChange={e => {
                        setProfile(p => ({ ...p, course: e.target.value }));
                        setActiveDropdown('course');
                      }}
                      onFocus={() => setActiveDropdown('course')}
                      onBlur={() => setActiveDropdown(null)}
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm transition focus:outline-none ${inputBg}`}
                      placeholder={config.coursePlaceholder}
                    />
                    {renderSuggestions('course', profile.course || '', (val) => setProfile(p => ({ ...p, course: val })))}
                  </div>
                  <div className="relative">
                    <label className={`block text-xs font-medium mb-1 ${textMuted}`}>{config.semesterLabel}</label>
                    <input
                      type="text"
                      value={profile.semester || ''}
                      onChange={e => {
                        setProfile(p => ({ ...p, semester: e.target.value }));
                        setActiveDropdown('semester');
                      }}
                      onFocus={() => setActiveDropdown('semester')}
                      onBlur={() => setActiveDropdown(null)}
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm transition focus:outline-none ${inputBg}`}
                      placeholder={config.semesterPlaceholder}
                    />
                    {renderSuggestions('semester', profile.semester || '', (val) => setProfile(p => ({ ...p, semester: val })))}
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${textMuted}`}>{config.goalLabel}</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="12"
                      value={profile.dailyGoalHours}
                      onChange={e => setProfile(p => ({ ...p, dailyGoalHours: parseInt(e.target.value) }))}
                      className="flex-1 accent-indigo-500 cursor-pointer"
                    />
                    <span className={`font-mono text-sm px-3 py-1 rounded-lg border w-16 text-center ${
                      isLightTheme 
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-200' 
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    }`}>
                      {profile.dailyGoalHours}h
                    </span>
                  </div>
                  <p className={`text-xs mt-1 ${textSub}`}>{config.goalSub}</p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className={`flex items-center gap-3 border-b pb-3 ${borderCol}`}>
                <Clock className="text-emerald-400 w-5 h-5" />
                <h3 className={`text-lg font-medium ${textTitle}`}>Circadian Rhythm & Daily Routine</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${textMuted}`}>Wake Up Time</label>
                  <input
                    type="time"
                    value={profile.wakeUpTime}
                    onChange={e => setProfile(p => ({ ...p, wakeUpTime: e.target.value }))}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm transition focus:outline-none ${inputBg}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${textMuted}`}>Sleep Time</label>
                  <input
                    type="time"
                    value={profile.sleepTime}
                    onChange={e => setProfile(p => ({ ...p, sleepTime: e.target.value }))}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm transition focus:outline-none ${inputBg}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${textMuted}`}>Coaching Timings (Optional)</label>
                  <input
                    type="text"
                    value={profile.coachingTimings || ''}
                    onChange={e => setProfile(p => ({ ...p, coachingTimings: e.target.value }))}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm transition focus:outline-none ${inputBg}`}
                    placeholder="e.g. 17:00-19:00"
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${textMuted}`}>Gym/Exercise Timing (Optional)</label>
                  <input
                    type="text"
                    value={profile.gymTiming || ''}
                    onChange={e => setProfile(p => ({ ...p, gymTiming: e.target.value }))}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm transition focus:outline-none ${inputBg}`}
                    placeholder="e.g. 07:00-08:00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${textMuted}`}>{config.commuteLabel}</label>
                  <input
                    type="number"
                    value={profile.travelTimeMinutes}
                    onChange={e => setProfile(p => ({ ...p, travelTimeMinutes: parseInt(e.target.value) || 0 }))}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm transition focus:outline-none ${inputBg}`}
                    min="0"
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${textMuted}`}>{config.homeworkLabel}</label>
                  <input
                    type="number"
                    value={profile.homeworkTimeMinutes}
                    onChange={e => setProfile(p => ({ ...p, homeworkTimeMinutes: parseInt(e.target.value) || 0 }))}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm transition focus:outline-none ${inputBg}`}
                    min="0"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className={`flex items-center gap-3 border-b pb-3 ${borderCol}`}>
                <Award className="text-amber-400 w-5 h-5" />
                <h3 className={`text-lg font-medium ${textTitle}`}>Subject Strengths & Weaknesses</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-rose-500 mb-1">{config.weakLabel}</label>
                  <p className={`text-xs mb-2 ${textMuted}`}>{config.weakSub}</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={newWeakSub}
                        onChange={e => {
                          setNewWeakSub(e.target.value);
                          setActiveDropdown('weak');
                        }}
                        onFocus={() => setActiveDropdown('weak')}
                        onBlur={() => setActiveDropdown(null)}
                        onKeyDown={e => e.key === 'Enter' && addWeakSubject()}
                        className={`w-full border rounded-xl px-4 py-2 text-sm transition focus:outline-none ${inputBg}`}
                        placeholder="e.g. Calculus, Physics Mechanics"
                      />
                      {renderSuggestions('weak', newWeakSub, (val) => setNewWeakSub(val))}
                    </div>
                    <button
                      type="button"
                      onClick={addWeakSubject}
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl px-4 text-sm font-medium transition"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {profile.weakSubjects.map(sub => (
                      <span key={sub} className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs px-2.5 py-1 rounded-lg">
                        {sub}
                        <button type="button" onClick={() => removeWeakSubject(sub)} className="hover:text-rose-700 font-bold ml-0.5">×</button>
                      </span>
                    ))}
                    {profile.weakSubjects.length === 0 && (
                      <span className={`text-xs ${textSub}`}>None added yet.</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-emerald-600 mb-1">{config.strongLabel}</label>
                  <p className={`text-xs mb-2 ${textMuted}`}>{config.strongSub}</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={newStrongSub}
                        onChange={e => {
                          setNewStrongSub(e.target.value);
                          setActiveDropdown('strong');
                        }}
                        onFocus={() => setActiveDropdown('strong')}
                        onBlur={() => setActiveDropdown(null)}
                        onKeyDown={e => e.key === 'Enter' && addStrongSubject()}
                        className={`w-full border rounded-xl px-4 py-2 text-sm transition focus:outline-none ${inputBg}`}
                        placeholder="e.g. English, Web Programming"
                      />
                      {renderSuggestions('strong', newStrongSub, (val) => setNewStrongSub(val))}
                    </div>
                    <button
                      type="button"
                      onClick={addStrongSubject}
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20 rounded-xl px-4 text-sm font-medium transition"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {profile.strongSubjects.map(sub => (
                      <span key={sub} className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs px-2.5 py-1 rounded-lg">
                        {sub}
                        <button type="button" onClick={() => removeStrongSubject(sub)} className="hover:text-emerald-800 font-bold ml-0.5">×</button>
                      </span>
                    ))}
                    {profile.strongSubjects.length === 0 && (
                      <span className={`text-xs ${textSub}`}>None added yet.</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className={`flex items-center gap-3 border-b pb-3 ${borderCol}`}>
                <Compass className="text-violet-400 w-5 h-5" />
                <h3 className={`text-lg font-medium ${textTitle}`}>Study Preferences</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-xs font-medium mb-2 ${textMuted}`}>Preferred Peak Focus Time</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['morning', 'afternoon', 'evening', 'night'].map((time) => (
                      <button
                        type="button"
                        key={time}
                        onClick={() => setProfile(p => ({ ...p, preferredStudyTime: time as any }))}
                        className={`px-3 py-2 text-sm rounded-xl border font-medium capitalize transition text-center ${
                          profile.preferredStudyTime === time
                            ? 'bg-indigo-500/25 border-indigo-500 text-indigo-500 font-semibold'
                            : isLightTheme
                            ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-350'
                            : 'bg-slate-900/60 border-slate-850 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-2 ${textMuted}`}>Focus Mode Break Strategy</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setProfile(p => ({ ...p, breakPreference: 'short' }))}
                      className={`p-3 text-left rounded-xl border transition ${
                        profile.breakPreference === 'short'
                          ? 'bg-indigo-500/25 border-indigo-500 text-indigo-500 font-semibold'
                          : isLightTheme
                          ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-350'
                          : 'bg-slate-900/60 border-slate-850 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-sm font-medium">Pomodoro 25/5</div>
                      <div className={`text-xs mt-1 ${textSub}`}>25 mins focus, 5 mins break. Perfect for intense concentration.</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfile(p => ({ ...p, breakPreference: 'long' }))}
                      className={`p-3 text-left rounded-xl border transition ${
                        profile.breakPreference === 'long'
                          ? 'bg-indigo-500/25 border-indigo-500 text-indigo-500 font-semibold'
                          : isLightTheme
                          ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-350'
                          : 'bg-slate-900/60 border-slate-850 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-sm font-medium">Ultradian 50/10</div>
                      <div className={`text-xs mt-1 ${textSub}`}>50 mins focus, 10 mins break. Perfect for complex research/math.</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-2 ${textMuted}`}>Daily Revision Preference</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { key: 'morning', title: 'Morning Revision', desc: 'Review yesterday\'s topics first thing' },
                      { key: 'night', title: 'Night Revision', desc: 'Consolidate today\'s learning before bed' },
                      { key: 'split', title: 'Split (Recommended)', desc: 'Short review morning and evening' }
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.key}
                        onClick={() => setProfile(p => ({ ...p, revisionPreference: item.key as any }))}
                        className={`p-3 text-left rounded-xl border transition flex flex-col justify-between h-full ${
                          profile.revisionPreference === item.key
                            ? 'bg-indigo-500/25 border-indigo-500 text-indigo-500 font-semibold'
                            : isLightTheme
                            ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-350'
                            : 'bg-slate-900/60 border-slate-850 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-sm font-medium">{item.title}</div>
                        <div className={`text-[10px] mt-1 ${textSub}`}>{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className={`flex justify-between items-center mt-8 pt-4 border-t ${borderCol}`}>
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1}
            className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-xl border transition ${
              step === 1
                ? 'border-transparent text-slate-400 cursor-not-allowed opacity-50'
                : isLightTheme
                ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 text-sm font-medium rounded-xl shadow-lg transition"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-6 py-2 text-sm font-medium rounded-xl shadow-lg shadow-emerald-500/10 transition"
            >
              <Check className="w-4 h-4" />
              Save Profile
            </button>
          )}
        </div>
      </div>

      {/* Danger Zone: Reset Application Data (Only visible when editing existing profile) */}
      {initialProfile && onResetAllData && (
        <div className={`mt-6 p-5 rounded-2xl border transition shadow-sm ${
          isLightTheme 
            ? 'bg-rose-50/70 border-rose-100 text-slate-900 shadow-rose-100/30' 
            : 'bg-rose-950/10 border-rose-950/40 text-rose-200 shadow-black/20'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-rose-500">
                <AlertTriangle className="w-4 h-4" />
                Danger Zone
              </h4>
              <p className={`text-xs mt-1.5 leading-relaxed ${isLightTheme ? 'text-slate-650' : 'text-slate-450'}`}>
                Irreversibly delete all profile details, custom study schedules, exams, homework tasks, and your focus history to start completely fresh from scratch.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs px-4 py-2.5 rounded-xl transition font-semibold shrink-0 shadow-lg shadow-rose-500/10"
            >
              Reset All Data
            </button>
          </div>
        </div>
      )}

      {/* Modern High-Contrast Modal Confirmation Dialog */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`border rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative ${
                isLightTheme 
                  ? 'bg-white border-rose-100 text-slate-900' 
                  : 'bg-slate-950 border-rose-950/80 text-white'
              }`}
            >
              <h4 className="text-sm font-bold flex items-center gap-2 text-rose-500 uppercase tracking-tight">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Are you absolutely sure?
              </h4>
              <p className={`text-xs leading-relaxed ${isLightTheme ? 'text-slate-650' : 'text-slate-400'}`}>
                This action is permanent and cannot be undone. All your optimized schedules, exam dates, active homework tasks, subject configuration, and analytics logs will be deleted from your browser's local storage immediately.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className={`text-xs px-4 py-2 rounded-xl transition font-semibold ${
                    isLightTheme 
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-350'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetConfirm(false);
                    onResetAllData?.();
                  }}
                  className="bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs px-4 py-2 rounded-xl transition font-semibold"
                >
                  Yes, Delete Everything
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
