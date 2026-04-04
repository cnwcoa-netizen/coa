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
  Download,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { CoachData } from './types';
import { SearchableSelect } from './components/SearchableSelect';

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
  const [trainNumber, setTrainNumber] = useState('');
  const [rakeNumber, setRakeNumber] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterRly, setFilterRly] = useState('');
  const [filterSchShop, setFilterSchShop] = useState('');
  const [pohDateStart, setPohDateStart] = useState('');
  const [pohDateEnd, setPohDateEnd] = useState('');
  const [rdtDateStart, setRdtDateStart] = useState('');
  const [rdtDateEnd, setRdtDateEnd] = useState('');
  const [ssiDateStart, setSsiDateStart] = useState('');
  const [ssiDateEnd, setSsiDateEnd] = useState('');
  const [searchMode, setSearchMode] = useState<'coach' | 'rake'>('coach');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({ key: '', direction: null });
  const [tableFilters, setTableFilters] = useState<Record<string, string>>({});
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['coach_No', 'RLY', 'CLASS', 'STATUS', 'SCH_SHOP', 'POH_DT', 'RDT', 'SSI_STN']);
  const [customFilters, setCustomFilters] = useState<Record<string, string>>({});

  const getFieldValue = (row: any, field: string) => {
    if (!row) return null;
    // Try exact match first
    if (row[field] !== undefined) return row[field];
    // Try case-insensitive match
    const key = Object.keys(row).find(k => k.toLowerCase() === field.toLowerCase());
    if (key) return row[key];
    // Try matching without underscores/spaces
    const normalizedField = field.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fuzzyKey = Object.keys(row).find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedField);
    if (fuzzyKey) return row[fuzzyKey];
    return null;
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (field: string, value: string) => {
    setTableFilters(prev => ({ ...prev, [field]: value }));
  };
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [trainSearchTerm, setTrainSearchTerm] = useState('');

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

  const uniqueTrainNumbers = useMemo(() => {
    if (data.length === 0) return [];
    const firstRow = data[0];
    const trainKey = Object.keys(firstRow).find(key => 
      key.toLowerCase().replace(/[^a-z]/g, '') === 'trainno'
    ) || Object.keys(firstRow).find(key => key.toLowerCase().includes('train')) || 'Train_No';
    
    const trains = data.map(row => row[trainKey]?.toString().trim()).filter(Boolean);
    return Array.from(new Set(trains)).sort();
  }, [data]);

  const uniqueRakeNumbers = useMemo(() => {
    if (data.length === 0) return [];
    const firstRow = data[0];
    const rakeKey = Object.keys(firstRow).find(key => 
      key.toLowerCase().replace(/[^a-z]/g, '') === 'rakeno'
    ) || Object.keys(firstRow).find(key => key.toLowerCase().includes('rake')) || 'RAKE_NO';
    
    const rakes = data.map(row => row[rakeKey]?.toString().trim()).filter(Boolean);
    return Array.from(new Set(rakes)).sort();
  }, [data]);

  const searchResults = useMemo(() => {
    if (data.length === 0) return null;

    if (searchMode === 'coach') {
      if (!searchQuery) return null;
      const result = data.find(row => {
        return Object.values(row).some(val => 
          val?.toString().toLowerCase() === searchQuery.toLowerCase()
        );
      });
      return result ? [result] : [];
    } else {
      if (!trainNumber && !rakeNumber) return null;

      const firstRow = data[0];
      const trainKey = Object.keys(firstRow).find(key => 
        key.toLowerCase().replace(/[^a-z]/g, '') === 'trainno'
      ) || Object.keys(firstRow).find(key => key.toLowerCase().includes('train')) || 'Train_No';
      const rakeKey = Object.keys(firstRow).find(key => 
        key.toLowerCase().replace(/[^a-z]/g, '') === 'rakeno'
      ) || Object.keys(firstRow).find(key => key.toLowerCase().includes('rake')) || 'RAKE_NO';

      return data.filter(row => {
        const tMatch = !trainNumber || row[trainKey]?.toString().toLowerCase().includes(trainNumber.toLowerCase());
        const rMatch = !rakeNumber || row[rakeKey]?.toString().toLowerCase().includes(rakeNumber.toLowerCase());
        return tMatch && rMatch;
      });
    }
  }, [searchQuery, trainNumber, rakeNumber, searchMode, data]);

  const rakeFilteredData = useMemo(() => {
    if (data.length === 0) return [];
    const firstRow = data[0];
    const trainKey = Object.keys(firstRow).find(key => 
      key.toLowerCase().replace(/[^a-z]/g, '') === 'trainno'
    ) || Object.keys(firstRow).find(key => key.toLowerCase().includes('train')) || 'Train_No';
    const rakeKey = Object.keys(firstRow).find(key => 
      key.toLowerCase().replace(/[^a-z]/g, '') === 'rakeno'
    ) || Object.keys(firstRow).find(key => key.toLowerCase().includes('rake')) || 'RAKE_NO';

    return data.filter(row => {
      const tMatch = !trainNumber || row[trainKey]?.toString().toLowerCase().includes(trainNumber.toLowerCase());
      const rMatch = !rakeNumber || row[rakeKey]?.toString().toLowerCase().includes(rakeNumber.toLowerCase());
      return tMatch && rMatch;
    });
  }, [data, trainNumber, rakeNumber]);

  const finalFilteredData = useMemo(() => {
    let filtered = [...rakeFilteredData];

    // Apply in-table filters
    Object.entries(tableFilters).forEach(([field, filterValue]) => {
      const fVal = filterValue as string;
      if (fVal) {
        filtered = filtered.filter(row => {
          const val = getFieldValue(row, field);
          const strVal = val !== null && val !== undefined ? String(val) : '';
          return strVal.toLowerCase().includes(fVal.toLowerCase());
        });
      }
    });

    // Apply sorting
    if (sortConfig.key && sortConfig.direction) {
      filtered.sort((a, b) => {
        const aVal = (getFieldValue(a, sortConfig.key) || '').toString();
        const bVal = (getFieldValue(b, sortConfig.key) || '').toString();
        
        // Handle numeric sorting if both are numbers
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [rakeFilteredData, sortConfig, tableFilters]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSearchModal(false);
  };

  const allColumns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  const customFilteredData = useMemo(() => {
    let filtered = [...data];
    Object.entries(customFilters).forEach(([key, val]) => {
      if (val) {
        filtered = filtered.filter(row => {
          const fieldVal = getFieldValue(row, key);
          return fieldVal?.toString().toLowerCase().includes((val as string).toLowerCase());
        });
      }
    });
    return filtered;
  }, [data, customFilters]);

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
            { id: 'rake', icon: ClipboardList },
            { id: 'rtd', icon: History },
            { id: 'custom', icon: Settings },
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

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
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
                  ) : searchResults && searchResults.length > 0 ? (
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
                              <p className="text-blue-600 font-black text-xs uppercase tracking-[0.2em] mb-1">
                                {searchMode === 'coach' ? 'Active Inventory Record' : 'Train Inventory Report'}
                              </p>
                              <h3 className="text-4xl font-black text-slate-900 tracking-tight">
                                {searchMode === 'coach' ? `Coach #${searchQuery}` : `Train ${trainNumber || 'N/A'}`}
                              </h3>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                              <span className="text-blue-600 font-black text-sm">{searchResults.length} Coaches Found</span>
                            </div>
                            <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                              <Download size={16} /> Export PDF
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Summary Stats for Train Search */}
                      {searchMode === 'rake' && searchResults.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Coaches</p>
                            <p className="text-2xl font-black text-slate-900">{searchResults.length}</p>
                          </div>
                          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unique Classes</p>
                            <p className="text-2xl font-black text-blue-600">
                              {new Set(searchResults.map(r => r['CLASS'])).size}
                            </p>
                          </div>
                          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Railway Zones</p>
                            <p className="text-2xl font-black text-purple-600">
                              {new Set(searchResults.map(r => r['RLY'])).size}
                            </p>
                          </div>
                          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Depot Source</p>
                            <p className="text-2xl font-black text-orange-600">CCT</p>
                          </div>
                        </div>
                      )}

                      {/* Detailed Report Table */}
                      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Inventory Details Report</h4>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50">
                                {visibleColumns.map(field => (
                                  <th key={field} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    {field.replace('_', ' ')}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {searchResults.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                                  {visibleColumns.map(field => (
                                    <td key={field} className="px-6 py-4 text-sm font-bold text-slate-700 whitespace-nowrap">
                                      {getFieldValue(row, field) || <span className="text-slate-300 font-normal italic text-xs">N/A</span>}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Single Coach Detailed Grid (Only if searching by coach) */}
                      {searchMode === 'coach' && searchResults.length === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(searchResults[0]).filter(([key]) => !visibleColumns.some(f => f.toLowerCase() === key.toLowerCase())).map(([key, value], idx) => (
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
                      )}
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
                      <span className="text-sm font-bold">Live Data</span>
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
            </motion.div>
          ) : activeTab === 'rake' ? (
            <motion.div
              key="rake"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Filter by Train & Rake</h2>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">
                    {finalFilteredData.length} Coaches matching filters
                  </p>
                </div>
              </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SearchableSelect
                    label="Train Number"
                    options={uniqueTrainNumbers}
                    value={trainNumber}
                    onChange={setTrainNumber}
                    placeholder="All Trains"
                    icon={TrainFront}
                  />
                  <SearchableSelect
                    label="Rake Number"
                    options={uniqueRakeNumbers}
                    value={rakeNumber}
                    onChange={setRakeNumber}
                    placeholder="All Rakes"
                    icon={ClipboardList}
                  />
                </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Filtered Results</h4>
                  <button 
                    onClick={() => {
                      setTrainNumber('');
                      setRakeNumber('');
                      setSortConfig({ key: '', direction: null });
                      setTableFilters({});
                    }}
                    className="text-xs font-black text-blue-600 uppercase tracking-widest hover:text-blue-700"
                  >
                    Clear All Filters
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        {visibleColumns.map(field => (
                          <th 
                            key={field} 
                            className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => handleSort(field)}
                          >
                            <div className="flex items-center gap-2">
                              {field.replace('_', ' ')}
                              {sortConfig.key === field ? (
                                sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-blue-600" /> : <ArrowDown size={12} className="text-blue-600" />
                              ) : (
                                <ArrowUpDown size={12} className="opacity-20 group-hover:opacity-100" />
                              )}
                            </div>
                          </th>
                        ))}
                        <th 
                          className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
                          onClick={() => handleSort('RAKE_NO')}
                        >
                          <div className="flex items-center gap-2">
                            Rake No
                            {sortConfig.key === 'RAKE_NO' ? (
                              sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-blue-600" /> : <ArrowDown size={12} className="text-blue-600" />
                            ) : (
                              <ArrowUpDown size={12} className="opacity-20 group-hover:opacity-100" />
                            )}
                          </div>
                        </th>
                      </tr>
                      {/* In-table Filter Row */}
                      <tr className="bg-white">
                        {visibleColumns.map(field => (
                          <th key={`filter-${field}`} className="px-4 py-2 border-b border-slate-100">
                            <div className="relative group">
                              <Filter size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                              <input
                                type="text"
                                placeholder={`Filter...`}
                                value={tableFilters[field] || ''}
                                onChange={(e) => handleFilterChange(field, e.target.value)}
                                className="w-full pl-7 pr-3 py-1.5 text-[10px] font-bold bg-slate-50 border-none rounded-lg focus:ring-1 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-300"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </th>
                        ))}
                        <th className="px-4 py-2 border-b border-slate-100">
                          <div className="relative group">
                            <Filter size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                            <input
                              type="text"
                              placeholder={`Filter...`}
                              value={tableFilters['RAKE_NO'] || ''}
                              onChange={(e) => handleFilterChange('RAKE_NO', e.target.value)}
                              className="w-full pl-7 pr-3 py-1.5 text-[10px] font-bold bg-slate-50 border-none rounded-lg focus:ring-1 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-slate-300"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {finalFilteredData.length > 0 ? (
                        finalFilteredData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                            {visibleColumns.map(field => (
                              <td key={field} className="px-6 py-4 text-sm font-bold text-slate-700 whitespace-nowrap">
                                {getFieldValue(row, field) || <span className="text-slate-300 font-normal italic text-xs">N/A</span>}
                              </td>
                            ))}
                            <td className="px-6 py-4 text-sm font-black text-blue-600 whitespace-nowrap">
                              {getFieldValue(row, 'RAKE_NO') || <span className="text-slate-300 font-normal italic text-xs">N/A</span>}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={visibleColumns.length + 1} className="p-20 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                              <Search size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">No Coaches Found</h3>
                            <p className="text-slate-400 text-sm">Try adjusting your filters.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'rtd' ? (
            <motion.div
              key="rtd"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">RTD Report</h2>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">
                    Ready to Depart / Return to Depot Analysis
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                    <Download size={16} />
                    Export RTD
                  </button>
                </div>
              </div>

              {/* RTD Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Total Coaches', value: data.length, icon: TrainFront, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Ready Coaches', value: data.filter(c => getFieldValue(c, 'STATUS')?.toString().toLowerCase() === 'ready').length, icon: ClipboardList, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Depot Coaches', value: data.filter(c => getFieldValue(c, 'STATUS')?.toString().toLowerCase() === 'depot').length, icon: MapPin, color: 'text-orange-600', bg: 'bg-orange-50' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center", stat.bg)}>
                      <stat.icon size={28} className={stat.color} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                      <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">RTD Status Table</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        {['coach_No', 'RLY', 'CLASS', 'STATUS', 'SSI_STN'].map(field => (
                          <th key={field} className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                            {field.replace('_', ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.slice(0, 20).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-5 text-sm font-black text-slate-900">{getFieldValue(row, 'coach_No')}</td>
                          <td className="px-8 py-5 text-sm font-bold text-slate-600">{getFieldValue(row, 'RLY')}</td>
                          <td className="px-8 py-5 text-sm font-bold text-slate-600">{getFieldValue(row, 'CLASS')}</td>
                          <td className="px-8 py-5">
                            <span className={cn(
                              "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                              getFieldValue(row, 'STATUS')?.toString().toLowerCase() === 'ready' 
                                ? "bg-green-100 text-green-700" 
                                : "bg-slate-100 text-slate-600"
                            )}>
                              {getFieldValue(row, 'STATUS') || 'N/A'}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-sm font-bold text-slate-600">{getFieldValue(row, 'SSI_STN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'custom' ? (
            <motion.div
              key="custom"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 pb-20"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Custom Report Builder</h2>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">
                    Design your own inventory report
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      setVisibleColumns(['coach_No', 'RLY', 'CLASS', 'STATUS', 'SCH_SHOP', 'POH_DT', 'RDT', 'SSI_STN']);
                      setCustomFilters({});
                    }}
                    className="px-6 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
                  >
                    Reset Builder
                  </button>
                  <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-2xl text-xs font-black uppercase tracking-widest text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                    <Download size={16} />
                    Export Custom Report
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Column Selection */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm h-fit">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <LayoutDashboard size={16} className="text-blue-600" />
                    Select Columns
                  </h4>
                  <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {allColumns.map(col => (
                      <label key={col} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-all group">
                        <input
                          type="checkbox"
                          checked={visibleColumns.includes(col)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setVisibleColumns(prev => [...prev, col]);
                            } else {
                              setVisibleColumns(prev => prev.filter(c => c !== col));
                            }
                          }}
                          className="w-5 h-5 rounded-lg border-2 border-slate-200 text-blue-600 focus:ring-blue-500/20 transition-all"
                        />
                        <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                          {col.replace(/_/g, ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Filter Builder */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Filter size={16} className="text-blue-600" />
                      Custom Filters
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['RDT', 'CLASS'].map(col => (
                        <div key={`filter-${col}`} className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{col.replace(/_/g, ' ')}</label>
                          <div className="relative">
                            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input
                              type="text"
                              placeholder={`Filter ${col}...`}
                              value={customFilters[col] || ''}
                              onChange={(e) => setCustomFilters(prev => ({ ...prev, [col]: e.target.value }))}
                              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom Report Table */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Preview Report</h4>
                      <span className="text-xs font-bold text-slate-400">{customFilteredData.length} Records Found</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50">
                            {visibleColumns.map(col => (
                              <th key={col} className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 whitespace-nowrap">
                                {col.replace(/_/g, ' ')}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {customFilteredData.slice(0, 50).map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                              {visibleColumns.map(col => (
                                <td key={`${idx}-${col}`} className="px-6 py-5 text-sm font-bold text-slate-700 whitespace-nowrap">
                                  {getFieldValue(row, col) || <span className="text-slate-300 font-normal italic text-xs">N/A</span>}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="other"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-[2.5rem] p-20 text-center border border-slate-100 shadow-xl"
            >
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <LayoutDashboard size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Coming Soon</h3>
              <p className="text-slate-500 font-medium">The {activeTab} module is currently under development.</p>
            </motion.div>
          )}
        </AnimatePresence>
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
                      <h3 className="text-xl font-black text-slate-900">Inventory Search</h3>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Kakinada Depot Retrieval</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowSearchModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Search Mode Toggle */}
                <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
                  <button
                    onClick={() => setSearchMode('coach')}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                      searchMode === 'coach' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Coach No
                  </button>
                  <button
                    onClick={() => setSearchMode('rake')}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                      searchMode === 'rake' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    Train No
                  </button>
                </div>

                <form onSubmit={handleSearchSubmit} className="space-y-6">
                  {searchMode === 'coach' ? (
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
                  ) : (
                    <div className="space-y-6">
                      <SearchableSelect
                        label="Train Number"
                        options={uniqueTrainNumbers}
                        value={trainNumber}
                        onChange={setTrainNumber}
                        placeholder="Select Train..."
                        icon={TrainFront}
                      />
                      <SearchableSelect
                        label="Rake Number"
                        options={uniqueRakeNumbers}
                        value={rakeNumber}
                        onChange={setRakeNumber}
                        placeholder="Select Rake..."
                        icon={ClipboardList}
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setTrainNumber('');
                        setRakeNumber('');
                        setSearchQuery('');
                      }}
                      className="px-6 py-5 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all"
                    >
                      {searchMode === 'coach' ? 'Retrieve Coach' : 'Generate Train Report'}
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
        {[
          { id: 'dashboard', icon: LayoutDashboard },
          { id: 'rake', icon: ClipboardList },
          { id: 'rtd', icon: History },
          { id: 'custom', icon: Settings },
          { id: 'search', icon: Search },
        ].map((item) => (
          <button 
            key={item.id} 
            onClick={() => {
              if (item.id === 'search') {
                setShowSearchModal(true);
              } else {
                setActiveTab(item.id);
              }
            }}
            className={cn(
              "p-3 rounded-2xl transition-all",
              activeTab === item.id ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-400"
            )}
          >
            <item.icon size={24} />
          </button>
        ))}
      </nav>
    </div>
  );
}
