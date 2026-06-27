import React, { useState } from "react";
import {
  X,
  User,
  Activity,
  UploadCloud,
  ChevronRight,
  ShieldCheck,
  Globe,
  Settings,
  CheckCircle,
  Copy,
  Sparkles,
  Users,
  BookOpen,
  Info,
  Share2,
  Mail,
  Send,
  Eye,
  EyeOff
} from "lucide-react";
import { CloneProfile, UserSyncData } from "../types";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  insights: string[];
  cloneProfile: CloneProfile | null;
  onCompileClone: () => Promise<void>;
  compiling: boolean;
  syncData: UserSyncData | null;
  onSync: (username: string, email: string, password: string, isPublic: boolean) => Promise<void>;
  syncing: boolean;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onOpenCatalog: () => void;
  onOpenJournal: () => void;
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
}

type TabType = "profile" | "sync" | "system";

export default function Sidebar({
  isOpen,
  onClose,
  isDark,
  insights,
  cloneProfile,
  onCompileClone,
  compiling,
  syncData,
  onSync,
  syncing,
  onOpenPrivacy,
  onOpenTerms,
  onOpenCatalog,
  onOpenJournal,
  activeTab: activeTabProp,
  onTabChange,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  React.useEffect(() => {
    if (activeTabProp) {
      setActiveTab(activeTabProp);
    }
  }, [activeTabProp]);
  const [username, setUsername] = useState(syncData?.username || "");
  const [email, setEmail] = useState(syncData?.email || "");
  const [password, setPassword] = useState(syncData?.password || "");
  const [showPassword, setShowPassword] = useState(false);
  const [isPublic, setIsPublic] = useState(syncData?.isPublic !== false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRequirements, setShowRequirements] = useState(false);

  // Sharing states
  const [shareConfig, setShareConfig] = useState<{ title: string; text: string; imageUrl: string; imageSpecs?: string } | null>(null);
  const [isShareExpanded, setIsShareExpanded] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  React.useEffect(() => {
    fetch("/api/seo-config-public")
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Failed to load public configuration.");
      })
      .then(data => {
        if (data && data.share) {
          setShareConfig(data.share);
        }
      })
      .catch(err => {
        console.error("Error loading public share config:", err);
      });
  }, []);

  if (!isOpen) return null;

  const handleSyncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (username.trim().length < 8) {
      setError("Username must be at least 8 characters long.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password.trim() || password.trim().length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      await onSync(username.trim(), email.trim(), password.trim(), isPublic);
    } catch (err: any) {
      setError(err.message || "Failed to complete server sync.");
    }
  };

  const copyUsername = () => {
    if (!syncData?.username) return;
    navigator.clipboard.writeText(`@${syncData.username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] shadow-2xl flex flex-col transition-transform duration-300 transform translate-x-0">
      {/* Overlay backdrop for mobile */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs -z-10 sm:hidden" onClick={onClose} />

      {/* Main Sidebar Panel */}
      <div
        className={`w-full h-full flex flex-col p-6 overflow-y-auto scrollbar-thin ${
          isDark
            ? "bg-[#0d0d0f] text-zinc-100 border-l border-zinc-800"
            : "bg-[#FAF9F5] text-stone-900 border-l border-stone-250"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200/50 dark:border-zinc-800/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-stone-900 dark:text-white">Identity Center</h2>
              <p className="text-[11px] text-stone-600 dark:text-zinc-100 font-medium">Configure your digital clone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full transition-all ${
              isDark ? "hover:bg-zinc-800 text-zinc-300 hover:text-white" : "hover:bg-stone-200/60 text-stone-500 hover:text-stone-900"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Access Apps */}
        <div className="grid grid-cols-2 gap-2.5 my-5">
          <button
            onClick={() => {
              onOpenCatalog();
              onClose();
            }}
            className={`group p-3 rounded-xl border text-left transition-all active:scale-[0.98] ${
              isDark
                ? "bg-zinc-900 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600"
                : "bg-white border-stone-200 hover:bg-stone-50 hover:border-stone-300 shadow-xs"
            }`}
          >
            <div className="p-1.5 w-fit rounded-lg bg-indigo-500/10 text-indigo-500 mb-2 transition-transform group-hover:scale-105">
              <Users className="w-4 h-4" />
            </div>
            <h4 className={`text-[12px] font-black uppercase tracking-wider ${
              isDark ? "text-indigo-300" : "text-indigo-600"
            }`}>
              Explore Selves
            </h4>
            <p className={`text-[11px] mt-0.5 font-extrabold line-clamp-1 ${
              isDark ? "text-zinc-100" : "text-stone-700"
            }`}>
              Public Directory
            </p>
          </button>

          <button
            onClick={() => {
              onOpenJournal();
              onClose();
            }}
            className={`group p-3 rounded-xl border text-left transition-all active:scale-[0.98] ${
              isDark
                ? "bg-zinc-900 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600"
                : "bg-white border-stone-200 hover:bg-stone-50 hover:border-stone-300 shadow-xs"
            }`}
          >
            <div className="p-1.5 w-fit rounded-lg bg-emerald-500/10 text-emerald-500 mb-2 transition-transform group-hover:scale-105">
              <BookOpen className="w-4 h-4" />
            </div>
            <h4 className={`text-[12px] font-black uppercase tracking-wider ${
              isDark ? "text-emerald-300" : "text-emerald-600"
            }`}>
              My Journal
            </h4>
            <p className={`text-[11px] mt-0.5 font-extrabold line-clamp-1 ${
              isDark ? "text-zinc-100" : "text-stone-700"
            }`}>
              Reflections & Logs
            </p>
          </button>
        </div>

        {/* Share with Friends Section */}
        {(() => {
          const defaultShare = {
            title: "Virtual Self - Private AI Digital Twin",
            text: "Discover Virtual Self - build a fully private, secure, empathetic digital clone of yourself. Own your digital consciousness with local first encryption. Try it now!",
            imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&h=630&q=80",
            imageSpecs: "Recommended dimensions: 1200 x 630 pixels. Aspect ratio 1.91:1. Formats: PNG, JPEG, or WebP. Under 2MB."
          };
          const activeShare = shareConfig || defaultShare;
          const shareUrl = typeof window !== "undefined" ? window.location.origin : "https://virtual-self.platform";

          const handleCopyShare = () => {
            const textToCopy = `${activeShare.title}\n\n${activeShare.text}\n\nTry it now at: ${shareUrl}`;
            navigator.clipboard.writeText(textToCopy);
            setShareCopied(true);
            setTimeout(() => setShareCopied(false), 2000);
          };

          return (
            <div className={`p-4 rounded-xl border mb-5 transition-all duration-300 ${
              isDark
                ? "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                : "bg-indigo-50/30 border-indigo-100 hover:border-indigo-200 shadow-xs"
            }`}>
              <button 
                onClick={() => setIsShareExpanded(!isShareExpanded)}
                className="w-full flex items-center justify-between text-left cursor-pointer focus:outline-none"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-black uppercase tracking-wider ${
                      isDark ? "text-indigo-300" : "text-indigo-600"
                    }`}>
                      Share with Friends
                    </h4>
                    <p className={`text-[11px] font-extrabold mt-0.5 ${
                      isDark ? "text-zinc-300" : "text-stone-600"
                    }`}>
                      Invite friends to clone their minds!
                    </p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-stone-400 transition-transform duration-300 ${isShareExpanded ? "rotate-90" : ""}`} />
              </button>

              {isShareExpanded && (
                <div className="mt-4 pt-4 border-t border-stone-200/50 dark:border-zinc-800/50 space-y-4 animate-fadeIn">
                  {/* Quick Share Platforms Grid */}
                  <div className="space-y-2">
                    <span className="block text-[9px] font-mono uppercase tracking-wider text-stone-500 dark:text-zinc-400 font-bold font-mono">
                      Quick Share Platforms
                    </span>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {/* WhatsApp */}
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(activeShare.title + "\n" + activeShare.text + "\n" + shareUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`py-2 px-2.5 rounded-lg text-[10.5px] font-bold flex items-center gap-2 border transition-all hover:scale-[1.02] ${
                          isDark 
                            ? "bg-zinc-950/40 border-zinc-850 hover:bg-zinc-900 text-emerald-400 hover:text-emerald-300 border-zinc-800" 
                            : "bg-white border-stone-200 text-emerald-600 hover:bg-stone-50"
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>

                      {/* Twitter / X */}
                      <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(activeShare.text)}&url=${encodeURIComponent(shareUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`py-2 px-2.5 rounded-lg text-[10.5px] font-bold flex items-center gap-2 border transition-all hover:scale-[1.02] ${
                          isDark 
                            ? "bg-zinc-950/40 border-zinc-850 hover:bg-zinc-900 text-zinc-200 hover:text-white border-zinc-800" 
                            : "bg-white border-stone-200 text-stone-850 hover:bg-stone-50"
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Twitter / X</span>
                      </a>

                      {/* LinkedIn */}
                      <a
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`py-2 px-2.5 rounded-lg text-[10.5px] font-bold flex items-center gap-2 border transition-all hover:scale-[1.02] ${
                          isDark 
                            ? "bg-zinc-950/40 border-zinc-850 hover:bg-zinc-900 text-blue-400 hover:text-blue-300 border-zinc-800" 
                            : "bg-white border-stone-200 text-blue-600 hover:bg-stone-50"
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>LinkedIn</span>
                      </a>

                      {/* Email */}
                      <a
                        href={`mailto:?subject=${encodeURIComponent(activeShare.title)}&body=${encodeURIComponent(activeShare.text + "\n\nTry it here: " + shareUrl)}`}
                        className={`py-2 px-2.5 rounded-lg text-[10.5px] font-bold flex items-center gap-2 border transition-all hover:scale-[1.02] ${
                          isDark 
                            ? "bg-zinc-950/40 border-zinc-850 hover:bg-zinc-900 text-indigo-400 hover:text-indigo-300 border-zinc-800" 
                            : "bg-white border-stone-200 text-indigo-600 hover:bg-stone-50"
                        }`}
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email Link</span>
                      </a>
                    </div>

                    {/* Copy Link Button */}
                    <button
                      onClick={handleCopyShare}
                      className={`w-full mt-1.5 py-2.5 rounded-lg text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                        shareCopied
                          ? "bg-emerald-600 text-white animate-pulse"
                          : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm"
                      }`}
                    >
                      {shareCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{shareCopied ? "Link & Text Copied Successfully!" : "Copy Full Share Link & Text"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Tab Switcher */}
        <div className={`flex p-1 rounded-xl border mb-5 ${
          isDark ? "bg-zinc-950 border-zinc-800/60" : "bg-stone-200/40 border-stone-200/80"
        }`}>
          {[
            { id: "profile", label: "Twin Profile", icon: User },
            { id: "sync", label: "Backup & Sync", icon: Globe },
            { id: "system", label: "System", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TabType);
                  if (onTabChange) {
                    onTabChange(tab.id as TabType);
                  }
                }}
                className={`flex-1 py-2 px-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                  isActive
                    ? isDark
                      ? "bg-zinc-800 text-white shadow-xs"
                      : "bg-white text-stone-900 shadow-xs border border-stone-200/50"
                    : isDark
                    ? "text-zinc-300 hover:text-white"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-indigo-500" : "text-stone-400 dark:text-zinc-300"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* TAB 1: PROFILE */}
          {activeTab === "profile" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className={`text-[13px] font-black tracking-widest uppercase ${
                  isDark ? "text-zinc-100" : "text-stone-800"
                }`}>
                  Virtual Self Profile
                </h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  isDark ? "bg-indigo-950 text-indigo-300" : "bg-indigo-100 text-indigo-700"
                }`}>
                  {insights.length} insights logged
                </span>
              </div>

              {cloneProfile ? (
                <div
                  className={`p-4 rounded-xl border space-y-5 ${
                    isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-stone-200 shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl shadow-xs">
                      {cloneProfile.avatarSeed || "👤"}
                    </div>
                    <div>
                      <h4 className={`font-black text-base ${
                        isDark ? "text-white" : "text-stone-900"
                      }`}>{cloneProfile.name}</h4>
                      <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        SYNTHESIS STATUS: STABLE
                      </p>
                    </div>
                  </div>

                  <div className={`border-t pt-4 space-y-5 ${
                    isDark ? "border-zinc-800" : "border-stone-200"
                  }`}>
                    <div className="space-y-1.5">
                      <span className={`font-black block text-[11px] uppercase tracking-wider ${
                        isDark ? "text-zinc-400" : "text-stone-500"
                      }`}>
                        Poetic Vibe
                      </span>
                      <p className={`text-[14px] font-bold leading-relaxed ${
                        isDark ? "text-white" : "text-stone-900"
                      }`}>
                        {cloneProfile.bio}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className={`text-[11px] uppercase font-black tracking-wider ${
                        isDark ? "text-zinc-400" : "text-stone-500"
                      }`}>
                        Persona Quirks & Traits
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cloneProfile.traits.map((trait, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] px-2.5 py-1 rounded-md font-extrabold ${
                              isDark
                                ? "bg-indigo-950/80 text-indigo-300 border border-indigo-900/30"
                                : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                            }`}
                          >
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className={`text-[11px] uppercase font-black tracking-wider ${
                        isDark ? "text-zinc-400" : "text-stone-500"
                      }`}>
                        Captured Speaking Cadence
                      </div>
                      <p className={`italic p-3 rounded-lg text-[13px] font-bold leading-relaxed border ${
                        isDark
                          ? "bg-zinc-950 text-white border-zinc-800"
                          : "bg-stone-50 text-stone-900 border-stone-200/60"
                      }`}>
                        "{cloneProfile.speakingStyle}"
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className={`text-[11px] uppercase font-black tracking-wider ${
                        isDark ? "text-zinc-400" : "text-stone-500"
                      }`}>
                        Guiding Core Beliefs
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cloneProfile.coreValues.map((v, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] px-2.5 py-1 rounded-md font-extrabold ${
                              isDark
                                ? "bg-emerald-950/60 text-emerald-300 border border-emerald-900/30"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            }`}
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className={`p-3.5 rounded-lg border space-y-1 ${
                      isDark
                        ? "bg-indigo-950/20 border-indigo-900/30 text-white"
                        : "bg-indigo-50/40 border-indigo-100 text-stone-900"
                    }`}>
                      <span className={`font-black text-[10px] block uppercase tracking-wider ${
                        isDark ? "text-indigo-300" : "text-indigo-600"
                      }`}>
                        Recommended Opener
                      </span>
                      <p className="text-[13px] font-bold leading-relaxed">
                        "{cloneProfile.recommendedGreeting}"
                      </p>
                    </div>

                    {/* Background Context */}
                    {cloneProfile.background && (
                      <div className={`space-y-2.5 border-t pt-4 ${
                        isDark ? "border-zinc-800" : "border-stone-200"
                      }`}>
                        <div className={`text-[11px] uppercase font-black tracking-wider ${
                          isDark ? "text-zinc-400" : "text-stone-500"
                        }`}>
                          Background Context
                        </div>
                        <div className={`space-y-1.5 text-[12px] font-bold leading-relaxed ${
                          isDark ? "text-white" : "text-stone-850"
                        }`}>
                          {cloneProfile.background.location && cloneProfile.background.location !== "Unknown or yet to be explored" && (
                            <p><strong className={`font-extrabold ${isDark ? "text-zinc-350" : "text-stone-900"}`}>Location:</strong> {cloneProfile.background.location}</p>
                          )}
                          {cloneProfile.background.job && cloneProfile.background.job !== "Unknown or yet to be explored" && (
                            <p><strong className={`font-extrabold ${isDark ? "text-zinc-350" : "text-stone-900"}`}>Occupation:</strong> {cloneProfile.background.job}</p>
                          )}
                          {cloneProfile.background.family && cloneProfile.background.family !== "Unknown or yet to be explored" && (
                            <p><strong className={`font-extrabold ${isDark ? "text-zinc-350" : "text-stone-900"}`}>Family:</strong> {cloneProfile.background.family}</p>
                          )}
                          {cloneProfile.background.friends && cloneProfile.background.friends !== "Unknown or yet to be explored" && (
                            <p><strong className={`font-extrabold ${isDark ? "text-zinc-350" : "text-stone-900"}`}>Social Circle:</strong> {cloneProfile.background.friends}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Likes & Dislikes */}
                    {cloneProfile.likesAndDislikes && (
                      <div className={`space-y-2.5 border-t pt-4 ${
                        isDark ? "border-zinc-800" : "border-stone-200"
                      }`}>
                        <div className={`text-[11px] uppercase font-black tracking-wider ${
                          isDark ? "text-zinc-400" : "text-stone-500"
                        }`}>
                          Likes & Dislikes
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-[12px] font-bold">
                          {cloneProfile.likesAndDislikes.likes && cloneProfile.likesAndDislikes.likes.length > 0 && (
                            <div>
                              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold block text-[10px] uppercase tracking-wider mb-1.5">Likes</span>
                              <ul className={`list-disc pl-3.5 space-y-1 font-bold ${isDark ? "text-white" : "text-stone-850"}`}>
                                {cloneProfile.likesAndDislikes.likes.map((like, i) => (
                                  <li key={i}>{like}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {cloneProfile.likesAndDislikes.dislikes && cloneProfile.likesAndDislikes.dislikes.length > 0 && (
                            <div>
                              <span className="text-rose-600 dark:text-rose-400 font-extrabold block text-[10px] uppercase tracking-wider mb-1.5">Dislikes</span>
                              <ul className={`list-disc pl-3.5 space-y-1 font-bold ${isDark ? "text-white" : "text-stone-850"}`}>
                                {cloneProfile.likesAndDislikes.dislikes.map((dislike, i) => (
                                  <li key={i}>{dislike}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Behavioral Habits */}
                    {cloneProfile.behaviorPatterns && cloneProfile.behaviorPatterns.length > 0 && (
                      <div className={`space-y-2 border-t pt-4 ${
                        isDark ? "border-zinc-800" : "border-stone-200"
                      }`}>
                        <div className={`text-[11px] uppercase font-black tracking-wider ${
                          isDark ? "text-zinc-400" : "text-stone-500"
                        }`}>
                          Behavioral Habits
                        </div>
                        <ul className={`list-disc pl-3.5 text-[12px] font-bold space-y-1.5 ${
                          isDark ? "text-white" : "text-stone-850"
                        }`}>
                          {cloneProfile.behaviorPatterns.map((pat, i) => (
                            <li key={i}>{pat}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Hopes, Dreams & Wishes */}
                    {((cloneProfile.futureHopes && cloneProfile.futureHopes.length > 0) || (cloneProfile.dreamsAndWishlist && cloneProfile.dreamsAndWishlist.length > 0)) && (
                      <div className={`space-y-2.5 border-t pt-4 ${
                        isDark ? "border-zinc-800" : "border-stone-200"
                      }`}>
                        <div className={`text-[11px] uppercase font-black tracking-wider ${
                          isDark ? "text-zinc-400" : "text-stone-500"
                        }`}>
                          Hopes, Dreams & Wishes
                        </div>
                        <div className="space-y-3 text-[12px]">
                          {cloneProfile.futureHopes && cloneProfile.futureHopes.length > 0 && (
                            <div>
                              <span className="text-indigo-600 dark:text-indigo-400 font-extrabold block text-[10px] uppercase tracking-wider mb-1">Future Vision</span>
                              <ul className={`list-disc pl-3.5 font-bold space-y-1 ${isDark ? "text-white" : "text-stone-850"}`}>
                                {cloneProfile.futureHopes.map((hope, i) => (
                                  <li key={i}>{hope}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {cloneProfile.dreamsAndWishlist && cloneProfile.dreamsAndWishlist.length > 0 && (
                            <div>
                              <span className="text-pink-600 dark:text-pink-400 font-extrabold block text-[10px] uppercase tracking-wider mb-1">Wishlist & Aspirations</span>
                              <ul className={`list-disc pl-3.5 font-bold space-y-1 ${isDark ? "text-white" : "text-stone-850"}`}>
                                {cloneProfile.dreamsAndWishlist.map((dr, i) => (
                                  <li key={i}>{dr}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={onCompileClone}
                    disabled={compiling}
                    className="w-full py-2.5 px-3 rounded-lg text-xs font-semibold border border-indigo-500/20 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-indigo-500 flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${compiling ? "animate-spin" : ""}`} />
                    <span>{compiling ? "Re-Analyzing Digital Consciousness..." : "Re-Synthesize Twin Profile"}</span>
                  </button>
                </div>
              ) : (
                <div
                  className={`p-6 rounded-xl border text-center space-y-4 ${
                    isDark ? "bg-zinc-900/25 border-zinc-800" : "bg-white border-stone-200 shadow-xs"
                  }`}
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 dark:bg-zinc-900 flex items-center justify-center text-stone-400 dark:text-zinc-500">
                    <User className="w-6 h-6 stroke-[1.2]" />
                  </div>
                  <div className="space-y-1">
                    <h4 className={`font-bold text-sm ${isDark ? "text-zinc-200" : "text-stone-800"}`}>Virtual Twin Unformed</h4>
                    <p className="text-[11px] text-stone-500 dark:text-zinc-300 font-light max-w-[240px] mx-auto leading-relaxed">
                      We need at least a few interactions with your empathetic AI companion to capture your unique psyche, habits, beliefs, and speaking cadence.
                    </p>
                  </div>

                  <button
                    onClick={onCompileClone}
                    disabled={compiling || insights.length < 2}
                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer ${
                      insights.length >= 2
                        ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm shadow-indigo-500/10"
                        : "bg-stone-200 dark:bg-zinc-800 text-stone-400 dark:text-zinc-500 cursor-not-allowed"
                    }`}
                  >
                    {compiling ? (
                      <>
                        <Settings className="w-3.5 h-3.5 animate-spin" />
                        <span>Analyzing Digital Consciousness...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Form My Virtual Twin</span>
                      </>
                    )}
                  </button>
                  {insights.length < 2 && (
                    <p className="text-[10px] text-amber-500 font-medium">
                      Need at least 2 conversational insights. Keep sharing!
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CLOUD BACKUP */}
          {activeTab === "sync" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[11px] font-bold tracking-wider uppercase text-stone-600 dark:text-zinc-300">
                  Cloud Synchronization
                </h3>
              </div>

              <p className="text-xs text-stone-500 dark:text-zinc-300 leading-relaxed">
                All logs are kept client-side by default. Sync your virtual self with our secure backup cloud to enable cross-device roaming and publish a public avatar for clone interactions.
              </p>

              {syncData ? (
                <div
                  className={`p-4 rounded-xl border space-y-3.5 ${
                    isDark ? "bg-emerald-950/10 border-emerald-900/30" : "bg-emerald-50 border-emerald-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="font-bold text-xs text-emerald-700 dark:text-emerald-400">
                      Cloud Sync Confirmed & Active
                    </h4>
                  </div>

                  <div className="border-t border-emerald-200/50 dark:border-emerald-950/30 pt-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-stone-600 dark:text-zinc-200">Username:</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold select-all ${isDark ? "text-white" : "text-stone-900"}`}>@{syncData.username}</span>
                        <button onClick={copyUsername} className="p-0.5 rounded text-stone-500 dark:text-zinc-300 hover:text-indigo-500 cursor-pointer">
                          {copied ? (
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-sans font-bold">Copied!</span>
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-stone-600 dark:text-zinc-200">Email Link:</span>
                      <span className={`truncate max-w-[180px] font-medium ${isDark ? "text-zinc-100" : "text-stone-800"}`}>{syncData.email}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-stone-600 dark:text-zinc-200">Public Directory:</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{syncData.isPublic ? "Active" : "Disabled"}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-stone-400 dark:text-zinc-350 leading-snug">
                    All dialog histories are pseudonymized under this cryptographic handle to maintain robust privacy.
                  </p>

                  <button
                    onClick={onCompileClone}
                    className="w-full py-2 px-3 bg-indigo-600 text-white hover:bg-indigo-500 rounded-lg text-xs font-bold text-center transition-all cursor-pointer shadow-sm shadow-indigo-500/10"
                  >
                    Sync & Publish Updates
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSyncSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold tracking-wider uppercase text-stone-600 dark:text-zinc-200 block">
                      Unique Handle / Username
                    </label>
                    <input
                      type="text"
                      placeholder="Minimum 8 characters (letters, numbers, underscores)"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                      className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${
                        isDark
                          ? "bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-700"
                          : "bg-white border-stone-250 text-stone-800 placeholder-stone-400"
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold tracking-wider uppercase text-stone-600 dark:text-zinc-200 block">
                      Sync Recovery Email
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${
                        isDark
                          ? "bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-700"
                          : "bg-white border-stone-250 text-stone-800 placeholder-stone-400"
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold tracking-wider uppercase text-stone-600 dark:text-zinc-200 block">
                      Security Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimum 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full pl-3 pr-10 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${
                          isDark
                            ? "bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-700"
                            : "bg-white border-stone-250 text-stone-800 placeholder-stone-400"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:text-zinc-500 dark:hover:text-zinc-350 p-1 rounded cursor-pointer`}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Public Interface Selector */}
                  <div className={`p-3 rounded-lg border flex items-center justify-between ${
                    isDark ? "bg-zinc-950 border-zinc-800" : "bg-white border-stone-200"
                  }`}>
                    <div className="flex flex-col max-w-[240px]">
                      <span className={`text-xs font-bold ${isDark ? "text-zinc-200" : "text-stone-800"}`}>Public Interface Mode</span>
                      <span className="text-[10px] font-light text-stone-500 dark:text-zinc-300 mt-0.5">
                        Allow other users' digital twin models to initiate simulated dialogues with my clone.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className={`w-4 h-4 rounded text-indigo-600 border-stone-300 focus:ring-indigo-500 cursor-pointer ${
                        isDark ? "dark:border-zinc-800" : ""
                      }`}
                    />
                  </div>

                  {error && (
                    <div className="p-2.5 text-[10px] text-red-500 bg-red-500/5 rounded-lg border border-red-500/20 font-light">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={syncing}
                    className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer bg-stone-900 text-stone-150 dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-sm`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>
                      {syncing 
                        ? "Initiating Cloud Transfer..." 
                        : cloneProfile 
                          ? "Sync Virtual Self to Server" 
                          : "Get Online & Restore Twin"}
                    </span>
                  </button>
                  {!cloneProfile && (
                    <p className="text-[10px] text-amber-500 font-medium text-center leading-snug">
                      No local Virtual Twin profile found. Getting online will restore your saved clone profile and dialogue history from the cloud.
                    </p>
                  )}
                </form>
              )}
            </div>
          )}

          {/* TAB 3: SYSTEM & SECURITY */}
          {activeTab === "system" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[11px] font-bold tracking-wider uppercase text-stone-600 dark:text-zinc-300">
                  System Diagnostics & Legal
                </h3>
              </div>



              {/* Legal & Policies */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Privacy & Consent compliance</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={onOpenPrivacy}
                    className={`py-2 px-3 rounded-lg text-[11px] font-bold text-center border transition-all cursor-pointer ${
                      isDark
                        ? "bg-zinc-900/40 border-zinc-800 text-zinc-300 hover:bg-zinc-900"
                        : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    Privacy Policy
                  </button>
                  <button
                    onClick={onOpenTerms}
                    className={`py-2 px-3 rounded-lg text-[11px] font-bold text-center border transition-all cursor-pointer ${
                      isDark
                        ? "bg-zinc-900/40 border-zinc-800 text-zinc-300 hover:bg-zinc-900"
                        : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    Terms of Service
                  </button>
                </div>
              </div>

              {/* Status Indicator */}
              <div className={`p-3 rounded-xl border flex items-center justify-between text-[11px] ${
                isDark ? "bg-zinc-900/20 border-zinc-800" : "bg-white border-stone-200 shadow-xs"
              }`}>
                <span className="text-stone-500 dark:text-zinc-300">Local Cache Security:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  ENCRYPTED VAULT
                </span>
              </div>

              <div className="text-[10px] text-center font-medium text-stone-500 dark:text-zinc-300 pt-3">
                VIRTUAL SELF WORKSPACE © 2026<br />Zero Tracker Integrity Protocol
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
