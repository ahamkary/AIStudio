import React, { useState } from "react";
import { 
  X, Plus, Trash2, Search, Filter, BookOpen, AlertCircle, 
  Heart, Brain, Zap, Shield, Sparkles, Edit2, Check, RotateCcw, Calendar 
} from "lucide-react";
import { JournalEntry } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip
} from "recharts";

// Beautiful custom HTML tooltip for Recharts showing journal details
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const categoryColors = {
      thought: "text-sky-600",
      obsession: "text-violet-600",
      anxiety: "text-pink-600",
      fear: "text-rose-600"
    };
    return (
      <div className="bg-white/95 p-3.5 rounded-xl border border-pink-200/80 shadow-md max-w-xs font-sans text-xs select-none">
        <p className="font-mono text-[9px] uppercase tracking-wider text-stone-400 mb-1 font-semibold">
          {data.date} @ {data.time}
        </p>
        <p className="font-bold flex items-center gap-1.5 capitalize text-stone-800 mb-1">
          <span className={`w-2 h-2 rounded-full ${
            data.category === "thought" ? "bg-sky-500" :
            data.category === "obsession" ? "bg-violet-500" :
            data.category === "anxiety" ? "bg-pink-500" : "bg-rose-500"
          }`} />
          <span className={categoryColors[data.category as keyof typeof categoryColors]}>{data.category}</span>
          <span className="text-stone-300 font-normal">|</span>
          <span className="text-indigo-600">Weight: {data.intensity}/5</span>
        </p>
        <p className="text-stone-600 italic leading-relaxed border-t border-stone-100 pt-1.5 mt-1 font-serif">
          "{data.content}"
        </p>
        {data.followUp && (
          <p className="text-[10px] text-emerald-700 bg-emerald-50/80 px-2 py-1 rounded-md mt-1.5 font-sans border border-emerald-100 leading-normal">
            <strong>Plan:</strong> {data.followUp}
          </p>
        )}
      </div>
    );
  }
  return null;
};

// Custom visual dot on the graph timeline color-coded by entry category
const renderCustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  const categoryColors = {
    thought: "#38bdf8", // sky-400
    obsession: "#a78bfa", // violet-400
    anxiety: "#f472b6", // pink-400
    fear: "#fb7185" // rose-400
  };
  const color = categoryColors[payload.category as keyof typeof categoryColors] || "#6366f1";
  return (
    <circle
      key={payload.id}
      cx={cx}
      cy={cy}
      r={5}
      fill={color}
      stroke="#ffffff"
      strokeWidth={2}
      className="cursor-pointer shadow-sm transition-all hover:scale-125"
    />
  );
};

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean; // Retained in props signature but ignored for the container's interior to satisfy "always in lighter colors"
  entries: JournalEntry[];
  onAddEntry: (entry: Omit<JournalEntry, "id" | "timestamp">) => void;
  onDeleteEntry: (id: string) => void;
  onUpdateEntry: (entry: JournalEntry) => void;
}

export default function JournalModal({
  isOpen,
  onClose,
  entries,
  onAddEntry,
  onDeleteEntry,
  onUpdateEntry,
}: JournalModalProps) {
  const [activeTab, setActiveTab] = useState<"ledger" | "journey">("ledger");
  const [category, setCategory] = useState<"thought" | "obsession" | "anxiety" | "fear">("thought");
  const [content, setContent] = useState("");
  const [followUpAction, setFollowUpAction] = useState("");
  const [intensity, setIntensity] = useState<number>(3);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [isAdding, setIsAdding] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState<"thought" | "obsession" | "anxiety" | "fear">("thought");
  const [editContent, setEditContent] = useState("");
  const [editFollowUp, setEditFollowUp] = useState("");
  const [editIntensity, setEditIntensity] = useState<number>(3);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onAddEntry({
      category,
      content: content.trim(),
      intensity,
      followUpAction: followUpAction.trim(),
    });

    setContent("");
    setFollowUpAction("");
    setIntensity(3);
    setIsAdding(false);
  };

  const startEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setEditCategory(entry.category);
    setEditContent(entry.content);
    setEditIntensity(entry.intensity);
    setEditFollowUp(entry.followUpAction || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdateSubmit = (id: string) => {
    if (!editContent.trim()) return;
    
    onUpdateEntry({
      id,
      category: editCategory,
      content: editContent.trim(),
      intensity: editIntensity,
      followUpAction: editFollowUp.trim(),
      timestamp: entries.find(e => e.id === id)?.timestamp || new Date().toISOString()
    });
    setEditingId(null);
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = 
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.followUpAction && entry.followUpAction.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = selectedFilter === "all" || entry.category === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const categoryIcons = {
    thought: <Brain className="w-4 h-4 text-sky-500" />,
    obsession: <Zap className="w-4 h-4 text-violet-500" />,
    anxiety: <Heart className="w-4 h-4 text-pink-500" />,
    fear: <Shield className="w-4 h-4 text-rose-500" />,
  };

  const categoryStyles = {
    thought: "bg-sky-50 text-sky-700 border border-sky-200/80",
    obsession: "bg-violet-50 text-violet-700 border border-violet-200/80",
    anxiety: "bg-pink-50 text-pink-700 border border-pink-250/80",
    fear: "bg-rose-50 text-rose-700 border border-rose-200/80",
  };

  // Chronological Emotional Journey Chart Data Prep for the last 30 days
  const last30DaysEntries = entries
    .filter(entry => {
      const entryDate = new Date(entry.timestamp);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return entryDate >= thirtyDaysAgo;
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const chartData = last30DaysEntries.map(entry => {
    const dateObj = new Date(entry.timestamp);
    return {
      id: entry.id,
      date: dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      time: dateObj.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
      intensity: entry.intensity,
      category: entry.category,
      content: entry.content,
      followUp: entry.followUpAction,
      timestamp: dateObj.getTime()
    };
  });

  const avgIntensity = last30DaysEntries.length > 0
    ? (last30DaysEntries.reduce((acc, curr) => acc + curr.intensity, 0) / last30DaysEntries.length).toFixed(1)
    : "0.0";

  const resilienceCount = last30DaysEntries.filter(e => e.followUpAction && e.followUpAction.trim().length > 0).length;
  const resilienceIndex = last30DaysEntries.length > 0
    ? Math.round((resilienceCount / last30DaysEntries.length) * 100)
    : 0;

  const categoryCounts = last30DaysEntries.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  let dominantCategory = "None";
  let maxCount = 0;
  Object.entries(categoryCounts).forEach(([cat, count]) => {
    if (count > maxCount) {
      maxCount = count;
      dominantCategory = cat;
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Box (Open Journal Binder - Always styled as an exquisite warm cream book/journal) */}
      <div
        id="journal-modal-container"
        className="relative w-full max-w-4xl h-[85vh] rounded-2xl flex flex-col overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.12)] border-2 bg-[#FDFBF7] text-stone-900 border-pink-200/80 transition-all duration-300 select-none font-sans"
      >
        {/* Book Spine Visual Accent on Left Margin */}
        <div className="absolute left-0 top-0 bottom-0 w-3.5 bg-gradient-to-r from-stone-600/10 to-transparent pointer-events-none z-20" />
        <div className="absolute left-0 top-0 bottom-0 w-4 border-r border-stone-400/20 pointer-events-none z-20" />

        {/* Spiral Binder Rings down the left side */}
        <div className="absolute left-6 top-10 bottom-10 flex flex-col justify-between pointer-events-none z-30 w-3.5 select-none opacity-60">
          {Array.from({ length: 14 }).map((_, i) => (
            <div 
              key={i} 
              className="w-5 h-3 rounded-full bg-gradient-to-r from-stone-400 via-stone-200 to-stone-500 shadow-sm border border-stone-400/30 -ml-2" 
            />
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-pink-100/80 pl-16 z-10 bg-[#FAF7F2]/95">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            <div>
              <h3 className="text-base font-bold tracking-tight font-sans text-stone-900">My Journal Book</h3>
              <p className="text-[10px] uppercase tracking-wider text-stone-500 font-mono font-medium">
                Ruled pages of self-reflection and actions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full transition-colors cursor-pointer hover:bg-stone-200/50 text-stone-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters and New Page Button Panel */}
        <div className="px-8 py-4 pl-16 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 z-10 border-b border-pink-100/80 bg-[#FAF7F2]/90">
          {/* Tab Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("ledger")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
                activeTab === "ledger"
                  ? "bg-stone-800 text-white border-stone-800 shadow-sm"
                  : "bg-white text-stone-600 border-stone-200/60 hover:bg-stone-50"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Ruled Ledger</span>
            </button>
            <button
              onClick={() => setActiveTab("journey")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
                activeTab === "journey"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white text-stone-600 border-stone-200/60 hover:bg-stone-50"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>Emotional Journey</span>
            </button>
          </div>

          {activeTab === "ledger" ? (
            /* Search & Category Filter */
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 max-w-xs min-w-[180px]">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search reflections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border outline-none focus:border-indigo-500/50 transition-all bg-white border-blue-200 text-stone-900 placeholder-stone-400"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-stone-400" />
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer focus:border-indigo-500/50 transition-all bg-white border-blue-200 text-stone-900"
                >
                  <option value="all">All Categories</option>
                  <option value="thought">Thoughts</option>
                  <option value="obsession">Obsessions</option>
                  <option value="anxiety">Anxieties</option>
                  <option value="fear">Fears</option>
                </select>
              </div>

              {!isAdding && (
                <button
                  onClick={() => setIsAdding(true)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl active:scale-95 transition-all cursor-pointer shadow-sm ml-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log State</span>
                </button>
              )}
            </div>
          ) : (
            <div className="text-[10px] text-stone-500 font-mono font-bold uppercase tracking-wider text-right">
              MAPPING CONSCIOUSNESS DYNAMICS
            </div>
          )}
        </div>

        {/* Content Area (Lined ruled page of book) */}
        <div className="flex-1 overflow-y-auto px-8 py-6 pl-16 relative bg-[#FCFAF5]">
          {/* Notebook Red/Pink Margin Lines */}
          <div className="absolute left-10 top-0 bottom-0 w-[1px] border-l border-pink-300 pointer-events-none" />
          <div className="absolute left-[41px] top-0 bottom-0 w-[1px] border-l border-pink-200/50 pointer-events-none" />

          {activeTab === "ledger" ? (
            <>
              <AnimatePresence mode="wait">
                {/* 1. Add Entry Form (Visualized as a new diary page insertion) */}
                {isAdding && (
                  <motion.div
                    key="add-form"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="relative p-6 mb-8 rounded-xl border shadow-xs bg-white border-pink-200"
                  >
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-pink-100">
                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-500 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          New Journal Entry Page
                        </span>
                        <button 
                          type="button" 
                          onClick={() => setIsAdding(false)}
                          className="text-stone-400 hover:text-stone-600 text-xs font-semibold uppercase tracking-wider transition-all"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Category Selection */}
                        <div className="md:col-span-5">
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1.5 font-bold">
                            Category Type
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {(["thought", "obsession", "anxiety", "fear"] as const).map((cat) => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setCategory(cat)}
                                className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all cursor-pointer ${
                                  category === cat
                                    ? "bg-indigo-50 border-indigo-200 text-indigo-600 font-semibold"
                                    : "bg-stone-50 border-stone-150 text-stone-600 hover:bg-stone-100"
                                }`}
                              >
                                {categoryIcons[cat]}
                                <span className="capitalize">{cat}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Intensity Slider */}
                        <div className="md:col-span-7">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold">
                              Intensity / Weight
                            </span>
                            <span className="text-xs font-bold text-indigo-500">{intensity} / 5</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={intensity}
                            onChange={(e) => setIntensity(Number(e.target.value))}
                            className="w-full accent-indigo-600 cursor-pointer py-1.5"
                          />
                          <div className="flex justify-between text-[9px] text-stone-400 font-mono mt-1">
                            <span>Mild</span>
                            <span>Moderate</span>
                            <span>Severe</span>
                          </div>
                        </div>

                        {/* Thought Content Input */}
                        <div className="md:col-span-12">
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1.5 font-bold">
                            Thought / Reflection / State
                          </label>
                          <textarea
                            required
                            rows={3}
                            placeholder="What state is your consciousness currently in? Write down the honest reflection..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg border outline-none focus:border-indigo-500/50 transition-all resize-none leading-relaxed bg-stone-50 border-stone-200 text-stone-800 placeholder-stone-400"
                          />
                        </div>

                        {/* Follow Up Action Input */}
                        <div className="md:col-span-12">
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-indigo-500 mb-1.5 font-bold flex items-center gap-1 flex-wrap">
                            <Sparkles className="w-3 h-3" />
                            Follow up Action / Thought
                          </label>
                          <textarea
                            rows={2}
                            placeholder="What acts of release, counter-weights, or plans can alleviate this state?"
                            value={followUpAction}
                            onChange={(e) => setFollowUpAction(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-lg border outline-none focus:border-indigo-500/50 transition-all resize-none leading-relaxed bg-stone-50 border-stone-200 text-stone-800 placeholder-stone-400"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 transition-all cursor-pointer shadow-sm"
                        >
                          Save Reflection
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 2. Journal Entry Pages list (Lined Paper Blocks with light pink/blue borders) */}
              <div className="space-y-8 pl-4">
                {filteredEntries.length === 0 ? (
                  <div className="py-20 text-center">
                    <AlertCircle className="w-12 h-12 mx-auto text-stone-300 mb-3 stroke-[1]" />
                    <h4 className="text-sm font-semibold text-stone-700">Pages are blank</h4>
                    <p className="text-xs text-stone-400 italic max-w-sm mx-auto mt-1">
                      No states matching your queries have been written down yet. Write one above to start reflecting.
                    </p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {filteredEntries.map((entry) => {
                      const isEditing = editingId === entry.id;

                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3 }}
                          className={`relative p-6 sm:p-8 rounded-xl border shadow-[0_4px_12px_rgba(0,0,0,0.02)] overflow-hidden transition-all duration-300 ${
                            isEditing
                              ? "bg-white border-blue-200"
                              : "bg-white hover:bg-[#FDFBF7] border-pink-150 hover:border-blue-200"
                          }`}
                        >
                          {/* Decorative Left Notebook Margin Ribbon in pink */}
                          <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-pink-300/70" />

                          {isEditing ? (
                            /* Inline Editor Mode */
                            <div className="space-y-4">
                              <div className="flex items-center justify-between pb-2 border-b border-pink-100">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1">
                                  <Edit2 className="w-3.5 h-3.5" />
                                  Editing Journal Entry
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleUpdateSubmit(entry.id)}
                                    className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                                  >
                                    <Check className="w-3 h-3" />
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="flex items-center gap-1 px-3 py-1 bg-stone-500 hover:bg-stone-400 text-white rounded-md text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    Cancel
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Edit Category */}
                                <div>
                                  <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1 font-bold">
                                    Edit Category
                                  </label>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(["thought", "obsession", "anxiety", "fear"] as const).map((cat) => (
                                      <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setEditCategory(cat)}
                                        className={`py-1 px-2 rounded text-[11px] font-semibold flex items-center gap-1 border transition-all cursor-pointer ${
                                          editCategory === cat
                                            ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                                            : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                                        }`}
                                      >
                                        {categoryIcons[cat]}
                                        <span className="capitalize">{cat}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Edit Intensity */}
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold">
                                      Intensity ({editIntensity}/5)
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    value={editIntensity}
                                    onChange={(e) => setEditIntensity(Number(e.target.value))}
                                    className="w-full accent-indigo-500 cursor-pointer"
                                  />
                                </div>

                                {/* Edit Content */}
                                <div className="md:col-span-2">
                                  <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1 font-bold">
                                    Thought / Reflection / State
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full px-3 py-1.5 text-xs rounded border outline-none focus:border-indigo-500/50 transition-all resize-none leading-relaxed bg-white border-blue-200 text-stone-900"
                                  />
                                </div>

                                {/* Edit Follow Up */}
                                <div className="md:col-span-2">
                                  <label className="block text-[10px] font-mono uppercase tracking-wider text-indigo-500 mb-1 font-bold">
                                    Follow up Action / Thought
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={editFollowUp}
                                    onChange={(e) => setEditFollowUp(e.target.value)}
                                    className="w-full px-3 py-1.5 text-xs rounded border outline-none focus:border-indigo-500/50 transition-all resize-none leading-relaxed bg-white border-blue-200 text-stone-900"
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Normal Read Mode (The Beautiful Ruled Book Page View) */
                            <div className="space-y-5">
                              {/* Entry Metadata Header */}
                              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-pink-100/60">
                                <div className="flex items-center gap-2">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${categoryStyles[entry.category]}`}>
                                    {categoryIcons[entry.category]}
                                    <span>{entry.category}</span>
                                  </span>
                                  
                                  {/* Intensity Notches */}
                                  <div className="flex items-center gap-1 bg-stone-50 px-2 py-0.5 rounded-full border border-pink-100">
                                    <span className="text-[9px] font-mono uppercase text-stone-400 mr-1 font-bold">WT:</span>
                                    {[1, 2, 3, 4, 5].map((i) => (
                                      <span 
                                        key={i}
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          i <= entry.intensity
                                            ? entry.category === "thought" ? "bg-sky-500"
                                              : entry.category === "obsession" ? "bg-violet-500"
                                              : entry.category === "anxiety" ? "bg-pink-500"
                                              : "bg-rose-500"
                                            : "bg-stone-200"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>

                                {/* Actions + Timestamp */}
                                <div className="flex items-center gap-3">
                                  <span className="inline-flex items-center gap-1 text-[10px] text-stone-500 font-mono font-bold">
                                    <Calendar className="w-3 h-3 text-indigo-400" />
                                    {new Date(entry.timestamp).toLocaleString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>

                                  {/* Edit & Delete Action Buttons */}
                                  <div className="flex items-center gap-1 pl-2 border-l border-pink-100">
                                    <button
                                      onClick={() => startEdit(entry)}
                                      className="p-1.5 rounded transition-all cursor-pointer hover:bg-stone-100 text-stone-500 hover:text-indigo-600"
                                      title="Edit entry"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => onDeleteEntry(entry.id)}
                                      className="p-1.5 rounded transition-all cursor-pointer hover:bg-red-50 text-stone-500 hover:text-red-600"
                                      title="Delete entry"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Ruled Notebook Line - Thought / Reflection / State */}
                              <div className="relative pl-6 border-l-2 border-blue-200">
                                <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-2 font-bold select-none">
                                  Thought / Reflection / State
                                </div>
                                <div 
                                  className="font-serif text-sm sm:text-base text-stone-900 leading-8 relative pl-1"
                                  style={{
                                    backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, rgba(147, 197, 253, 0.4) 31px, rgba(147, 197, 253, 0.4) 32px)",
                                    backgroundSize: "100% 32px",
                                    lineHeight: "32px",
                                    paddingTop: "1px",
                                  }}
                                >
                                  {entry.content}
                                </div>
                              </div>

                              {/* Ruled Notebook Line - Follow up Action / Thought */}
                              <div className="relative pl-6 border-l-2 border-pink-200 mt-4 pt-1">
                                <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-500 mb-2 font-bold select-none flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Follow up Action / Thought</span>
                                </div>
                                <div 
                                  className="font-serif text-sm text-stone-850 leading-7 relative pl-1"
                                  style={{
                                    backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, rgba(147, 197, 253, 0.25) 27px, rgba(147, 197, 253, 0.25) 28px)",
                                    backgroundSize: "100% 28px",
                                    lineHeight: "28px",
                                    paddingTop: "1px",
                                  }}
                                >
                                  {entry.followUpAction || (
                                    <span className="text-stone-400 italic">
                                      No follow-up action plan registered. Click edit to add.
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </>
          ) : (
            /* Emotional Journey separate page */
            <div className="space-y-6 pl-4 py-2">
              {/* Introduction header */}
              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-stone-850 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    Emotional Journey Map
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed max-w-xl">
                    This chart tracks the mental intensity levels of your recorded thoughts, fears, obsessions, and anxieties over the last 30 days. It helps you recognize behavior loops and milestones of releasing cognitive weights.
                  </p>
                </div>
                <div className="bg-white/80 border border-indigo-100 px-3.5 py-2 rounded-xl flex items-center gap-2 self-start sm:self-auto font-mono text-[10px] tracking-wider uppercase font-semibold text-indigo-700">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                  Realtime Graph
                </div>
              </div>

              {/* Statistics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-pink-150/80 p-4 rounded-xl shadow-xs flex flex-col justify-between min-h-[100px]">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 font-bold">Average Intensity</span>
                    <h5 className="text-2xl font-bold text-stone-800 tracking-tight mt-1">
                      {avgIntensity} <span className="text-xs text-stone-400 font-normal">/ 5.0</span>
                    </h5>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-2 italic">
                    {Number(avgIntensity) >= 4 ? "Experiencing heavier cognitive weights lately." :
                     Number(avgIntensity) >= 2.5 ? "Stable moderate emotional states." :
                     Number(avgIntensity) > 0 ? "Quiet, reflective, low-intensity baseline." : "No states logged."}
                  </p>
                </div>

                <div className="bg-white border border-pink-150/80 p-4 rounded-xl shadow-xs flex flex-col justify-between min-h-[100px]">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 font-bold">Dominant State Trigger</span>
                    <h5 className="text-sm font-bold text-indigo-600 tracking-tight mt-2 capitalize flex items-center gap-1.5">
                      {dominantCategory !== "None" ? (
                        <>
                          {categoryIcons[dominantCategory as keyof typeof categoryIcons]}
                          <span>{dominantCategory}</span>
                        </>
                      ) : "None"}
                    </h5>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-2 italic">
                    Most frequent channel of self-reflection.
                  </p>
                </div>

                <div className="bg-white border border-pink-150/80 p-4 rounded-xl shadow-xs flex flex-col justify-between min-h-[100px]">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 font-bold">Resilience Coefficient</span>
                    <h5 className="text-2xl font-bold text-emerald-600 tracking-tight mt-1">
                      {resilienceIndex}%
                    </h5>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-2 italic">
                    Ratio of active follow-up resolutions.
                  </p>
                </div>
              </div>

              {/* Line Chart Section */}
              <div className="bg-white border border-pink-150/80 rounded-2xl p-5 shadow-xs relative overflow-hidden min-h-[360px]">
                {/* Visual grid background */}
                <div 
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    backgroundImage: "radial-gradient(#6366F1 1px, transparent 1px)",
                    backgroundSize: "20px 20px"
                  }}
                />

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">Consciousness Intensity Timeline</h4>
                      <p className="text-[10px] text-stone-400 mt-0.5">Chronological log of last 30 days (y-axis: weight 1-5)</p>
                    </div>
                    {/* Interactive legend */}
                    <div className="flex flex-wrap gap-2.5 text-[9px] font-mono font-medium">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-500" /> Thoughts</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-violet-500" /> Obsessions</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-pink-500" /> Anxieties</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Fears</span>
                    </div>
                  </div>

                  {chartData.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-16 text-center select-none">
                      <AlertCircle className="w-12 h-12 text-stone-300 stroke-[1.2] mb-2 animate-bounce" />
                      <p className="text-xs font-semibold text-stone-600">No entries in the last 30 days</p>
                      <p className="text-[10px] text-stone-400 max-w-xs mt-1">
                        Go back to the Ruled Ledger and log your current state of thought, obsession, or anxiety to map your emotional journey!
                      </p>
                    </div>
                  ) : (
                    <div className="w-full h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#888888" 
                            fontSize={9} 
                            tickLine={false} 
                            axisLine={false} 
                            dy={10}
                          />
                          <YAxis 
                            domain={[1, 5]} 
                            tickCount={5} 
                            stroke="#888888" 
                            fontSize={9} 
                            tickLine={false} 
                            axisLine={false}
                            dx={-5}
                          />
                          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#e5e7eb", strokeWidth: 1 }} />
                          <Line 
                            type="monotone" 
                            dataKey="intensity" 
                            stroke="#6366F1" 
                            strokeWidth={3} 
                            dot={renderCustomDot} 
                            activeDot={{ r: 8, stroke: "#6366F1", strokeWidth: 2, fill: "#fff" }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 pl-16 flex items-center justify-between border-t border-pink-100 pl-16 text-[10px] font-mono tracking-wider text-stone-500 uppercase z-10 bg-[#FAF7F2]">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>Integrated with Clone core memory and release protocols</span>
          </div>
          <span>Total logged: {entries.length} pages</span>
        </div>
      </div>
    </div>
  );
}

