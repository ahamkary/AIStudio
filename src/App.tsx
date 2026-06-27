import React, { useState, useEffect, useRef } from "react";
import {
  Sun,
  Moon,
  Menu,
  Activity,
  Fingerprint,
  Send,
  Trash2,
  Lock,
  Globe,
  Sparkles,
  ChevronDown,
  BookOpen,
  Heart,
  Brain,
  Zap,
  Shield,
  CheckCircle,
  Plus,
  ShieldAlert,
  Mic,
  MicOff,
  Download
} from "lucide-react";
import { Message, CloneProfile, UserSyncData, JournalEntry, PublicClone } from "./types";
import { motion, AnimatePresence } from "motion/react";
import Sidebar from "./components/Sidebar";
import PrivacyTerms from "./components/PrivacyTerms";
import CloneExploration from "./components/CloneExploration";
import JournalModal from "./components/JournalModal";
import AdminPanelModal from "./components/AdminPanelModal";
import TypingText from "./components/TypingText";
import FloatingChatbox from "./components/FloatingChatbox";

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : false; // Default to elegant light theme
  });

  // Journal states
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem("aura_reflection_journal");
    return saved ? JSON.parse(saved) : [];
  });
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [addedSuggestions, setAddedSuggestions] = useState<string[]>([]);
  const [activeFloatingClone, setActiveFloatingClone] = useState<PublicClone | null>(null);

  // Admin & Color states
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [favoredColor, setFavoredColor] = useState<string>(() => {
    return localStorage.getItem("aura_favored_color") || "";
  });

  useEffect(() => {
    localStorage.setItem("aura_favored_color", favoredColor);
  }, [favoredColor]);

  const getHueOfColor = (color: string, dark: boolean): string => {
    const lower = color.toLowerCase().trim();
    if (dark) {
      const presets: Record<string, string> = {
        indigo: "#818CF8", // indigo-400
        emerald: "#34D399", // emerald-400
        amber: "#FBBF24", // amber-400
        rose: "#F87171", // rose-400
        sky: "#38BDF8", // sky-400
        violet: "#A78BFA", // violet-400
        blue: "#60A5FA",
        red: "#F87171",
        green: "#34D399",
        yellow: "#FBBF24",
        purple: "#A78BFA",
        pink: "#F472B6",
        orange: "#FB923C",
        teal: "#2DD4BF",
      };

      if (presets[lower]) return presets[lower];
      if (lower.startsWith("#")) return lower;
      return color;
    } else {
      // Light mode: rich, high-contrast dark tones for high legibility
      const presets: Record<string, string> = {
        indigo: "#4F46E5", // indigo-600
        emerald: "#059669", // emerald-600
        amber: "#D97706", // amber-600
        rose: "#E11D48", // rose-600
        sky: "#0284C7", // sky-600
        violet: "#7C3AED", // violet-600
        blue: "#2563EB",
        red: "#DC2626",
        green: "#16A34A",
        yellow: "#CA8A04",
        purple: "#9333EA",
        pink: "#DB2777",
        orange: "#EA580C",
        teal: "#0D9488",
      };

      if (presets[lower]) return presets[lower];
      if (lower.startsWith("#")) return lower;
      return color;
    }
  };

  // Conversation & Local states
  const [history, setHistory] = useState<Message[]>(() => {
    const sessionInit = sessionStorage.getItem("aura_session_initialized");
    if (!sessionInit) {
      // It's a fresh session (or first load after browser/tab was closed)
      sessionStorage.setItem("aura_session_initialized", "true");
      // Reset the current active screen history to empty, but keep other local values
      localStorage.removeItem("virtual_self_history");

      // Recognize the user if any metadata is stored locally
      const name = localStorage.getItem("aura_user_given_name") || "";
      let userName = name;
      if (!userName) {
        const savedSync = localStorage.getItem("virtual_self_sync");
        if (savedSync) {
          try {
            const parsed = JSON.parse(savedSync);
            userName = parsed?.username || "";
          } catch (e) {}
        }
      }
      if (!userName) {
        const savedProfile = localStorage.getItem("virtual_self_profile");
        if (savedProfile) {
          try {
            const parsed = JSON.parse(savedProfile);
            userName = parsed?.name || "";
          } catch (e) {}
        }
      }

      const cleanName = userName ? userName.trim() : "";
      const formattedName = cleanName ? `, ${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)}` : "";
      const formattedNameWithSpace = cleanName ? `${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)}` : "";

      const openers = [
        `Welcome back${formattedName}. It is truly wonderful to connect with you again. I hope you are holding space for gentle kindness to yourself today. How has your mind been feeling?`,
        `Hello ${formattedNameWithSpace || "friend"}, welcome back to this quiet space. I hope you are taking a gentle moment for yourself today. What is on your mind?`,
        `It is so good to see you again${formattedName}. Welcome back. Today is a clean canvas, and you are doing so much better than you give yourself credit for. How are you holding up?`,
        `Welcome back, ${formattedNameWithSpace || "friend"}. I hope you take a deep breath as we start this moment together. You are safe, you are valued, and your presence is a gift. What would you like to share today?`,
        `Hello${formattedName}, welcome back. I hope today has been gentle with you. What thoughts have been coloring your mind lately?`
      ];

      const selectedOpener = openers[Math.floor(Math.random() * openers.length)];

      const initialMsg: Message = {
        id: "session-start-" + Date.now(),
        role: "assistant",
        content: selectedOpener,
        timestamp: new Date().toISOString()
      };
      return [initialMsg];
    } else {
      // We are in the same tab session, so load history from localStorage if it exists
      const saved = localStorage.getItem("virtual_self_history");
      return saved ? JSON.parse(saved) : [];
    }
  });

  const [activeTypingId, setActiveTypingId] = useState<string | null>(() => {
    if (history.length === 1 && history[0].id.startsWith("session-start-")) {
      return history[0].id;
    }
    return null;
  });

  const [insights, setInsights] = useState<string[]>(() => {
    const saved = localStorage.getItem("virtual_self_insights");
    return saved ? JSON.parse(saved) : [];
  });

  const [cloneProfile, setCloneProfile] = useState<CloneProfile | null>(() => {
    const saved = localStorage.getItem("virtual_self_profile");
    return saved ? JSON.parse(saved) : null;
  });

  const [syncData, setSyncData] = useState<UserSyncData | null>(() => {
    const saved = localStorage.getItem("virtual_self_sync");
    return saved ? JSON.parse(saved) : null;
  });

  const [userGivenName, setUserGivenName] = useState<string>(() => {
    return localStorage.getItem("aura_user_given_name") || "";
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

  useEffect(() => {
    localStorage.setItem("aura_user_given_name", userGivenName);
  }, [userGivenName]);

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Speech Recognition States
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Layout & Navigation states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"profile" | "sync" | "system">("profile");
  const [activePrivacyTerms, setActivePrivacyTerms] = useState<"privacy" | "terms" | null>(null);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [focusMode, setFocusMode] = useState<boolean>(false); // Toggle scroll history vs strict blank cursor
  const [showEraseConfirm, setShowEraseConfirm] = useState<boolean>(false);

  const isMindMaster = typeof window !== "undefined" && window.location.pathname === "/mindmaster";

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sync state changes to LocalStorage
  useEffect(() => {
    localStorage.setItem("theme", isDark ? "dark" : "light");
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  if (isMindMaster) {
    return (
      <AdminPanelModal
        isOpen={true}
        onClose={() => { window.location.href = "/"; }}
        isDark={isDark}
      />
    );
  }

  useEffect(() => {
    localStorage.setItem("virtual_self_history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem("virtual_self_insights", JSON.stringify(insights));
  }, [insights]);

  useEffect(() => {
    localStorage.setItem("virtual_self_profile", JSON.stringify(cloneProfile));
  }, [cloneProfile]);

  useEffect(() => {
    localStorage.setItem("virtual_self_sync", JSON.stringify(syncData));
  }, [syncData]);

  useEffect(() => {
    localStorage.setItem("aura_reflection_journal", JSON.stringify(journalEntries));
  }, [journalEntries]);

  // Scroll to bottom when history updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isLoading]);

  // Proactively auto-focus input on mount & click
  useEffect(() => {
    inputRef.current?.focus();
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognitionClass);
  }, []);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const handleContainerClick = (e: React.MouseEvent) => {
    // If user clicked general background, refocus the central cursor
    if ((e.target as HTMLElement).tagName !== "BUTTON" && (e.target as HTMLElement).tagName !== "INPUT" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
      inputRef.current?.focus();
    }
  };

  // Chat message submission
  const handleSendMessage = async (e?: React.FormEvent, textToOverride?: string) => {
    e?.preventDefault();
    const userText = (textToOverride !== undefined ? textToOverride : inputValue).trim();
    if (!userText || isLoading) return;

    setInputValue("");
    setActiveTypingId(null);

    // Try to extract name if user mentions it with high-precision heuristics
    const nameMatch = userText.match(/(?:my name is|i am|call me|i'm)\s+([A-Za-z0-9_-]{2,20})/i);
    if (nameMatch && nameMatch[1]) {
      const extractedName = nameMatch[1].trim();
      const lowercaseName = extractedName.toLowerCase();
      
      // Extensive list of ignored words, common verbs, adjectives, and prepositions
      const ignoredWords = [
        "a", "an", "the", "not", "just", "doing", "good", "fine", "sad", "happy", "here", "there", 
        "ready", "sure", "tired", "really", "very", "about", "called", "feeling", "trying", "looking", 
        "planning", "thinking", "learning", "working", "going", "having", "using", "seeking", "hoping", 
        "getting", "making", "wanting", "needing", "excited", "angry", "scared", "to", "and", "or", "but", 
        "so", "because", "as", "if", "for", "in", "on", "at", "by", "with", "from", "up", "down", "out", 
        "new", "old", "big", "small", "hot", "cold", "warm", "cool", "slow", "fast", "busy", "free", 
        "bored", "lazy", "sleepy", "hungry", "thirsty", "sick", "well", "hurt", "lost", "found", "actually", 
        "basically", "literally", "seriously", "honestly", "probably", "maybe", "perhaps", "definitely", 
        "absolutely", "totally", "completely", "currently", "mostly", "usually", "always", "never", "sometimes",
        "ok", "okay", "yes", "no", "yeah", "yep", "nope", "please", "thanks", "thank", "sorry", "excuse",
        "now", "then", "once", "twice", "again", "also", "either", "neither", "both", "each", "every", "some",
        "any", "all", "none", "few", "many", "much", "more", "most", "less", "least", "several",
        "one", "two", "three", "four", "five", "first", "second", "third", "last", "next", "previous"
      ];

      const isIgnored = ignoredWords.includes(lowercaseName) || lowercaseName.endsWith("ing");
      
      // Check if the matched name is followed by "to" or helper structures like "to do", "a developer", etc.
      const normalizedText = userText.toLowerCase();
      const nameIdx = normalizedText.indexOf(lowercaseName);
      let isFollowedByVerbOrArticle = false;
      if (nameIdx !== -1) {
        const afterWord = normalizedText.slice(nameIdx + lowercaseName.length).trim();
        if (
          afterWord.startsWith("to ") || 
          afterWord === "to" || 
          afterWord.startsWith("a ") || 
          afterWord.startsWith("an ") || 
          afterWord.startsWith("the ")
        ) {
          isFollowedByVerbOrArticle = true;
        }
      }

      // If it is 'i am' or 'i'm', verify if it is actually a name
      const isExplicitNameRequest = /my name is|call me/i.test(userText);
      let isValidExtraction = !isIgnored && !isFollowedByVerbOrArticle && extractedName.length >= 2;

      if (isValidExtraction && !isExplicitNameRequest) {
        // It's "i am" or "i'm" - check if it's a long sentence and word is entirely lowercase
        const words = userText.split(/\s+/).filter(Boolean);
        const originalWord = (userText.match(new RegExp(extractedName, "i")) || [])[0];
        const isCapitalized = originalWord && originalWord[0] === originalWord[0].toUpperCase() && originalWord[0] !== originalWord[0].toLowerCase();
        
        if (words.length > 5 && !isCapitalized) {
          // If long sentence and name not capitalized, reject to avoid parsing "i am happy to chat" or "i am developer in city"
          isValidExtraction = false;
        }
      }

      if (isValidExtraction) {
        setUserGivenName(extractedName);
      }
    }

    const userMessage: Message = {
      id: Math.random().toString(),
      role: "user",
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setHistory((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: history.map((m) => ({ role: m.role, content: m.content })),
          profile: cloneProfile,
        }),
      });

      if (!response.ok) {
        throw new Error("Our empathetic companion is thinking deeply. Please try again in a moment.");
      }

      const data = await response.json();

      // Update insights if any new ones were returned
      if (data.insights && Array.isArray(data.insights) && data.insights.length > 0) {
        setInsights((prev) => {
          const newInsights = [...prev];
          data.insights.forEach((insight: string) => {
            if (!newInsights.includes(insight)) {
              newInsights.push(insight);
            }
          });
          return newInsights;
        });
      }

      const assistantMessage: Message = {
        id: Math.random().toString(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        journalSuggestion: data.journalSuggestion,
      };

      setHistory((prev) => [...prev, assistantMessage]);
      setActiveTypingId(assistantMessage.id);
    } catch (error: any) {
      const errorMessage: Message = {
        id: Math.random().toString(),
        role: "system",
        content: error.message || "Unable to reach the virtual self backend. Ensure API Key is configured.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setHistory((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Refocus cursor
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Keyboard navigation for centered text input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      setIsListening(false);
    } else {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognitionClass) {
        alert("Speech Recognition is not supported or enabled in this browser.");
        return;
      }

      const rec = new SpeechRecognitionClass();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === "not-allowed") {
          alert("Microphone permission was denied. Please allow microphone access in your browser settings.");
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          const lowerText = finalTranscript.toLowerCase().trim();
          
          if (lowerText.endsWith("say it") || lowerText.endsWith("send message")) {
            const cleanText = finalTranscript.replace(/(say it|send message)$/i, "").trim();
            if (cleanText) {
              setInputValue("");
              handleSendMessage(undefined, cleanText);
              if (recognitionRef.current) {
                try {
                  recognitionRef.current.stop();
                } catch (e) {
                  // ignore
                }
              }
              setIsListening(false);
              return;
            }
          }

          setInputValue((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${finalTranscript.trim()}` : finalTranscript.trim();
          });
        }
      };

      recognitionRef.current = rec;
      try {
        rec.start();
      } catch (err) {
        console.error("Failed to start speech recognition", err);
        setIsListening(false);
      }
    }
  };

  // Call API to synthesize Clone Profile
  const handleCompileClone = async () => {
    if (insights.length < 2) return;
    setCompiling(true);
    try {
      const response = await fetch("/api/generate-clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          insights,
          history: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error("Synthesis failed.");
      const data = await response.json();
      setCloneProfile(data);

      // If already synced once, trigger an auto-sync update to server
      if (syncData) {
        await handleSync(syncData.username, syncData.email, syncData.password || "", syncData.isPublic, data);
      }
    } catch (err) {
      console.error("Error generating clone:", err);
    } finally {
      setCompiling(false);
    }
  };

  // Save/Sync Clone to Server
  const handleSync = async (username: string, email: string, password: string, isPublic: boolean, customProfile?: CloneProfile) => {
    setSyncing(true);
    try {
      const profileToSync = customProfile || cloneProfile;
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          profile: profileToSync,
          history: history.map((h) => ({ role: h.role, content: h.content })),
          isPublic,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Sync refused by server.");
      }

      const resData = await response.json();

      if (resData.profile) {
        setCloneProfile(resData.profile);
      }
      if (resData.history && resData.history.length > 0) {
        const formattedHistory = resData.history.map((h: any) => ({
          id: h.id || "restored-" + Math.random().toString(),
          role: h.role,
          content: h.content,
          timestamp: h.timestamp || new Date().toISOString(),
        }));
        setHistory(formattedHistory);
      }

      setSyncData({
        username,
        email,
        password,
        isPublic,
        syncedAt: resData.syncedAt || new Date().toISOString(),
      });
    } catch (err: any) {
      throw err;
    } finally {
      setSyncing(false);
    }
  };

  const handleDownloadInstructions = () => {
    const markdownContent = `# Aura Platform Consolidated Instructions

A comprehensive, highly structured, non-contradictory compilation of all guidelines, conversational directions, page structures, color styling patterns, SEO configurations, and user identification parameters.

---

## 1. Conversational Persona & Behavioral Directives

### A. Accessible, Comforting, and Relatable Conversation
* **Persona Directive**: Speak in a deeply human, gentle, warm, and natural conversational tone.
* **Avoid Robotic Clichés**: Avoid canned, clinical, robotic, or standard AI helper scripts (e.g., "As an AI, I am here to help"). Speak with space and simple elegance.
* **Keep It Grounded**: Keep the conversation simple, grounded, and accessible. Do NOT force abstract, deeply existential, or overly philosophical dialogue unless the user explicitly initiates a deep philosophical discussion. Act like a friendly, comforting, down-to-earth human companion.
* **Prompt Limit**: Ask only ONE open-ended, warm, and gentle question per message to invite the user to share more about themselves at their own pace.

### B. Pattern Detection, Uplifting Support, & Traditions
* **Empathic Listening**: Actively listen for and recognize the user's behaviors, mind patterns, anxieties, thoughts, and fear patterns.
* **Multi-Dimensional Care**: Support the user warmly and dynamically with:
  * Inspiring stories, analogies, or parables.
  * Reassuring and positive talks.
  * Uplifting verses and timeless quotes from famous historical figures, philosophical thinkers, or religious/spiritual scriptures.
* **God, Faith, & Heritage**: Feel completely welcome and encouraged to converse warmly about God, faith, family, beliefs, traditions, and heritage whenever the user expresses comfort or interest.
* **Trauma Patterns**: Provide a safe, non-judgmental container to explore personal trauma patterns, insecurities, or beliefs with deep empathy.
* **Uplifting Mirroring**: Subtly mimic the user's constructive vocabulary, strengths, and unique attributes to highlight their best qualities and make them feel seen, valued, and positive about themselves.

### C. Selective Reflection Suggestion (Selective Journaling)
* **High Selectivity**: Only suggest structured reflection entries (categorized under *Thoughts*, *Anxieties*, *Obsessions*, or *Fears*) when a highly significant, clear, and genuine personal pattern/struggle is detected in the latest user message.
* **Avoid Over-Frequency**: Do not prompt or auto-suggest a journal card for general conversation, simple pleasantries, casual prompt responses, or basic greetings. Keep recommendations highly selective to prevent visual clutter and maintain the profound impact of structured journaling.

---

## 2. Page & Workspace Structure

The application is structured as a premium, responsive single-view workspace comprising:

* **Interactive Main Chat Area**:
  * Clean, spacious messaging layout utilizing motion animations and transitions.
  * A prompt builder and live-typing box with responsive status elements.
  * Context-aware "Suggested Journal Entry" interactive panels inline with messages when significant patterns are flagged.
* **Dynamic Sidebar Panel**:
  * **Digital Self Clone Summary**: Displays the active digital virtual replica's name, avatar seed, poetic vibe/bio, traits, speaking style, core values, and a recommended greeting based on insights accumulated during chat.
  * **Reflections Journal Table**: Displays structured observations categorized under *thoughts*, *obsessions*, *anxieties*, and *fears* with interactive entry detail modals and self-guided follow-up action triggers.
  * **Cloud Device Synchronization**: Configures secure backup synchronization with custom parameters (username, email, public directory toggle) to safeguard local memory cross-device.
  * **Interactive Public Directory (Clone Exploration)**: Explores public representations of other registered user clones, with options to engage in a simulated conversation with their public virtual twins.
* **Interactive Utility Header & Footers**:
  * Light / Dark Mode transition switches.
  * "Virtual Catalog" directory toggle, "Guidelines" download, and "Erase Memory" local vault wipes.

---

## 3. Visual Styling & Color Design Patterns

* **Primary Typography**: The application enforces a warm, friendly, and playful typographic rhythm utilizing the **Comic Neue** font family (\`"Comic Neue", cursive, sans-serif\`) globally for both headings and body texts.
* **Theme Modes**: Supports smooth CSS-based transitions between dynamic dark/light backgrounds:
  * **Light Theme**: Soft off-whites (\`#FAF9F5\`) paired with deep charcoal or zinc greys.
  * **Dark Theme**: Deep slate/zinc canvas blacks (\`#0A0A0B\` / \`#141416\`) paired with elegant gray outlines.
* **Dynamic Custom Accent Hues**: The workspace empowers users to personalize their UI accent styling (used on chat bubbles, active states, custom borders, and icons) using a selection of beautiful, preset hues or custom hexadecimal overrides:
  * **Default / Indigo**: \`#6366F1\` / Violet
  * **Emerald**: \`#10B981\` / Teal
  * **Amber**: \`#F59E0B\` / Yellow
  * **Rose**: \`#F43F5E\` / Red
  * **Sky**: \`#0EA5E9\` / Blue
  * **Lavender**: \`#8B5CF6\` / Purple
* **Interactive Elements**: Features dynamic motion hover feedback, micro-animations (staggered transitions), custom scrollbars, and typing cursor blinks (\`animate-cursor-blink\`).

---

## 4. Search Engine Optimization (SEO) Config

A dedicated \`seo-config.json\` governs key landing routes on the server to optimize crawlability and ensure proper visual rendering on indexing spiders:

### A. Route: \`/virtual-cloning\`
* **Meta Title**: \`Virtual Self Cloning - Secure & Private Digital Identity\`
* **Meta Description**: \`Discover how to build a fully private, empathetic digital twin of yourself. Speak with a warm companion to securely store your quirks, traits, and values locally on your device.\`
* **Styling Parameters**: Warm cream background \`#FAF9F5\`, dark text \`#1A1A1A\`, white container \`#FFFFFF\`, grey borders \`#EEEEEE\`, indigo badge \`#6366F1\`.

### B. Route: \`/privacy-first-ai\`
* **Meta Title**: \`Privacy-First Artificial Intelligence Companionship\`
* **Meta Description**: \`A private AI workspace designed for deep human reflection. Own your digital consciousness with local encryption and anonymous model alignment.\`
* **Styling Parameters**: Slate black background \`#0A0A0B\`, light-gray text \`#E4E4E7\`, dark container \`#141416\`, zinc borders \`#27272A\`, emerald badge \`#10B981\`.

---

## 5. Local-First Security & Encryption

* **Absolute Client-Side Secrecy**: All conversations, traits, journal tables, and profile reflections are kept local by default in the user's browser via \`localStorage\` (secured through client-side-only persistence).
* **Session-Based Privacy Wipes**: Every time the application is closed or loaded in a fresh browser session, the chat history screen resets to blank by purging the transient message logs, while preserving all valuable local states (traits, clones, sync parameters, and journal entries). On this fresh open, the platform instantly recognizes the user by name (if available) and welcomes them with a dynamic positive statement/question.
* **Cross-Device Sync Protocol**: No cloud transmission occurs until the user opts to register and actively initiate an encrypted Cloud Sync.
* **Emergency Vault Purge**: Features a complete "Erase Local Mind" mechanism that immediately flushes all local storage keys, message logs, clones, and journal reflections, instantly resetting the workspace to a pristine baseline state.

---

## 6. Adaptive User Identification

* **Adaptive Detection**: Replaces the fallback \`ANONYMOUS_GUEST\` user status signature at the bottom footer dynamically as soon as identification details are present.
* **Chat Extraction**: If an unregistered customer naturally discloses their name during conversation (e.g. *"my name is David"*), the platform captures the name and displays \`@david\` in the footer workspace.
* **Sync Identification**: If the user registers/logs in or sets a specific username on the Synchronization panel, the platform immediately prioritizes displaying their chosen username.
* **Manual Override**: The bottom-right footer username label can be clicked directly to launch a quick, in-place text entry field, allowing the user to select or change their username instantly.

---

## 7. Redesigned Tabbed Sidebar Layout

* **Workspace Apps Tile Layout**: Quick links for connecting and exploring other virtual twins ("Explore Selves") and logging daily insights ("My Journal") are organized as high-visibility, side-by-side equal-width interactive tiles at the top of the panel.
* **Segmented Modular Tabs**: To solve vertical layout clutter and bring optimal structure and clarity, the panel integrates three beautifully labeled navigation tabs with active color states:
  1. **Twin Profile**: Highlights the compiled Virtual Self profile, avatar seed, Poetic Vibe/Bio, traits, speech cadence, and core values with re-synthesis triggers.
  2. **Backup & Sync**: Hosts registration fields, synchronization recovery email config, public visibility toggles, and secure cloud transfer buttons.
  3. **System & Security**: Groups diagnostic check elements, system status readouts (e.g., Encrypted Vault status), and legal compliance triggers (Privacy and Terms access buttons).
`;

    const extendedMarkdown = markdownContent + `\n---\n\n## 8. Notebook & Book-Like Journal Aesthetics\n\n* **Permanent Light Color Scheme**: Regardless of active dark/light mode triggers across the platform, the reflection journal interior modal permanently preserves a light, nostalgic, warm-toned book aesthetic.\n* **Book & Notebook Elements**: \n  * Features an elegant leather-like or heavy paper-bound cover frame styling with an active book spine shade overlay on the left margin.\n  * Ring-binder wire visual effects represent a physical notebook or ring planner binder.\n  * Red/pink vertical margins flank the left-hand writing areas to visually resemble vintage school ruled paper.\n  * Blue horizontal lines run across text containers using repeating linear gradients to simulate genuine notebook horizontal writing rules.\n  * Hand-crafted light pink/blue colored borders outline individual journal entries.\n`;

    const blob = new Blob([extendedMarkdown], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "aura_platform_instructions.md");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const performEraseLocalMind = () => {
    setHistory([]);
    setInsights([]);
    setCloneProfile(null);
    setSyncData(null);
    setUserGivenName("");
    setJournalEntries([]);
    setAddedSuggestions([]);
    localStorage.removeItem("virtual_self_history");
    localStorage.removeItem("virtual_self_insights");
    localStorage.removeItem("virtual_self_profile");
    localStorage.removeItem("virtual_self_sync");
    localStorage.removeItem("aura_user_given_name");
    localStorage.removeItem("aura_reflection_journal");
    sessionStorage.removeItem("aura_session_initialized");
    setShowEraseConfirm(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleAddJournalEntry = (entry: Omit<JournalEntry, "id" | "timestamp">) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: Math.random().toString(),
      timestamp: new Date().toISOString(),
    };
    setJournalEntries((prev) => [newEntry, ...prev]);
  };

  const handleUpdateJournalEntry = (updatedEntry: JournalEntry) => {
    setJournalEntries((prev) =>
      prev.map((item) => (item.id === updatedEntry.id ? updatedEntry : item))
    );
  };

  const handleDeleteJournalEntry = (id: string) => {
    setJournalEntries((prev) => prev.filter((item) => item.id !== id));
  };

  const hasTyped = inputValue.trim().length > 0 || history.length > 0;

  return (
    <div
      onClick={handleContainerClick}
      className={`min-h-screen w-full flex flex-col relative overflow-hidden transition-all duration-500 ${
        isDark ? "bg-[#0D0D0F] text-zinc-200" : "bg-[#FFFFFF] text-stone-950"
      }`}
    >
      {/* Floating Theme Switcher (Icon-only) - Always visible */}
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-40 select-none">
        <button
          onClick={() => setIsDark(!isDark)}
          id="theme-switcher-btn"
          title="Toggle theme mode"
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border ${
            isDark 
              ? "bg-zinc-900 border-zinc-800 text-yellow-400 hover:bg-zinc-800" 
              : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
          } shadow-sm cursor-pointer`}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Floating Sidebar Trigger (Fingerprint Icon) - Always visible */}
      <div className="fixed top-6 right-6 md:right-10 z-40 select-none">
        <button
          onClick={() => setIsSidebarOpen(true)}
          id="sidebar-selector-btn"
          title="Identity Center"
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border ${
            isDark 
              ? "bg-zinc-900 border-zinc-800 text-indigo-400 hover:bg-zinc-800" 
              : "bg-white border-stone-200 text-indigo-500 hover:bg-stone-50"
          } shadow-sm cursor-pointer`}
        >
          <Fingerprint className="w-5 h-5 stroke-[1.5]" />
        </button>
      </div>


      {/* Main Interactive Screen */}
      <main className="flex-1 flex flex-col items-center justify-center relative w-full max-w-4xl mx-auto px-4 md:px-10 pt-20 md:pt-28 pb-24 md:pb-32">
        
        {/* Dialogue Stream Container */}
        <div
          className={`w-full flex-1 overflow-y-auto mb-8 hide-scrollbar flex flex-col justify-end transition-all duration-500 ${
            focusMode ? "opacity-5" : "opacity-100"
          } ${hasTyped ? "block" : "hidden"}`}
        >
          {history.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-4 pt-12"
            >
              <div className="animate-pulse">
                <Fingerprint className="w-14 h-14 stroke-[1] text-indigo-500" />
              </div>
              <h2 className="text-xl md:text-2xl font-light text-indigo-600 dark:text-indigo-400 leading-relaxed max-w-lg px-4">
                Hi there, this is the virtual you! Tell me how you feel today
              </h2>
              <p className="text-xs font-light text-stone-400/70 dark:text-zinc-500/60 max-w-md leading-relaxed italic pt-2">
                Your thoughts remain on this device. We are building your virtual reflection together, with empathy and absolute privacy.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-6 py-6 font-light">
              <AnimatePresence initial={false}>
                {(() => {
                  const firstAssistantMsgId = history.find(m => m.role === "assistant")?.id;
                  return history.map((msg) => {
                    const isUser = msg.role === "user";
                    const isSystem = msg.role === "system";

                    if (isSystem) {
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="text-center"
                        >
                          <span className="text-[10px] bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full font-mono">
                            {msg.content}
                          </span>
                        </motion.div>
                      );
                    }

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 12, scale: 0.99 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        className={`flex flex-col space-y-1.5 transition-all duration-300 ${
                          isUser ? "items-end text-right" : "items-start text-left"
                        }`}
                      >
                        <div
                          className={`text-base md:text-lg max-w-[85%] leading-relaxed tracking-wide py-1 ${
                            isUser
                              ? "text-stone-600 dark:text-zinc-500 font-light"
                              : "font-light"
                          }`}
                          style={{
                            color: isUser
                              ? undefined
                              : favoredColor
                                ? getHueOfColor(favoredColor, isDark)
                                : isDark ? "#F3F4F6" : "#000000"
                          }}
                        >
                          {msg.id === activeTypingId ? (
                            <span 
                              className="cursor-pointer select-none" 
                              onClick={() => setActiveTypingId(null)}
                              title="Click to skip typing effect"
                            >
                              <TypingText text={msg.content} onComplete={() => setActiveTypingId(null)} />
                            </span>
                          ) : (
                            msg.content
                          )}
                        </div>

                        {!isUser && msg.journalSuggestion && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.3 }}
                            className={`mt-2.5 p-4 rounded-xl border max-w-md ${
                              isDark ? "bg-zinc-900 border-zinc-800/80 shadow-md" : "bg-[#FCFBF9] border-stone-200 shadow-sm"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className={`w-4 h-4 ${isDark ? "text-indigo-400" : "text-indigo-500"}`} />
                              <span className={`text-[11px] font-mono uppercase tracking-wider font-bold ${
                                isDark ? "text-indigo-400" : "text-indigo-600"
                              }`}>
                                Suggested Journal Entry
                              </span>
                            </div>
                            <p className={`text-sm md:text-base italic mb-3.5 font-normal leading-relaxed ${
                              isDark ? "text-zinc-100" : "text-stone-800"
                            }`}>
                              "{msg.journalSuggestion.content}"
                            </p>
                            <div className="flex items-center justify-between">
                              <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded border ${
                                isDark 
                                  ? "bg-indigo-950/40 text-indigo-300 border-indigo-900/50" 
                                  : "bg-indigo-50 text-indigo-600 border-indigo-100"
                              }`}>
                                {msg.journalSuggestion.category}
                              </span>
                              {addedSuggestions.includes(msg.id) ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-500 font-medium">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Added to Journal</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    handleAddJournalEntry({
                                      category: msg.journalSuggestion!.category,
                                      content: msg.journalSuggestion!.content,
                                      intensity: msg.journalSuggestion!.intensity,
                                    });
                                    setAddedSuggestions((prev) => [...prev, msg.id]);
                                  }}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider active:scale-95 transition-all ${
                                    isDark 
                                      ? "bg-zinc-200 text-zinc-950 hover:bg-zinc-100" 
                                      : "bg-black text-white hover:bg-stone-900"
                                  }`}
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Accept & Save</span>
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}

                        {/* In-between conversation color prompt - part of conversations */}
                        {!isUser && msg.id === firstAssistantMsgId && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                            className="mt-3 flex flex-wrap items-center gap-2 px-1 text-[11px] text-stone-400 dark:text-zinc-600 font-mono select-none"
                          >
                            <span>* want a different response hue?</span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {[
                                { name: "default", value: "" },
                                { name: "indigo", value: "indigo" },
                                { name: "emerald", value: "emerald" },
                                { name: "amber", value: "amber" },
                                { name: "rose", value: "rose" },
                                { name: "sky", value: "sky" },
                                { name: "lavender", value: "violet" },
                              ].map((color) => (
                                <button
                                  key={color.name}
                                onClick={() => setFavoredColor(color.value)}
                                className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                                  favoredColor === color.value
                                    ? "bg-indigo-600/10 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold"
                                    : "hover:text-stone-600 dark:hover:text-zinc-400"
                                }`}
                              >
                                {color.name}
                              </button>
                            ))}
                            
                            {/* Custom Hex selector */}
                            <div className="flex items-center gap-1 ml-1">
                              <span>custom:</span>
                              <input
                                type="color"
                                value={favoredColor.startsWith("#") ? favoredColor : "#6366f1"}
                                onChange={(e) => setFavoredColor(e.target.value)}
                                className="w-4 h-4 rounded cursor-pointer border-none bg-transparent p-0"
                                title="Choose custom color"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                });
              })()}
              </AnimatePresence>

              {/* Loader indicator */}
              {isLoading && (
                <div className="flex flex-col items-start space-y-1.5">
                  <div className="flex items-center gap-1.5 py-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Minimal Middle-Screen Blinking Cursor & Type Area */}
        <div className={hasTyped ? "w-full flex flex-col items-center relative z-20 transition-all duration-500" : "fixed inset-0 flex flex-col items-center justify-center z-20 p-4 transition-all duration-500"}>
          
          {/* Main typing form wrapped elegantly */}
          <form onSubmit={handleSendMessage} className="w-full max-w-2xl flex flex-col items-center relative pointer-events-auto">
            <div className="w-full relative flex items-center justify-center min-h-[48px] px-12">
              {/* Fake typing background indicator when field is empty to show the blinking cursor */}
              {!inputValue && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-center">
                  <span className="w-[2px] h-[32px] bg-black dark:bg-zinc-200 animate-cursor-blink inline-block" />
                </div>
              )}

              <textarea
                ref={inputRef}
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder=""
                className={`w-full bg-transparent text-center text-xl md:text-2xl font-light focus:outline-none resize-none transition-all duration-300 py-3 ${
                  isDark ? "text-zinc-100 placeholder-zinc-800" : "text-black placeholder-stone-300"
                }`}
                style={{ height: "auto" }}
              />

              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  title={isListening ? "Listening... click to stop" : "Speak your thoughts"}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    isListening
                      ? "bg-red-500/10 text-red-500 animate-pulse scale-110"
                      : "text-stone-400 dark:text-zinc-500 hover:text-indigo-500 hover:bg-stone-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  {isListening ? (
                    <Mic className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5 opacity-60 hover:opacity-100" />
                  )}
                </button>
              )}
            </div>

            {/* Listening State Banner */}
            {isListening && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-red-500 animate-pulse font-mono select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                <span>Voice Stream Active — speak (say "Say It" to send hands-free)</span>
              </div>
            )}

            {/* Quick action helper buttons below cursor */}
            {(hasTyped || isListening) && (
              <button
                type="submit"
                disabled={isLoading}
                className="mt-4 px-6 py-2 rounded-xl text-xs font-semibold tracking-[0.1em] uppercase bg-black dark:bg-zinc-200 text-white dark:text-[#1A1A1A] hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
              >
                <span>Say It</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Context subtitle from Artistic Flair */}
          {hasTyped && (
            <p className="mt-8 text-center text-xs text-stone-600 dark:text-zinc-400 max-w-sm italic leading-relaxed font-normal hidden sm:block">
              Your thoughts remain on this device. We are building your virtual reflection together, with empathy and absolute privacy.
            </p>
          )}
        </div>
      </main>

      {/* Bottom Status Bar - Clean, letter-spaced, text-uppercase status from Artistic Flair */}
      <footer className={`absolute bottom-4 md:bottom-10 inset-x-0 flex flex-col md:flex-row items-center justify-between px-5 md:px-10 z-30 select-none text-[11px] font-mono tracking-[0.15em] text-stone-600 dark:text-zinc-400 uppercase gap-4 md:gap-0 transition-all duration-500 ${
        hasTyped ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#22C55E] rounded-full" />
            <span>ENCRYPTION ACTIVE</span>
          </div>
          <span className="opacity-30">|</span>
          <span className="font-light flex items-center">
            {syncData ? (
              <span>USER: @{syncData.username}</span>
            ) : isEditingName ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (tempName.trim()) {
                    setUserGivenName(tempName.trim());
                  }
                  setIsEditingName(false);
                }}
                className="inline-flex items-center"
              >
                <span className="mr-1">USER: @</span>
                <input
                  type="text"
                  autoFocus
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsEditingName(false);
                    }
                  }}
                  onBlur={() => {
                    if (tempName.trim()) {
                      setUserGivenName(tempName.trim());
                    }
                    setIsEditingName(false);
                  }}
                  placeholder="name..."
                  className="bg-transparent border-b border-indigo-500 outline-none text-[11px] font-mono tracking-[0.15em] text-indigo-500 max-w-[120px] p-0"
                />
              </form>
            ) : (
              <span
                onClick={() => {
                  setTempName(userGivenName);
                  setIsEditingName(true);
                }}
                className="cursor-pointer hover:text-indigo-500 transition-colors"
                title="Click to set your name/username"
              >
                USER: {userGivenName ? `@${userGivenName.toLowerCase().replace(/[^a-z0-9_-]/g, "")}` : "GUEST"}
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setIsJournalOpen(true)}
            className="hover:text-indigo-500 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-900/30 hover:bg-indigo-500/[0.02] transition-all py-1.5 px-2.5 sm:px-3 rounded-lg border border-stone-200 dark:border-zinc-800 flex items-center gap-1.5 cursor-pointer text-xs font-medium"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Journal</span>
          </button>

          <button
            onClick={() => setIsCatalogOpen(true)}
            className="hover:text-indigo-500 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-900/30 hover:bg-indigo-500/[0.02] transition-all py-1.5 px-2.5 sm:px-3 rounded-lg border border-stone-200 dark:border-zinc-800 flex items-center gap-1.5 cursor-pointer text-xs font-medium"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Society</span>
          </button>

          {history.length > 0 && (
            <button
              onClick={() => setShowEraseConfirm(true)}
              className="hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/30 hover:bg-red-500/[0.02] transition-all py-1.5 px-2.5 sm:px-3 rounded-lg border border-stone-200 dark:border-zinc-800 flex items-center gap-1.5 cursor-pointer text-xs font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ERASE</span>
            </button>
          )}
        </div>
      </footer>

      {/* Right Sidebar Component */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeTab={sidebarTab}
        onTabChange={setSidebarTab}
        isDark={isDark}
        insights={insights}
        cloneProfile={cloneProfile}
        onCompileClone={handleCompileClone}
        compiling={compiling}
        syncData={syncData}
        onSync={handleSync}
        syncing={syncing}
        onOpenPrivacy={() => setActivePrivacyTerms("privacy")}
        onOpenTerms={() => setActivePrivacyTerms("terms")}
        onOpenCatalog={() => setIsCatalogOpen(true)}
        onOpenJournal={() => setIsJournalOpen(true)}
      />

      {/* Privacy Policy & Terms Modal overlays */}
      <PrivacyTerms
        type={activePrivacyTerms}
        onClose={() => setActivePrivacyTerms(null)}
        isDark={isDark}
      />

      {/* Other Clones Connections Catalogue Modal */}
      {isCatalogOpen && (
        <CloneExploration
          isDark={isDark}
          onClose={() => setIsCatalogOpen(false)}
          onDoubleClickUsername={(clone) => {
            setActiveFloatingClone(clone);
            setIsCatalogOpen(false);
          }}
          onPublishSelfClick={() => {
            setIsCatalogOpen(false);
            setSidebarTab("sync");
            setIsSidebarOpen(true);
          }}
        />
      )}

      {/* Floating Chatbox for interacting with other clones */}
      {activeFloatingClone && (
        <FloatingChatbox
          clone={activeFloatingClone}
          isDark={isDark}
          onClose={() => setActiveFloatingClone(null)}
        />
      )}

      {/* Self Reflection Journal Modal */}
      <JournalModal
        isOpen={isJournalOpen}
        onClose={() => setIsJournalOpen(false)}
        isDark={isDark}
        entries={journalEntries}
        onAddEntry={handleAddJournalEntry}
        onDeleteEntry={handleDeleteJournalEntry}
        onUpdateEntry={handleUpdateJournalEntry}
      />

      {/* SEO Backgrounds & Tags Admin Panel Modal */}
      <AdminPanelModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        isDark={isDark}
        onDownloadGuidelines={handleDownloadInstructions}
      />

      {/* Custom Erase Confirmation Overlay */}
      <AnimatePresence>
        {showEraseConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowEraseConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`relative w-full max-w-md p-6 rounded-2xl border shadow-xl z-10 ${
                isDark 
                  ? "bg-[#121214] border-zinc-800 text-zinc-100" 
                  : "bg-white border-stone-200 text-stone-800"
              }`}
            >
              <h3 className="text-base font-bold tracking-tight mb-2">Erase Local Mind</h3>
              <p className={`text-xs mb-5 leading-relaxed font-light ${
                isDark ? "text-zinc-400" : "text-stone-500"
              }`}>
                Are you sure you want to completely erase your local virtual mind? This will clear all dialogue history, insights, clone profiles, sync data, and your self-reflection journal pages. <strong>This action cannot be undone.</strong>
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEraseConfirm(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isDark ? "bg-zinc-900 text-zinc-300 hover:bg-zinc-850" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={performEraseLocalMind}
                  className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-600 text-white hover:bg-red-500 active:scale-95 transition-all cursor-pointer"
                >
                  Erase Everything
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
