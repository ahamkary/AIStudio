import React, { useState, useEffect, useRef } from "react";
import { X, Minus, Maximize2, Send, MessageSquare, Sparkles } from "lucide-react";
import { PublicClone, Message } from "../types";
import TypingText from "./TypingText";

interface FloatingChatboxProps {
  clone: PublicClone;
  isDark: boolean;
  onClose: () => void;
}

export default function FloatingChatbox({ clone, isDark, onClose }: FloatingChatboxProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [activeCloneTypingId, setActiveCloneTypingId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load chat history from localStorage on mount/clone change
  useEffect(() => {
    const saved = localStorage.getItem(`aura_chat_clone_${clone.username}`);
    if (saved) {
      try {
        setChatHistory(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to parse saved chat history:", err);
        initializeGreeting();
      }
    } else {
      initializeGreeting();
    }
    setIsMinimized(false); // Maximize when a new clone is selected/clicked
  }, [clone]);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem(`aura_chat_clone_${clone.username}`, JSON.stringify(chatHistory));
    }
  }, [chatHistory, clone]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isMinimized, sendingMessage]);

  const initializeGreeting = () => {
    setChatHistory([
      {
        id: "greeting",
        role: "assistant",
        content: clone.recommendedGreeting || `Hello! I am the virtual self of @${clone.username}. Let's chat!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || sendingMessage) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      role: "user",
      content: userInput,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setUserInput("");
    setActiveCloneTypingId(null);
    setSendingMessage(true);

    try {
      const response = await fetch("/api/chat-with-clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cloneProfile: clone,
          message: userMsg.content,
          history: chatHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error("The virtual clone is unresponsive right now.");
      const data = await response.json();

      const assistantMsg: Message = {
        id: Math.random().toString(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setChatHistory((prev) => [...prev, assistantMsg]);
      setActiveCloneTypingId(assistantMsg.id);
    } catch (err: any) {
      const errorMsg: Message = {
        id: Math.random().toString(),
        role: "system",
        content: err.message || "An error occurred connecting to the virtual clone.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatHistory((prev) => [...prev, errorMsg]);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm(`Clear your conversation with @${clone.username}?`)) {
      localStorage.removeItem(`aura_chat_clone_${clone.username}`);
      initializeGreeting();
    }
  };

  if (isMinimized) {
    return (
      <div 
        onClick={() => setIsMinimized(false)}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full cursor-pointer shadow-lg hover:scale-105 active:scale-95 transition-all border duration-300 ${
          isDark 
            ? "bg-zinc-900 border-zinc-700 text-indigo-400" 
            : "bg-indigo-600 border-indigo-500 text-white"
        }`}
      >
        <span className="text-xl animate-bounce" role="img" aria-label="avatar">
          {clone.avatarSeed}
        </span>
        <div className="flex flex-col text-left">
          <span className="text-[11px] font-black uppercase tracking-wider leading-none">
            Chat with {clone.name}
          </span>
          <span className={`text-[9px] font-mono opacity-80 mt-0.5 leading-none ${isDark ? "text-zinc-400" : "text-indigo-200"}`}>
            @{clone.username}
          </span>
        </div>
        <MessageSquare className="w-4 h-4 ml-1 opacity-90 animate-pulse" />
      </div>
    );
  }

  return (
    <div 
      className={`fixed bottom-6 right-6 z-50 w-[340px] h-[450px] sm:w-[380px] sm:h-[480px] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 border animate-slideIn ${
        isDark 
          ? "bg-[#121214] border-zinc-800 text-zinc-100 shadow-zinc-950/50" 
          : "bg-white border-stone-200 text-stone-900 shadow-stone-300/60"
      }`}
    >
      {/* Header */}
      <div className={`p-3.5 border-b flex items-center justify-between ${
        isDark ? "bg-zinc-900/80 border-zinc-800" : "bg-indigo-50/50 border-stone-100"
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-2xl flex-shrink-0" role="img" aria-label="avatar">
            {clone.avatarSeed}
          </span>
          <div className="min-w-0 text-left">
            <h4 className="font-bold text-xs truncate leading-tight">{clone.name}</h4>
            <span className="text-[10px] font-mono text-indigo-500 dark:text-indigo-400 truncate block">
              @{clone.username}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={handleClearChat}
            title="Reset history"
            className={`p-1.5 rounded-lg text-[10px] font-mono hover:text-rose-500 transition-colors ${
              isDark ? "text-zinc-500 hover:bg-zinc-800" : "text-stone-400 hover:bg-stone-100"
            }`}
          >
            Clear
          </button>
          <button 
            onClick={() => setIsMinimized(true)}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-stone-100 text-stone-500"
            }`}
            title="Minimize"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button 
            onClick={onClose}
            className={`p-1.5 rounded-lg hover:text-rose-500 transition-colors ${
              isDark ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-stone-100 text-stone-500"
            }`}
            title="Close Chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mini bio */}
      <div className={`px-4 py-2 text-[10.5px] font-light border-b leading-relaxed ${
        isDark ? "bg-zinc-900/20 border-zinc-850/60 text-zinc-300" : "bg-stone-50/60 border-stone-100 text-stone-600"
      }`}>
        <p className="line-clamp-1">
          <span className="font-bold text-indigo-500 dark:text-indigo-400">Bio: </span>
          {clone.bio}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 hide-scrollbar">
        {chatHistory.map((msg) => {
          const isUser = msg.role === "user";
          const isSystem = msg.role === "system";

          if (isSystem) {
            return (
              <div key={msg.id} className="text-center py-1">
                <span className="text-[9px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded font-mono">
                  {msg.content}
                </span>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${isUser ? "ml-auto items-end" : "mr-auto items-start"}`}
            >
              <div
                className={`p-2.5 px-3 rounded-2xl text-[12.5px] leading-relaxed ${
                  isUser
                    ? isDark
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-stone-900 text-stone-100 rounded-br-none"
                    : isDark
                    ? "bg-zinc-900 text-zinc-200 rounded-bl-none border border-zinc-800"
                    : "bg-stone-100 text-stone-800 rounded-bl-none border border-stone-200/50"
                }`}
              >
                {msg.id === activeCloneTypingId ? (
                  <span 
                    className="cursor-pointer select-none" 
                    onClick={() => setActiveCloneTypingId(null)}
                    title="Skip typing"
                  >
                    <TypingText text={msg.content} onComplete={() => setActiveCloneTypingId(null)} />
                  </span>
                ) : (
                  msg.content
                )}
              </div>
              <span className="text-[8px] text-stone-400 dark:text-zinc-500 mt-0.5 px-1 font-mono">
                {msg.timestamp}
              </span>
            </div>
          );
        })}
        {sendingMessage && (
          <div className="flex flex-col max-w-[85%] mr-auto items-start">
            <div className={`p-2 px-3 rounded-2xl rounded-bl-none border flex items-center gap-1 ${
              isDark ? "bg-zinc-900 border-zinc-800" : "bg-stone-100 border-stone-200"
            }`}>
              <span className="w-1 h-1 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-1 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-1 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className={`p-3 border-t flex gap-2 ${
        isDark ? "border-zinc-800 bg-[#121214]" : "border-stone-150 bg-[#FFFFFF]"
      }`}>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={`Say something to ${clone.name}...`}
          disabled={sendingMessage}
          className={`flex-1 text-[12px] rounded-xl px-3 py-2 focus:outline-none transition-all ${
            isDark
              ? "bg-zinc-900 border border-zinc-800 focus:border-indigo-500 text-zinc-100 placeholder-zinc-600"
              : "bg-white border border-stone-300 focus:border-indigo-400 text-stone-950 placeholder-stone-400"
          }`}
        />
        <button
          type="submit"
          disabled={!userInput.trim() || sendingMessage}
          className={`p-2 rounded-xl transition-all ${
            userInput.trim() && !sendingMessage
              ? "bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95"
              : "bg-stone-200 dark:bg-zinc-800 text-stone-400 dark:text-zinc-600"
          }`}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
