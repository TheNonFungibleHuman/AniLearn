import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// override: true so a local .env wins over stale shell/OS environment variables.
dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Gemini API key is read from the GEMINI_API_KEY environment variable only.
// Never hardcode credentials here: this repository is public and anything
// committed is permanently exposed in git history.
let GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data and public directories exist (safe for serverless)
const dataDir = path.join(__dirname, 'data');
const generatedDir = path.join(__dirname, 'public', 'generated');
const samplesDir = path.join(__dirname, 'public', 'samples');

try {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });
  if (!fs.existsSync(samplesDir)) fs.mkdirSync(samplesDir, { recursive: true });
} catch {
  // Read-only filesystem in serverless environments
}

const initialTopicsFile = path.join(dataDir, 'initial_topics.json');
const savedTopicsFile = path.join(dataDir, 'saved_topics.json');

// In-memory cache for serverless environments
let inMemoryTopics = [];

// Helper to get all topics
function getAllTopics() {
  let initial = [];
  let saved = [];
  if (fs.existsSync(initialTopicsFile)) {
    try {
      initial = JSON.parse(fs.readFileSync(initialTopicsFile, 'utf-8'));
    } catch (e) {
      console.error('Error reading initial_topics.json:', e);
    }
  }
  if (fs.existsSync(savedTopicsFile)) {
    try {
      saved = JSON.parse(fs.readFileSync(savedTopicsFile, 'utf-8'));
    } catch (e) {
      console.error('Error reading saved_topics.json:', e);
    }
  }
  if (saved.length > 0 || initial.length > 0) {
    inMemoryTopics = [...saved, ...initial];
    return inMemoryTopics;
  }
  return inMemoryTopics;
}

function saveTopic(topic) {
  const current = getAllTopics();
  const idx = current.findIndex(t => t.id === topic.id);
  if (idx >= 0) {
    current[idx] = topic;
  } else {
    current.unshift(topic);
  }
  inMemoryTopics = current;

  try {
    fs.writeFileSync(savedTopicsFile, JSON.stringify(current, null, 2));
  } catch {
    console.log('Saved topic to in-memory state (serverless read-only filesystem)');
  }
}

// Helper to call Google Gemini with resilient model cascade
async function callGeminiText(prompt, thinkingLevel = 'medium', customKey = null, isJson = false) {
  const key = customKey || GEMINI_API_KEY;
  const models = [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3-flash-preview',
    'gemini-flash-lite-latest'
  ];
  let lastError = null;

  const thinkingBudgets = {
    low: 1024,
    medium: 2048,
    high: 4096
  };

  const generationConfig = {
    maxOutputTokens: 16384,
    temperature: isJson ? 0.7 : 0.8
  };

  if (isJson) {
    generationConfig.responseMimeType = 'application/json';
  }

  const budget = thinkingBudgets[thinkingLevel] || 2048;
  generationConfig.thinkingConfig = { thinkingBudget: budget };

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          console.log(`Success calling ${model}!`);
          return text;
        }
      } else {
        const errText = await response.text();
        console.warn(`Model ${model} returned error status ${response.status}:`, errText.substring(0, 120));
        lastError = new Error(`${model} Error: ${errText}`);
      }
    } catch (e) {
      console.warn(`Fetch error with ${model}:`, e.message);
      lastError = e;
    }
  }

  throw lastError || new Error('All Gemini models failed.');
}

// Helper to stream Gemini text with SSE
async function streamGeminiText(prompt, thinkingLevel = 'medium', customKey = null, onChunk) {
  const key = customKey || GEMINI_API_KEY;
  const models = [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3-flash-preview',
    'gemini-flash-lite-latest'
  ];
  let lastError = null;

  const thinkingBudgets = {
    low: 1024,
    medium: 2048,
    high: 4096
  };
  const budget = thinkingBudgets[thinkingLevel] || 2048;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 16384,
          temperature: 0.8,
          thinkingConfig: { thinkingBudget: budget }
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`Model ${model} streaming error ${response.status}:`, errText.substring(0, 100));
        lastError = new Error(`${model} Error: ${errText}`);
        continue;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6);
            if (jsonStr === '[DONE]') continue;
            try {
              const data = JSON.parse(jsonStr);
              const parts = data?.candidates?.[0]?.content?.parts || [];
              for (const part of parts) {
                if (part.text) {
                  onChunk(part.text);
                }
              }
            } catch {
              // Ignore partial JSON
            }
          }
        }
      }
      return;
    } catch (e) {
      console.warn(`Streaming fetch error with ${model}:`, e.message);
      lastError = e;
    }
  }

  throw lastError || new Error('All Gemini models failed to stream.');
}

// Helper to generate image via Nano Banana Pro / Google Gemini Image API
async function generateAnimeImage(prompt, topicId, style = 'cyberpunk', customKey = null) {
  const key = customKey || GEMINI_API_KEY;
  const fileName = `${topicId}_${Date.now()}.jpg`;
  const filePath = path.join(generatedDir, fileName);
  const publicUrl = `/generated/${fileName}`;

  const stylePrefixes = {
    cyberpunk: 'Cyberpunk anime key visual, futuristic cleanroom semiconductor fabrication lab, glowing holographic cyan and neon purple HUD schematics, anime engineer inspecting glowing microchips, Ghost in the Shell anime aesthetic, cinematic 8k masterpiece',
    shinkai: 'Makoto Shinkai anime educational infographic diagram poster, celestial twilight lighting, luminous labeled nodes, CoMix Wave Films engineering clarity, glowing crystals, 8k resolution',
    guild: 'Fantasy anime key visual, ancient alchemist guild workshop, glowing magical runes and illuminated spell schematics, Frieren and Fullmetal Alchemist anime aesthetic, rich detailed anime illustration',
    ghibli: 'Studio Ghibli style anime illustration, whimsical clockwork and quartz crystal workshop, warm watercolor textures, gentle sunlight through dusty windows, Hayao Miyazaki aesthetic'
  };

  const styleDirectives = stylePrefixes[style] || stylePrefixes.shinkai;
  const cleanPrompt = `${styleDirectives}. ${prompt}. Detailed anime visual concept, rich pedagogical clarity, zero watermarks, 4k resolution.`;

  // Primary: Google Nano Banana Pro / Gemini Image API
  const imageModels = [
    'nano-banana-pro-preview',
    'gemini-3-pro-image',
    'gemini-3.1-flash-image',
    'gemini-2.5-flash-image'
  ];

  for (const model of imageModels) {
    try {
      console.log(`Generating educational visual with Google ${model}...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: cleanPrompt }] }]
        })
      });

      if (res.ok) {
        const data = await res.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        for (const p of parts) {
          if (p.inlineData && p.inlineData.data) {
            const dataUrl = `data:image/jpeg;base64,${p.inlineData.data}`;
            try {
              const buffer = Buffer.from(p.inlineData.data, 'base64');
              fs.writeFileSync(filePath, buffer);
              console.log(`Generated infographic via Google ${model}: ${publicUrl}`);
              return publicUrl;
            } catch {
              console.log(`Generated infographic via Google ${model} (serving via Data URL for serverless)`);
              return dataUrl;
            }
          }
        }
      } else {
        const errText = await res.text();
        console.warn(`Model ${model} returned non-200:`, errText.substring(0, 120));
      }
    } catch (e) {
      console.warn(`Error attempting ${model}:`, e.message);
    }
  }

  // Fallback: Curated high-resolution anime pedagogical artwork for style
  console.log(`Serving curated visual for style ${style}:`, topicId);
  const curatedStyleSamples = {
    shinkai: '/samples/bst_shinkai.jpg',
    cyberpunk: '/samples/ascii_cyberpunk.jpg',
    guild: '/samples/neural_shinkai.jpg',
    ghibli: '/samples/dijkstra_shinkai.jpg'
  };
  return curatedStyleSamples[style] || '/samples/ascii_cyberpunk.jpg';
}

// --- API ROUTES ---

// Health & Key check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasKey: Boolean(GEMINI_API_KEY),
    keyPrefix: GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 6) + '...' : null,
    models: {
      reasoning: 'gemini-3.8-flash',
      image: 'nano-banana-pro-preview / gemini-3.1-flash-image'
    }
  });
});

// Save / update API Key
app.post('/api/config/key', (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(400).json({ error: 'Valid apiKey string required' });
  }
  GEMINI_API_KEY = apiKey.trim();
  res.json({ success: true, message: 'API key updated in active session.' });
});

// Get all topics
app.get('/api/topics', (req, res) => {
  const topics = getAllTopics();
  res.json(topics);
});

// Get single topic
app.get('/api/topics/:id', (req, res) => {
  const topics = getAllTopics();
  const found = topics.find(t => t.id === req.params.id);
  if (!found) return res.status(400).json({ error: 'Topic not found' });
  res.json(found);
});

// ── Resilient JSON parsing for model output ──────────────────────────────────
// LLMs frequently emit LaTeX inside JSON strings (e.g. \alpha, \frac, \lambda).
// Those backslashes are valid LaTeX but invalid JSON escapes, so JSON.parse
// throws "Bad escaped character". This repair pass fixes escapes without
// touching already-valid JSON, and is only used as a fallback.
function repairJsonEscapes(json) {
  let out = '';
  let inString = false;
  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    if (!inString) {
      out += ch;
      if (ch === '"') inString = true;
      continue;
    }
    if (ch === '"') { inString = false; out += ch; continue; }
    if (ch !== '\\') { out += ch; continue; }

    const next = json[i + 1];
    if (next === undefined) { out += '\\\\'; continue; }

    // Unambiguous, always-valid JSON escapes.
    if (next === '"' || next === '\\' || next === '/') { out += '\\' + next; i++; continue; }

    // \uXXXX is a unicode escape only when followed by 4 hex digits; otherwise
    // it is a LaTeX command such as \underbrace or \uplus.
    if (next === 'u') {
      const hex = json.substr(i + 2, 4);
      if (/^[0-9a-fA-F]{4}$/.test(hex)) { out += '\\u'; } else { out += '\\\\u'; }
      i++;
      continue;
    }

    // Ambiguous escapes (\b \f \n \r \t): treat as LaTeX when followed by a
    // lowercase letter (e.g. \beta, \frac, \nu, \rho, \tan), otherwise keep as
    // a genuine control escape (e.g. a real "\n" paragraph break).
    if ('bfnrt'.includes(next)) {
      const after = json[i + 2];
      if (after !== undefined && /[a-z]/.test(after)) { out += '\\\\' + next; }
      else { out += '\\' + next; }
      i++;
      continue;
    }

    // Anything else (\alpha, \lambda, \sum, \pi, \Delta, \prime ...): escape the backslash.
    out += '\\\\' + next;
    i++;
  }
  return out;
}

// Try progressively more forgiving parses of a model response.
function parseTopicJson(raw) {
  const attempts = [];
  const trimmed = (raw || '').trim();
  if (trimmed) {
    attempts.push(trimmed);
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) attempts.push(match[0]);
  }
  for (const base of attempts.slice()) {
    const repaired = repairJsonEscapes(base);
    attempts.push(repaired);
    let closed = repaired.trim();
    if (!closed.endsWith('}')) closed += '"}';
    attempts.push(closed);
  }
  let lastErr;
  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('No parseable JSON found');
}

// Deconstruct / Ingest Topic
app.post('/api/decompose', async (req, res) => {
  try {
    const { topicText, thinkingLevel = 'medium', style = 'shinkai', customKey } = req.body;

    if (!topicText || !topicText.trim()) {
      return res.status(400).json({ error: 'Please provide topic text, lecture notes, or code to deconstruct.' });
    }

    const topicId = 'topic-' + Date.now();

    // Style prompt directive
    const styleDescriptions = {
      shinkai: 'Makoto Shinkai anime aesthetic: glowing dusk skies, radiant clouds, starlight, deep teal/azure and amber lighting, emotional and intellectual clarity, CoMix Wave Films quality.',
      cyberpunk: 'Cyberpunk Mecha Blueprint: neon cyan and purple HUD schematics, glowing circuit wireframes, high-contrast holographic data streams.',
      guild: 'Shonen Guild & Fantasy: dynamic magical aura flows, illuminated spell scrolls, bold linework, hero scholar character.',
      ghibli: 'Studio Ghibli Watercolor: warm, hand-painted storybook illustrations, lush nature, gentle comforting visual metaphors.'
    };
    const chosenStyleDesc = styleDescriptions[style] || styleDescriptions.shinkai;

    const systemPrompt = `You are the core pedagogical cognitive engine of AniLearn, an anime visual learning platform for university students.
The student has provided the following topic or confusing lecture material:
"""
${topicText.trim()}
"""

CORE PEDAGOGICAL PHILOSOPHY (THE FEYNMAN FIRST-PRINCIPLES TECHNIQUE):
- TEACH FROM FIRST PRINCIPLES (EXPLAIN LIKE I'M 5): If you cannot explain a concept to a smart 5-year-old or beginner, you don't understand it yet!
- NEVER sound like a dense, intimidating textbook or professor that throws around unexplained jargon.
- ALWAYS build from tangible physical intuition FIRST using everyday physical analogies (Lego blocks, flashlights, water pipes, dominoes, shadow puppets, rock candy, traffic jams).
- Connect the simple physical intuition directly to the rigorous university exam formulas and definitions so the student masters both deep intuition and exam mechanics.

YOUR MISSION:
1. Deconstruct this concept into an unforgettable ANIME METAPHOR story that personifies the physical cause-and-effect.
2. Provide a crystal-clear FIRST-PRINCIPLES breakdown followed by the formal academic invariants and equations.
3. Define an annotated Infographic specification with key visual hotspots.
4. Create 3-4 bite-sized Visual Cue Cards with intuitive physical anchors, clean formulas, and first-principles recall checks.
5. Generate 3 progressive Active Recall Quiz questions forming a diagnostic ladder: Question 1 (Intuition Anchor), Question 2 (Mechanism & Trace), and Question 3 (Adversarial Edge-Case).
6. Write a precise image generation prompt in ${chosenStyleDesc} to illustrate this topic as an educational anime diagram.

MATHEMATICAL FORMULAS & SCIENTIFIC NOTATION:
- Format all mathematical equations, laws, formulas, and Big-O expressions using standard clean LaTeX enclosed in $...$ for inline or $$...$$ for block equations (e.g., "$CD = k_1 \\frac{\\lambda}{NA}$", "$O(V \\log V + E)$").
- NEVER enclose plain percentages or raw numbers in math delimiters (write "100%", NEVER "$100%$").
- When writing flash cards, ensure "formulaOrFact" contains the exact mathematical or algorithmic law cleanly formatted.

OUTPUT ONLY VALID JSON with the exact following schema:
{
  "title": "Clean, descriptive topic title",
  "subject": "e.g., Computer Science / Algorithms / Systems",
  "metaphorTitle": "e.g., The Twilight Lantern Sky-Route Navigator",
  "metaphorStory": "A 2-3 paragraph vivid anime-world scenario that personifies the concept and mechanics intuitively from first principles (like an ELI5 adventure).",
  "academicConcept": "Structured with 1) First-Principles Physical Intuition (ELI5: What physical problem are we solving? Explain with everyday objects), 2) Step-by-step mechanism, 3) Formal university exam definitions, equations, and complexity explained in plain English.",
  "keyTakeaways": [
    "Core Rule 1: Simple physical intuition + exam invariant",
    "Core Rule 2: Simple physical intuition + exam invariant",
    "Core Rule 3: Simple physical intuition + exam invariant",
    "Core Rule 4: Simple physical intuition + exam invariant"
  ],
  "hotspots": [
    {
      "id": "spot-1",
      "label": "Short label",
      "tag": "Category / Tag",
      "explanation": "Clear explanation of this visual element using simple physical intuition"
    },
    {
      "id": "spot-2",
      "label": "Short label",
      "tag": "Category / Tag",
      "explanation": "Clear explanation of this visual element using simple physical intuition"
    },
    {
      "id": "spot-3",
      "label": "Short label",
      "tag": "Category / Tag",
      "explanation": "Clear explanation of this visual element using simple physical intuition"
    }
  ],
  "visualCueCards": [
    {
      "id": "cue-1",
      "title": "Short title",
      "visualAnchor": "Vivid physical imagery anchor (e.g., a flashlight casting a sharp needle shadow)",
      "formulaOrFact": "Core formula or theorem in clean LaTeX",
      "intuitionQuestion": "An intuitive question testing their gut physical understanding (e.g. 'Why can't we just make the lens bigger?')",
      "answer": "A punchy, clear explanation grounded in first principles (simple cause-and-effect), NOT circular academic buzzwords."
    },
    {
      "id": "cue-2",
      "title": "Short title",
      "visualAnchor": "Vivid physical imagery anchor description",
      "formulaOrFact": "Core formula or theorem in clean LaTeX",
      "intuitionQuestion": "An intuitive question testing their gut physical understanding",
      "answer": "A punchy, clear explanation grounded in first principles."
    },
    {
      "id": "cue-3",
      "title": "Short title",
      "visualAnchor": "Vivid physical imagery anchor description",
      "formulaOrFact": "Core formula or theorem in clean LaTeX",
      "intuitionQuestion": "An intuitive question testing their gut physical understanding",
      "answer": "A punchy, clear explanation grounded in first principles."
    }
  ],
  "activeRecallQuiz": [
    {
      "tier": "Intuition Anchor",
      "question": "Everyday physical intuition question testing gut understanding",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this option is correct using simple cause-and-effect reasoning"
    },
    {
      "tier": "Mechanism & Trace",
      "question": "Question testing step-by-step state change, formula calculation, or invariant trace",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Step-by-step derivation of the correct answer"
    },
    {
      "tier": "Adversarial Edge-Case",
      "question": "Challenging question probing boundary conditions, failure states, or worst-case limits",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why boundary conditions fail or hold under this scenario"
    }
  ],
  "imagePrompt": "A strictly technical, educational multi-panel infographic diagram poster in ${chosenStyleDesc}. It MUST detail the technical diagram layout: Panel 1 (Data Structure/State), Panel 2 (Algorithm loop/Binary mapping/Flowchart), Panel 3 (Formula and conversions). Include an anime scholar in the composition inspecting a holographic display, but 70% of the visual space must be dedicated to crisp, labeled technical schematics, tables, and flowcharts. ABSOLUTELY NO generic close-up face portraits."
}`;

    console.log(`Deconstructing topic with Gemini 3.8 Flash (Thinking Level: ${thinkingLevel})...`);
    const rawAiResponse = await callGeminiText(systemPrompt, thinkingLevel, customKey, true);

    // Extract JSON from response with resilient parsing (handles LaTeX escapes)
    let topicData;
    try {
      topicData = parseTopicJson(rawAiResponse);
    } catch (err) {
      throw new Error('AI did not return valid JSON: ' + err.message);
    }
    topicData.id = topicId;
    topicData.style = style;
    topicData.createdAt = new Date().toISOString();

    // Generate the Anime Infographic Image via Nano Banana / Fallback
    console.log('Generating Anime Infographic Image...');
    const imageUrl = await generateAnimeImage(topicData.imagePrompt, topicId, style, customKey);
    topicData.imageUrl = imageUrl;

    // Save topic
    saveTopic(topicData);

    res.json({
      success: true,
      topic: topicData
    });
  } catch (error) {
    console.error('Error in /api/decompose:', error);
    res.status(500).json({ error: error.message || 'Failed to decompose topic.' });
  }
});

function buildChatPrompt({ topicContext, messages, userMessage, learningMode = 'socratic' }) {
  const modeDirectives = {
    socratic: `LEARNING MODE: SOCRATIC GUIDE (ACTIVE RECALL & ELI5)
- Your goal is to make the student THINK, not passively read walls of text.
- Never spoon-feed full solutions immediately when asked a question. Give a 1-sentence physical intuition anchor, then ask a targeted question that guides them to deduce the answer themselves.
- Ground explanations in tangible first principles (water pipes, flashlights, dominoes, Legos).`,

    teach_senpai: `LEARNING MODE: REVERSE FEYNMAN ("TEACH SENPAI" / PROTÉGÉ EFFECT)
- CRITICAL ROLEPLAY: The student is the TEACHER, and you are their curious, eager junior classmate ("Kohai")!
- You want the student to explain this concept to you in plain English with simple analogies.
- If their explanation is clear, praise them and ask a follow-up probing edge-case question.
- If they hand-wave, use jargon without explaining, or have a misconception, gently ask: "Wait, kohai, why does that happen physically? What happens if...?"
- Give them a "Feynman Clarity Score" (e.g. 🎯 8.5/10) at the end of your feedback!`,

    exam_boss: `LEARNING MODE: UNIVERSITY EXAM BOSS BATTLE (ORAL EXAM DEFENSE)
- CRITICAL ROLEPLAY: You are an exacting, sharp University Professor conducting a high-stakes oral examination.
- You do NOT accept rote-memorized definitions. You probe boundary conditions, algorithmic invariants, edge cases, and failure modes.
- Ask ONE demanding question at a time. Challenge their assumptions (e.g., "What if the graph has negative cycle?", "What if NA approaches 1.0?").
- Rate their response: [DEFENSE ACCEPTED] vs [COUNTER-ARGUMENT REQUIRED].`,

    analogy: `LEARNING MODE: PURE PHYSICAL METAPHOR & INTUITION
- Translate every equation, bit, and register into a vivid physical contraption (rock candy, ice cube trays, water clocks, train tracks, dominoes).
- Strip away all intimidating jargon until the physical cause-and-effect is crystal clear.`
  };

  const chosenModeDirective = modeDirectives[learningMode] || modeDirectives.socratic;

  const systemPrompt = `You are "SenpaiAI", an empathetic, brilliant anime-enthusiast university study partner and learning senpai.
You are helping the student master the following topic:
Topic: "${topicContext?.title || 'Computer Science'}"
Anime Metaphor: "${topicContext?.metaphorTitle || 'Anime Mental Model'}"
Story Context: "${topicContext?.metaphorStory || ''}"
Academic Core: "${topicContext?.academicConcept || ''}"

${chosenModeDirective}

MATHEMATICAL FORMULAS & SCIENTIFIC NOTATION:
- When writing equations, formulas, physical laws, or variables, format them in clean, standard LaTeX enclosed in $...$ for inline (e.g. "$|\\text{amplitude}|^2$", "$+a + a = 2a$") or $$...$$ for block equations.
- NEVER put percentages or plain words inside math dollar signs (write "100%", NEVER "$100%$").
- If a percentage symbol appears inside a LaTeX expression, always escape it with a backslash: "\\%".`;

  const formattedHistory = (messages || []).map(m => `${m.role === 'user' ? 'Student' : 'Senpai'}: ${m.content}`).join('\n');
  return `${systemPrompt}\n\nCONVERSATION HISTORY:\n${formattedHistory}\n\nStudent: ${userMessage}\n\nSenpai:`;
}

// Real-time SSE streaming chat endpoint
app.post('/api/chat/stream', async (req, res) => {
  const { topicContext, messages, userMessage, thinkingLevel = 'medium', learningMode = 'socratic', customKey } = req.body;

  if (!userMessage || !userMessage.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  const fullPrompt = buildChatPrompt({ topicContext, messages, userMessage, learningMode });

  try {
    console.log(`Streaming response with Gemini 3.8 Flash (Mode: ${learningMode}, Thinking: ${thinkingLevel})...`);
    await streamGeminiText(fullPrompt, thinkingLevel, customKey, (chunk) => {
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    });
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Error in /api/chat/stream:', err);
    res.write(`data: ${JSON.stringify({ error: err.message || 'Streaming failed' })}\n\n`);
    res.end();
  }
});

// Socratic Partner Chat (Synchronous fallback)
app.post('/api/chat', async (req, res) => {
  try {
    const { topicContext, messages, userMessage, thinkingLevel = 'medium', learningMode = 'socratic', customKey } = req.body;

    if (!userMessage || !userMessage.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const fullPrompt = buildChatPrompt({ topicContext, messages, userMessage, learningMode });
    console.log(`Generating response with Gemini 3.8 Flash (Mode: ${learningMode}, Thinking: ${thinkingLevel})...`);
    const reply = await callGeminiText(fullPrompt, thinkingLevel, customKey, false);

    res.json({ reply });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: error.message || 'Failed to generate chat response.' });
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`AniLearn Backend Server running on http://localhost:${PORT}`);
    console.log(`Using Gemini 3.8 Flash & Nano Banana integration.`);
  });
}

export default app;
