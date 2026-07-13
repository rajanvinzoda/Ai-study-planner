import React, { useState, useRef } from 'react';
import { ParsedTimetable, TimeSlot } from '../types';
import { Download, Printer, Layout, Sparkles, Check, FileText, Calendar, Trash2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ExportScheduleProps {
  timetable?: ParsedTimetable;
  aiTimetable?: ParsedTimetable;
  onClearInstitutional?: () => void;
  onClearAi?: () => void;
}

type PosterTheme = 'apple' | 'material' | 'glass' | 'cyberpunk' | 'sunset' | 'forest' | 'ocean' | 'amoled';

function guessHslFromVariable(content: string): { h: number; s: number; l: number } {
  const lower = content.toLowerCase();
  if (lower.includes('slate') || lower.includes('gray') || lower.includes('zinc') || lower.includes('neutral') || lower.includes('stone')) {
    return { h: 220, s: 10, l: 45 };
  }
  if (lower.includes('indigo')) {
    return { h: 239, s: 84, l: 67 };
  }
  if (lower.includes('violet') || lower.includes('purple')) {
    return { h: 262, s: 83, l: 58 };
  }
  if (lower.includes('blue')) {
    return { h: 221, s: 83, l: 53 };
  }
  if (lower.includes('emerald') || lower.includes('green')) {
    return { h: 142, s: 71, l: 45 };
  }
  if (lower.includes('amber') || lower.includes('yellow')) {
    return { h: 38, s: 92, l: 50 };
  }
  if (lower.includes('rose') || lower.includes('red') || lower.includes('pink')) {
    return { h: 350, s: 89, l: 60 };
  }
  if (lower.includes('sunset') || lower.includes('orange')) {
    return { h: 24, s: 94, l: 50 };
  }
  return { h: 224, s: 20, l: 40 };
}

function parseAlpha(alphaStr: string | null): number {
  if (!alphaStr) return 1;
  const cleaned = alphaStr.trim();
  if (cleaned.includes('var(')) {
    return 0.85;
  }
  let val = parseFloat(cleaned);
  if (cleaned.endsWith('%')) {
    val = val / 100;
  }
  return isNaN(val) ? 1 : val;
}

function replaceColorFunction(cssText: string, name: string, replacer: (match: string, contents: string) => string): string {
  let result = '';
  let currentIndex = 0;
  
  while (true) {
    const regex = new RegExp(name + '\\(', 'i');
    const searchStr = cssText.slice(currentIndex);
    const matchObj = searchStr.match(regex);
    
    if (!matchObj || matchObj.index === undefined) {
      result += searchStr;
      break;
    }
    
    const index = currentIndex + matchObj.index;
    const actualTarget = matchObj[0];
    
    result += cssText.slice(currentIndex, index);
    
    let depth = 1;
    let i = index + actualTarget.length;
    while (i < cssText.length && depth > 0) {
      const char = cssText[i];
      if (char === '(') {
        depth++;
      } else if (char === ')') {
        depth--;
      }
      i++;
    }
    
    if (depth === 0) {
      const match = cssText.slice(index, i);
      const contents = cssText.slice(index + actualTarget.length, i - 1);
      const replacement = replacer(match, contents);
      result += replacement;
      currentIndex = i;
    } else {
      result += actualTarget;
      currentIndex = index + actualTarget.length;
    }
  }
  
  return result;
}

function convertOklchToHsl(cssText: string): string {
  return replaceColorFunction(cssText, 'oklch', (match, contents) => {
    try {
      const parts = contents.split('/');
      const lchPart = parts[0].trim();
      const alphaPart = parts[1] ? parts[1].trim() : null;

      if (contents.includes('from') || contents.includes('var(')) {
        const { h, s, l } = guessHslFromVariable(contents);
        const alpha = parseAlpha(alphaPart);
        if (alphaPart) {
          return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
        }
        return `hsl(${h}, ${s}%, ${l}%)`;
      }

      const lchValues = lchPart.split(/[\s,]+/);
      if (lchValues.length < 3) {
        return 'hsl(240, 5%, 50%)';
      }

      const lStr = lchValues[0];
      const cStr = lchValues[1];
      const hStr = lchValues[2];

      let l = 0.5;
      if (lStr.endsWith('%')) {
        l = parseFloat(lStr) / 100;
      } else {
        l = parseFloat(lStr);
      }

      let c = parseFloat(cStr);
      if (isNaN(c)) c = 0;

      let h = parseFloat(hStr);
      if (isNaN(h)) h = 0;

      const lHsl = Math.round(l * 100);
      const sHsl = Math.min(100, Math.round((c / 0.4) * 100));
      const hHsl = Math.round(h);

      if (alphaPart) {
        const alpha = parseAlpha(alphaPart);
        return `hsla(${hHsl}, ${sHsl}%, ${lHsl}%, ${alpha})`;
      } else {
        return `hsl(${hHsl}, ${sHsl}%, ${lHsl}%)`;
      }
    } catch (err) {
      console.error("Error converting OKLCH match:", match, err);
      return 'hsl(240, 5%, 50%)';
    }
  });
}

function convertOklabToHsl(cssText: string): string {
  return replaceColorFunction(cssText, 'oklab', (match, contents) => {
    try {
      const parts = contents.split('/');
      const labPart = parts[0].trim();
      const alphaPart = parts[1] ? parts[1].trim() : null;

      if (contents.includes('from') || contents.includes('var(')) {
        const { h, s, l } = guessHslFromVariable(contents);
        const alpha = parseAlpha(alphaPart);
        if (alphaPart) {
          return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
        }
        return `hsl(${h}, ${s}%, ${l}%)`;
      }

      const labValues = labPart.split(/[\s,]+/);
      if (labValues.length < 3) {
        return 'hsl(240, 5%, 50%)';
      }

      const lStr = labValues[0];
      const aStr = labValues[1];
      const bStr = labValues[2];

      let l = 0.5;
      if (lStr.endsWith('%')) {
        l = parseFloat(lStr) / 100;
      } else {
        l = parseFloat(lStr);
      }

      let a = parseFloat(aStr);
      let b = parseFloat(bStr);
      if (isNaN(a)) a = 0;
      if (isNaN(b)) b = 0;

      // Calculate chroma and hue approximation from a and b
      const c = Math.sqrt(a * a + b * b);
      let h = Math.atan2(b, a) * (180 / Math.PI);
      if (h < 0) h += 360;

      const lHsl = Math.round(l * 100);
      const sHsl = Math.min(100, Math.round((c / 0.4) * 100));
      const hHsl = Math.round(h);

      if (alphaPart) {
        const alpha = parseAlpha(alphaPart);
        return `hsla(${hHsl}, ${sHsl}%, ${lHsl}%, ${alpha})`;
      } else {
        return `hsl(${hHsl}, ${sHsl}%, ${lHsl}%)`;
      }
    } catch (err) {
      console.error("Error converting OKLAB match:", match, err);
      return 'hsl(240, 5%, 50%)';
    }
  });
}

function convertColorMixToHsl(cssText: string): string {
  return replaceColorFunction(cssText, 'color-mix', (match, contents) => {
    try {
      const { h, s, l } = guessHslFromVariable(contents);
      return `hsl(${h}, ${s}%, ${l}%)`;
    } catch (e) {
      return 'hsl(240, 5%, 50%)';
    }
  });
}

function convertLightDarkToHsl(cssText: string): string {
  return replaceColorFunction(cssText, 'light-dark', (match, contents) => {
    try {
      const parts = contents.split(',');
      const firstColor = parts[0]?.trim() || '';
      if (firstColor.includes('var(')) {
        const { h, s, l } = guessHslFromVariable(firstColor);
        return `hsl(${h}, ${s}%, ${l}%)`;
      }
      return firstColor || 'hsl(240, 5%, 50%)';
    } catch (e) {
      return 'hsl(240, 5%, 50%)';
    }
  });
}

export default function ExportSchedule({ 
  timetable, 
  aiTimetable,
  onClearInstitutional,
  onClearAi
}: ExportScheduleProps) {
  // Switcher to decide which timetable to render
  const [activeTimetableKey, setActiveTimetableKey] = useState<'institutional' | 'ai'>(
    timetable ? 'institutional' : 'ai'
  );
  const [selectedTheme, setSelectedTheme] = useState<PosterTheme>('apple');
  const [layoutMode, setLayoutMode] = useState<'portrait' | 'landscape'>('portrait');
  const [confirmClearType, setConfirmClearType] = useState<'institutional' | 'ai' | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const getSubjectsCount = (t?: ParsedTimetable) => {
    if (!t || !t.timeSlots) return 0;
    const set = new Set(t.timeSlots.map(s => s.subject).filter(Boolean));
    return set.size;
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    
    try {
      const element = printRef.current;
      
      // Calculate layout orientation settings for PDF
      const isLandscape = layoutMode === 'landscape';
      const pdfWidth = isLandscape ? 297 : 210;
      const pdfHeight = isLandscape ? 210 : 297;
      
      // Render canvas with 2x scale for crisp print definition
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: selectedTheme === 'amoled' ? '#000000' : 
                         selectedTheme === 'apple' ? '#f8fafc' : 
                         selectedTheme === 'cyberpunk' ? '#09090b' : null,
        logging: false,
        onclone: (clonedDoc) => {
          // 0. Enforce a fixed desktop-optimized width on the cloned element to ensure crisp, non-stacked column structures
          const clonedPoster = clonedDoc.getElementById('printable-schedule-poster');
          if (clonedPoster) {
            const targetWidth = isLandscape ? '1440px' : '1024px';
            clonedPoster.style.setProperty('width', targetWidth, 'important');
            clonedPoster.style.setProperty('min-width', targetWidth, 'important');
            clonedPoster.style.setProperty('max-width', targetWidth, 'important');
          }

          // 1. Convert all inline styles, fills, and strokes containing oklch, oklab, color-mix, or light-dark to HSL fallbacks
          const allClonedElements = clonedDoc.querySelectorAll('*');
          allClonedElements.forEach(el => {
            // style attribute
            const styleAttr = el.getAttribute('style');
            if (styleAttr) {
              let newStyle = styleAttr;
              const lower = newStyle.toLowerCase();
              if (lower.includes('oklch')) newStyle = convertOklchToHsl(newStyle);
              if (lower.includes('oklab')) newStyle = convertOklabToHsl(newStyle);
              if (lower.includes('color-mix')) newStyle = convertColorMixToHsl(newStyle);
              if (lower.includes('light-dark')) newStyle = convertLightDarkToHsl(newStyle);
              el.setAttribute('style', newStyle);
            }
            // fill attribute
            const fillAttr = el.getAttribute('fill');
            if (fillAttr) {
              let newFill = fillAttr;
              const lower = newFill.toLowerCase();
              if (lower.includes('oklch')) newFill = convertOklchToHsl(newFill);
              if (lower.includes('oklab')) newFill = convertOklabToHsl(newFill);
              if (lower.includes('color-mix')) newFill = convertColorMixToHsl(newFill);
              if (lower.includes('light-dark')) newFill = convertLightDarkToHsl(newFill);
              el.setAttribute('fill', newFill);
            }
            // stroke attribute
            const strokeAttr = el.getAttribute('stroke');
            if (strokeAttr) {
              let newStroke = strokeAttr;
              const lower = newStroke.toLowerCase();
              if (lower.includes('oklch')) newStroke = convertOklchToHsl(newStroke);
              if (lower.includes('oklab')) newStroke = convertOklabToHsl(newStroke);
              if (lower.includes('color-mix')) newStroke = convertColorMixToHsl(newStroke);
              if (lower.includes('light-dark')) newStroke = convertLightDarkToHsl(newStroke);
              el.setAttribute('stroke', newStroke);
            }
          });

          // 2. Extract CSS from all styleSheets loaded on the main active window
          const originalSheets = Array.from(document.styleSheets);
          let combinedCss = '';
          originalSheets.forEach(sheet => {
            try {
              if (sheet.cssRules) {
                const rules = Array.from(sheet.cssRules);
                const cssText = rules.map(rule => rule.cssText).join('\n');
                combinedCss += cssText + '\n';
              }
            } catch (e) {
              console.warn("Could not read stylesheet rules:", e);
            }
          });

          // 3. Convert all oklch, oklab, color-mix, and light-dark occurrences inside the combined CSS to hsl
          let convertedCss = combinedCss;
          const lowerCss = convertedCss.toLowerCase();
          if (lowerCss.includes('oklch')) {
            convertedCss = convertOklchToHsl(convertedCss);
          }
          if (lowerCss.includes('oklab')) {
            convertedCss = convertOklabToHsl(convertedCss);
          }
          if (lowerCss.includes('color-mix')) {
            convertedCss = convertColorMixToHsl(convertedCss);
          }
          if (lowerCss.includes('light-dark')) {
            convertedCss = convertLightDarkToHsl(convertedCss);
          }

          // 4. Remove all original style sheets and link tags from clonedDoc to prevent html2canvas parsing crashes
          const clonedStylesAndLinks = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
          clonedStylesAndLinks.forEach(el => el.remove());

          // 5. Inject our processed, safe CSS block containing converted HSL colors
          const newStyleEl = clonedDoc.createElement('style');
          newStyleEl.textContent = convertedCss;
          clonedDoc.head.appendChild(newStyleEl);
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: layoutMode,
        unit: 'mm',
        format: 'a4',
      });
      
      // Determine background fill matching current poster theme to eliminate white borders
      let fillHex = '#ffffff';
      if (selectedTheme === 'amoled') fillHex = '#000000';
      else if (selectedTheme === 'apple') fillHex = '#f8fafc';
      else if (selectedTheme === 'cyberpunk') fillHex = '#09090b';
      else if (selectedTheme === 'material') fillHex = '#1a237e'; 
      else if (selectedTheme === 'glass') fillHex = '#0f172a'; 
      else if (selectedTheme === 'sunset') fillHex = '#9f1239'; 
      else if (selectedTheme === 'forest') fillHex = '#022c22'; 
      else if (selectedTheme === 'ocean') fillHex = '#082f49'; 
      
      pdf.setFillColor(fillHex);
      pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
      
      // Compute best proportional dimensions preserving aspect ratio
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const canvasRatio = canvasWidth / canvasHeight;
      const pdfRatio = pdfWidth / pdfHeight;
      
      let drawWidth = pdfWidth;
      let drawHeight = pdfHeight;
      
      if (canvasRatio > pdfRatio) {
        // Canvas is wider than PDF page aspect ratio (scale by width)
        drawWidth = pdfWidth;
        drawHeight = pdfWidth / canvasRatio;
      } else {
        // Canvas is taller than PDF page aspect ratio (scale by height)
        drawHeight = pdfHeight;
        drawWidth = pdfHeight * canvasRatio;
      }
      
      const posX = (pdfWidth - drawWidth) / 2;
      const posY = (pdfHeight - drawHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', posX, posY, drawWidth, drawHeight);
      
      const fileLabel = activeTimetableKey === 'ai' ? '7Day_Master_Study_Schedule' : 'Class_Timetable';
      pdf.save(`${fileLabel}_${selectedTheme}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const activeTimetable = activeTimetableKey === 'institutional' ? timetable : aiTimetable;

  const themes: Record<PosterTheme, { name: string; bg: string; card: string; text: string; accent: string }> = {
    apple: {
      name: 'Apple Minimal',
      bg: 'bg-slate-50 text-slate-900',
      card: 'bg-white border border-slate-100 shadow-sm rounded-xl',
      text: 'text-slate-800',
      accent: 'bg-slate-900 text-white'
    },
    material: {
      name: 'Material Design',
      bg: 'bg-indigo-900 text-white',
      card: 'bg-indigo-800/80 border border-indigo-700/50 shadow-md rounded-2xl',
      text: 'text-indigo-100',
      accent: 'bg-pink-500 text-white'
    },
    glass: {
      name: 'Glassmorphism',
      bg: 'bg-gradient-to-tr from-slate-900 via-violet-950 to-slate-900 text-white',
      card: 'bg-white/10 backdrop-blur-md border border-white/15 shadow-xl rounded-2xl',
      text: 'text-slate-200',
      accent: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
    },
    cyberpunk: {
      name: 'Cyberpunk 2077',
      bg: 'bg-zinc-950 text-yellow-400',
      card: 'bg-zinc-900 border-2 border-yellow-400 shadow-[4px_4px_0px_0px_rgba(234,179,8,1)] rounded-none',
      text: 'text-zinc-300',
      accent: 'bg-yellow-400 text-black font-mono font-bold'
    },
    sunset: {
      name: 'Sunset Glow',
      bg: 'bg-gradient-to-b from-orange-500 to-rose-600 text-white',
      card: 'bg-white/10 backdrop-blur-md border border-white/10 shadow-lg rounded-xl',
      text: 'text-orange-50',
      accent: 'bg-amber-400 text-rose-900 font-semibold'
    },
    forest: {
      name: 'Forest Moss',
      bg: 'bg-gradient-to-tr from-emerald-950 via-slate-950 to-emerald-950 text-white',
      card: 'bg-emerald-900/20 border border-emerald-800/30 shadow-md rounded-xl',
      text: 'text-emerald-100',
      accent: 'bg-emerald-500 text-slate-950 font-semibold'
    },
    ocean: {
      name: 'Ocean Deep',
      bg: 'bg-gradient-to-tr from-sky-950 via-blue-950 to-slate-950 text-white',
      card: 'bg-sky-900/20 border border-sky-800/30 shadow-md rounded-xl',
      text: 'text-sky-100',
      accent: 'bg-sky-400 text-slate-950'
    },
    amoled: {
      name: 'AMOLED Black',
      bg: 'bg-black text-white',
      card: 'bg-zinc-950 border border-zinc-800 shadow-none rounded-xl',
      text: 'text-zinc-400',
      accent: 'bg-white text-black font-semibold'
    }
  };

  const currentTheme = themes[selectedTheme];

  const handlePrint = () => {
    window.print();
  };

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Helper to filter slots for a specific day and sort by start time
  const getSlotsForDay = (day: string): TimeSlot[] => {
    if (!activeTimetable || !activeTimetable.timeSlots) return [];
    return activeTimetable.timeSlots
      .filter(slot => slot.days.includes(day))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getSlotColor = (type: string): string => {
    switch (type) {
      case 'lecture': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25';
      case 'lab': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
      case 'tutorial': return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
      case 'break': return 'bg-slate-500/10 text-slate-400 border-slate-500/25';
      case 'lunch': return 'bg-rose-500/10 text-rose-400 border-rose-500/25';
      default: return 'bg-violet-500/10 text-violet-400 border-violet-500/25';
    }
  };

  if (!activeTimetable) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-6 bg-slate-900 rounded-2xl border border-slate-850 space-y-4">
        <Layout className="w-12 h-12 text-slate-500 mx-auto animate-bounce" />
        <h3 className="text-sm font-semibold text-white">No Timetable Selected</h3>
        <p className="text-xs text-slate-400">Please generate or upload a timetable first.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto my-6 p-1">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-display font-semibold text-white flex items-center gap-2">
            <Layout className="text-indigo-400 w-5 h-5" />
            Timetable Designer & Export
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Choose a visual design theme and layout to print or download a high-res poster.
          </p>
        </div>

        {/* Action Triggers */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-indigo-400 text-white text-xs px-4 py-2.5 rounded-xl font-semibold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 cursor-pointer disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-indigo-200 border-t-transparent rounded-full animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs px-4 py-2.5 rounded-xl font-semibold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Poster</span>
          </button>
        </div>
      </div>

      {/* Timetable Selection Cards */}
      <div className="mb-8 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
            <Layout className="w-3.5 h-3.5 text-indigo-400" />
            Select Timetable to Customize & Export
          </h3>
          <span className="text-[10px] text-slate-500 font-mono bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-800">
            {timetable && aiTimetable ? '2 Saved Schedules' : '1 Saved Schedule'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Institutional Timetable */}
          <div
            onClick={() => {
              if (timetable) {
                setActiveTimetableKey('institutional');
              }
            }}
            className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
              !timetable
                ? 'bg-slate-950/20 border-slate-900 border-dashed opacity-50 cursor-not-allowed select-none'
                : activeTimetableKey === 'institutional'
                ? 'bg-gradient-to-br from-indigo-950/20 via-slate-900/90 to-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/5 cursor-pointer'
                : 'bg-slate-900/50 border-slate-850 hover:border-slate-700 hover:bg-slate-900/80 cursor-pointer'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className={`p-3 rounded-xl border transition-colors ${
                  activeTimetableKey === 'institutional' && timetable
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                    : 'bg-slate-950 border-slate-850 text-slate-400'
                }`}>
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">Institutional Timetable</h4>
                    {activeTimetableKey === 'institutional' && timetable && (
                      <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate max-w-[240px] md:max-w-[320px]">
                    {timetable ? (timetable.institution || 'Fixed Class Schedule') : 'Not uploaded yet'}
                  </p>
                  {timetable && (
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono pt-1">
                      <span>{timetable.timeSlots.length} Classes</span>
                      {timetable.department && (
                        <>
                          <span className="opacity-45">•</span>
                          <span className="truncate max-w-[120px]">{timetable.department}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Indicator / Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {timetable ? (
                  <>
                    {/* Tiny representation grid */}
                    <div className="hidden sm:flex gap-0.5 items-end h-6">
                      {[1, 2, 3, 4, 5].map((d) => (
                        <div 
                          key={d} 
                          className={`w-1.5 rounded-full transition-all duration-300 ${
                            activeTimetableKey === 'institutional' 
                              ? 'bg-indigo-500 h-4' 
                              : 'bg-slate-700 h-2'
                          }`} 
                        />
                      ))}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmClearType('institutional');
                      }}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      title="Delete Timetable"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <span className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: AI Study Schedule */}
          <div
            onClick={() => {
              if (aiTimetable) {
                setActiveTimetableKey('ai');
              }
            }}
            className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
              !aiTimetable
                ? 'bg-slate-950/20 border-slate-900 border-dashed opacity-50 cursor-not-allowed select-none'
                : activeTimetableKey === 'ai'
                ? 'bg-gradient-to-br from-indigo-950/20 via-slate-900/90 to-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/5 cursor-pointer'
                : 'bg-slate-900/50 border-slate-850 hover:border-slate-700 hover:bg-slate-900/80 cursor-pointer'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className={`p-3 rounded-xl border transition-colors ${
                  activeTimetableKey === 'ai' && aiTimetable
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                    : 'bg-slate-950 border-slate-850 text-slate-400'
                }`}>
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">7-Day Study Plan</h4>
                    {activeTimetableKey === 'ai' && aiTimetable && (
                      <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate max-w-[240px] md:max-w-[320px]">
                    {aiTimetable ? 'Personalized Study Guide' : 'Not generated yet'}
                  </p>
                  {aiTimetable && (
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono pt-1">
                      <span>{aiTimetable.timeSlots.length} Sessions</span>
                      <span className="opacity-45">•</span>
                      <span>{getSubjectsCount(aiTimetable)} Subjects</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Indicator / Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {aiTimetable ? (
                  <>
                    {/* Tiny representation grid */}
                    <div className="hidden sm:flex gap-0.5 items-end h-6">
                      {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                        <div 
                          key={d} 
                          className={`w-1.5 rounded-full transition-all duration-300 ${
                            activeTimetableKey === 'ai' 
                              ? 'bg-indigo-400 h-5' 
                              : 'bg-slate-700 h-2'
                          }`} 
                        />
                      ))}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmClearType('ai');
                      }}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      title="Delete Schedule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <span className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print stylesheet override */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          /* Hide all headers, tabs, select cards and sidebars during print */
          header,
          footer,
          .mb-8,
          .lg\\:col-span-1,
          .fixed,
          nav,
          button {
            display: none !important;
          }
          .lg\\:col-span-3 {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-card {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
          }
        }
      `}</style>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Style selection sidebar */}
        <div className="lg:col-span-1 space-y-4">

          <div className="glass-panel-dark rounded-xl p-4 border border-slate-850">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              Poster Style Themes
            </h3>

            <div className="space-y-1.5">
              {Object.entries(themes).map(([key, item]) => (
                <button
                  key={key}
                  onClick={() => setSelectedTheme(key as PosterTheme)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs font-medium transition border flex items-center justify-between ${
                    selectedTheme === key
                      ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                      : 'bg-slate-900 border-slate-850 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span>{item.name}</span>
                  {selectedTheme === key && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel-dark rounded-xl p-4 border border-slate-850">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5 font-mono">
              Page Orientation
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setLayoutMode('portrait')}
                className={`py-2 rounded-lg text-xs font-medium border text-center transition ${
                  layoutMode === 'portrait' ? 'bg-indigo-600/15 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-slate-850 text-slate-500'
                }`}
              >
                Portrait
              </button>
              <button
                onClick={() => setLayoutMode('landscape')}
                className={`py-2 rounded-lg text-xs font-medium border text-center transition ${
                  layoutMode === 'landscape' ? 'bg-indigo-600/15 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-slate-850 text-slate-500'
                }`}
              >
                Landscape
              </button>
            </div>
          </div>
        </div>

        {/* Poster live render area */}
        <div className="lg:col-span-3">
          <div
            ref={printRef}
            id="printable-schedule-poster"
            className={`transition-all duration-300 p-8 shadow-2xl overflow-x-auto print-card ${currentTheme.bg} ${
              layoutMode === 'landscape' ? 'min-w-[700px]' : ''
            }`}
          >
            {/* Header branding */}
            <div className="border-b border-current/10 pb-6 mb-8 flex justify-between items-start">
              <div>
                <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full ${currentTheme.accent}`}>
                  {activeTimetable.institution || (activeTimetableKey === 'ai' ? '7-DAY STUDY PLAN' : 'ACADEMIC COMMITMENTS')}
                </span>
                <h1 className="text-3xl font-display font-black tracking-tight mt-3 uppercase">
                  {activeTimetableKey === 'ai' ? '7-Day Study Schedule' : 'CLASS TIMETABLE'}
                </h1>
                <p className="text-xs opacity-80 mt-1 uppercase tracking-wide font-mono">
                  {activeTimetable.department ? `${activeTimetable.department}  •  ` : ''}
                  {activeTimetable.semester ? `${activeTimetable.semester}  •  ` : ''}
                  {activeTimetable.division ? `${activeTimetable.division}` : ''}
                </p>
              </div>
              <div className="text-right font-mono text-[10px] opacity-75">
                SMART STUDY PLANNER<br />
                PRINT READY • ULTRA HD
              </div>
            </div>

            {/* Timetable Grid rendering */}
            <div className={`grid gap-4 ${layoutMode === 'landscape' ? 'grid-cols-7' : 'grid-cols-1 md:grid-cols-3'}`}>
              {weekdays.map(day => {
                const daySlots = getSlotsForDay(day);
                if (daySlots.length === 0 && layoutMode === 'portrait') return null;

                return (
                  <div key={day} className={`flex flex-col gap-2.5 ${currentTheme.card} p-4`}>
                    <h3 className="text-sm font-display font-bold border-b border-current/10 pb-1.5 flex justify-between items-center">
                      <span>{day}</span>
                      <span className="text-[10px] font-mono opacity-50">({daySlots.length})</span>
                    </h3>

                    <div className="space-y-2 flex-1">
                      {daySlots.map((slot, index) => (
                        <div
                          key={index}
                          className={`p-2.5 rounded-lg border flex flex-col justify-between gap-1.5 ${getSlotColor(slot.type)}`}
                        >
                          <div>
                            <div className="text-xs font-bold tracking-tight text-slate-800 dark:text-white truncate">
                              {slot.subject}
                            </div>
                            <div className="text-[10px] font-mono font-medium opacity-80 mt-0.5">
                              {slot.startTime} - {slot.endTime}
                            </div>
                          </div>
                          {(slot.room || slot.teacher) && (
                            <div className="flex justify-between items-center text-[8px] font-mono opacity-60 uppercase tracking-wider pt-1 border-t border-white/5">
                              <span>{slot.room || ''}</span>
                              <span>{slot.teacher || ''}</span>
                            </div>
                          )}
                        </div>
                      ))}

                      {daySlots.length === 0 && (
                        <div className="text-center py-6 text-[10px] opacity-40 italic">
                          No sessions
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Poster Footer */}
            {activeTimetable.notes && (
              <div className="mt-8 pt-4 border-t border-current/10 text-[10px] opacity-75 leading-relaxed">
                <strong>Important Notes:</strong> {activeTimetable.notes}
              </div>
            )}
            <div className="text-center text-[8px] opacity-40 mt-12 font-mono">
              Designed with Smart Study Assistant. Instant secure local processing. Privacy Reserved.
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Removing Timetable */}
      <AnimatePresence>
        {confirmClearType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmClearType(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative z-10 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-450 flex items-center justify-center mx-auto border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-white">
                  Remove {confirmClearType === 'institutional' ? 'Institutional' : '7-Day Study'} Timetable?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Are you sure you want to permanently delete your {confirmClearType === 'institutional' ? 'Institutional Fixed Timetable' : '7-Day Study Schedule'}? This will clear all parsed data from local storage.
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setConfirmClearType(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs py-2.5 rounded-xl font-semibold transition"
                >
                  No, Keep It
                </button>
                <button
                  onClick={() => {
                    if (confirmClearType === 'institutional') {
                      if (onClearInstitutional) onClearInstitutional();
                      setActiveTimetableKey('ai');
                    } else {
                      if (onClearAi) onClearAi();
                      setActiveTimetableKey('institutional');
                    }
                    setConfirmClearType(null);
                  }}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Yes, Remove
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
