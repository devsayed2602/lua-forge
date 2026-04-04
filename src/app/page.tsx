"use client";

import { useState, useEffect, useRef } from "react";
import { Download, Gamepad2, Loader2, FileArchive, CheckCircle2, AlertCircle, Search, X, Eye, FileCode, Clipboard, ClipboardCheck, ChevronDown, Database, MessageSquare, List, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedBackground from "./AnimatedBackground";

interface Game {
  id: string;
  name: string;
}

// Sub-component for Game Poster with Fallback handling
const GamePoster = ({ appId, name, onGenerate }: { appId: string; name: string; onGenerate: (id: string) => void }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Use Steam's standard library vertical poster CDN (600x900 instead of retina _2x)
  const imageUrl = `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appId}/library_600x900.jpg`;

  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#0d0d0d] border border-white/5 shadow-2xl group cursor-pointer"
    >
      {/* Artwork */}
      {!error ? (
        <>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#111111]">
              <Loader2 className="w-6 h-6 text-purple-600 animate-spin opacity-20" />
            </div>
          )}
          <img 
            src={imageUrl} 
            alt={name}
            loading="lazy"
            onLoad={() => setLoading(false)}
            onError={() => { setError(true); setLoading(false); }}
            className={`w-full h-full object-cover transition-all duration-700 pointer-events-none ${loading ? 'opacity-0' : 'opacity-100 group-hover:scale-110 group-hover:rotate-1'}`}
          />
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[#111111]">
            <Gamepad2 className="w-12 h-12 text-white/5" />
            <span className="text-[10px] text-white/10 font-bold uppercase tracking-widest text-center px-4">{name}</span>
        </div>
      )}

      {/* Info & Action Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <h3 className="text-white font-black text-sm line-clamp-2 leading-tight mb-1 drop-shadow-lg">{name}</h3>
            <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded-sm uppercase tracking-tighter">ID: {appId}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); onGenerate(appId); }}
                  className="bg-white text-black p-2 rounded-lg hover:bg-purple-500 hover:text-white transition-all shadow-xl"
                >
                    <Download className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
      </div>

      {/* Decorative Border Glow on Hover */}
      <div className="absolute inset-0 border-2 border-purple-500/0 group-hover:border-purple-500/30 rounded-2xl transition-all duration-500 pointer-events-none" />
    </motion.div>
  );
};

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

  // Preview Modal States
  const [previewContent, setPreviewContent] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState(false);

  useEffect(() => {
    fetch("/api/suggestions")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSuggestedGames(data);
          if (searchQuery === "") {
            setFilteredGames(data);
          }
        }
      })
      .catch((err) => console.error("Failed to load suggestions:", err));
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
    } catch (err) {
      console.error("Failed to load full index:", err);
    } finally {
      setIsIndexLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const source = isIndexLoaded ? games : suggestedGames;
      const q = searchQuery.toLowerCase().trim();
      const tokens = q.split(/\s+/); // Split by whitespace into keywords
      
      const filtered = source.filter((game) => {
          const name = game.name.toLowerCase();
          const id = game.id;
          
          // ID match (exact or substring)
          if (id.includes(q)) return true;
          
          // Name match: ALL tokens must be present in the name (AND logic)
          return tokens.every(token => name.includes(token));
      }).slice(0, 48); // Show up to 48 matching results
      
      setFilteredGames(filtered);
      setIsSearching(true);
      if (!isIndexLoaded) loadFullIndex();
    } else {
      setFilteredGames(suggestedGames);
      setIsSearching(false);
    }
  }, [searchQuery, games, suggestedGames, isIndexLoaded]);

  const handleRetrieve = async (id: string) => {
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

  return (
    <>
      <AnimatedBackground />
      <main className="relative z-10 min-h-screen bg-transparent text-[#e0e0e0] flex flex-col items-center p-4 md:p-12 font-sans selection:bg-purple-500/30">
      <div className="w-full max-w-6xl flex flex-col gap-10">
        
        {/* SEARCH SECTION */}
        <div className="relative group max-w-2xl mx-auto w-full">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            {isIndexLoading ? <Loader2 className="w-6 h-6 text-purple-500 animate-spin" /> : <Search className="w-6 h-6 text-gray-500" />}
          </div>
          <input
            type="text"
            onFocus={loadFullIndex}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Your Library..."
            className="w-full bg-white/[0.03] backdrop-blur-xl border-2 border-white/[0.08] py-6 px-16 rounded-[2rem] text-white placeholder-gray-700 font-black tracking-widest text-lg outline-none focus:border-purple-600/50 focus:bg-white/[0.05] focus:shadow-[0_0_50px_rgba(147,51,234,0.1)] transition-all uppercase"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute inset-y-0 right-6 flex items-center text-gray-600 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* RESULTS GRID */}
        <div className="flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {!isSearching && suggestedGames.length > 0 && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3 px-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-black uppercase tracking-[0.4em] text-purple-500/70">Recommended For You</span>
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
                        <GamePoster appId={game.id} name={game.name} onGenerate={handleRetrieve} />
                    </motion.div>
                ))
                ) : searchQuery.length > 0 && !isIndexLoading && (
                    <div className="col-span-full text-center py-20 opacity-20 font-black tracking-[1em] text-sm uppercase">No Content Found</div>
                )}
            </AnimatePresence>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center gap-4 text-gray-700 uppercase tracking-[0.5em] text-[10px] font-black">
            <p className="opacity-40">Lua Forge © 2026 External Injection Suite</p>
        </div>
      </div>

      {/* MODAL */}
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

      <style jsx global>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(147,51,234,0.3); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
      `}</style>
    </main>
    </>
  );
}
