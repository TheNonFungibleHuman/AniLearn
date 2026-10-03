# AniLearn Technical Architecture & AI Integration Guide
*Comprehensive reference for future sessions, model integrations, and pedagogical pipelines.*

---

## 1. System Overview

AniLearn is an end-to-end visual cognitive learning companion for university students. It translates complex university syllabus topics into:
1. Structured **Anime Mental Models** (world-building analogies).
2. Rigorous **Academic Invariants & Formal Definitions**.
3. High-resolution **Technical Pedagogical Infographics** (Nano Banana / Imagen / Anime Technical Engine).
4. Conversational **Socratic Reasoning** powered by **Gemini 3.8 Flash**.
5. Interactive **Active Recall Quizzes** and **3D Mnemonic Cue Cards**.

---

## 2. Google 2026 AI Model Stack

### A. Reasoning & Socratic Partner: Gemini 3.8 Flash
- **Model ID**: `gemini-3.8-flash`
- **Role**: Deconstructs raw user lecture notes into the JSON schema, powers the real-time Socratic chat.
- **Thinking Levels**: Configurable depth via `thinkingLevel` (`"low"` for summaries, `"medium"` for standard intuition, `"high"` for rigorous proofs and edge cases).
- **Resilient Fallback Cascade**:
  Google API demand spikes occasionally return `503 Unavailable`. The backend in `server.js` implements an automated cascade:
  `['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3-flash-preview', 'gemini-flash-latest']`.

### B. Visual Infographic Engine: Nano Banana & Technical Diagram Engine
- **Primary Google Models**: `nano-banana-pro-preview`, `gemini-3.1-flash-image`, `gemini-3-pro-image`.
- **The Critical Pedagogical Constraint (The 70/30 Rule)**:
  - **Problem**: Generic prompts like `"cyberpunk anime illustration"` cause image models to draw blurry close-up face portraits or decorative wallpapers that offer zero educational value.
  - **Solution**: All prompts must enforce the **70/30 Composition Rule**:
    - **70% of canvas**: Labeled technical schematics, binary/hex tables, step-by-step numbered flowcharts, mathematical formulas, and data structure node maps.
    - **30% of canvas**: An anime scholar/engineer in composition (e.g. at a holographic terminal, observatory desk, or twilight railway) acting as the visual narrative anchor.
    - **Negative constraints**: Explicitly bans close-up character portraits, blurry wallpaper art, and character headshots.

---

## 3. Data Schema & Persistence

All topics follow this schema and are saved in `data/saved_topics.json` and `data/initial_topics.json`:

```json
{
  "id": "topic-1790985382923",
  "title": "ASCII: The 7-Bit Foundation of Digital Typography",
  "subject": "Computer Science / Data Representation",
  "style": "cyberpunk",
  "imageUrl": "/generated/topic-1790985382923_ascii.jpg",
  "metaphorTitle": "The Neon Pilot Frequency Matrix",
  "metaphorStory": "A vivid 2-3 paragraph anime scenario personifying the concept...",
  "academicConcept": "Rigorous university-level formal definition...",
  "keyTakeaways": [
    "Invariants and properties..."
  ],
  "hotspots": [
    {
      "id": "spot-1",
      "label": "The C0 Control Zone (0x00 - 0x1F)",
      "tag": "Telemetry / Control",
      "explanation": "Explanation of this visual component..."
    }
  ],
  "visualCueCards": [
    {
      "id": "cue-1",
      "title": "7-Bit Capacity Constraint",
      "visualAnchor": "A 7-chamber neon capacitor array...",
      "formulaOrFact": "2^7 = 128 total characters (0x00 to 0x7F)",
      "intuitionQuestion": "Why did original ASCII define 128 characters instead of 256?",
      "answer": "Teleprinters and memory buses in the 1960s optimized bandwidth..."
    }
  ],
  "activeRecallQuiz": [
    {
      "question": "Multiple choice question testing real understanding...",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Why this option is correct..."
    }
  ],
  "imagePrompt": "Technical prompt specification enforcing diagram layout..."
}
```

---

## 4. How to Resume or Extend in a New Session

1. **Verify Environment**:
   - `GEMINI_API_KEY` is loaded from `.env` or process environment.
2. **Start Services**:
   - Backend: `node server.js` (runs on `http://localhost:3001`).
   - Frontend: `npm run dev` (runs on `http://localhost:5175`).
   - Or double click `run.bat`.
3. **Key Source Files**:
   - `server.js`: API routes, Gemini 3.8 Flash cascade, Nano Banana prompt synthesis.
   - `src/App.jsx`: Root split-screen layout, topic state, segment control.
   - `src/components/VisualCanvas.jsx`: High-res infographic viewer with zoom, pan, and hotspot pins.
   - `src/components/SocraticChat.jsx`: Interactive SenpaiAI chat with rendered markdown and thinking levels.
   - `src/components/CueCardsDeck.jsx`: 3D keyboard-navigable mnemonic cards.
   - `src/components/MetaphorCard.jsx`: Concept breakdown, takeaways, and active recall quiz.
   - `src/components/Navbar.jsx`: Vercel-style clean top navigation bar.
