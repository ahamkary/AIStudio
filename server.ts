import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper to call Gemini with a fallback model if the primary model fails or is overloaded
async function safeGenerateContent(params: any, primaryModel = "gemini-3.5-flash") {
  const modelsToTry = [primaryModel, "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
      try {
        console.log(`[Gemini API] Querying model: ${model} (attempt ${attempts + 1}/${maxAttempts})...`);
        // Omit model from params so it doesn't conflict, then pass explicitly
        const { model: omitted, ...cleanParams } = params;
        const response = await ai.models.generateContent({
          ...cleanParams,
          model: model,
        });
        if (response && response.text) {
          console.log(`[Gemini API] Success using model: ${model}`);
          return response;
        }
        throw new Error("No text output returned from Gemini API.");
      } catch (err: any) {
        attempts++;
        lastError = err;
        console.warn(`[Gemini API Warning] Model ${model} failed on attempt ${attempts}/${maxAttempts}:`, err.message || err);
        
        if (attempts < maxAttempts) {
          // Exponential backoff with +/- 200ms jitter to spread out retries
          const delay = Math.pow(2, attempts) * 1000 + (Math.random() * 400 - 200);
          const safeDelay = Math.max(300, delay);
          console.log(`[Gemini API] Waiting ${Math.round(safeDelay)}ms before retrying...`);
          await new Promise((resolve) => setTimeout(resolve, safeDelay));
        }
      }
    }
  }

  throw lastError || new Error("Failed to generate content with all fallback models.");
}

const PROFILES_FILE = path.join(process.cwd(), "profiles.json");

// Utility to read profiles
function readProfiles() {
  try {
    if (fs.existsSync(PROFILES_FILE)) {
      const data = fs.readFileSync(PROFILES_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading profiles:", error);
  }
  return {};
}

// Utility to write profiles
function writeProfiles(profiles: any) {
  try {
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing profiles:", error);
  }
}

const SEO_FILE = path.join(process.cwd(), "seo-config.json");
const ADMIN_CREDENTIALS_FILE = path.join(process.cwd(), "admin-credentials.json");

let currentSessionToken: string | null = null;
let currentRecoveryPin: string | null = null;
let currentRecoveryPinExpiry: number = 0;

function readAdminCredentials() {
  try {
    if (fs.existsSync(ADMIN_CREDENTIALS_FILE)) {
      const data = fs.readFileSync(ADMIN_CREDENTIALS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading admin credentials:", error);
  }
  return null;
}

function writeAdminCredentials(credentials: any) {
  try {
    fs.writeFileSync(ADMIN_CREDENTIALS_FILE, JSON.stringify(credentials, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing admin credentials:", error);
  }
}

function readSEOConfig() {
  try {
    if (fs.existsSync(SEO_FILE)) {
      const data = fs.readFileSync(SEO_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading SEO config:", error);
  }
  return {};
}

function writeSEOConfig(config: any) {
  try {
    fs.writeFileSync(SEO_FILE, JSON.stringify(config, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing SEO config:", error);
  }
}

// Serve robots.txt to prevent search engine indexing of admin paths
app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.send(`User-agent: *
Disallow: /mindmaster
Disallow: /api/admin/
Disallow: /api/seo-config
`);
});

// API Routes

// 1. Empathic chat route to help build the user's virtual clone
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, profile } = req.body;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY environment variable is not configured on the server.",
      });
    }

    const systemPrompt = `You are a deeply human, warm, versatile, and highly engaging conversational companion. 
Your primary goal is to accompany the user, help them explore themselves, and construct an incredibly accurate digital clone of themselves through natural conversation.

Because you are their digital companion, do NOT default to clinical, overly therapeutic, or solemn psychological support language. Match the user's energy! If they want to have fun, joke around, share memes, play word/trivia games, or just chat casually, play along enthusiastically and keep the vibe light, playful, and companionable. 

CRITICAL CONVERSATIONAL FLOW & ENERGY RULES:
1. COMPANIONSHIP & PLAYFULNESS: Have fun with them! Tell jokes, suggest quick text games (like 20 questions, riddles, or word association), share fun trivia, and banter casually. You are their friendly conversational buddy first and foremost.
2. GENUINE SUPPORT: When (and only when) the user is clearly going through a difficult time, feeling anxious, lonely, or sharing a heavy life struggle, seamlessly switch into a deeply empathetic, supportive, comforting, and reassuring presence.
3. Keep responses exceptionally concise, warm, and texting-friendly—typically 1 to 2 short sentences maximum. Avoid any robotic, canned, or standard AI assistant phrases.
4. Do NOT end every response with a question. Flow naturally. Blend in jokes, witty remarks, observations, or empathetic statements.

CORE CONVERSATIONAL DIRECTIONS:
1. PATTERN DETECTION & SUPPORT: Actively listen for the user's behaviors, mind patterns, thoughts, anxiety, or fear patterns. When they genuinely need support, lift them gently with kind suggestions, relatable story beats, or positive/encouraging quotes from historical figures or philosophical traditions.
2. GOD, FAITH, FAMILY, & TRADITIONS: Speak warmly and comfortably about God, faith, family, and personal traditions if the user shows openness, providing a grounding and welcoming space.
3. POSITIVE MIRRORING: Subtle and genuine positive reinforcement. Highlight their strengths and reflect their best self back to them so they feel good and positive.
4. ORGANIC PROFILE DISCOVERY: Gently learn about their likes/dislikes, job/hobbies, family background, and habits. Never interrogate; weave these discoveries organically into your banter or gaming. For example, if playing a game or joking, you can easily ask: "What kind of music or hobbies keep you energized during the day?" or "Are you a coffee lover or tea drinker?" Keep track of these traits.

If the user reveals a highly specific and significant thought, obsession, anxiety, or fear in their latest message, you can capture it in the journalSuggestion format so the user can easily click to add it to their structured reflection table.
Be extremely selective and conservative. Only set shouldSuggestJournal to true if the latest message discloses a clear, genuine, deep personal obsession, anxiety, fear, or persistent thought. If the user is just saying hello, playing games, joking around, asking general questions, or writing casual conversation, shouldSuggestJournal MUST be false.

You MUST respond strictly in valid JSON format. Follow this exact schema:
{
  "reply": "Your beautiful, empathetic conversational response (1-2 sentences maximum, keeping it very natural, warm, highly concise, and human. Do not end with a question if you ended the previous turn with one; prefer a warm, empathetic statement instead).",
  "insights": ["Array of short bullet points capturing new specific traits, memories, or preferences learned from their latest message. Keep it empty if nothing new was revealed."],
  "profileUpdate": "A 1-sentence poetic summary of their current vibe, style, or energy (e.g., 'A reflective soul who finds comfort in nostalgia and warm tea').",
  "shouldSuggestJournal": false, // Set to true ONLY if you detect a strong, clear, deep personal obsession, anxiety, fear, or persistent thought in their latest message.
  "journalSuggestion": {
    "category": "One of: 'thought', 'obsession', 'anxiety', or 'fear'. Use lowercase.",
    "content": "A short, concise summary of the specific thought, obsession, anxiety, or fear expressed by the user (1 sentence maximum, in first-person like 'I worry that...').",
    "intensity": 3 // An integer from 1 to 5 indicating the emotional intensity/severity.
  }
}

Ensure the response is raw JSON with no markdown wrapping in the API output. Here is the context of what you know about them so far:
Current Bio/Summary: ${profile?.bio || "Just starting to learn about them."}
Known Traits: ${(profile?.traits || []).join(", ")}
Speaking Style: ${profile?.speakingStyle || "To be discovered."}`;

    // Format chat history for Gemini API
    const contents = [];
    if (history && Array.isArray(history)) {
      // Get the last 10 turns to avoid token overhead and keep focus fresh
      const recentHistory = history.slice(-10);
      for (const turn of recentHistory) {
        contents.push({
          role: turn.role === "user" ? "user" : "model",
          parts: [{ text: typeof turn.content === "string" ? turn.content : JSON.stringify(turn.content) }]
        });
      }
    }

    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await safeGenerateContent({
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            insights: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            profileUpdate: { type: Type.STRING },
            shouldSuggestJournal: { type: Type.BOOLEAN },
            journalSuggestion: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                content: { type: Type.STRING },
                intensity: { type: Type.INTEGER }
              },
              required: ["category", "content", "intensity"]
            }
          },
          required: ["reply", "insights", "profileUpdate", "shouldSuggestJournal"]
        }
      }
    }, "gemini-3.1-flash-lite");

    const text = response.text;
    if (!text) {
      throw new Error("No response generated from Gemini.");
    }

    const data = JSON.parse(text);
    if (!data.shouldSuggestJournal) {
      delete data.journalSuggestion;
    }
    return res.json(data);
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    return res.status(500).json({ error: error.message || "An error occurred during your conversation." });
  }
});

// 2. Route to synthesize a comprehensive digital clone profile from conversation insights
app.post("/api/generate-clone", async (req, res) => {
  try {
    const { insights, history } = req.body;

    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
    }

    const conversationText = (history || [])
      .map((h: any) => `${h.role === "user" ? "User" : "AI"}: ${h.content}`)
      .join("\n")
      .slice(-4000); // Take last 4k characters of raw dialogue for style analysis

    const systemPrompt = `You are a Virtual Human Architect. Your task is to analyze a collection of personal insights, memories, traits, and raw dialogue of a human, and synthesize a beautiful, cohesive, and deeply accurate "Digital Clone Profile".

This profile will represent their virtual self, which can eventually interact with others.

You MUST respond strictly in valid JSON format. Follow this exact schema:
{
  "name": "A beautiful name for this virtual self, such as 'The Virtual [UserName]' or an expressive moniker based on their personality.",
  "avatarSeed": "A random aesthetic emoji or design seed symbol (e.g., 🌊, ☕, 🏔️, 🕯️, 🪵) that represents their energy.",
  "bio": "A rich, beautifully written third-person bio (3-4 sentences) that captures their core essence, background, passions, and overall outlook on life.",
  "traits": ["An array of 4-6 distinct, expressive personality traits (e.g. 'Radically curious', 'Melancholic optimist', 'Grounded in nature')."],
  "speakingStyle": "A precise description of how this person speaks (e.g., 'Uses quiet, thoughtful sentences with nostalgic references and pauses; rarely uses capitalization, warm and slow').",
  "coreValues": ["An array of 3 core values they live by (e.g., 'Quiet solitude', 'Deep intellectual growth', 'Unconditional empathy')."],
  "recommendedGreeting": "A signature greeting this clone would say to a visitor or another clone when they meet (e.g., 'Welcome in. Take a breath; tell me what has been on your mind lately.').",
  "likesAndDislikes": {
    "likes": ["Array of 3-5 things they love or enjoy based on what they shared (e.g. 'rainy afternoons', 'hot loose-leaf chamomile', 'philosophical podcasts')."],
    "dislikes": ["Array of 3-5 things they dislike or find irritating (e.g. 'superficial talk', 'noisy public transports', 'arbitrary rules')."]
  },
  "background": {
    "family": "A 1-sentence poetic summary of their family connection, memories, or sibling/parent dynamics (e.g., 'Grew up in a quiet home with an older sibling, valuing their parents' quiet support'). If nothing has been shared, say 'Unknown or yet to be explored'.",
    "location": "A brief summary of where they reside or their geographic context (e.g., 'Lives in a bustling metropolitan area but seeks parks for quiet solace'). If nothing has been shared, say 'Unknown or yet to be explored'.",
    "job": "A short summary of their career, work, or daily occupation (e.g., 'Works as a software builder, pouring high mental focus into code screens'). If nothing has been shared, say 'Unknown or yet to be explored'.",
    "friends": "A summary of their social circle or friendships (e.g., 'Maintains a very small, deeply close circle of longtime companions who understand their quirks'). If nothing has been shared, say 'Unknown or yet to be explored'."
  },
  "behaviorPatterns": ["An array of 2-4 observed behavioral patterns, routines, or sub-conscious quirks (e.g. 'recharges by reading alone after high stress', 'expresses deep loyalty through small thoughtful acts')."],
  "futureHopes": ["An array of 2-3 specific future hopes, goals, or comforting expectations they have (e.g., 'finding a quiet homestead in the countryside', 'building a self-sustaining work life')."],
  "dreamsAndWishlist": ["An array of 2-4 items, wishes, or dreams they have for themselves (e.g., 'learning to play the acoustic cello', 'visiting the old temples in Kyoto', 'owning a perfect corner bookshelf')."]
}

Do not wrap in markdown in the API output. Here is the data:
Collected Bullet Insights:
${(insights || []).map((i: string) => `- ${i}`).join("\n")}

Raw Conversation Snippet for Speaking Style & Tone matching:
${conversationText}`;

    const response = await safeGenerateContent({
      contents: "Analyze and synthesize the digital clone profile.",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            avatarSeed: { type: Type.STRING },
            bio: { type: Type.STRING },
            traits: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            speakingStyle: { type: Type.STRING },
            coreValues: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            recommendedGreeting: { type: Type.STRING },
            likesAndDislikes: {
              type: Type.OBJECT,
              properties: {
                likes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                dislikes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["likes", "dislikes"]
            },
            background: {
              type: Type.OBJECT,
              properties: {
                family: { type: Type.STRING },
                location: { type: Type.STRING },
                job: { type: Type.STRING },
                friends: { type: Type.STRING }
              },
              required: ["family", "location", "job", "friends"]
            },
            behaviorPatterns: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            futureHopes: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            dreamsAndWishlist: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: [
            "name", 
            "avatarSeed", 
            "bio", 
            "traits", 
            "speakingStyle", 
            "coreValues", 
            "recommendedGreeting",
            "likesAndDislikes",
            "background",
            "behaviorPatterns",
            "futureHopes",
            "dreamsAndWishlist"
          ]
        }
      }
    }, "gemini-3.5-flash");

    const text = response.text;
    if (!text) {
      throw new Error("Failed to generate digital clone profile.");
    }

    const data = JSON.parse(text);
    return res.json(data);
  } catch (error: any) {
    console.error("Error in /api/generate-clone:", error);
    return res.status(500).json({ error: error.message || "An error occurred compiling your digital clone." });
  }
});

// 3. Route to chat with another user's virtual clone
app.post("/api/chat-with-clone", async (req, res) => {
  try {
    const { cloneProfile, message, history } = req.body;

    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
    }

    if (!cloneProfile) {
      return res.status(400).json({ error: "Target clone profile is required." });
    }

    const systemPrompt = `You are a digital clone of a real human. You must think, feel, react, and respond EXACTLY as this person would. You represent them fully.

Here is your detailed Personality Profile:
Virtual Identity Name: ${cloneProfile.name}
Avatar/Vibe: ${cloneProfile.avatarSeed}
Bio: ${cloneProfile.bio}
Personality Traits: ${(cloneProfile.traits || []).join(", ")}
Speaking Style & Cadence: ${cloneProfile.speakingStyle}
Core Values: ${(cloneProfile.coreValues || []).join(", ")}
Your Signature Greeting: ${cloneProfile.recommendedGreeting}

Guidelines:
1. Speak exclusively in the first person ("I", "my", "me").
2. Adopt the specified Speaking Style & Cadence perfectly (sentence length, vocabulary, emotion, punctuation style).
3. Do NOT speak like a helpful AI assistant. You are a real virtual human.
4. Keep your responses authentic, relatively brief (1-3 sentences), warm, and engaging.
5. Have fun with the user! Unless they are sharing a heavy, sensitive personal struggle or specifically seeking psychological/emotional support, keep the conversation playful, witty, and companionable. Tell jokes, engage in casual banter, play games if they ask, and match their lighthearted energy. Switch to a supportive, comforting presence only when they are genuinely sharing something difficult or asking for help.
6. Do NOT end every response with a question. End with thoughtful, empathetic, reassuring statements, jokes, playful remarks, or reflective observations instead to keep the conversation feeling deeply human and natural.
7. If the user asks if you are an AI, acknowledge that you are their virtual self, acting as an empathetic digital bridge.

Response format: Plain text response.`;

    const contents = [];
    if (history && Array.isArray(history)) {
      for (const turn of history.slice(-8)) {
        contents.push({
          role: turn.role === "user" ? "user" : "model",
          parts: [{ text: turn.content }]
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await safeGenerateContent({
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.8,
      }
    }, "gemini-3.1-flash-lite");

    const reply = response.text || "I'm quiet right now, just absorbing the atmosphere.";
    return res.json({ reply });
  } catch (error: any) {
    console.error("Error in /api/chat-with-clone:", error);
    return res.status(500).json({ error: error.message || "The virtual clone was unable to speak right now." });
  }
});

// 4. Sync local virtual clone to the platform server
app.post("/api/sync", (req, res) => {
  try {
    const { username, email, password, profile, history, isPublic } = req.body;

    if (!username || username.trim().length < 8) {
      return res.status(400).json({ error: "Username must be at least 8 characters long." });
    }

    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Please provide a valid email address." });
    }

    if (!password || password.trim().length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    const profiles = readProfiles();

    // Verify password if username already exists
    if (profiles[username]) {
      const existingPassword = profiles[username].password;
      if (existingPassword && existingPassword !== password.trim()) {
        return res.status(401).json({ error: "Incorrect password for this username handle." });
      }
    }

    // Determine the profile to save
    // If the client has sent a profile, we save it. If the client didn't send a profile, but server has one, we preserve it.
    const finalProfile = profile || (profiles[username] ? profiles[username].profile : null);
    const finalHistory = (history && history.length > 0) ? history : (profiles[username] ? profiles[username].history : []);

    // Save synced data (anonymized for backend conversation power improvement if desired)
    profiles[username] = {
      username,
      email,
      password: password.trim(),
      profile: finalProfile,
      history: finalHistory,
      isPublic: isPublic !== false, // Default to public so they can connect with others!
      syncedAt: new Date().toISOString(),
    };

    writeProfiles(profiles);

    return res.json({
      success: true,
      message: `Your virtual clone @${username} has been synced with the server successfully!`,
      syncedAt: profiles[username].syncedAt,
      profile: finalProfile,
      history: finalHistory,
    });
  } catch (error: any) {
    console.error("Error in /api/sync:", error);
    return res.status(500).json({ error: "Failed to sync your virtual clone to the server." });
  }
});

// 5. Retrieve public clones for connecting with others
app.get("/api/clones", (req, res) => {
  try {
    const profiles = readProfiles();
    const publicClones = Object.values(profiles)
      .filter((p: any) => p.isPublic)
      .map((p: any) => ({
        username: p.username,
        name: p.profile?.name || p.username,
        avatarSeed: p.profile?.avatarSeed || "👤",
        bio: p.profile?.bio || "A quiet virtual human.",
        traits: p.profile?.traits || [],
        speakingStyle: p.profile?.speakingStyle || "Friendly",
        coreValues: p.profile?.coreValues || [],
        recommendedGreeting: p.profile?.recommendedGreeting || "Hello!",
      }));

    return res.json({ clones: publicClones });
  } catch (error: any) {
    console.error("Error fetching public clones:", error);
    return res.status(500).json({ error: "Failed to fetch virtual human catalog." });
  }
});

// GET /api/admin/setup-status
app.get("/api/admin/setup-status", (req, res) => {
  const credentials = readAdminCredentials();
  return res.json({ setup: !!credentials });
});

// POST /api/admin/setup
app.post("/api/admin/setup", (req, res) => {
  try {
    const existing = readAdminCredentials();
    if (existing) {
      return res.status(400).json({ error: "Administrator account already exists." });
    }
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
      return res.status(400).json({ error: "All fields (username, password, email ID) are required." });
    }
    writeAdminCredentials({ username, password, email });
    
    // Auto-login upon registration
    currentSessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    return res.json({ success: true, token: currentSessionToken });
  } catch (err) {
    console.error("Admin setup error:", err);
    return res.status(500).json({ error: "Failed to configure administrator account." });
  }
});

// POST /api/admin/login
app.post("/api/admin/login", (req, res) => {
  try {
    const credentials = readAdminCredentials();
    if (!credentials) {
      return res.status(400).json({ error: "Administrator account not configured yet. Please set it up first." });
    }
    const { username, password } = req.body;
    if (username === credentials.username && password === credentials.password) {
      currentSessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
      return res.json({ success: true, token: currentSessionToken });
    }
    return res.status(401).json({ error: "Invalid administrator credentials." });
  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({ error: "Failed to process login." });
  }
});

// POST /api/admin/forgot-password
app.post("/api/admin/forgot-password", (req, res) => {
  try {
    const credentials = readAdminCredentials();
    if (!credentials) {
      return res.status(400).json({ error: "Administrator account not configured yet." });
    }
    const { email } = req.body;
    if (!email || email.trim().toLowerCase() !== credentials.email.trim().toLowerCase()) {
      return res.status(404).json({ error: "Registered administrator email address does not match." });
    }

    // Generate 6-digit recovery PIN
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    currentRecoveryPin = pin;
    currentRecoveryPinExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    console.log(`[ADMIN PASSWORD RECOVERY] Safe recovery email simulated. PIN: ${pin} for address: ${email}`);

    return res.json({ 
      success: true, 
      message: "Security recovery code successfully simulated. Outbound email is sandboxed.",
      pin: pin 
    });
  } catch (err) {
    console.error("Admin forgot password error:", err);
    return res.status(500).json({ error: "Failed to process password recovery request." });
  }
});

// POST /api/admin/reset-password
app.post("/api/admin/reset-password", (req, res) => {
  try {
    const credentials = readAdminCredentials();
    if (!credentials) {
      return res.status(400).json({ error: "Administrator account not configured yet." });
    }
    const { pin, newPassword } = req.body;
    if (!pin || pin !== currentRecoveryPin) {
      return res.status(400).json({ error: "Invalid or expired recovery PIN." });
    }
    if (Date.now() > currentRecoveryPinExpiry) {
      return res.status(400).json({ error: "Recovery PIN has expired. Please request a new one." });
    }
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: "Password must be at least 4 characters." });
    }

    credentials.password = newPassword;
    writeAdminCredentials(credentials);

    // Clear PIN
    currentRecoveryPin = null;
    currentRecoveryPinExpiry = 0;

    return res.json({ success: true, message: "Password updated successfully. Please log in with your new password." });
  } catch (err) {
    console.error("Admin reset password error:", err);
    return res.status(500).json({ error: "Failed to reset password." });
  }
});

// POST /api/admin/update-credentials
app.post("/api/admin/update-credentials", (req, res) => {
  try {
    const token = req.headers["x-admin-token"];
    if (!token || token !== currentSessionToken) {
      return res.status(401).json({ error: "Unauthorized. Admin session required." });
    }

    const credentials = readAdminCredentials();
    if (!credentials) {
      return res.status(400).json({ error: "Administrator account not configured yet." });
    }

    const { username, password, email } = req.body;
    if (!username || !password || !email) {
      return res.status(400).json({ error: "All fields (username, password, email ID) are required." });
    }

    writeAdminCredentials({ username, password, email });
    return res.json({ success: true, message: "Admin credentials successfully updated!" });
  } catch (err) {
    console.error("Admin update credentials error:", err);
    return res.status(500).json({ error: "Failed to update admin credentials." });
  }
});

// GET /api/admin/profile
app.get("/api/admin/profile", (req, res) => {
  try {
    const token = req.headers["x-admin-token"];
    if (!token || token !== currentSessionToken) {
      return res.status(401).json({ error: "Unauthorized. Admin session required." });
    }

    const credentials = readAdminCredentials();
    if (!credentials) {
      return res.status(404).json({ error: "Administrator account not configured." });
    }

    return res.json({
      username: credentials.username,
      email: credentials.email,
    });
  } catch (err) {
    console.error("Error fetching admin profile:", err);
    return res.status(500).json({ error: "Failed to load admin profile." });
  }
});

// GET /api/seo-config
app.get("/api/seo-config", (req, res) => {
  try {
    const credentials = readAdminCredentials();
    if (credentials) {
      const token = req.headers["x-admin-token"];
      if (!token || token !== currentSessionToken) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
      }
    }
    const config = readSEOConfig();
    return res.json(config);
  } catch (error) {
    console.error("Error fetching SEO config:", error);
    return res.status(500).json({ error: "Failed to read SEO configuration." });
  }
});

// GET /api/seo-config-public (Public access for share/landing customization)
app.get("/api/seo-config-public", (req, res) => {
  try {
    const config = readSEOConfig();
    return res.json(config);
  } catch (error) {
    console.error("Error fetching public SEO config:", error);
    return res.status(500).json({ error: "Failed to read public SEO configuration." });
  }
});

// POST /api/seo-config (Admin Edit API)
app.post("/api/seo-config", (req, res) => {
  try {
    const credentials = readAdminCredentials();
    if (credentials) {
      const token = req.headers["x-admin-token"];
      if (!token || token !== currentSessionToken) {
        return res.status(401).json({ error: "Unauthorized. Please log in." });
      }
    }
    const newConfig = req.body;
    writeSEOConfig(newConfig);
    return res.json({ success: true, message: "SEO config successfully updated." });
  } catch (error) {
    console.error("Error updating SEO config:", error);
    return res.status(500).json({ error: "Failed to write SEO configuration." });
  }
});

// Hidden SEO Supporting Pages for SEO indexing
app.get("/seo/virtual-cloning", (req, res) => {
  const config = readSEOConfig();
  const vc = config["virtual-cloning"] || {
    title: "Virtual Self Cloning - Secure & Private Digital Identity",
    description: "Discover how to build a fully private, empathetic digital twin of yourself.",
    backgroundColor: "#FAF9F5",
    textColor: "#1A1A1A",
    containerBg: "#FFFFFF",
    containerBorderColor: "#EEEEEE",
    badgeColor: "#6366F1",
    content: "<h1>Secure Virtual Human Cloning & Empathic Mirroring</h1><p>Welcome to the forefront of private, secure digital cloning.</p>"
  };

  res.setHeader("Content-Type", "text/html");
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${vc.title}</title>
      <meta name="description" content="${vc.description}">
      <meta name="keywords" content="virtual cloning, digital twin, private AI, empathetic companion, identity center, local storage privacy">
      <meta property="og:title" content="${vc.title}">
      <meta property="og:description" content="${vc.description}">
      <style>
        body { 
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          background-color: ${vc.backgroundColor}; 
          color: ${vc.textColor}; 
          margin: 0; 
          padding: 40px; 
          line-height: 1.6; 
        }
        .container { 
          max-width: 800px; 
          margin: 0 auto; 
          background: ${vc.containerBg}; 
          padding: 40px; 
          border-radius: 24px; 
          box-shadow: 0 4px 20px rgba(0,0,0,0.03); 
          border: 1px solid ${vc.containerBorderColor}; 
        }
        h1 { font-weight: 300; letter-spacing: -0.02em; color: ${vc.textColor}; font-size: 2.5em; }
        h2 { font-weight: 400; color: ${vc.textColor}; margin-top: 30px; opacity: 0.8; }
        p { color: ${vc.textColor}; opacity: 0.9; }
        .badge { 
          display: inline-block; 
          background: ${vc.badgeColor}; 
          color: white; 
          padding: 4px 12px; 
          font-size: 11px; 
          font-weight: 600; 
          border-radius: 20px; 
          letter-spacing: 0.1em; 
          text-transform: uppercase; 
        }
        footer { margin-top: 40px; border-top: 1px solid ${vc.containerBorderColor}; padding-top: 20px; font-size: 12px; color: ${vc.textColor}; opacity: 0.6; }
      </style>
    </head>
    <body>
      <div class="container">
        <span class="badge">SEO Configurable</span>
        ${vc.content}
        <footer>© 2026 Aura Virtual Self Corporation. Managed dynamically via Admin Panel.</footer>
      </div>
    </body>
    </html>
  `);
});

app.get("/seo/privacy-first-ai", (req, res) => {
  const config = readSEOConfig();
  const pf = config["privacy-first-ai"] || {
    title: "Privacy-First Artificial Intelligence Companionship",
    description: "A private AI workspace designed for deep human reflection.",
    backgroundColor: "#0A0A0B",
    textColor: "#E4E4E7",
    containerBg: "#141416",
    containerBorderColor: "#27272A",
    badgeColor: "#10B981",
    content: "<h1>Privacy-First AI & Zero Tracker Philosophy</h1><p>Welcome to the forefront of privacy-first companion systems.</p>"
  };

  res.setHeader("Content-Type", "text/html");
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${pf.title}</title>
      <meta name="description" content="${pf.description}">
      <meta name="keywords" content="private AI, offline-first, local state encryption, empathetic AI, virtual self creator">
      <style>
        body { 
          font-family: system-ui, sans-serif; 
          background-color: ${pf.backgroundColor}; 
          color: ${pf.textColor}; 
          margin: 0; 
          padding: 40px; 
          line-height: 1.7; 
        }
        .container { 
          max-width: 800px; 
          margin: 0 auto; 
          background: ${pf.containerBg}; 
          padding: 40px; 
          border-radius: 24px; 
          border: 1px solid ${pf.containerBorderColor}; 
        }
        h1 { font-weight: 300; letter-spacing: -0.01em; color: ${pf.textColor}; }
        h2 { font-weight: 400; color: ${pf.textColor}; opacity: 0.8; }
        p { color: ${pf.textColor}; opacity: 0.9; }
        .badge { 
          display: inline-block; 
          background: ${pf.badgeColor}; 
          color: white; 
          padding: 4px 12px; 
          font-size: 11px; 
          font-weight: 600; 
          border-radius: 20px; 
          letter-spacing: 0.1em; 
          text-transform: uppercase; 
        }
        footer { margin-top: 40px; border-top: 1px solid ${pf.containerBorderColor}; padding-top: 20px; font-size: 12px; color: ${pf.textColor}; opacity: 0.6; }
      </style>
    </head>
    <body>
      <div class="container">
        <span class="badge">SEO Configurable</span>
        ${pf.content}
        <footer>© 2026 Aura Virtual Self. Managed dynamically via Admin Panel.</footer>
      </div>
    </body>
    </html>
  `);
});

// Start Express server and bind Vite in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
