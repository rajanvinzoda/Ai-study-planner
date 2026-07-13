import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Increase JSON limit for file uploads (images/PDFs)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy initializer for Google GenAI client to prevent startup crash if API key is missing
function getAiClient(req?: express.Request): GoogleGenAI {
  // Use the provided production API key as default if process.env.GEMINI_API_KEY is not configured
  const defaultApiKey = "AQ.Ab8RN6LLVVbtNpUigDb3nUolWfs0KJT_6XAOFWI05tw4Dm3jIw";
  const apiKey = process.env.GEMINI_API_KEY || defaultApiKey;

  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Global API status endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// Endpoint: Test custom or global AI API key
app.post("/api/ai/test", async (req, res) => {
  try {
    const ai = getAiClient(req);
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Respond in 10-15 words confirming your integration is successful and you are ready.",
    });
    res.json({
      success: true,
      message: response.text?.trim() || "API key tested successfully!"
    });
  } catch (error: any) {
    console.error("Error testing AI key:", error);
    res.status(400).json({
      success: false,
      error: error.message || "Invalid API key or network error."
    });
  }
});

// Endpoint: General AI Chat Assistant / Doubt Solver
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { messages, profile, timetable, aiTimetable, exams, assignments, tasks } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing or invalid 'messages' field in request body." });
    }

    const ai = getAiClient(req);

    // Build the system instructions containing the contextual data about the student
    const systemInstruction = `You are "StudyBuddy", an elite personal academic assistant and tutor.
Your purpose is to help the student with their timetable, assignments, exams, study habits, and answer any doubts they have about any subject.

Student Profile:
- Role: ${profile?.role || "Student"}
- Study preferences: prefers "${profile?.preferredStudyTime || "Flexible"}" study time
- Daily focus goal: target of ${profile?.dailyGoalHours || "4"} hours of focus per day
- Subjects/Topics of interest: ${JSON.stringify(profile?.customSubjects || [])}

Current Fixed Institutional Timetable:
${timetable && timetable.timeSlots?.length > 0 ? JSON.stringify(timetable.timeSlots) : "No institutional timetable uploaded yet."}

Current 7-Day Personalized Study Schedule:
${aiTimetable && aiTimetable.timeSlots?.length > 0 ? JSON.stringify(aiTimetable.timeSlots) : "No study plan has been generated yet."}

Upcoming Exams:
${exams && exams.length > 0 ? JSON.stringify(exams) : "No exams recorded."}

Upcoming Assignments:
${assignments && assignments.length > 0 ? JSON.stringify(assignments) : "No assignments recorded."}

Outstanding Tasks:
${tasks && tasks.length > 0 ? JSON.stringify(tasks) : "No tasks recorded."}

Instructions:
1. Provide highly encouraging, organized, intelligent, and academically rigorous support.
2. If the user asks about their classes, subjects, rooms, teachers, study schedule, or upcoming tasks/exams/assignments, consult the provided data and answer accurately.
3. If the user asks a doubt about any academic subject (Math, Physics, Biology, History, Computer Science, etc.), act as an expert teacher. Explain concepts step-by-step with simple, clear analogies. Use Markdown formatting, bullet points, and code blocks as appropriate for readability.
4. If they ask how to generate schedules or organize items, guide them nicely to use the corresponding tabs in the app (e.g. Dashboard for quick tasks, Timetable tab to upload/parse or generate a 7-day plan, Calendar for assignments/exams, Focus Mode for studying).
5. Ensure your tone is friendly, empathetic, yet mentoring. Avoid mentioning raw JSON structure or internal system parameters unless explicitly requested. Keep the dialogue highly natural and human-like.`;

    // Map conversation messages to the format expected by the @google/genai SDK
    const contents = messages.map((msg: any) => ({
      role: msg.role === "assistant" || msg.role === "model" ? "model" : "user",
      parts: [{ text: msg.content || "" }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({
      success: true,
      reply: response.text || "I apologize, but I couldn't formulate a response. Please try again."
    });
  } catch (error: any) {
    console.error("Error in AI Chat endpoint:", error);
    res.status(500).json({
      error: error.message || "An error occurred in the StudyBuddy Chat Assistant."
    });
  }
});

// Timetable parsing schema (strict format output)
const timetableSchema = {
  type: Type.OBJECT,
  properties: {
    institution: { type: Type.STRING, description: "Name of school, college, or university if detected" },
    department: { type: Type.STRING, description: "Department or branch if detected (e.g. Computer Science, Science, Commerce)" },
    semester: { type: Type.STRING, description: "Semester or year if detected" },
    division: { type: Type.STRING, description: "Division, standard, or section if detected" },
    timeSlots: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING, description: "The subject or course name" },
          startTime: { type: Type.STRING, description: "Start time of class in 24-hour format HH:MM, e.g. '09:00'" },
          endTime: { type: Type.STRING, description: "End time of class in 24-hour format HH:MM, e.g. '10:00'" },
          days: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Array of weekdays this class occurs, e.g., ['Monday', 'Wednesday', 'Friday']"
          },
          room: { type: Type.STRING, description: "Room number or lab name if specified" },
          teacher: { type: Type.STRING, description: "Teacher or instructor name if specified" },
          type: {
            type: Type.STRING,
            description: "Category of the slot: 'lecture', 'lab', 'tutorial', 'seminar', 'break', 'lunch', 'activity', or 'other'"
          }
        },
        required: ["subject", "startTime", "endTime", "days", "type"]
      }
    },
    confidence: { type: Type.STRING, description: "Confidence level of parsing: 'high', 'medium', or 'low'" },
    notes: { type: Type.STRING, description: "Any key remarks or parsed notes regarding the timetable (shifts, special instructions)" }
  },
  required: ["timeSlots", "confidence"]
};

// Daily schedule generation schema
const scheduleSchema = {
  type: Type.OBJECT,
  properties: {
    date: { type: Type.STRING, description: "Format YYYY-MM-DD" },
    timeline: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          startTime: { type: Type.STRING, description: "HH:MM format, e.g. '06:00'" },
          endTime: { type: Type.STRING, description: "HH:MM format, e.g. '06:30'" },
          label: { type: Type.STRING, description: "What the activity is, e.g., 'Wake Up', 'Revision: Mathematics', 'College Class: Chemistry'" },
          type: {
            type: Type.STRING,
            description: "Must be 'wake_up', 'school_college', 'study', 'homework', 'revision', 'break', 'meal', 'travel', 'sleep', or 'other'"
          },
          subject: { type: Type.STRING, description: "Specify the subject name if the activity is study, homework, revision, or school_college" },
          description: { type: Type.STRING, description: "What the student should focus on during this slot" }
        },
        required: ["startTime", "endTime", "label", "type"]
      }
    },
    smartTodos: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Highly actionable, targeted list of micro-tasks tailored to today (e.g. 'Solve 5 physics mechanics questions', 'Draft intro paragraph for CS paper')"
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Tailored productivity advice, motivation, hydration checks, and strategic tips based on upcoming exams and weak areas"
    },
    subjectAnalysis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          focusArea: { type: Type.STRING, description: "What specific topic/concept to prioritize today" },
          suggestedDurationMinutes: { type: Type.INTEGER }
        },
        required: ["subject", "focusArea", "suggestedDurationMinutes"]
      }
    },
    focusPlan: { type: Type.STRING, description: "A summary Pomodoro/Focus recommendation for the day, e.g. 'Pomodoro 25/5 setup works best for today's science-heavy load.'" }
  },
  required: ["date", "timeline", "smartTodos", "recommendations", "subjectAnalysis", "focusPlan"]
};

// Endpoint: Parse Timetable File or Text
app.post("/api/timetable/parse", async (req, res) => {
  try {
    const { fileBase64, mimeType, pastedText } = req.body;
    const ai = getAiClient(req);

    let contents: any[] = [];

    if (fileBase64 && mimeType) {
      contents.push({
        inlineData: {
          data: fileBase64,
          mimeType: mimeType,
        },
      });
      contents.push({
        text: "Please extract all class times, subjects, classrooms, teachers, weekdays, and breaks from this timetable image or PDF document and format it cleanly into the requested JSON schema. Categorize each slot's type accurately.",
      });
    } else if (pastedText) {
      contents.push({
        text: `Here is a pasted school/college timetable text:\n\n${pastedText}\n\nPlease parse this and structure it into the requested JSON schema. Extract all weekdays, timings (converting them to 24-hour HH:MM format), subjects, and categories.`,
      });
    } else {
      res.status(400).json({ error: "Missing both file data and pasted text. Please upload an image/PDF or paste your timetable." });
      return;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: "You are an elite, highly precise OCR and academic planner assistant. Your job is to parse timetables (printed, digital, screenshot, handwritten, or raw text) and output a clean, validated JSON structure matching the schema. Standardize all slot start/end times into 24-hour 'HH:MM' format. Standardize days to standard English weekday names (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday). Map subjects and types carefully. Set confidence as high, medium, or low based on visual quality and text clarity.",
        responseMimeType: "application/json",
        responseSchema: timetableSchema,
      },
    });

    if (!response.text) {
      throw new Error("No response text generated by Gemini.");
    }

    const parsedData = JSON.parse(response.text.trim());
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error in parse timetable API:", error);
    res.status(500).json({
      error: error.message || "An error occurred while parsing the timetable. Please verify your file or paste simple text.",
    });
  }
});

// Endpoint: Generate daily customized schedule
app.post("/api/schedule/generate", async (req, res) => {
  try {
    const { profile, timetable, exams, assignments, tasks, dayOfWeek, currentDate } = req.body;
    const ai = getAiClient(req);
    const userRole = profile.role || "student";

    const promptText = `
Generate an optimized study/work schedule for today.
Today's Date: ${currentDate}
Today's Weekday: ${dayOfWeek}

User Role: ${userRole.toUpperCase()} (This user is a ${userRole}. Generate scheduling blocks, titles, descriptions, recommendations, and smart tasks with vocabulary, task styles, and advice perfectly suited for this role.)

Profile Details:
- Course/Department/Subject: ${profile.course || "N/A"}
- Wake up time: ${profile.wakeUpTime}
- Sleep time: ${profile.sleepTime}
- Preferred study/focus time: ${profile.preferredStudyTime}
- Daily Goal (Hours): ${profile.dailyGoalHours} hours
- Challenging Subjects/Topics/Prep Areas: ${JSON.stringify(profile.weakSubjects || [])}
- Strong/Easy Subjects/Topics/Main Taught Areas: ${JSON.stringify(profile.strongSubjects || [])}
- Travel Time to work/institution/commute: ${profile.travelTimeMinutes} minutes each way
- Coaching/Off-hours/Activities Timings: ${profile.coachingTimings || "None"}
- Gym/Exercise Timing: ${profile.gymTiming || "None"}
- Target Task/Homework/Prep Duration: ${profile.homeworkTimeMinutes} minutes
- Revision/Review Preference: ${profile.revisionPreference || "split"}
- Focus/Break Preference: ${profile.breakPreference || "short"} (short breaks 25/5, long breaks 50/10)

Institutional/Work Timetable:
${JSON.stringify(timetable || { timeSlots: [] })}

Upcoming Exams/Deadlines/Milestones:
${JSON.stringify(exams || [])}

Current Assignments/Homework/Prep Tasks:
${JSON.stringify(assignments || [])}

Custom Tasks:
${JSON.stringify(tasks || [])}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction: `You are an elite Personal Planner and Productivity Coach. Your goal is to analyze the user's institutional/work timetable for today, their preferences, upcoming exams or deadlines, and their specific role (${userRole.toUpperCase()}) to generate a perfectly optimized daily planner.

Follow these strict constraints for the returned timeline:
1. Start at the wakeUpTime (e.g. 06:00 Wake Up, 06:15 Fresh Up).
2. End at sleepTime (e.g. 22:00 Sleep).
3. If today is a weekday and there are institutional classes or teaching slots matching this weekday in their timetable, you MUST schedule them exactly as defined in their 'timeSlots', along with the 'travel' slots before and after class/work (equal to travelTimeMinutes).
4. Do not forget to schedule proper breaks, meals (Breakfast, Lunch, Dinner), activities, and gym/exercise if specified.
5. Focus/Prep/Study blocks MUST target the preferredStudyTime when possible, prioritizing 'weakSubjects/topics' with extra detail.
6. Allocate 'homeworkTimeMinutes' for pending assignments, homework, or teaching preps.
7. Integrate a smart 'revision/review' slot according to the user's revision preference.
8. Balance study/prep loads. If exams or deadlines are critical or close, assign more structured focus blocks for those subjects.
9. Avoid overlaps and write motivational, hyper-personalized text descriptions.
10. Ensure the total study/prep hours align with the user's dailyGoalHours without exhausting them.
11. Return everything strictly in the daily planner JSON format. Adapt all text to fit the chosen user role (e.g. use "study" for students, "lesson preparation/grading/teaching" for teachers, "review and child tutoring" for parents, "skill practice/project development" for other professionals/learners).`,
        responseMimeType: "application/json",
        responseSchema: scheduleSchema,
      },
    });

    if (!response.text) {
      throw new Error("No response text generated by Gemini.");
    }

    const scheduleData = JSON.parse(response.text.trim());
    res.json(scheduleData);
  } catch (error: any) {
    console.error("Error in schedule generation API:", error);
    res.status(500).json({
      error: error.message || "An error occurred while generating your daily schedule. Please check parameters and try again.",
    });
  }
});

// Endpoint: Generate 7-day master customized study/work timetable
app.post("/api/schedule/generate-7day", async (req, res) => {
  try {
    const { profile, selectedSubjects, institutionalTimetable } = req.body;
    const ai = getAiClient(req);
    const userRole = profile.role || "student";

    const promptText = `
Generate a comprehensive, highly optimized 7-day study/work master timetable.
This master timetable is for a ${userRole.toUpperCase()} user. 

Profile Details:
- Wake up time: ${profile.wakeUpTime}
- Sleep time: ${profile.sleepTime}
- Preferred focus/study time: ${profile.preferredStudyTime}
- Daily Goal: ${profile.dailyGoalHours} hours of focus per day
- Selected Subjects/Topics/Areas to plan: ${JSON.stringify(selectedSubjects || [])}

Institutional/Work Schedule Commitments (AVOID scheduling study blocks during these hours):
${JSON.stringify(institutionalTimetable || { timeSlots: [] })}

Requirements:
1. Generate focus/study blocks across all 7 days of the week (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday).
2. Schedule ONLY the subjects requested: ${JSON.stringify(selectedSubjects)}.
3. Do NOT schedule focus sessions during the user's institutional classes/lectures listed above in Institutional/Work Schedule Commitments. This is extremely important so the user's "extra free time" is managed perfectly.
4. Align focus blocks with the user's preferred focus time (${profile.preferredStudyTime}) where possible, and ensure the total duration per day respects the daily focus goal (${profile.dailyGoalHours} hours) without causing fatigue.
5. Provide a beautiful master schedule formatted strictly in the Timetable JSON format (ParsedTimetable). Set the "institution" field to "7-Day Master Plan", and specify room/teacher fields as "Self-Study" or "Prep Block" or "Online Class" to look highly realistic and useful. Set confidence as "high".
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction: `You are an elite academic planner and scheduling system. Your goal is to analyze the user's preferences, their fixed institutional timetable, and selected subjects to generate a custom 7-day master study/focus timetable.
Ensure that:
1. Focus/study blocks never overlap with existing institutional classes.
2. The days array in each generated time slot contains only standard weekday names (e.g. ["Monday", "Tuesday"]).
3. Each block is 1 to 2 hours in length for peak cognitive efficiency.
4. The output matches the Timetable JSON schema exactly (ParsedTimetable format).`,
        responseMimeType: "application/json",
        responseSchema: timetableSchema,
      },
    });

    if (!response.text) {
      throw new Error("No response text generated by Gemini.");
    }

    const timetableData = JSON.parse(response.text.trim());
    res.json(timetableData);
  } catch (error: any) {
    console.error("Error in 7-day timetable generation:", error);
    res.status(500).json({
      error: error.message || "An error occurred while generating your 7-day study timetable.",
    });
  }
});

// Configure Vite integration for development, or serve static assets in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode serving pre-built assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Study Planner server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
