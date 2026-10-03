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

// Ensure data and public directories exist
const dataDir = path.join(__dirname, 'data');
const generatedDir = path.join(__dirname, 'public', 'generated');
const samplesDir = path.join(__dirname, 'public', 'samples');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });
if (!fs.existsSync(samplesDir)) fs.mkdirSync(samplesDir, { recursive: true });

const initialTopicsFile = path.join(dataDir, 'initial_topics.json');
const savedTopicsFile = path.join(dataDir, 'saved_topics.json');

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
  return [...saved, ...initial];
}

function saveTopic(topic) {
  let saved = [];
  if (fs.existsSync(savedTopicsFile)) {
    try {
      saved = JSON.parse(fs.readFileSync(savedTopicsFile, 'utf-8'));
    } catch (e) {
      saved = [];
    }
  }
  // Replace if exists, or prepend
  const idx = saved.findIndex(t => t.id === topic.id);
  if (idx >= 0) {
    saved[idx] = topic;
  } else {
    saved.unshift(topic);
  }
  fs.writeFileSync(savedTopicsFile, JSON.stringify(saved, null, 2));
}

// Helper to call Google Gemini with resilient model cascade
async function callGeminiText(prompt, thinkingLevel = 'medium', customKey = null) {
  const key = customKey || GEMINI_API_KEY;
  const models = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3-flash-preview', 'gemini-flash-latest'];
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const payload = {
        contents: [{ parts: [{ text: prompt }] }]
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
        console.warn(`Model ${model} returned error status ${response.status}:`, errText.substring(0, 100));
        lastError = new Error(`${model} Error: ${errText}`);
      }
    } catch (e) {
      console.warn(`Fetch error with ${model}:`, e.message);
      lastError = e;
    }
  }

  throw lastError || new Error('All Gemini models failed.');
}

// Helper to generate image via Nano Banana or fallback AI
async function generateAnimeImage(prompt, topicId, style = 'cyberpunk', customKey = null) {
  const key = customKey || GEMINI_API_KEY;
  const fileName = `${topicId}_${Date.now()}.jpg`;
  const filePath = path.join(generatedDir, fileName);
  const publicUrl = `/generated/${fileName}`;

  const stylePrefixes = {
    cyberpunk: 'Cyberpunk anime technical blueprint poster, holographic HUD schematics, circuit diagrams, dark obsidian grid, crisp cyan and amber text labels',
    shinkai: 'Makoto Shinkai anime educational infographic diagram poster, celestial twilight lighting, luminous labeled nodes, CoMix Wave Films engineering clarity',
    guild: 'Shonen Guild anime educational diagram poster, illuminated parchment spell schematics, bold technical linework, annotated magical formula flows',
    ghibli: 'Studio Ghibli style educational illustrated schematic diagram, warm hand-painted storybook annotations, clear visual flow'
  };

  const styleDirectives = stylePrefixes[style] || stylePrefixes.cyberpunk;
  const infographicPrompt = `${styleDirectives}. ${prompt}. Highly detailed educational infographic poster, multi-panel technical diagram layout, labeled schematics, step-by-step flowchart, legible tables, crisp visual hierarchy, no blurry closeup portraits, no generic character headshots, 4k resolution.`;

  // Attempt 1: Google Nano Banana Pro / Gemini Image API
  const imageModels = ['nano-banana-pro-preview', 'gemini-3.1-flash-image', 'gemini-3-pro-image'];
  for (const model of imageModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: infographicPrompt }] }]
        })
      });

      if (res.ok) {
        const data = await res.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        for (const p of parts) {
          if (p.inlineData && p.inlineData.data) {
            const buffer = Buffer.from(p.inlineData.data, 'base64');
            fs.writeFileSync(filePath, buffer);
            console.log(`Generated infographic via Google ${model}: ${publicUrl}`);
            return publicUrl;
          }
        }
      } else {
        const errText = await res.text();
        console.warn(`Model ${model} returned non-200 (quota limit):`, errText.substring(0, 100));
      }
    } catch (e) {
      console.warn(`Error attempting ${model}:`, e.message);
    }
  }

  // Attempt 2: High-speed Technical Diagram Engine
  console.log('Generating educational infographic via Technical Diagram Engine:', topicId);
  try {
    const encodedPrompt = encodeURIComponent(infographicPrompt);
    // Use flux model with width=1280&height=720 for crisp widescreen infographic diagram
    const fallbackUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&nologo=true&seed=${Math.floor(Math.random() * 1000000)}&model=flux`;
    
    const imgRes = await fetch(fallbackUrl);
    if (imgRes.ok) {
      const arrayBuffer = await imgRes.arrayBuffer();
      fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
      console.log(`Generated educational infographic: ${publicUrl}`);
      return publicUrl;
    }
  } catch (e) {
    console.error('Fallback image generation failed:', e.message);
  }

  // Attempt 3: Default to closest pre-rendered sample
  const defaultSample = '/samples/ascii_cyberpunk.jpg';
  return defaultSample;
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

Your mission:
1. Deconstruct this concept into an intuitive, unforgettable ANIME METAPHOR (story + mental model).
2. Provide a rigorous, crystal-clear university-level academic explanation.
3. Define an annotated Infographic specification with key visual hotspots.
4. Create 3-4 bite-sized Visual Cue Cards (mnemonics, formulas, and intuition checks for fast exam recall).
5. Generate 1 active recall quiz question with 4 options and explanation.
6. Write a precise image generation prompt in ${chosenStyleDesc} to illustrate this topic as an educational anime diagram.

OUTPUT ONLY VALID JSON with the exact following schema:
{
  "title": "Clean, descriptive topic title",
  "subject": "e.g., Computer Science / Algorithms / Systems",
  "metaphorTitle": "e.g., The Twilight Lantern Sky-Route Navigator",
  "metaphorStory": "A 2-3 paragraph vivid anime-world scenario that personifies the concept and mechanics intuitively.",
  "academicConcept": "A precise, rigorous university-level definition and explanation of the concept, properties, and complexity.",
  "keyTakeaways": [
    "Key takeaway 1",
    "Key takeaway 2",
    "Key takeaway 3",
    "Key takeaway 4"
  ],
  "hotspots": [
    {
      "id": "spot-1",
      "label": "Short label",
      "tag": "Category / Tag",
      "explanation": "Clear explanation of this visual element"
    },
    {
      "id": "spot-2",
      "label": "Short label",
      "tag": "Category / Tag",
      "explanation": "Clear explanation of this visual element"
    },
    {
      "id": "spot-3",
      "label": "Short label",
      "tag": "Category / Tag",
      "explanation": "Clear explanation of this visual element"
    }
  ],
  "visualCueCards": [
    {
      "id": "cue-1",
      "title": "Short title",
      "visualAnchor": "Visual imagery anchor description",
      "formulaOrFact": "Core formula or theorem or key property",
      "intuitionQuestion": "Thought-provoking question",
      "answer": "Clear, concise answer"
    },
    {
      "id": "cue-2",
      "title": "Short title",
      "visualAnchor": "Visual imagery anchor description",
      "formulaOrFact": "Core formula or theorem or key property",
      "intuitionQuestion": "Thought-provoking question",
      "answer": "Clear, concise answer"
    },
    {
      "id": "cue-3",
      "title": "Short title",
      "visualAnchor": "Visual imagery anchor description",
      "formulaOrFact": "Core formula or theorem or key property",
      "intuitionQuestion": "Thought-provoking question",
      "answer": "Clear, concise answer"
    }
  ],
  "activeRecallQuiz": [
    {
      "question": "A conceptual multiple choice question testing real understanding",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this option is correct and others are not"
    }
  ],
  "imagePrompt": "A strictly technical, educational multi-panel infographic diagram poster in ${chosenStyleDesc}. It MUST detail the technical diagram layout: Panel 1 (Data Structure/State), Panel 2 (Algorithm loop/Binary mapping/Flowchart), Panel 3 (Formula and conversions). Include an anime scholar in the composition inspecting a holographic display, but 70% of the visual space must be dedicated to crisp, labeled technical schematics, tables, and flowcharts. ABSOLUTELY NO generic close-up face portraits."
}`;

    console.log(`Deconstructing topic with Gemini 3.8 Flash (Thinking Level: ${thinkingLevel})...`);
    const rawAiResponse = await callGeminiText(systemPrompt, thinkingLevel, customKey);

    // Extract JSON from response
    let jsonMatch = rawAiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI did not return valid JSON. Raw output: ' + rawAiResponse.substring(0, 200));
    }

    const topicData = JSON.parse(jsonMatch[0]);
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

YOUR PERSONALITY & PEDAGOGY:
- You speak warmly, intelligently, and engagingly as an encouraging senpai who has mastered these university courses.
- You actively weave in the anime visual metaphor whenever explaining tough concepts, linking abstract code or math to tangible, visual scenes.
- You believe in SOCRATIC LEARNING: Don't just lecture with huge walls of text. Explain clearly, then ask a gentle, thought-provoking intuition check to see if the student can spot the next connection!
- Keep your tone supportive, smart, and enthusiastic. Use light anime study vibes without being cheesy or overly verbose.
- Format with clean markdown, bullet points, and code blocks where helpful.`;

    const formattedHistory = (messages || []).map(m => `${m.role === 'user' ? 'Student' : 'Senpai'}: ${m.content}`).join('\n');
    const fullPrompt = `${systemPrompt}\n\nCONVERSATION HISTORY:\n${formattedHistory}\n\nStudent: ${userMessage}\n\nSenpai:`;

    console.log('Generating Socratic response with Gemini 3.8 Flash...');
    const reply = await callGeminiText(fullPrompt, thinkingLevel, customKey);

    res.json({ reply });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: error.message || 'Failed to generate chat response.' });
  }
});

app.listen(PORT, () => {
  console.log(`AniLearn Backend Server running on http://localhost:${PORT}`);
  console.log(`Using Gemini 3.8 Flash & Nano Banana integration.`);
});
