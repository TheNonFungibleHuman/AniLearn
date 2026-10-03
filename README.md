# AniLearn (SenpaiAI) 🌌
*An end-to-end visual-first, anime-infographic cognitive learning companion for university students.*
*Powered by Google DeepMind's 2026 **Gemini 3.8 Flash** and **Nano Banana** suite.*

---

## 🌟 Why AniLearn?

University courses often overwhelm visual learners with dry, dense academic jargon and abstract slides. **AniLearn** bridges the cognitive gap by transforming abstract university coursework into:
1. **Luminous Anime Metaphors (Makoto Shinkai aesthetic)**: Anchoring complex logic into intuitive, emotional, and visual scenes.
2. **Pedagogical Infographics**: Educational diagrams with clear visual flows, labeled states, and character-driven anchors.
3. **SenpaiAI (Socratic Study Partner)**: Powered by **Gemini 3.8 Flash** with configurable thinking levels (`low`, `medium`, `high`) that thinks alongside you, explains with visual analogies, and asks active recall intuition questions.
4. **Visual Mnemonic Cue Cards**: Interactive flip cards designed for fast exam cramming and long-term retention.
5. **Interactive Diagram Hotspots**: Clickable annotations directly linked to Senpai's Socratic dialogue.

---

## 🎨 Preloaded Computer Science Modules

AniLearn comes pre-configured with high-fidelity Makoto Shinkai educational infographics and modules:
- 🌌 **Dijkstra's Shortest Path Algorithm** (*The Twilight Lantern Sky-Route Navigator*)
- 🌿 **Binary Search Trees & Rotations** (*The Celestial Yggdrasil of Balanced Runes*)
- 🚂 **OS Concurrency, Mutex & Deadlock** (*The Twilight Tramway Crossroads & Circular Gridlock*)
- 🔭 **Neural Networks & Backpropagation** (*The Celestial Observatory of Starlight Gradients*)
- ⚡ **Cache Memory Hierarchy & Locality** (*The Weaver's Astral Desk of the Celestial Archive*)

---

## 🚀 Quick Start

### 1. Launching the App
Double-click `run.bat` or run in separate terminal tabs:

```bash
# Start Backend (Port 3001)
node server.js

# Start Frontend (Port 5175 / 5173)
npm run dev
```

Open your browser to:
👉 **[http://localhost:5175/](http://localhost:5175/)**

---

## 🧠 Google 2026 AI Architecture

| Role | Official 2026 Model | Capability |
|---|---|---|
| **Socratic Reasoning & Metaphors** | `gemini-3.8-flash` | Calibrated reasoning with thinking levels (`low`, `medium`, `high`), active recall quizzes, and Socratic dialogues. |
| **Visual Cue & Infographic Engine** | `nano-banana-pro-preview` / `gemini-3.1-flash-image` | High-fidelity Makoto Shinkai style diagrammatic generation with diagram labeling. |
| **Resilient Model Cascade** | `gemini-3.8-flash` ➔ `gemini-3.6-flash` ➔ `gemini-flash-latest` | Zero-downtime architecture gracefully handling Google demand spikes. |

---

## 📁 Project Structure

```
aimaxxing/
├── data/
│   ├── initial_topics.json      # Preloaded rich CS topics with quizzes & hotspots
│   └── saved_topics.json        # User-generated custom topics
├── public/
│   ├── samples/                 # Pre-rendered Shinkai masterpieces
│   └── generated/               # AI-generated topic infographics
├── src/
│   ├── components/
│   │   ├── Navbar.jsx           # App header, model badge, topic switcher
│   │   ├── MetaphorCard.jsx     # Anime metaphor, academic theory, active quiz
│   │   ├── SocraticChat.jsx     # SenpaiAI interactive chat with thinking level
│   │   ├── VisualCanvas.jsx     # Zoomable infographic viewer & hotspots
│   │   ├── CueCardsDeck.jsx     # Mnemonic flip flashcard deck
│   │   ├── IngestModal.jsx      # Topic ingestion & slide deconstruction
│   │   └── SettingsModal.jsx    # Google Gemini API key configuration
│   ├── App.jsx                  # Main split-screen study layout
│   └── index.css                # Obsidian & Shinkai twilight styling
├── server.js                    # Express orchestrator with Gemini 3.8 & Nano Banana
├── run.bat                      # One-click Windows launcher
└── package.json
```

---

## 🎓 How to Study with AniLearn

1. **Ingest Notes**: Click **"Deconstruct Topic"** in the top bar, paste any confusing slide text, code snippet, or exam question.
2. **Select Thinking Level**:
   - `Low`: Rapid high-level summary and visual cue cards.
   - `Medium`: Balanced conceptual intuition and step-by-step example.
   - `High`: In-depth theoretical proofs, edge cases, and algorithmic complexity.
3. **Explore the Infographic**: Zoom in to inspect the Makoto Shinkai visual diagram, and click the **Interactive Hotspots** to highlight key mechanics.
4. **Chat with Senpai**: Switch to the **SenpaiAI Study Partner** tab or click *"Ask Senpai about this part"* to have a conversational Socratic study session.
5. **Flip Cue Cards**: Practice active recall using the visual mnemonic flip cards before your exams.
