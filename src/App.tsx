/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { 
  Search, 
  Loader2, 
  Database, 
  AlertCircle, 
  ExternalLink, 
  ChevronRight, 
  Info, 
  TrainFront, 
  X, 
  ArrowRight,
  LayoutDashboard,
  ClipboardList,
  Calendar,
  MapPin,
  Settings,
  History,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { CoachData } from './types';

const DEFAULT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1U_IKmh3FaTqbZCeBjfy0hG9izELC_2WHW7bVIG21JtQ/export?format=csv";
const RAILWAY_LOGO_URL = "https://upload.wikimedia.org/wikipedia/en/thumb/4/41/Indian_Railways_Logo.svg/1200px-Indian_Railways_Logo.svg.png";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    return localStorage.getItem('coach_sheet_url') || DEFAULT_SHEET_URL;
  });
  const [data, setData] = useState<CoachData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Splash screen timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const fetchData = async (url: string) => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      let fetchUrl = url;
      if (url.includes('docs.google.com/spreadsheets/d/') && !url.includes('export?format=csv')) {
        const match = url.match(/\/d\/([^\/]+)/);
        if (match && match[1]) {
          fetchUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
        }
      }
      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error('Failed to fetch data from Google Sheet');
      const csvText = await response.text();
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setData(results.data as CoachData[]);
          setLoading(false);
          localStorage.setItem('coach_sheet_url', url);
        },
        error: (err: Error) => {
          setError(`Parsing error: ${err.message}`);
          setLoading(false);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(sheetUrl);
  }, []);

  const searchResult = useMemo(() => {
    if (!searchQuery || data.length === 0) return null;
    return data.find(row => {
      return Object.values(row).some(val => 
        val?.toString().toLowerCase() === searchQuery.toLowerCase()
      );
    }) || null;
  }, [searchQuery, data]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSearchModal(false);
  };

  // Splash Screen Component
  if (showSplash) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-800 to-blue-900 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative mb-8"
        >
          <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full scale-150 animate-pulse" />
          <img 
            src={RAILWAY_LOGO_URL} 
            alt="Indian Railways" 
            className="w-40 h-40 object-contain relative z-10 drop-shadow-2xl"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-center px-6"
        >
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2 drop-shadow-lg">
            KAKINADA COACHING DEPOT
          </h1>
          <div className="h-1.5 w-32 bg-yellow-400 mx-auto rounded-full mb-4" />
          <p className="text-blue-100 font-bold tracking-[0.2em] text-sm uppercase">
            Indian Railways • South Central Railway
          </p>
        </motion.div>

        <div className="absolute bottom-12 flex flex-col items-center">
          <div className="flex gap-1 mb-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                className="w-2 h-2 bg-yellow-400 rounded-full"
              />
            ))}
          </div>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Initialising Inventory System</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      {/* Sidebar / Navigation */}
      <nav className="fixed left-0 top-0 bottom-0 w-20 bg-white border-r border-slate-200 hidden md:flex flex-col items-center py-8 z-30">
        <div className="mb-12">
          <img src={RAILWAY_LOGO_URL} className="w-10 h-10 object-contain" alt="IR" referrerPolicy="no-referrer" />
        </div>
        <div className="flex-1 flex flex-col gap-8">
          {[
            { id: 'dashboard', icon: LayoutDashboard },
            { id: 'inventory', icon: ClipboardList },
            { id: 'history', icon: History },
            { id: 'settings', icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "p-3 rounded-2xl transition-all duration-300",
                activeTab === item.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                  : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
              )}
            >
              <item.icon size={24} />
            </button>
          ))}
        </div>
        <button className="p-3 text-slate-400 hover:text-red-600">
          <X size={24} />
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-20 p-4 md:p-10">
        {/* Top Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Coach Inventory</h2>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <MapPin size={14} className="text-blue-600" />
              Kakinada Coaching Depot (CCT)
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowSearchModal(true)}
              className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center gap-3 text-slate-500 hover:border-blue-300 transition-all group"
            >
              <Search size={18} className="group-hover:text-blue-600" />
              <span className="font-semibold">Search Coach No...</span>
              <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border bg-slate-50 px-1.5 font-mono text-[10px] font-medium text-slate-400 opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
            <button 
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-500 hover:text-blue-600 transition-all"
            >
              <Database size={20} />
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Display Area */}
          <div className="lg:col-span-2 space-y-8">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-[2.5rem] p-12 flex flex-col items-center justify-center border border-slate-100 shadow-xl shadow-slate-200/50 min-h-[500px]"
                >
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-blue-100 blur-3xl rounded-full scale-150 animate-pulse" />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="relative z-10"
                    >
                      <TrainFront size={64} className="text-blue-600" />
                    </motion.div>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="absolute -bottom-2 -right-2 bg-yellow-400 w-6 h-6 rounded-full border-4 border-white"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Syncing Inventory</h3>
                  <p className="text-slate-400 text-sm font-medium">Accessing National Railway Database...</p>
                </motion.div>
              ) : searchResult ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Result Header Card */}
                  <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                      <TrainFront size={200} />
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-200">
                          <TrainFront size={36} />
                        </div>
                        <div>
                          <p className="text-blue-600 font-black text-xs uppercase tracking-[0.2em] mb-1">Active Inventory Record</p>
                          <h3 className="text-4xl font-black text-slate-900 tracking-tight">Coach #{searchQuery}</h3>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                          <Download size={16} /> Export PDF
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(searchResult).map(([key, value], idx) => (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={key}
                        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">
                            {key}
                          </span>
                          <div className="w-2 h-2 bg-slate-100 rounded-full group-hover:bg-blue-100 transition-colors" />
                        </div>
                        <p className="text-xl font-bold text-slate-800 tracking-tight">
                          {value || <span className="text-slate-300 italic font-normal text-sm">Not Recorded</span>}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-[2.5rem] p-12 flex flex-col items-center justify-center border border-slate-100 shadow-xl shadow-slate-200/50 min-h-[500px] text-center"
                >
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200">
                    <Search size={48} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-3">Ready for Search</h3>
                  <p className="text-slate-500 max-w-sm mb-8 font-medium">
                    Please enter a valid coach number to retrieve the complete inventory profile from the Kakinada Coaching Depot database.
                  </p>
                  <button 
                    onClick={() => setShowSearchModal(true)}
                    className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-3"
                  >
                    Start Search <ArrowRight size={18} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar Info Panel */}
          <div className="space-y-8">
            {/* Depot Stats */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Database size={100} />
              </div>
              <h4 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-6">Depot Statistics</h4>
              <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold text-sm">Total Records</span>
                  <span className="text-2xl font-black">{data.length}</span>
                </div>
                <div className="h-px bg-white/10 w-full" />
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold text-sm">Last Updated</span>
                  <span className="text-sm font-bold">Today, 09:45 AM</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold text-sm">System Status</span>
                  <span className="flex items-center gap-2 text-xs font-black text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    OPERATIONAL
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'New Entry', icon: ClipboardList, color: 'bg-blue-50 text-blue-600' },
                  { label: 'Schedule', icon: Calendar, color: 'bg-purple-50 text-purple-600' },
                  { label: 'Reports', icon: Info, color: 'bg-orange-50 text-orange-600' },
                  { label: 'Export', icon: Download, color: 'bg-green-50 text-green-600' },
                ].map((action) => (
                  <button key={action.label} className="flex flex-col items-center gap-3 p-4 rounded-3xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", action.color)}>
                      <action.icon size={20} />
                    </div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Search Modal */}
      <AnimatePresence>
        {showSearchModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSearchModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                      <Search size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">Coach Search</h3>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Inventory Retrieval System</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowSearchModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSearchSubmit} className="space-y-6">
                  <div className="relative">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Enter Coach Number..."
                      className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl text-2xl font-black placeholder:text-slate-300 outline-none focus:border-blue-600 focus:bg-white transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                      <TrainFront size={32} className="text-slate-200" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button
                      type="submit"
                      className="flex-1 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all"
                    >
                      Retrieve Data
                    </button>
                  </div>
                </form>
              </div>
              
              <div className="bg-slate-50 p-6 border-t border-slate-100 flex items-center gap-3">
                <Info size={16} className="text-blue-600" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Search tip: Enter exact coach number for precise matching
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Config Panel (Drawer) */}
      <AnimatePresence>
        {isConfigOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfigOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-md h-full relative z-10 shadow-2xl p-10 flex flex-col"
            >
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-2xl font-black text-slate-900">System Config</h3>
                <button onClick={() => setIsConfigOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-8 flex-1">
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Database Source (CSV)</label>
                  <div className="space-y-3">
                    <input
                      type="text"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-600 transition-all"
                      value={sheetUrl}
                      onChange={(e) => setSheetUrl(e.target.value)}
                    />
                    <button 
                      onClick={() => fetchData(sheetUrl)}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
                    >
                      Update Database
                    </button>
                  </div>
                </div>

                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                  <h5 className="text-blue-700 font-black text-[10px] uppercase tracking-widest mb-2">Instructions</h5>
                  <p className="text-blue-600/80 text-xs leading-relaxed font-medium">
                    Ensure the Google Sheet is "Published to the web" as a CSV. Standard edit links will be automatically converted to export format.
                  </p>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">
                  Coach Inventory v2.4.0 • Enterprise Edition
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-between items-center z-30">
        {[LayoutDashboard, ClipboardList, Search, Settings].map((Icon, i) => (
          <button 
            key={i} 
            onClick={() => i === 2 ? setShowSearchModal(true) : null}
            className={cn(
              "p-3 rounded-2xl transition-all",
              i === 0 ? "bg-blue-600 text-white" : "text-slate-400"
            )}
          >
            <Icon size={24} />
          </button>
        ))}
      </nav>
    </div>
  );
}
