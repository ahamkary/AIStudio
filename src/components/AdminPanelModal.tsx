import React, { useState, useEffect } from "react";
import { 
  X, 
  ShieldAlert, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  ExternalLink, 
  Globe, 
  Lock, 
  User, 
  Mail, 
  Key, 
  LogOut, 
  Check, 
  AlertTriangle,
  Download
} from "lucide-react";

interface SEOPageConfig {
  title: string;
  description: string;
  backgroundColor: string;
  textColor: string;
  containerBg: string;
  containerBorderColor: string;
  badgeColor: string;
  content: string;
}

interface ShareConfig {
  title: string;
  text: string;
  imageUrl: string;
  imageSpecs?: string;
}

interface SEOConfig {
  "virtual-cloning": SEOPageConfig;
  "privacy-first-ai": SEOPageConfig;
  share?: ShareConfig;
}

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onDownloadGuidelines?: () => void;
}

export default function AdminPanelModal({ isOpen, onClose, isDark, onDownloadGuidelines }: AdminPanelModalProps) {
  const isFullPage = typeof window !== "undefined" && window.location.pathname === "/mindmaster";

  const [config, setConfig] = useState<SEOConfig | null>(null);
  const [activeTab, setActiveTab] = useState<"virtual-cloning" | "privacy-first-ai" | "share-settings" | "admin-credentials">("virtual-cloning");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Auth & Access Control states
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [viewMode, setViewMode] = useState<"login" | "setup" | "forgot" | "reset" | "editor">("login");

  // Prevent search engine crawling when rendering /mindmaster page
  useEffect(() => {
    if (isFullPage) {
      let meta = document.querySelector('meta[name="robots"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'robots');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', 'noindex, nofollow');
    }
  }, [isFullPage]);

  // Input Fields for Login / Setup / Recovery
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [recoveryPinInput, setRecoveryPinInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [simulatedPinNotice, setSimulatedPinNotice] = useState<string | null>(null);

  // Edit Admin Credentials inside settings tab
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editEmail, setEditEmail] = useState("");

  useEffect(() => {
    if (isOpen) {
      setStatus(null);
      setSimulatedPinNotice(null);
      checkSetupStatus();
    }
  }, [isOpen]);

  const checkSetupStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/setup-status");
      const data = await res.json();
      setIsSetup(data.setup);
      
      if (!data.setup) {
        setViewMode("setup");
      } else {
        const storedToken = localStorage.getItem("aura_admin_session_token");
        if (storedToken) {
          await fetchConfig(storedToken);
        } else {
          setViewMode("login");
        }
      }
    } catch (err) {
      console.error(err);
      setViewMode("login");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConfig = async (token: string) => {
    setIsLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/seo-config", {
        headers: { "X-Admin-Token": token }
      });
      if (res.status === 401) {
        localStorage.removeItem("aura_admin_session_token");
        setIsLoggedIn(false);
        setViewMode("login");
        return;
      }
      if (!res.ok) throw new Error("Failed to load SEO configuration.");
      const data = await res.json();
      if (!data.share) {
        data.share = {
          title: "Virtual Self - Private AI Digital Twin",
          text: "Discover Virtual Self - build a fully private, secure, empathetic digital clone of yourself. Own your digital consciousness with local first encryption. Try it now!",
          imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&h=630&q=80",
          imageSpecs: "Recommended og:image dimensions: 1200 x 630 pixels. Aspect ratio: 1.91:1. Supported formats: SVG, PNG, JPG, or WebP. Keep file size under 2MB for optimal loading speed."
        };
      }
      setConfig(data);
      setIsLoggedIn(true);
      setViewMode("editor");

      // Populate edit fields as well
      fetchAdminProfile(token);
    } catch (err: any) {
      console.error(err);
      setStatus({ type: "error", message: "Could not fetch SEO config." });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdminProfile = async (token: string) => {
    try {
      const res = await fetch("/api/admin/profile", {
        headers: { "X-Admin-Token": token }
      });
      if (res.ok) {
        const data = await res.json();
        setEditUsername(data.username || "");
        setEditEmail(data.email || "");
        setEditPassword(""); // Keep password empty initially for typing updates
      }
    } catch (err) {
      console.error("Failed to load admin profile", err);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: adminUsername,
          password: adminPassword,
          email: adminEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to configure administrator account.");

      localStorage.setItem("aura_admin_session_token", data.token);
      setIsSetup(true);
      setIsLoggedIn(true);
      setViewMode("editor");
      await fetchConfig(data.token);
      setStatus({ type: "success", message: "Administrator account configured successfully!" });
    } catch (err: any) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: adminUsername,
          password: adminPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid username or password.");

      localStorage.setItem("aura_admin_session_token", data.token);
      setIsLoggedIn(true);
      setViewMode("editor");
      await fetchConfig(data.token);
    } catch (err: any) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);
    setSimulatedPinNotice(null);
    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registered administrator email address not found.");

      if (data.pin) {
        setSimulatedPinNotice(data.pin);
      }
      setStatus({ type: "success", message: data.message });
      setViewMode("reset");
    } catch (err: any) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: recoveryPinInput,
          newPassword: newPasswordInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid or expired recovery PIN.");

      setStatus({ type: "success", message: data.message });
      setSimulatedPinNotice(null);
      setRecoveryPinInput("");
      setNewPasswordInput("");
      setViewMode("login");
    } catch (err: any) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);
    try {
      const storedToken = localStorage.getItem("aura_admin_session_token") || "";
      const res = await fetch("/api/admin/update-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": storedToken,
        },
        body: JSON.stringify({
          username: editUsername,
          password: editPassword,
          email: editEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update administrator credentials.");

      setStatus({ type: "success", message: "Administrator master credentials successfully updated!" });
      setEditPassword(""); // reset password input field
      fetchAdminProfile(storedToken);
    } catch (err: any) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("aura_admin_session_token");
    setIsLoggedIn(false);
    setAdminUsername("");
    setAdminPassword("");
    setViewMode("login");
    setConfig(null);
    setStatus({ type: "success", message: "Successfully logged out of administrator session." });
    if (isFullPage) {
      window.location.href = "/";
    }
  };

  const handleSaveSEO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setIsLoading(true);
    setStatus(null);
    try {
      const storedToken = localStorage.getItem("aura_admin_session_token") || "";
      const res = await fetch("/api/seo-config", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Admin-Token": storedToken
        },
        body: JSON.stringify(config),
      });

      if (res.status === 401) {
        localStorage.removeItem("aura_admin_session_token");
        setIsLoggedIn(false);
        setViewMode("login");
        throw new Error("Session expired. Please log in again.");
      }
      if (!res.ok) throw new Error("Failed to save SEO config");
      setStatus({ type: "success", message: "SEO Page background and configurations updated successfully!" });
    } catch (err: any) {
      console.error(err);
      setStatus({ type: "error", message: err.message || "Failed to save configuration." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof SEOPageConfig, value: string) => {
    if (!config || activeTab === "admin-credentials" || activeTab === "share-settings") return;
    setConfig({
      ...config,
      [activeTab]: {
        ...config[activeTab],
        [field]: value,
      },
    });
  };

  const handleShareChange = (field: "title" | "text" | "imageUrl" | "imageSpecs", value: string) => {
    if (!config) return;
    setConfig({
      ...config,
      share: {
        title: config.share?.title || "",
        text: config.share?.text || "",
        imageUrl: config.share?.imageUrl || "",
        imageSpecs: config.share?.imageSpecs || "",
        [field]: value,
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 ${
      isFullPage 
        ? (isDark ? "bg-[#0D0D0F]" : "bg-[#F3F4F6]") 
        : ""
    }`}>
      {/* Backdrop */}
      {!isFullPage && (
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Modal Box */}
      <div
        className={`relative w-full max-w-3xl max-h-[90vh] md:max-h-[85vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl border transition-all duration-300 ${
          isDark 
            ? "bg-[#141416] text-zinc-100 border-zinc-800" 
            : "bg-[#FFFFFF] text-stone-950 border-stone-200"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-zinc-800/10 dark:border-zinc-200/10">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-indigo-500" />
            <div>
              <h3 className="text-base font-semibold tracking-tight">
                {viewMode === "setup" && "First-Time Administrator Setup"}
                {viewMode === "login" && "Admin Authentication Required"}
                {viewMode === "forgot" && "Admin Credentials Backup & Recovery"}
                {viewMode === "reset" && "Reset Administrator Password"}
                {viewMode === "editor" && "SEO Background & Design Admin Panel"}
              </h3>
              <p className="text-[10px] uppercase tracking-wider text-stone-500 dark:text-zinc-500 font-mono font-medium">
                {viewMode === "editor" 
                  ? "Dynamically customize crawlable search engine optimization pages" 
                  : "Securing administrative endpoints under strict master policies"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onDownloadGuidelines && (
              <button
                onClick={onDownloadGuidelines}
                className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                  isDark 
                    ? "border-zinc-800 hover:border-indigo-500 text-zinc-300 hover:text-indigo-400 bg-zinc-900/30" 
                    : "border-stone-250 hover:border-indigo-500 text-stone-700 hover:text-indigo-600 bg-stone-50"
                }`}
                title="Download Consolidated Platform Guidelines"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Guidelines</span>
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-1.5 rounded-full transition-colors flex items-center gap-1 text-xs font-semibold ${
                isDark ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-stone-100 text-stone-500"
              }`}
              title={isFullPage ? "Exit Admin Panel" : "Close"}
            >
              {isFullPage && <span className="font-mono text-[9px] tracking-wider uppercase mr-1">Exit</span>}
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body - Conditionally Render Auth Screens vs Configuration Editor */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Status Alert */}
          {status && (
            <div className={`p-4 rounded-xl flex items-start gap-2.5 text-xs mb-5 ${
              status.type === "success" 
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                : "bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400"
            }`}>
              {status.type === "success" ? (
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{status.message}</span>
            </div>
          )}

          {/* VIEW: SETUP ACCOUNT */}
          {viewMode === "setup" && (
            <form onSubmit={handleSetup} className="max-w-md mx-auto py-6 space-y-5">
              <div className="text-center space-y-1.5 mb-2">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto text-indigo-500">
                  <Key className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm">Configure Admin Master Account</h4>
                <p className="text-xs text-stone-600 dark:text-zinc-400 font-light leading-relaxed">
                  No admin configuration file detected. Please create your master credentials below. 
                  These will be used to protect SEO page headers, layout elements, and content editing access.
                </p>
              </div>

              <div className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-700 dark:text-zinc-400 mb-1.5 font-bold">
                    Admin Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-stone-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. system_admin"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border outline-none focus:border-indigo-500/50 ${
                        isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-stone-300 text-stone-950"
                      }`}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-700 dark:text-zinc-400 mb-1.5 font-bold">
                    Admin Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-stone-500" />
                    <input
                      type="password"
                      required
                      placeholder="Minimum 4 characters"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border outline-none focus:border-indigo-500/50 ${
                        isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-stone-300 text-stone-950"
                      }`}
                    />
                  </div>
                </div>

                {/* Backup / Recovery Email */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-700 dark:text-zinc-400 mb-1.5 font-bold">
                    Administrator Backup Email ID
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-stone-500" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. admin@auravirtual.self"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border outline-none focus:border-indigo-500/50 ${
                        isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-stone-300 text-stone-950"
                      }`}
                    />
                  </div>
                  <p className="text-[10px] text-stone-500 dark:text-zinc-500 italic mt-1 leading-normal">
                    CRITICAL: This email address is used to verify ownership during password recovery operations.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl active:scale-95 transition-all mt-6"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Configure & Access Panel</span>
              </button>
            </form>
          )}

          {/* VIEW: LOGIN SCREEN */}
          {viewMode === "login" && (
            <form onSubmit={handleLogin} className="max-w-md mx-auto py-8 space-y-5">
              <div className="text-center space-y-1.5 mb-2">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto text-indigo-500">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm">Sign in to Admin Dashboard</h4>
                <p className="text-xs text-stone-600 dark:text-zinc-400 font-light">
                  Please enter your administrator username and master password to proceed.
                </p>
              </div>

              <div className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-700 dark:text-zinc-400 mb-1.5 font-bold">
                    Administrator Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-stone-500" />
                    <input
                      type="text"
                      required
                      placeholder="Username"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border outline-none focus:border-indigo-500/50 ${
                        isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-stone-300 text-stone-950"
                      }`}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-700 dark:text-zinc-400 font-bold">
                      Master Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setViewMode("forgot")}
                      className="text-[10px] font-mono uppercase tracking-wider text-indigo-500 hover:underline hover:text-indigo-600"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-stone-500" />
                    <input
                      type="password"
                      required
                      placeholder="Password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border outline-none focus:border-indigo-500/50 ${
                        isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-stone-300 text-stone-950"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl active:scale-95 transition-all mt-6"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                <span>Authorize & Unlock</span>
              </button>
            </form>
          )}

          {/* VIEW: FORGOT PASSWORD */}
          {viewMode === "forgot" && (
            <form onSubmit={handleForgotPasswordSubmit} className="max-w-md mx-auto py-8 space-y-5">
              <div className="text-center space-y-1.5 mb-2">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto text-indigo-500">
                  <Mail className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm">Recover Master Credentials</h4>
                <p className="text-xs text-stone-600 dark:text-zinc-400 font-light leading-relaxed">
                  Enter the registered email address of the administrator below. 
                  A secure 6-digit recovery PIN will be simulated to reset your master password safely.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-700 dark:text-zinc-400 mb-1.5 font-bold">
                    Registered Administrator Email ID
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-stone-500" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. admin@auravirtual.self"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border outline-none focus:border-indigo-500/50 ${
                        isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-stone-300 text-stone-950"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setViewMode("login")}
                  className="text-xs text-stone-600 dark:text-zinc-400 hover:underline"
                >
                  Back to login
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl active:scale-95 transition-all"
                >
                  {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Request Recovery PIN</span>
                </button>
              </div>
            </form>
          )}

          {/* VIEW: RESET PASSWORD */}
          {viewMode === "reset" && (
            <form onSubmit={handleResetPasswordSubmit} className="max-w-md mx-auto py-6 space-y-5">
              <div className="text-center space-y-1.5 mb-2">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto text-indigo-500">
                  <Key className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm">Reset Password Verification</h4>
                <p className="text-xs text-stone-600 dark:text-zinc-400 font-light leading-relaxed">
                  Enter the 6-digit PIN and choose your new system master password.
                </p>
              </div>

              {/* Developer Environment PIN Notice Box */}
              {simulatedPinNotice && (
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-600 dark:text-indigo-400 space-y-1">
                  <p className="font-bold uppercase tracking-wider text-[10px] font-mono">Simulated Outbound Mailer Interface</p>
                  <p className="font-light">Since real emails are sandboxed in container preview, your secure verification code is:</p>
                  <p className="text-base font-bold font-mono tracking-widest text-center py-1 select-all">{simulatedPinNotice}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* 6-digit Recovery Code */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-700 dark:text-zinc-400 mb-1.5 font-bold">
                    6-Digit Recovery PIN
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-2.5 w-4 h-4 text-stone-500" />
                    <input
                      type="text"
                      required
                      placeholder="Enter 6-digit PIN"
                      value={recoveryPinInput}
                      onChange={(e) => setRecoveryPinInput(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border outline-none focus:border-indigo-500/50 font-mono tracking-widest ${
                        isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-stone-300 text-stone-950"
                      }`}
                    />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-700 dark:text-zinc-400 mb-1.5 font-bold">
                    New Master Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-stone-500" />
                    <input
                      type="password"
                      required
                      placeholder="Minimum 4 characters"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border outline-none focus:border-indigo-500/50 ${
                        isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-stone-300 text-stone-950"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setViewMode("login")}
                  className="text-xs text-stone-600 dark:text-zinc-400 hover:underline"
                >
                  Back to login
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl active:scale-95 transition-all"
                >
                  {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save New Password</span>
                </button>
              </div>
            </form>
          )}

          {/* VIEW: MAIN EDITOR INTERFACE */}
          {viewMode === "editor" && (
            <div className="space-y-6">
              
              {/* Navigation Tabs (Including Admin Account management) */}
              <div className={`flex border rounded-xl overflow-hidden text-xs -mt-2 ${
                isDark ? "bg-zinc-950/40 border-zinc-800" : "bg-stone-50 border-stone-200"
              }`}>
                <button
                  onClick={() => setActiveTab("virtual-cloning")}
                  className={`flex-1 py-3 px-2 font-semibold text-center border-b-2 transition-all ${
                    activeTab === "virtual-cloning"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900"
                      : "border-transparent text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200"
                  }`}
                >
                  Page 1: Virtual Cloning
                </button>
                <button
                  onClick={() => setActiveTab("privacy-first-ai")}
                  className={`flex-1 py-3 px-2 font-semibold text-center border-b-2 transition-all ${
                    activeTab === "privacy-first-ai"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900"
                      : "border-transparent text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200"
                  }`}
                >
                  Page 2: Privacy-First AI
                </button>
                <button
                  onClick={() => setActiveTab("share-settings")}
                  className={`flex-1 py-3 px-2 font-semibold text-center border-b-2 transition-all ${
                    activeTab === "share-settings"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900"
                      : "border-transparent text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200"
                  }`}
                >
                  Share Settings
                </button>
                <button
                  onClick={() => setActiveTab("admin-credentials")}
                  className={`flex-1 py-3 px-2 font-semibold text-center border-b-2 transition-all ${
                    activeTab === "admin-credentials"
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900"
                      : "border-transparent text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200"
                  }`}
                >
                  Admin Credentials Backup
                </button>
              </div>

              {/* EDITOR SUB-VIEW: CONFIGURING VIRTUAL-CLONING OR PRIVACY-FIRST-AI SEO PAGES */}
              {activeTab !== "admin-credentials" && activeTab !== "share-settings" && (
                <>
                  {isLoading && !config ? (
                    <div className="py-20 text-center">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
                      <p className="text-xs text-stone-500 font-mono font-medium">FETCHING SECURE SEO DESIGN LAYOUTS...</p>
                    </div>
                  ) : config ? (
                    <form onSubmit={handleSaveSEO} className="space-y-6">
                      
                      {/* View Live Page Link */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold">
                          Crawlable Page Index URL
                        </span>
                        <a
                          href={`/seo/${activeTab}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-indigo-500 hover:underline"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>View live page /seo/{activeTab}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {/* Grid: Color Pickers (Background & Designing) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4.5 rounded-xl border border-zinc-800/10 dark:border-zinc-200/10 bg-zinc-500/5">
                        <h4 className="md:col-span-2 text-xs font-bold uppercase tracking-wider text-indigo-500">
                          Background & Style Configuration
                        </h4>

                        {/* Body Background Color */}
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-600 dark:text-zinc-400 mb-1.5 font-bold">
                            Page Background Color
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={config[activeTab].backgroundColor}
                              onChange={(e) => handleInputChange("backgroundColor", e.target.value)}
                              className="w-8 h-8 rounded-lg cursor-pointer border border-stone-300 dark:border-zinc-700 bg-transparent p-0"
                            />
                            <input
                              type="text"
                              value={config[activeTab].backgroundColor}
                              onChange={(e) => handleInputChange("backgroundColor", e.target.value)}
                              className={`flex-1 px-3 py-1.5 text-xs rounded-lg border outline-none focus:border-indigo-500/50 font-mono ${
                                isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-stone-300 text-stone-950"
                              }`}
                            />
                          </div>
                        </div>

                        {/* Text Color */}
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-600 dark:text-zinc-400 mb-1.5 font-bold">
                            Main Text Color
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={config[activeTab].textColor}
                              onChange={(e) => handleInputChange("textColor", e.target.value)}
                              className="w-8 h-8 rounded-lg cursor-pointer border border-stone-300 dark:border-zinc-700 bg-transparent p-0"
                            />
                            <input
                              type="text"
                              value={config[activeTab].textColor}
                              onChange={(e) => handleInputChange("textColor", e.target.value)}
                              className={`flex-1 px-3 py-1.5 text-xs rounded-lg border outline-none focus:border-indigo-500/50 font-mono ${
                                isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-stone-300 text-stone-950"
                              }`}
                            />
                          </div>
                        </div>

                        {/* Container Background */}
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-600 dark:text-zinc-400 mb-1.5 font-bold">
                            Container Card Background
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={config[activeTab].containerBg}
                              onChange={(e) => handleInputChange("containerBg", e.target.value)}
                              className="w-8 h-8 rounded-lg cursor-pointer border border-stone-300 dark:border-zinc-700 bg-transparent p-0"
                            />
                            <input
                              type="text"
                              value={config[activeTab].containerBg}
                              onChange={(e) => handleInputChange("containerBg", e.target.value)}
                              className={`flex-1 px-3 py-1.5 text-xs rounded-lg border outline-none focus:border-indigo-500/50 font-mono ${
                                isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-stone-300 text-stone-950"
                              }`}
                            />
                          </div>
                        </div>

                        {/* Container Border Color */}
                        <div>
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-600 dark:text-zinc-400 mb-1.5 font-bold">
                            Container Card Border Color
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={config[activeTab].containerBorderColor}
                              onChange={(e) => handleInputChange("containerBorderColor", e.target.value)}
                              className="w-8 h-8 rounded-lg cursor-pointer border border-stone-300 dark:border-zinc-700 bg-transparent p-0"
                            />
                            <input
                              type="text"
                              value={config[activeTab].containerBorderColor}
                              onChange={(e) => handleInputChange("containerBorderColor", e.target.value)}
                              className={`flex-1 px-3 py-1.5 text-xs rounded-lg border outline-none focus:border-indigo-500/50 font-mono ${
                                isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-stone-300 text-stone-950"
                              }`}
                            />
                          </div>
                        </div>

                        {/* Badge Accent Color */}
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-600 dark:text-zinc-400 mb-1.5 font-bold">
                            Badge Accent Color
                          </label>
                          <div className="flex items-center gap-2 max-w-xs">
                            <input
                              type="color"
                              value={config[activeTab].badgeColor}
                              onChange={(e) => handleInputChange("badgeColor", e.target.value)}
                              className="w-8 h-8 rounded-lg cursor-pointer border border-stone-300 dark:border-zinc-700 bg-transparent p-0"
                            />
                            <input
                              type="text"
                              value={config[activeTab].badgeColor}
                              onChange={(e) => handleInputChange("badgeColor", e.target.value)}
                              className={`flex-1 px-3 py-1.5 text-xs rounded-lg border outline-none focus:border-indigo-500/50 font-mono ${
                                isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-stone-300 text-stone-950"
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Metadata Settings */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                          Search Engine Metadata (HTML Tags)
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Title Tag */}
                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-600 dark:text-zinc-400 mb-1.5 font-bold">
                              Meta Title Tag
                            </label>
                            <input
                              type="text"
                              required
                              value={config[activeTab].title}
                              onChange={(e) => handleInputChange("title", e.target.value)}
                              className={`w-full px-3 py-2 text-xs rounded-lg border outline-none focus:border-indigo-500/50 ${
                                isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-stone-300 text-stone-950"
                              }`}
                            />
                          </div>

                          {/* Description Tag */}
                          <div>
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-600 dark:text-zinc-400 mb-1.5 font-bold">
                              Meta Description Tag
                            </label>
                            <textarea
                              required
                              rows={2}
                              value={config[activeTab].description}
                              onChange={(e) => handleInputChange("description", e.target.value)}
                              className={`w-full px-3 py-2 text-xs rounded-lg border outline-none focus:border-indigo-500/50 leading-relaxed ${
                                isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-stone-300 text-stone-950"
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Rich Content (HTML body) */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-600 dark:text-zinc-400 font-bold">
                          Rich Page Content (Body HTML)
                        </label>
                        <p className="text-[10px] text-stone-500 dark:text-zinc-500 leading-normal italic">
                          Tip: You can use direct HTML tags like &lt;h1&gt;, &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt; to outline the text structure.
                        </p>
                        <textarea
                          required
                          rows={6}
                          value={config[activeTab].content}
                          onChange={(e) => handleInputChange("content", e.target.value)}
                          className={`w-full px-3 py-2.5 text-xs rounded-lg border outline-none focus:border-indigo-500/50 font-mono leading-relaxed ${
                            isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-stone-300 text-stone-950"
                          }`}
                        />
                      </div>

                      {/* Submit Controls */}
                      <div className="flex items-center justify-between border-t border-stone-200 dark:border-zinc-850 pt-5">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 font-mono uppercase tracking-wider font-bold"
                          title="Terminate admin session securely"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              const token = localStorage.getItem("aura_admin_session_token") || "";
                              fetchConfig(token);
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all ${
                              isDark 
                                ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800" 
                                : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                            }`}
                            disabled={isLoading}
                          >
                            Discard Changes
                          </button>
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl active:scale-95 transition-all"
                          >
                            <Save className="w-4 h-4" />
                            <span>{isLoading ? "Saving..." : "Save Config"}</span>
                          </button>
                        </div>
                      </div>

                    </form>
                  ) : (
                    <div className="py-20 text-center">
                      <p className="text-xs text-rose-500 font-mono">No configuration found.</p>
                    </div>
                  )}
                </>
              )}

              {/* EDITOR SUB-VIEW: CUSTOMIZING SHARE TEXT AND IMAGE SPECIFICATIONS */}
              {activeTab === "share-settings" && config && (
                <form onSubmit={handleSaveSEO} className="space-y-6 animate-fadeIn">
                  <div className="border border-stone-200 dark:border-zinc-800 p-4.5 rounded-xl bg-indigo-500/5 mb-4">
                    <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">
                      Customize Share Meta Data
                    </h4>
                    <p className="text-xs text-stone-600 dark:text-zinc-400 leading-relaxed font-light">
                      Customize the text and preview imagery users see when sharing this platform through WhatsApp, Twitter, Facebook, iMessage, and other chat/social services.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Share Title */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-700 dark:text-zinc-400 mb-1.5 font-bold font-mono">
                        Share Title
                      </label>
                      <input
                        type="text"
                        required
                        value={config.share?.title || ""}
                        onChange={(e) => handleShareChange("title", e.target.value)}
                        className={`w-full px-3 py-2 text-xs rounded-lg border outline-none focus:border-indigo-500/50 ${
                          isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-stone-300 text-stone-950"
                        }`}
                        placeholder="e.g. Virtual Self - Private AI Digital Twin"
                      />
                    </div>

                    {/* Share Description / Text */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-700 dark:text-zinc-400 mb-1.5 font-bold font-mono">
                        Share Description / Text
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={config.share?.text || ""}
                        onChange={(e) => handleShareChange("text", e.target.value)}
                        className={`w-full px-3 py-2 text-xs rounded-lg border outline-none focus:border-indigo-500/50 leading-relaxed ${
                          isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-stone-300 text-stone-950"
                        }`}
                        placeholder="e.g. Discover Virtual Self - build a private, secure, empathetic digital clone of yourself."
                      />
                    </div>

                    {/* Share Image URL */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-700 dark:text-zinc-400 mb-1.5 font-bold font-mono">
                        Share Image URL
                      </label>
                      <input
                        type="url"
                        required
                        value={config.share?.imageUrl || ""}
                        onChange={(e) => handleShareChange("imageUrl", e.target.value)}
                        className={`w-full px-3 py-2 text-xs rounded-lg border outline-none focus:border-indigo-500/50 ${
                          isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-stone-300 text-stone-950"
                        }`}
                        placeholder="e.g. https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&h=630&q=80"
                      />
                    </div>

                    {/* Image Specifications */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-700 dark:text-zinc-400 mb-1.5 font-bold font-mono">
                        Image Specifications & Guidelines
                      </label>
                      <textarea
                        rows={3}
                        value={config.share?.imageSpecs || ""}
                        onChange={(e) => handleShareChange("imageSpecs", e.target.value)}
                        className={`w-full px-3 py-2 text-xs rounded-lg border outline-none focus:border-indigo-500/50 leading-relaxed font-mono text-[11px] ${
                          isDark ? "bg-zinc-950 border-zinc-800 text-zinc-300" : "bg-stone-50 border-stone-200 text-stone-600"
                        }`}
                        placeholder="Specifications regarding recommended dimension, aspect ratios, etc."
                      />
                    </div>
                  </div>

                  {/* Visual Social Preview Card */}
                  <div className="space-y-2 pt-2">
                    <span className="block text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-zinc-400 font-bold font-mono">
                      Rich Instant Messaging Preview Bubble
                    </span>
                    <div className={`border rounded-xl overflow-hidden max-w-sm ${
                      isDark ? "bg-zinc-950 border-zinc-800" : "bg-stone-50 border-stone-200"
                    }`}>
                      {config.share?.imageUrl ? (
                        <div className="aspect-[1.91/1] w-full overflow-hidden bg-zinc-800 relative flex items-center justify-center">
                          <img 
                            src={config.share.imageUrl} 
                            alt="Social Preview" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="aspect-[1.91/1] w-full bg-zinc-800 flex items-center justify-center text-[11px] text-zinc-500 font-mono">
                          NO PREVIEW IMAGE URL DEFINED
                        </div>
                      )}
                      <div className={`p-3.5 space-y-1 ${
                        isDark ? "bg-zinc-900/60" : "bg-white"
                      }`}>
                        <div className="text-[10px] font-mono uppercase text-indigo-500 tracking-wider font-extrabold font-mono">
                          {typeof window !== "undefined" ? window.location.hostname : "virtual-self.platform"}
                        </div>
                        <h5 className={`text-xs font-bold leading-tight ${
                          isDark ? "text-zinc-100" : "text-stone-900"
                        }`}>
                          {config.share?.title || "Virtual Self - Private AI Digital Twin"}
                        </h5>
                        <p className={`text-[10.5px] line-clamp-2 leading-relaxed ${
                          isDark ? "text-zinc-400" : "text-stone-500"
                        }`}>
                          {config.share?.text || "Discover Virtual Self - build a private, secure, empathetic digital clone of yourself."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Controls */}
                  <div className="flex items-center justify-between border-t border-stone-200 dark:border-zinc-850 pt-5 mt-4">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 font-mono uppercase tracking-wider font-bold"
                      title="Terminate admin session securely"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const token = localStorage.getItem("aura_admin_session_token") || "";
                          fetchConfig(token);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all ${
                          isDark 
                            ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800" 
                            : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                        }`}
                        disabled={isLoading}
                      >
                        Discard Changes
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl active:scale-95 transition-all"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isLoading ? "Saving..." : "Save Share Config"}</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* EDITOR SUB-VIEW: MANAGING ADMIN MASTER CREDENTIALS */}
              {activeTab === "admin-credentials" && (
                <form onSubmit={handleUpdateCredentials} className="space-y-5 max-w-lg mx-auto py-4">
                  <div className="border border-stone-200 dark:border-zinc-800 p-4.5 rounded-xl bg-indigo-500/5 mb-2">
                    <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">
                      Update Administrative Credentials
                    </h4>
                    <p className="text-xs text-stone-600 dark:text-zinc-400 leading-relaxed font-light">
                      Modifying these fields changes the master account required to unlock this dashboard. 
                      Ensure your recovery email remains valid to avoid lockouts.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Username */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-700 dark:text-zinc-400 mb-1.5 font-bold">
                        Administrator Username
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 w-4 h-4 text-stone-500" />
                        <input
                          type="text"
                          required
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                          className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border outline-none focus:border-indigo-500/50 ${
                            isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-stone-300 text-stone-950"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-700 dark:text-zinc-400 mb-1.5 font-bold">
                        New Master Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 w-4 h-4 text-stone-500" />
                        <input
                          type="password"
                          required
                          placeholder="Type new secure password"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border outline-none focus:border-indigo-500/50 ${
                            isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-stone-300 text-stone-950"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-stone-700 dark:text-zinc-400 mb-1.5 font-bold">
                        Registered Administrator Email ID (For Backup Recovery)
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-stone-500" />
                        <input
                          type="email"
                          required
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border outline-none focus:border-indigo-500/50 ${
                            isDark ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-stone-300 text-stone-950"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-stone-200 dark:border-zinc-850 pt-5 mt-6">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 font-mono uppercase tracking-wider font-bold"
                      title="Terminate admin session securely"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl active:scale-95 transition-all"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isLoading ? "Saving..." : "Save Credentials"}</span>
                    </button>
                  </div>
                </form>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className={`px-6 py-4 flex items-center justify-between border-t text-[10px] font-mono tracking-wider text-stone-500 dark:text-zinc-500 uppercase ${
          isDark ? "bg-zinc-950/40 border-zinc-800" : "bg-stone-50 border-stone-200"
        }`}>
          <span>Administrator Access Level</span>
          <span>Saves directly to /seo-config.json</span>
        </div>
      </div>
    </div>
  );
}
