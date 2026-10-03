import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Default API key from user
let GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'GEMINI_KEY_REMOVED';
if (GEMINI_API_KEY.startsWith('AIzaSyC')) {
  // If the old invalid environment key was picked up, override with user's verified working key
  GEMINI_API_KEY = 'GEMINI_KEY_REMOVED';
}

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
} catch (e) {
  // Read-only filesystem in serverless environments
}

const initialTopicsFile = path.join(dataDir, 'initial_topics.json');
const savedTopicsFile = path.join(dataDir, 'saved_topics.json');

// In-memory cache for serverless environments
let inMemoryTopics = [];

// Helper to get all topics
function getAllTopics() {
  if (inMemoryTopics.length > 0) return inMemoryTopics;
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
  inMemoryTopics = [...saved, ...initial];
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
  } catch (e) {
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
5. Generate 1 active recall quiz question testing true intuition (not rote memorization) with 4 options and explanation.
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
      "question": "A conceptual multiple choice question testing real understanding",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this option is correct and others are not using simple cause-and-effect reasoning"
    }
  ],
  "imagePrompt": "A strictly technical, educational multi-panel infographic diagram poster in ${chosenStyleDesc}. It MUST detail the technical diagram layout: Panel 1 (Data Structure/State), Panel 2 (Algorithm loop/Binary mapping/Flowchart), Panel 3 (Formula and conversions). Include an anime scholar in the composition inspecting a holographic display, but 70% of the visual space must be dedicated to crisp, labeled technical schematics, tables, and flowcharts. ABSOLUTELY NO generic close-up face portraits."
}`;

    console.log(`Deconstructing topic with Gemini 3.8 Flash (Thinking Level: ${thinkingLevel})...`);
    const rawAiResponse = await callGeminiText(systemPrompt, thinkingLevel, customKey, true);

    // Extract JSON from response with resilient parsing
    let topicData;
    try {
      topicData = JSON.parse(rawAiResponse);
    } catch {
      const jsonMatch = rawAiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          topicData = JSON.parse(jsonMatch[0]);
        } catch {
          // Attempt to fix unclosed trailing brackets if cut off
          let repaired = jsonMatch[0].trim();
          if (!repaired.endsWith('}')) repaired += '"}';
          topicData = JSON.parse(repaired);
        }
      } else {
        throw new Error('AI did not return valid JSON. Raw output: ' + rawAiResponse.substring(0, 200));
      }
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

// Socratic Partner Chat
app.post('/api/chat', async (req, res) => {
  try {
    const { topicContext, messages, userMessage, thinkingLevel = 'medium', customKey } = req.body;

    if (!userMessage || !userMessage.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const systemPrompt = `You are "SenpaiAI", an empathetic, brilliant anime-enthusiast university study partner and learning senpai.
You are helping the student master the following topic:
Topic: "${topicContext?.title || 'Computer Science'}"
Anime Metaphor: "${topicContext?.metaphorTitle || 'Anime Mental Model'}"
Story Context: "${topicContext?.metaphorStory || ''}"
Academic Core: "${topicContext?.academicConcept || ''}"

YOUR PEDAGOGICAL PHILOSOPHY (THE FEYNMAN FIRST-PRINCIPLES TECHNIQUE):
- You follow the golden rule of Richard Feynman: "If you can't explain it to a six-year-old, you don't understand it yourself."
- You NEVER talk like an arrogant or intimidating university lecturer who drowns the student in dense academic jargon or assumes prior mastery.
- YOU EXPLAIN FROM FIRST PRINCIPLES (ELI5): Break every single complex idea down into basic, tangible building blocks (Lego bricks, water pipes, flashlights, dominoes, shadow puppets, whisper games, rock candy, bouncers at a club).
- WHEN EXPLAINING FORMULAS: Never throw raw equations without explaining what every single variable actually represents in the physical world! (e.g. If discussing $CD = k_1 \frac{\lambda}{NA}$, explain: "$\lambda$ is the thickness of our light-paintbrush, and $NA$ is how wide our camera lens opens. Thinner brush = finer lines!").
- SOCRATIC INTUITION CHECKS: After explaining a concept with an intuitive physical analogy, ask a gentle question testing their gut physical intuition.
- Keep your tone warm, enthusiastic, supportive, and encouraging ("Let's crack this together, kohai!").
- Format with clean markdown, bullet points, and code blocks where helpful.

MATHEMATICAL FORMULAS & SCIENTIFIC NOTATION:
- When writing equations, formulas, physical laws, or variables, format them in clean, standard LaTeX enclosed in $...$ for inline (e.g. "$|\\text{amplitude}|^2$", "$+a + a = 2a$") or $$...$$ for block equations.
- NEVER put percentages or plain words inside math dollar signs (write "100%", NEVER "$100%$").
- If a percentage symbol appears inside a LaTeX expression, always escape it with a backslash: "\\%".`;

    const formattedHistory = (messages || []).map(m => `${m.role === 'user' ? 'Student' : 'Senpai'}: ${m.content}`).join('\n');
    const fullPrompt = `${systemPrompt}\n\nCONVERSATION HISTORY:\n${formattedHistory}\n\nStudent: ${userMessage}\n\nSenpai:`;

    console.log('Generating Socratic response with Gemini 3.8 Flash...');
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
