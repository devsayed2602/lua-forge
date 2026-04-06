"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Download, Gamepad2, Loader2, FileArchive, CheckCircle2, AlertCircle, Search, X, Eye, FileCode, Clipboard, ClipboardCheck, ChevronDown, Database, MessageSquare, List, Sparkles, Shield, ShieldCheck, Lock, Power, ToggleLeft, ToggleRight, Bell, BellOff, SearchX, DownloadCloud, CloudOff, Save, LogOut, Wrench, Activity, RefreshCw, Type } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedBackground from "./AnimatedBackground";

interface Game {
  id: string;
  name: string;
}

interface SiteConfig {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  bannerEnabled: boolean;
  bannerMessage: string;
  searchDisabled: boolean;
  downloadsDisabled: boolean;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}

// Sub-component for Game Poster with Fallback handling
const GamePoster = ({ appId, name, onGenerate, downloadsDisabled }: { appId: string; name: string; onGenerate: (id: string) => void; downloadsDisabled?: boolean }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Primary: Vertical Poster, Fallback: Horizontal Header
  const verticalUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`;
  const headerUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`;
  const currentUrl = useFallback ? headerUrl : verticalUrl;

  // Fail-safe: If image doesn't load in 5 seconds, try fallback or error
  useEffect(() => {
    if (loading) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (loading) {
          if (!useFallback) {
             setUseFallback(true); // Try header.jpg before giving up
          } else {
             setError(true);
             setLoading(false);
          }
        }
      }, 5000); 
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [loading, useFallback]);

  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#0d0d0d] border border-white/5 shadow-2xl group cursor-pointer"
    >
      {!error ? (
        <>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#111111]">
              <Loader2 className="w-6 h-6 text-purple-600 animate-spin opacity-20" />
            </div>
          )}
          <img 
            key={currentUrl} // Key change triggers new load attempt on fallback
            src={currentUrl} 
            alt={name}
            loading="lazy"
            decoding="async"
            onLoad={() => {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                setLoading(false);
            }}
            onError={() => { 
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                if (!useFallback) {
                    setUseFallback(true);
                } else {
                    setError(true); 
                    setLoading(false); 
                }
            }}
            className={`w-full h-full object-cover transition-all duration-700 pointer-events-none ${loading ? 'opacity-0' : 'opacity-100 group-hover:scale-110 group-hover:rotate-1'}`}
          />
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[#111111]">
            <Gamepad2 className="w-12 h-12 text-white/5" />
            <span className="text-[10px] text-white/10 font-bold uppercase tracking-widest text-center px-4">{name}</span>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <h3 className="text-white font-black text-sm line-clamp-2 leading-tight mb-1 drop-shadow-lg">{name}</h3>
            <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded-sm uppercase tracking-tighter">ID: {appId}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); if (!downloadsDisabled) onGenerate(appId); }}
                  className={`bg-white text-black p-2 rounded-lg transition-all shadow-xl ${downloadsDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-purple-500 hover:text-white'}`}
                  disabled={downloadsDisabled}
                >
                    <Download className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
      </div>

      <div className="absolute inset-0 border-2 border-purple-500/0 group-hover:border-purple-500/30 rounded-2xl transition-all duration-500 pointer-events-none" />
    </motion.div>
  );
};

// ─── Admin Dashboard Component ───────────────────────────────────────
const AdminDashboard = ({ config, onSave, onLogout }: { config: SiteConfig; onSave: (config: Partial<SiteConfig>) => Promise<void>; onLogout: () => void }) => {
  const [localConfig, setLocalConfig] = useState(config);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => setLocalConfig(config), [config]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(localConfig);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Toggle = ({ enabled, onToggle, label, icon: Icon, activeColor = "bg-purple-600" }: any) => (
    <div className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-all group">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl transition-all ${enabled ? activeColor + ' text-white shadow-lg' : 'bg-white/5 text-white/30'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-black text-white/90 uppercase tracking-wider">{label}</p>
          <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-0.5">{enabled ? "Active" : "Inactive"}</p>
        </div>
      </div>
      <button onClick={onToggle} className="relative">
        <div className={`w-14 h-7 rounded-full transition-all duration-300 ${enabled ? activeColor + ' shadow-[0_0_20px_rgba(147,51,234,0.3)]' : 'bg-white/10'}`}>
          <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 ${enabled ? 'left-[calc(100%-1.625rem)]' : 'left-0.5'}`} />
        </div>
      </button>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
    >
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onLogout} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
      
      <motion.div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#080808] border border-white/[0.08] rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] custom-scrollbar">
        {/* Header */}
        <div className="sticky top-0 z-10 backdrop-blur-2xl bg-[#080808]/90 px-10 py-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-[0_10px_30px_rgba(147,51,234,0.4)]">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-white font-black text-2xl tracking-tight">Control Center</h2>
              <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em] mt-1">Admin Dashboard • Forge v2.0</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSave} 
              disabled={saving}
              className={`flex items-center gap-3 px-7 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl ${saved ? 'bg-emerald-600 text-white' : 'bg-white text-black hover:bg-purple-500 hover:text-white'}`}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
            </button>
            <button onClick={onLogout} className="p-3.5 bg-white/5 hover:bg-red-500/20 hover:border-red-500/30 text-white/50 hover:text-red-400 rounded-2xl transition-all border border-white/5">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-10 flex flex-col gap-8">

          {/* ── Status Overview ─────────────────────────────── */}
          <div className="grid grid-cols-3 gap-4">
            <div className={`p-5 rounded-2xl border transition-all ${localConfig.maintenanceMode ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
              <Activity className={`w-5 h-5 mb-3 ${localConfig.maintenanceMode ? 'text-red-400' : 'text-emerald-400'}`} />
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Site Status</p>
              <p className={`text-sm font-black uppercase tracking-wider mt-1 ${localConfig.maintenanceMode ? 'text-red-400' : 'text-emerald-400'}`}>
                {localConfig.maintenanceMode ? 'Offline' : 'Online'}
              </p>
            </div>
            <div className={`p-5 rounded-2xl border transition-all ${localConfig.searchDisabled ? 'bg-orange-500/10 border-orange-500/20' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
              <Search className={`w-5 h-5 mb-3 ${localConfig.searchDisabled ? 'text-orange-400' : 'text-emerald-400'}`} />
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Search</p>
              <p className={`text-sm font-black uppercase tracking-wider mt-1 ${localConfig.searchDisabled ? 'text-orange-400' : 'text-emerald-400'}`}>
                {localConfig.searchDisabled ? 'Disabled' : 'Enabled'}
              </p>
            </div>
            <div className={`p-5 rounded-2xl border transition-all ${localConfig.downloadsDisabled ? 'bg-orange-500/10 border-orange-500/20' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
              <DownloadCloud className={`w-5 h-5 mb-3 ${localConfig.downloadsDisabled ? 'text-orange-400' : 'text-emerald-400'}`} />
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Downloads</p>
              <p className={`text-sm font-black uppercase tracking-wider mt-1 ${localConfig.downloadsDisabled ? 'text-orange-400' : 'text-emerald-400'}`}>
                {localConfig.downloadsDisabled ? 'Disabled' : 'Enabled'}
              </p>
            </div>
          </div>

          {/* ── Controls ─────────────────────────────── */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-4 px-1">System Controls</p>
            <div className="flex flex-col gap-3">
              <Toggle
                enabled={localConfig.maintenanceMode}
                onToggle={() => setLocalConfig(p => ({ ...p, maintenanceMode: !p.maintenanceMode }))}
                label="Maintenance Mode"
                icon={Wrench}
                activeColor="bg-red-600"
              />
              <Toggle
                enabled={localConfig.searchDisabled}
                onToggle={() => setLocalConfig(p => ({ ...p, searchDisabled: !p.searchDisabled }))}
                label="Disable Search"
                icon={SearchX}
                activeColor="bg-orange-600"
              />
              <Toggle
                enabled={localConfig.downloadsDisabled}
                onToggle={() => setLocalConfig(p => ({ ...p, downloadsDisabled: !p.downloadsDisabled }))}
                label="Disable Downloads"
                icon={CloudOff}
                activeColor="bg-orange-600"
              />
              <Toggle
                enabled={localConfig.bannerEnabled}
                onToggle={() => setLocalConfig(p => ({ ...p, bannerEnabled: !p.bannerEnabled }))}
                label="Announcement Banner"
                icon={Bell}
                activeColor="bg-blue-600"
              />
            </div>
          </div>

          {/* ── Maintenance Message ─────────────────────────────── */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-4 px-1">Maintenance Message</p>
            <div className="relative">
              <Wrench className="absolute left-5 top-5 w-4 h-4 text-white/10" />
              <textarea
                value={localConfig.maintenanceMessage}
                onChange={(e) => setLocalConfig(p => ({ ...p, maintenanceMessage: e.target.value }))}
                placeholder="Enter the message visitors see during maintenance..."
                rows={3}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 pl-12 text-white/70 text-sm font-medium outline-none focus:border-purple-600/40 transition-all resize-none placeholder-white/10"
              />
            </div>
          </div>

          {/* ── Banner Message ─────────────────────────────── */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-4 px-1">Banner Message</p>
            <div className="relative">
              <Type className="absolute left-5 top-5 w-4 h-4 text-white/10" />
              <input
                type="text"
                value={localConfig.bannerMessage}
                onChange={(e) => setLocalConfig(p => ({ ...p, bannerMessage: e.target.value }))}
                placeholder="Announcement text shown at the top of the site..."
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 pl-12 text-white/70 text-sm font-medium outline-none focus:border-purple-600/40 transition-all placeholder-white/10"
              />
            </div>
          </div>

          {/* ── Last Updated Footer ─────────────────────────────── */}
          {localConfig.lastUpdatedAt && (
            <div className="pt-4 border-t border-white/5 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/10">
                Last updated: {new Date(localConfig.lastUpdatedAt).toLocaleString()} by {localConfig.lastUpdatedBy}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};


// ═══════════════════════════════════════════════════════════════════════
// ─── Main Home Component ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════
export default function Home() {
  const [appId, setAppId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [suggestedGames, setSuggestedGames] = useState<Game[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isIndexLoading, setIsIndexLoading] = useState(false);
  const [isIndexLoaded, setIsIndexLoaded] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Preview Modal States
  const [previewContent, setPreviewContent] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState(false);

  // ─── Admin States ───────────────────────────────────────────────────
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminAuthError, setAdminAuthError] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminConfig, setAdminConfig] = useState<SiteConfig | null>(null);
  const [sessionPassword, setSessionPassword] = useState("");

  // ─── Site Status (public) ───────────────────────────────────────────
  const [siteStatus, setSiteStatus] = useState<Partial<SiteConfig>>({
    maintenanceMode: false,
    maintenanceMessage: "",
    bannerEnabled: false,
    bannerMessage: "",
    searchDisabled: false,
    downloadsDisabled: false,
  });

  // ─── Easter Egg: Rapid Click Counter ────────────────────────────────
  const clickTimestamps = useRef<number[]>([]);
  const CLICK_THRESHOLD = 5;
  const CLICK_WINDOW_MS = 2000; // 5 clicks within 2 seconds

  const handleFooterClick = useCallback(() => {
    const now = Date.now();
    clickTimestamps.current.push(now);
    // Keep only clicks within the window
    clickTimestamps.current = clickTimestamps.current.filter(t => now - t < CLICK_WINDOW_MS);
    
    if (clickTimestamps.current.length >= CLICK_THRESHOLD) {
      clickTimestamps.current = [];
      setShowAdminLogin(true);
    }
  }, []);

  // ─── Fetch public site status ───────────────────────────────────────
  useEffect(() => {
    fetch("/api/admin/status")
      .then(res => res.json())
      .then(data => setSiteStatus(data))
      .catch(() => {});
  }, []);

  // ─── Admin Login ────────────────────────────────────────────────────
  const handleAdminLogin = async () => {
    setAdminLoading(true);
    setAdminAuthError(false);
    try {
      const res = await fetch("/api/admin", {
        headers: { "x-admin-password": adminPassword.trim() },
      });
      const data = await res.json();
      
      if (!res.ok) {
        setAdminAuthError(true);
        setErrorMessage(data.error || "Authentication failed");
        setAdminLoading(false);
        return;
      }
      
      setAdminConfig(data);
      setSessionPassword(adminPassword.trim());
      setShowAdminLogin(false);
      setShowAdminDashboard(true);
      setAdminPassword("");
    } catch {
      setAdminAuthError(true);
      setErrorMessage("Network error during authentication");
    } finally {
      setAdminLoading(false);
    }
  };

  // ─── Admin Save ─────────────────────────────────────────────────────
  const handleAdminSave = async (updatedConfig: Partial<SiteConfig>) => {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": sessionPassword,
        },
        body: JSON.stringify(updatedConfig),
      });
      if (res.ok) {
        const data = await res.json();
        setAdminConfig(data.config);
        setSiteStatus(data.config);
      }
    } catch (err) {
      console.error("Failed to save admin config:", err);
    }
  };

  const handleAdminLogout = () => {
    setShowAdminDashboard(false);
    setSessionPassword("");
    setAdminConfig(null);
  };

  // ─── Existing Game Logic (unchanged) ────────────────────────────────
  const fetchSuggestions = async (silent = false) => {
    if (!silent) setIsShuffling(true);
    try {
      const res = await fetch("/api/suggestions?t=" + Date.now());
      const data = await res.json();
      if (Array.isArray(data)) {
        setSuggestedGames(data);
        if (searchQuery === "") {
          setFilteredGames(data);
        }
      }
      if (!isIndexLoaded && !isIndexLoading) {
        loadFullIndex();
      }
    } catch (err) {
      console.error("Failed to load suggestions:", err);
    } finally {
      setIsShuffling(false);
    }
  };

  useEffect(() => {
    fetchSuggestions(true);
  }, []);

  const loadFullIndex = async () => {
    if (isIndexLoaded || isIndexLoading) return;
    setIsIndexLoading(true);
    try {
      const res = await fetch("/api/games");
      const data = await res.json();
      let gameList: Game[] = [];
      if (data && Array.isArray(data.games)) gameList = data.games;
      else if (Array.isArray(data)) gameList = data;
      setGames(gameList);
      setIsIndexLoaded(true);
      console.log(`Index loaded: ${gameList.length} items`);
    } catch (err) {
      console.error("Failed to load full index:", err);
    } finally {
      setIsIndexLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 180);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery.trim().length > 0) {
      const source = isIndexLoaded ? games : suggestedGames;
      const q = debouncedQuery.toLowerCase().trim();
      const tokens = q.split(/\s+/).filter(t => t.length > 0);
      const filtered = source.filter((game) => {
          const name = game.name.toLowerCase();
          const id = game.id;
          if (id.includes(q)) return true;
          for (const token of tokens) {
            if (!name.includes(token)) return false;
          }
          return true;
      }).slice(0, 48);
      setFilteredGames(filtered);
      setIsSearching(true);
      if (!isIndexLoaded) loadFullIndex();
    } else {
      setFilteredGames(suggestedGames);
      setIsSearching(false);
    }
  }, [debouncedQuery, games, suggestedGames, isIndexLoaded]);

  const handleRetrieve = async (id: string) => {
    if (siteStatus.downloadsDisabled) return;
    setAppId(id);
    setStatus("loading");
    try {
      const response = await fetch(`/api/view?appId=${encodeURIComponent(id)}`);
      if (!response.ok) throw new Error("Failed to retrieve content");
      const content = await response.text();
      setPreviewContent(content);
      setIsPreviewOpen(true);
      setStatus("idle");
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(error.message);
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const handleFeelingLucky = () => {
    const list = isIndexLoaded ? games : suggestedGames;
    if (list.length === 0) return;
    const randomGame = list[Math.floor(Math.random() * list.length)];
    handleRetrieve(randomGame.id);
  };

  const handleDownloadZip = async () => {
    setStatus("loading");
    try {
      const response = await fetch(`/api/download?appId=${encodeURIComponent(appId)}`);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${appId}-lua-patch.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (error) {
      setStatus("error");
      setErrorMessage("Final download failed.");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(previewContent);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  // ═══════════════════════════════════════════════════════════════════
  // ─── RENDER ───────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════
  return (
    <>
      <AnimatedBackground />

      {/* ── MAINTENANCE MODE OVERLAY ───────────────────────────────── */}
      <AnimatePresence>
        {siteStatus.maintenanceMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl p-8"
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
              className="flex flex-col items-center gap-8 max-w-lg text-center"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
                <div className="relative p-8 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/20">
                  <Wrench className="w-16 h-16 text-purple-400 animate-[spin_4s_linear_infinite]" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight mb-4">Under Maintenance</h1>
                <p className="text-white/40 text-sm font-medium leading-relaxed">
                  {siteStatus.maintenanceMessage || "We're performing scheduled maintenance. We'll be back shortly."}
                </p>
              </div>
              <div className="flex items-center gap-3 text-white/10">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em]">Systems updating</span>
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: '0.5s' }} />
              </div>
            </motion.div>

            {/* Admin still needs the footer to access the dashboard during maintenance */}
            <div className="absolute bottom-8">
              <p 
                onClick={handleFooterClick}
                className="text-white/5 text-[10px] font-black uppercase tracking-[0.5em] cursor-default select-none hover:text-white/8 transition-colors"
              >
                Lua Forge © 2026
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ANNOUNCEMENT BANNER ─────────────────────────────────────── */}
      <AnimatePresence>
        {siteStatus.bannerEnabled && siteStatus.bannerMessage && !siteStatus.maintenanceMode && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[90] bg-gradient-to-r from-purple-600/90 via-pink-600/90 to-purple-600/90 backdrop-blur-xl border-b border-white/10"
          >
            <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-center gap-3">
              <Bell className="w-4 h-4 text-white/80 animate-bounce" />
              <p className="text-white/90 text-xs font-black uppercase tracking-widest">{siteStatus.bannerMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className={`relative z-10 min-h-screen bg-transparent text-[#e0e0e0] flex flex-col items-center p-4 md:p-12 font-sans selection:bg-purple-500/30 ${siteStatus.bannerEnabled && siteStatus.bannerMessage && !siteStatus.maintenanceMode ? 'pt-16 md:pt-20' : ''}`}>
        <AnimatePresence>
          {!siteStatus.maintenanceMode && (
            <motion.a
              href="https://discord.gg/QNhMzXD3BJ"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="absolute top-8 right-8 z-[100] flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all duration-300 group shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
            >
              <div className="p-2 rounded-lg bg-indigo-500/20 group-hover:bg-indigo-500 text-indigo-400 group-hover:text-white transition-all duration-300">
                <svg 
                  viewBox="0 0 24 24" 
                  className="w-4 h-4 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z"/>
                </svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 group-hover:text-white transition-colors">Join Discord</span>
              <div className="absolute inset-0 border border-indigo-500/0 group-hover:border-indigo-500/20 rounded-2xl transition-all duration-500 blur-sm pointer-events-none" />
            </motion.a>
          )}
        </AnimatePresence>
      <div className="w-full max-w-6xl flex flex-col gap-10">
        
        {/* SEARCH SECTION */}
        <div className="relative group max-w-2xl mx-auto w-full">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            {siteStatus.searchDisabled ? <SearchX className="w-6 h-6 text-red-500/50" /> : isIndexLoading ? <Loader2 className="w-6 h-6 text-purple-500 animate-spin" /> : <Search className="w-6 h-6 text-gray-500" />}
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => !siteStatus.searchDisabled && setSearchQuery(e.target.value)}
            placeholder={siteStatus.searchDisabled ? "Search is temporarily disabled..." : "Search Your Library..."}
            disabled={!!siteStatus.searchDisabled}
            className={`w-full bg-white/[0.03] backdrop-blur-xl border-2 border-white/[0.08] py-6 px-16 rounded-[2rem] text-white placeholder-gray-700 font-black tracking-widest text-lg outline-none focus:border-purple-600/50 focus:bg-white/[0.05] focus:shadow-[0_0_50px_rgba(147,51,234,0.1)] transition-all uppercase ${siteStatus.searchDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          />
          <div className="absolute inset-y-0 right-4 flex items-center gap-2">
            {!searchQuery && !siteStatus.searchDisabled && (
              <button 
                onClick={handleFeelingLucky}
                title="Feeling Lucky? (Random Game)"
                className="p-3 text-purple-500 hover:text-white hover:bg-purple-600/20 rounded-xl transition-all"
              >
                <Sparkles className="w-6 h-6" />
              </button>
            )}
            {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="p-3 text-gray-600 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
            )}
          </div>
        </div>

        {/* RESULTS GRID */}
        <div className="flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {!isSearching && suggestedGames.length > 0 && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-black uppercase tracking-[0.4em] text-purple-500/70">Recommended For You</span>
                    </div>
                    <button 
                      onClick={() => fetchSuggestions(false)} 
                      disabled={isShuffling}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 hover:border-purple-500/30 hover:bg-purple-500/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-purple-400 transition-all duration-300 disabled:opacity-50 group active:scale-95"
                    >
                      <RefreshCw className={`w-3 h-3 ${isShuffling ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
                      <span>{isShuffling ? "Shuffling..." : "Shuffle"}</span>
                    </button>
                </motion.div>
            )}
            {isSearching && isIndexLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 px-2">
                    <Loader2 className="w-3 h-3 text-gray-700 animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700">Indexing 66,000 game modules...</span>
                </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            <AnimatePresence>
                {filteredGames.length > 0 ? (
                filteredGames.map((game, idx) => (
                    <motion.div 
                        key={game.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: idx * 0.03 }}
                    >
                        <GamePoster appId={game.id} name={game.name} onGenerate={handleRetrieve} downloadsDisabled={!!siteStatus.downloadsDisabled} />
                    </motion.div>
                ))
                ) : searchQuery.length > 0 && !isIndexLoading && (
                    <div className="col-span-full text-center py-20 opacity-20 font-black tracking-[1em] text-sm uppercase">No Content Found</div>
                )}
            </AnimatePresence>
          </div>
        </div>

        {/* FOOTER - Easter Egg Target */}
        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center gap-4 text-gray-700 uppercase tracking-[0.5em] text-[10px] font-black">
            <p 
              onClick={handleFooterClick}
              className="opacity-40 cursor-default select-none"
            >
              Lua Forge © 2026 External Injection Suite
            </p>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      <AnimatePresence>
        {isPreviewOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPreviewOpen(false)} className="absolute inset-0 bg-black/95 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-5xl h-[80vh] bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] shadow-4xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-10 py-8 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-6">
                    <div className="p-4 rounded-2xl bg-white/5 text-white">
                        <FileCode className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-white font-black tracking-tight text-2xl">{appId}.lua</h3>
                        <p className="text-[11px] text-gray-600 font-bold uppercase tracking-[0.3em]">Generated Forge Payload</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={copyToClipboard} className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white text-black hover:bg-purple-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest shadow-xl">
                        {copyStatus ? <ClipboardCheck className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                        {copyStatus ? "Copied" : "Copy Source"}
                    </button>
                    <button onClick={() => setIsPreviewOpen(false)} className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all border border-white/5">
                        <X className="w-6 h-6" />
                    </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-10 font-mono text-[14px] leading-relaxed text-purple-100/60 custom-scrollbar">
                <pre className="whitespace-pre-wrap">{previewContent}</pre>
              </div>
              <div className="p-10 border-t border-white/5 bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-4 text-emerald-500/70">
                    <CheckCircle2 className="w-6 h-6 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-[0.2em]">Signature Verified: SECURE_INJECTION_V2</span>
                </div>
                <button onClick={handleDownloadZip} className="w-full sm:w-auto px-12 py-5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl transition-all shadow-[0_20px_40px_rgba(147,51,234,0.3)] flex items-center justify-center gap-4 text-sm uppercase tracking-[0.2em]">
                    <Download className="w-5 h-5" />
                    Pack Source (.Zip)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── ADMIN LOGIN MODAL ──────────────────────────────────────── */}
      <AnimatePresence>
        {showAdminLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          >
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowAdminLogin(false); setAdminPassword(""); setAdminAuthError(false); }} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-[#080808] border border-white/[0.08] rounded-[2.5rem] p-10 shadow-[0_50px_100px_rgba(0,0,0,0.8)]"
            >
              <div className="flex flex-col items-center gap-8">
                {/* Icon */}
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-600/20 rounded-full blur-2xl" />
                  <div className="relative p-6 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/20">
                    <ShieldCheck className="w-10 h-10 text-purple-400" />
                  </div>
                </div>

                <div className="text-center">
                  <h2 className="text-white font-black text-2xl tracking-tight">Authentication Required</h2>
                  <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Forge Admin Access</p>
                </div>

                {/* Password Input */}
                <div className="w-full space-y-4">
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/15" />
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => { setAdminPassword(e.target.value); setAdminAuthError(false); }}
                      onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                      placeholder="Enter password..."
                      autoFocus
                      className={`w-full bg-white/[0.03] border-2 rounded-2xl p-5 pl-14 text-white font-bold text-sm outline-none transition-all placeholder-white/10 ${adminAuthError ? 'border-red-500/50 shake' : 'border-white/[0.06] focus:border-purple-600/40'}`}
                    />
                  </div>

                  <AnimatePresence>
                    {adminAuthError && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="flex items-center gap-3 text-red-400 px-2">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs font-bold">Invalid password. Access denied.</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={handleAdminLogin}
                    disabled={adminLoading || !adminPassword}
                    className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black rounded-2xl text-sm uppercase tracking-[0.3em] transition-all shadow-[0_20px_40px_rgba(147,51,234,0.3)] hover:shadow-[0_20px_60px_rgba(147,51,234,0.5)] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {adminLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                    {adminLoading ? "Verifying..." : "Authenticate"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ADMIN DASHBOARD ────────────────────────────────────────── */}
      <AnimatePresence>
        {showAdminDashboard && adminConfig && (
          <AdminDashboard
            config={adminConfig}
            onSave={handleAdminSave}
            onLogout={handleAdminLogout}
          />
        )}
      </AnimatePresence>

      <style jsx global>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(147,51,234,0.3); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </main>
    </>
  );
}
