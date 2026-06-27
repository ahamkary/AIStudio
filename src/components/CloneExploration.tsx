import React, { useState, useEffect } from "react";
import { MessageSquare, RefreshCw, X, Send, Eye, Sparkles } from "lucide-react";
import { PublicClone, Message } from "../types";
import TypingText from "./TypingText";

interface CloneExplorationProps {
  isDark: boolean;
  onClose: () => void;
  onDoubleClickUsername?: (clone: PublicClone) => void;
  onPublishSelfClick?: () => void;
}

export default function CloneExploration({ isDark, onClose, onDoubleClickUsername, onPublishSelfClick }: CloneExplorationProps) {
  const [clones, setClones] = useState<PublicClone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClone, setSelectedClone] = useState<PublicClone | null>(null);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [activeCloneTypingId, setActiveCloneTypingId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Fetch public clones from server
  const fetchClones = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/clones");
      if (!response.ok) throw new Error("Could not fetch virtual clones.");
      const data = await response.json();
      setClones(data.clones || []);
    } catch (err: any) {
      setError(err.message || "Failed to load clones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClones();
  }, []);

  const handleStartChat = (clone: PublicClone) => {
    setSelectedClone(clone);
    // Initialize with clone's custom greeting!
    setChatHistory([
      {
        id: "greeting",
        role: "assistant",
        content: clone.recommendedGreeting || `Hello, I am the virtual version of ${clone.username}. Let's connect.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !selectedClone || sendingMessage) return;

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
      // API call to talk with clone
      const response = await fetch("/api/chat-with-clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cloneProfile: selectedClone,
          message: userMsg.content,
          history: chatHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error("Connection timed out. The clone is quiet.");
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
        content: err.message || "An error occurred connecting to the virtual self.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatHistory((prev) => [...prev, errorMsg]);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div
        className={`w-full max-w-4xl h-[85vh] rounded-2xl flex flex-col md:flex-row overflow-hidden transition-all duration-300 border ${
          isDark
            ? "bg-[#121214] border-zinc-800 text-zinc-100"
            : "bg-[#FFFFFF] border-stone-200 text-stone-950"
        }`}
      >
        {/* Left list pane */}
        <div
          className={`w-full md:w-2/5 p-5 flex flex-col border-r ${
            isDark ? "border-zinc-800 bg-[#0c0c0d]" : "border-stone-200 bg-[#FAF9F6]"
          }`}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
              <h3 className="font-semibold text-lg tracking-tight">My Virtual Society</h3>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={fetchClones}
                title="Refresh society"
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-stone-200 text-stone-600"
                }`}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="md:hidden p-1.5 rounded-lg hover:bg-red-500/10 text-stone-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-xs font-light text-stone-500 dark:text-zinc-400 mb-4 leading-relaxed">
            Connect with virtual representations of other users. <span className="text-indigo-500 dark:text-indigo-400 font-medium">Double-click on any username</span> to open a quick, persistent chatbox!
          </p>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 hide-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-sm text-stone-400 font-light">
                <RefreshCw className="w-5 h-5 animate-spin mb-2 text-stone-500" />
                <span>Syncing society from cloud...</span>
              </div>
            ) : error ? (
              <div className="p-3 text-center text-xs text-red-500 font-light bg-red-500/5 rounded-xl border border-red-500/20">
                {error}
              </div>
            ) : clones.length === 0 ? (
              <div className="text-center py-12 text-xs text-stone-400 font-light">
                No virtual clones synced yet. Be the first to publish{" "}
                <button
                  type="button"
                  onClick={() => {
                    if (onPublishSelfClick) {
                      onPublishSelfClick();
                    }
                  }}
                  className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium underline focus:outline-none cursor-pointer"
                >
                  your virtual self
                </button>
                !
              </div>
            ) : (
              clones.map((clone) => (
                <div
                  key={clone.username}
                  onClick={() => handleStartChat(clone)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                    selectedClone?.username === clone.username
                      ? isDark
                        ? "bg-zinc-800 border-zinc-700 text-zinc-100 shadow-md shadow-zinc-950/25"
                        : "bg-white border-stone-300 text-stone-900 shadow-md shadow-stone-200/50"
                      : isDark
                      ? "bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-800/40"
                      : "bg-white/80 border-stone-200 hover:bg-stone-100/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-xl" role="img" aria-label="avatar">
                      {clone.avatarSeed}
                    </span>
                    <div className="overflow-hidden">
                      <h4 className="font-medium text-sm truncate">{clone.name}</h4>
                      <p 
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          if (onDoubleClickUsername) {
                            onDoubleClickUsername(clone);
                          }
                        }}
                        className="text-[10px] text-stone-500 dark:text-zinc-400 truncate font-mono cursor-pointer hover:text-indigo-500 transition-colors select-none"
                        title="Double-click to open quick chatbox!"
                      >
                        @{clone.username}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-zinc-300 line-clamp-2 font-light">
                    {clone.bio}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {clone.traits.slice(0, 2).map((t, i) => (
                      <span
                        key={i}
                        className="text-[9px] px-1.5 py-0.5 rounded-md font-light bg-indigo-500/10 text-indigo-500"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right dialogue pane */}
        <div className="flex-1 flex flex-col h-full relative">
          <button
            onClick={onClose}
            className={`hidden md:block absolute top-4 right-4 p-1.5 rounded-full z-10 transition-colors ${
              isDark ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-stone-200 text-stone-600"
            }`}
          >
            <X className="w-5 h-5" />
          </button>

          {selectedClone ? (
            <div className="flex flex-col h-full">
              {/* Active Header */}
              <div
                className={`p-4 border-b flex items-center justify-between ${
                  isDark ? "border-zinc-800 bg-[#0e0e10]" : "border-stone-200 bg-[#FFFFFF]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedClone.avatarSeed}</span>
                  <div>
                    <h3 className="font-semibold text-sm leading-tight">{selectedClone.name}</h3>
                    <p className="text-[10px] text-stone-600 dark:text-zinc-400 font-mono">
                      Active Bridge / Simulation
                    </p>
                  </div>
                </div>
              </div>

              {/* Bio & Details Header Drawer */}
              <div
                className={`p-3.5 px-5 text-xs font-light border-b ${
                  isDark ? "bg-[#18181b]/40 border-zinc-800/60" : "bg-[#FAF9F6] border-stone-200"
                }`}
              >
                <div className="text-stone-600 dark:text-zinc-300 mb-1 leading-relaxed">
                  <span className="font-medium text-stone-700 dark:text-zinc-200">About Clone: </span>
                  {selectedClone.bio}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="font-medium text-[10px] text-stone-500 dark:text-zinc-400 self-center mr-1">
                    Style:
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-500">
                    {selectedClone.speakingStyle}
                  </span>
                  <span className="font-medium text-[10px] text-stone-500 dark:text-zinc-400 self-center ml-2 mr-1">
                    Values:
                  </span>
                  {selectedClone.coreValues.map((v, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              {/* Scrollable Dialogue */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 hide-scrollbar">
                {chatHistory.map((msg) => {
                  const isUser = msg.role === "user";
                  const isSystem = msg.role === "system";

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="text-center py-2">
                        <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-1 rounded-full font-light">
                          {msg.content}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[80%] ${isUser ? "ml-auto items-end" : "mr-auto items-start"}`}
                    >
                      <div
                        className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                          isUser
                            ? isDark
                              ? "bg-zinc-800 text-zinc-100 rounded-br-none"
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
                            title="Click to skip typing effect"
                          >
                            <TypingText text={msg.content} onComplete={() => setActiveCloneTypingId(null)} />
                          </span>
                        ) : (
                          msg.content
                        )}
                      </div>
                      <span className="text-[9px] text-stone-400 dark:text-zinc-500 mt-1 px-1 font-mono">
                        {msg.timestamp}
                      </span>
                    </div>
                  );
                })}
                {sendingMessage && (
                  <div className="flex flex-col max-w-[80%] mr-auto items-start">
                    <div
                      className={`p-3.5 rounded-2xl rounded-bl-none text-sm border flex items-center gap-1.5 ${
                        isDark ? "bg-zinc-900 border-zinc-800" : "bg-stone-100 border-stone-200"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-stone-500 dark:bg-zinc-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-stone-500 dark:bg-zinc-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-stone-500 dark:bg-zinc-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Send Area */}
              <form
                onSubmit={handleSendMessage}
                className={`p-4 border-t flex gap-2 ${
                  isDark ? "border-zinc-800 bg-[#0e0e10]" : "border-stone-200 bg-[#FFFFFF]"
                }`}
              >
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={`Speak with virtual ${selectedClone.name}...`}
                  disabled={sendingMessage}
                  className={`flex-1 text-sm rounded-xl px-4 py-2.5 focus:outline-none transition-all ${
                    isDark
                      ? "bg-zinc-900 border border-zinc-800 focus:border-indigo-500 text-zinc-100 placeholder-zinc-500"
                      : "bg-white border border-stone-300 focus:border-indigo-400 text-stone-950 placeholder-stone-500"
                  }`}
                />
                <button
                  type="submit"
                  disabled={!userInput.trim() || sendingMessage}
                  className={`p-2.5 rounded-xl transition-all ${
                    userInput.trim() && !sendingMessage
                      ? "bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 active:scale-95"
                      : "bg-stone-300 dark:bg-zinc-800 text-stone-400 dark:text-zinc-600"
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div
                className={`p-4 rounded-full mb-4 ${isDark ? "bg-zinc-800/50 text-zinc-500" : "bg-stone-100 text-stone-400"}`}
              >
                <MessageSquare className="w-10 h-10 stroke-[1.2]" />
              </div>
              <h3 className="font-semibold text-base mb-1">Bridge Connection Inactive</h3>
              <p className="text-xs font-light max-w-sm text-stone-500 dark:text-zinc-400 leading-relaxed">
                Select a virtual clone from the society list to establish an interactive empathetic simulation
                and build your connections.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
