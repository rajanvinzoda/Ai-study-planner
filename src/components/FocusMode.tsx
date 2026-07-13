import React, { useState, useEffect, useRef } from 'react';
import { FocusSession } from '../types';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, Minimize2, CheckCircle2, Award, Smile, SkipForward, Coffee } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FocusModeProps {
  subjects: string[];
  onSessionComplete: (session: FocusSession) => void;
}

export default function FocusMode({ subjects, onSessionComplete }: FocusModeProps) {
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || 'General Study');
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');
  const [durationPreset, setDurationPreset] = useState<number>(25); // minutes

  const [timeLeft, setTimeLeft] = useState<number>(25 * 60); // seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Audio Synthesizer States
  const [ambientSound, setAmbientSound] = useState<'none' | 'rain' | 'brown' | 'space'>('none');
  const [soundVolume, setSoundVolume] = useState<number>(0.5);

  // Rating modal upon completion
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [completedDuration, setCompletedDuration] = useState(25);
  const [focusRating, setFocusRating] = useState<number>(80);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Synthesizer Audio Nodes
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  useEffect(() => {
    // Sync presets when selected
    if (timerMode === 'focus') {
      setTimeLeft(durationPreset * 60);
    } else {
      setTimeLeft(durationPreset === 50 ? 10 * 60 : 5 * 60);
    }
    setIsRunning(false);
  }, [durationPreset, timerMode]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft]);

  // Handle ambient synthesizer when selection changes
  useEffect(() => {
    stopSynthesizer();
    if (ambientSound !== 'none') {
      startSynthesizer();
    }
    return () => {
      stopSynthesizer();
    };
  }, [ambientSound]);

  // Handle dynamic volume adjust
  useEffect(() => {
    if (noiseGainRef.current) {
      noiseGainRef.current.gain.value = soundVolume;
    }
  }, [soundVolume]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);

    // Play a friendly synthesized chime
    playChime();

    if (timerMode === 'focus') {
      setCompletedDuration(durationPreset);
      setShowRatingModal(true);
    } else {
      // Return to focus mode automatically
      setTimerMode('focus');
    }
  };

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.35); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
      osc2.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.35); // E5

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.8);
      osc2.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.log('Audio Context chime not supported yet');
    }
  };

  // Synthesize noise on-the-fly inside client-side Web Audio
  const startSynthesizer = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      // Create Brown/White Noise
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (ambientSound === 'brown') {
          // Brown noise integration
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5; // boost volume
        } else if (ambientSound === 'rain') {
          // Soft textured noise for rain
          output[i] = white;
        } else {
          // Deep cosmic white/pink texture
          output[i] = (lastOut + (0.12 * white)) / 1.12;
          lastOut = output[i];
          output[i] *= 1.8;
        }
      }

      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      if (ambientSound === 'rain') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, ctx.currentTime);
        filter.Q.setValueAtTime(1.5, ctx.currentTime);

        // Add low frequency rumbling rain wave
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.2, ctx.currentTime); // very slow wave
        lfoGain.gain.setValueAtTime(300, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();
        oscillatorRef.current = lfo;
      } else if (ambientSound === 'brown') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, ctx.currentTime);
      } else if (ambientSound === 'space') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(150, ctx.currentTime);

        // Slow modulating LFO for deep-space hover filter
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.08, ctx.currentTime); // 12 seconds cycle
        lfoGain.gain.setValueAtTime(60, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();
        oscillatorRef.current = lfo;
      }

      gain.gain.value = soundVolume;

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      source.start(0);

      noiseSourceRef.current = source;
      filterNodeRef.current = filter;
      noiseGainRef.current = gain;

    } catch (e) {
      console.error('Failed to initialize Web Audio Synthesizer:', e);
    }
  };

  const stopSynthesizer = () => {
    try {
      if (noiseSourceRef.current) {
        noiseSourceRef.current.stop();
        noiseSourceRef.current.disconnect();
        noiseSourceRef.current = null;
      }
      if (filterNodeRef.current) {
        filterNodeRef.current.disconnect();
        filterNodeRef.current = null;
      }
      if (noiseGainRef.current) {
        noiseGainRef.current.disconnect();
        noiseGainRef.current = null;
      }
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }
    } catch (e) {
      console.warn('Error cleanup synthesizer:', e);
    }
  };

  const handleRatingSubmit = () => {
    setShowRatingModal(false);
    onSessionComplete({
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      subject: selectedSubject,
      durationMinutes: completedDuration,
      completed: true,
      focusScore: focusRating,
      ambientSoundUsed: ambientSound
    });
    // Toggle to break mode automatically
    setTimerMode('break');
  };

  const handleSkip = () => {
    if (timerMode === 'focus') {
      setCompletedDuration(Math.round((durationPreset * 60 - timeLeft) / 60));
      setShowRatingModal(true);
    } else {
      setTimerMode('focus');
    }
  };

  const toggleTimer = () => {
    // Resume context if suspended (browser rules)
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    if (timerMode === 'focus') {
      setTimeLeft(durationPreset * 60);
    } else {
      setTimeLeft(durationPreset === 50 ? 10 * 60 : 5 * 60);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const radius = 100;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const totalDuration = timerMode === 'focus' ? durationPreset * 60 : (durationPreset === 50 ? 10 * 60 : 5 * 60);
  const strokeDashoffset = circumference - (timeLeft / totalDuration) * circumference;

  return (
    <div 
      className={`relative transition-all duration-300 ${
        isFullscreen 
          ? 'fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6' 
          : 'glass-panel-dark rounded-2xl p-6 md:p-8 max-w-2xl mx-auto my-6 shadow-xl'
      }`}
    >
      {/* Fullscreen control header */}
      <div className="absolute top-4 right-4 flex gap-2 no-print z-10">
        <button
          onClick={toggleFullscreen}
          className="p-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex flex-col items-center w-full max-w-md mx-auto text-center">
        {/* Step Header */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs px-3 py-1 rounded-full font-mono font-medium">
            {timerMode === 'focus' ? (
              <>
                <Award className="w-3 h-3" />
                Active Focus Session
              </>
            ) : (
              <>
                <Coffee className="w-3 h-3 animate-bounce" />
                Deserved Mindful Break
              </>
            )}
          </div>
          <h2 className="text-2xl font-display font-bold text-white mt-2">
            {timerMode === 'focus' ? `Study: ${selectedSubject}` : 'Rest & Recharge'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {timerMode === 'focus' ? 'Keep distractions far away. Dive into deep learning.' : 'Stretch, hydrate, breathe deeply, and look away from screen.'}
          </p>
        </div>

        {/* Preset Selector */}
        {timerMode === 'focus' && !isRunning && (
          <div className="flex gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-850 mb-6">
            {[25, 50, 90].map(mins => (
              <button
                key={mins}
                onClick={() => setDurationPreset(mins)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition ${
                  durationPreset === mins
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        )}

        {/* Circular Timer Visual */}
        <div className="relative my-4 flex items-center justify-center">
          <svg
            height={radius * 2}
            width={radius * 2}
            className="transform -rotate-90"
          >
            {/* Background Circle */}
            <circle
              stroke="rgba(255, 255, 255, 0.03)"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            {/* Progress Circle */}
            <circle
              stroke={timerMode === 'focus' ? '#6366f1' : '#10b981'}
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.35s' }}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-4xl font-display font-bold tracking-tight text-white font-mono">
              {formatTime(timeLeft)}
            </span>
            <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider mt-1">
              {timerMode === 'focus' ? 'FOCUS TIME' : 'BREAK'}
            </span>
          </div>
        </div>

        {/* Play / Pause / Reset Control Row */}
        <div className="flex items-center gap-4 my-6">
          <button
            onClick={resetTimer}
            className="p-3 border border-slate-800 hover:border-slate-700 bg-slate-900/40 text-slate-400 hover:text-white rounded-xl transition"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={toggleTimer}
            className={`p-5 text-white rounded-full transition-all duration-300 transform active:scale-95 shadow-xl ${
              timerMode === 'focus'
                ? 'bg-indigo-600 hover:bg-indigo-500 hover:scale-105 shadow-indigo-600/10'
                : 'bg-emerald-600 hover:bg-emerald-500 hover:scale-105 shadow-emerald-600/10'
            }`}
          >
            {isRunning ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white translate-x-0.5" />}
          </button>
          <button
            onClick={handleSkip}
            className="p-3 border border-slate-800 hover:border-slate-700 bg-slate-900/40 text-slate-400 hover:text-white rounded-xl transition"
            title="Skip/Complete"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Subject dropdown (during planning/before starting) */}
        {timerMode === 'focus' && !isRunning && subjects.length > 0 && (
          <div className="w-full max-w-xs mb-6 bg-slate-900/85 border border-slate-850 p-3 rounded-xl text-left">
            <label className="block text-[10px] font-medium text-slate-500 mb-1">Focus Target Subject</label>
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="w-full bg-slate-950 text-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none border border-slate-800"
            >
              {subjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        )}

        {/* Ambient Synthesizer Controls */}
        <div className="w-full max-w-xs bg-slate-900/50 p-4 rounded-xl border border-slate-850 text-left">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Ambient Sound Synth</span>
            <div className="flex items-center gap-1">
              <VolumeX className="w-3 h-3 text-slate-500" />
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.05"
                value={soundVolume}
                onChange={e => setSoundVolume(parseFloat(e.target.value))}
                className="w-16 accent-indigo-500 h-1 rounded"
              />
              <Volume2 className="w-3 h-3 text-slate-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'none', label: 'Silence' },
              { id: 'brown', label: 'Brown Noise' },
              { id: 'rain', label: 'Synth Rain' },
              { id: 'space', label: 'Cosmic Rumbler' },
            ].map(snd => (
              <button
                key={snd.id}
                onClick={() => setAmbientSound(snd.id as any)}
                className={`py-1.5 px-2.5 text-[10px] rounded-lg border font-medium text-center transition truncate ${
                  ambientSound === snd.id
                    ? 'bg-indigo-500/20 border-indigo-500/80 text-indigo-400'
                    : 'bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-350 hover:border-slate-750'
                }`}
              >
                {snd.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Complete Rating Modal overlay */}
      <AnimatePresence>
        {showRatingModal && (
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
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl relative"
            >
              <div className="w-12 h-12 bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-display font-semibold text-white">Focus Session Complete!</h3>
              <p className="text-xs text-slate-400 mt-1">Awesome effort! You successfully completed your focus block.</p>

              <div className="bg-slate-950 rounded-xl p-3 my-4 text-xs font-mono text-indigo-400 flex justify-between items-center">
                <span>{selectedSubject}</span>
                <span>{completedDuration} minutes</span>
              </div>

              {/* Slider for rating */}
              <div className="text-left mt-4 mb-6">
                <label className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                  <span>How was your Focus?</span>
                  <span className="text-indigo-400">{focusRating}% Focus Score</span>
                </label>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={focusRating}
                  onChange={e => setFocusRating(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 mt-1"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-1.5 font-mono">
                  <span>Distracted</span>
                  <span>Good Focus</span>
                  <span>Hyper Flow</span>
                </div>
              </div>

              <button
                onClick={handleRatingSubmit}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-xl text-xs transition"
              >
                Log Session & Take Break
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
