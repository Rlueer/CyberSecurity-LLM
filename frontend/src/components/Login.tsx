import React, { useState, useRef, useEffect } from 'react';

import { Shield, User, Building2, Info, ChevronDown, Search, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

const SECTOR_QUESTION_ID = 999;

const SECTORS = [
  "Small and Medium Enterprises (SMEs)",
  "Large Enterprises",
  "Finance and Insurance",
  "Healthcare and Pharmaceuticals",
  "Public Sector and Government",
  "Critical Infrastructure",
  "Energy and Utilities",
  "Transportation and Logistics",
  "Telecommunications",
  "Information Technology and Software",
  "Cloud and SaaS Providers",
  "Manufacturing and Industry",
  "Education and Research",
  "Retail and E-Commerce",
  "Construction and Real Estate",
  "Legal and Consulting Services",
  "Media and Entertainment",
  "Agriculture and Food",
  "Defense and Aerospace",
  "Non-Profit and NGOs"
];

interface LoginProps {
  onLogin: (username: string, sector: string, userId: string) => void;
}

const DEFAULT_SECTOR = "Education and Research";

async function getSectorFromJob(job: string, userId: string): Promise<{ sector: string | null; error?: string }> {
  try {
    const response = await fetch('http://localhost:3001/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: job,
        previous_question_id: 999,
        user_id: userId // DÜZELTME 2: userId'yi isteğin gövdesine ekliyoruz.
      }),
    });
    const data = await response.json();
    if (data && data.comment) {
      const found = SECTORS.find(s => data.comment.toLowerCase().includes(s.toLowerCase()));
      if (!found || data.score === 0) {
        return { sector: null, error: 'Could not match your job to a sector. Please rephrase or try again.' };
      }
      return { sector: found };
    }
    return { sector: null, error: 'Could not match your job to a sector. Please rephrase or try again.' };
  } catch (err) {
    console.error('[SECTOR SUGGESTION ERROR]', err);
    return { sector: null, error: 'Could not match your job to a sector. Please rephrase or try again.' };
  }
}

const sectorInfo =
  "Sector selection ensures that assessment questions and analysis are tailored to your context. Please select or search for your sector. If you can't find it, use 'My job is not listed' to describe your job.";

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [sector, setSector] = useState(SECTORS[13]);
  const [search, setSearch] = useState('');
  const [showCustomJob, setShowCustomJob] = useState(false);
  const [customJob, setCustomJob] = useState('');
  const [isLoadingSector, setIsLoadingSector] = useState(false);
  const [customError, setCustomError] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredSectors = SECTORS.filter(s =>
    s.toLowerCase().includes(search.toLowerCase())
  );
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    if (!trimmedUsername) return;

    const randomDigits = Math.random().toString().slice(2, 12);
    const userId = `${trimmedUsername}-${randomDigits}`;

    if (showCustomJob && customJob.trim()) {
      setCustomError('');
      setIsLoadingSector(true);
      
      // DÜZELTME 3: getSectorFromJob fonksiyonunu çağırırken oluşturduğumuz userId'yi iletiyoruz.
      const { sector, error } = await getSectorFromJob(customJob.trim(), userId);
      
      setIsLoadingSector(false);
      if (error) {
        setCustomError(error);
        return;
      }
      onLogin(trimmedUsername, sector!, userId);
    } else {
      onLogin(trimmedUsername, sector, userId);
    }
  };

  const handleSectorSelect = (selectedSector: string) => {
    setSector(selectedSector);
    setIsDropdownOpen(false);
    setSearch('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '30px 30px'
        }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-2xl shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            CyberSecurity-LLM
          </h1>
          <p className="text-slate-300 text-sm">
            Enterprise Security Maturity Assessment
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-slate-200 mb-2">
                <User className="w-4 h-4 mr-2 text-blue-400" />
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full p-4 bg-slate-900/50 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  autoFocus
                />
                {username.trim() && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-400" />
                )}
              </div>
            </div>

            {/* Sector Selection */}
            <div className="space-y-2" ref={dropdownRef}>
              <div className="flex items-center justify-between">
                <label className="flex items-center text-sm font-medium text-slate-200">
                  <Building2 className="w-4 h-4 mr-2 text-blue-400" />
                  Industry Sector
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className="text-slate-400 hover:text-blue-400 transition-colors"
                    onMouseEnter={() => setShowInfo(true)}
                    onMouseLeave={() => setShowInfo(false)}
                    tabIndex={-1}
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  {showInfo && (
                    <div className="absolute right-0 top-6 z-30 w-80 bg-slate-900 border border-blue-500/50 rounded-xl p-4 shadow-2xl">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {sectorInfo}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {!showCustomJob ? (
                <div className="relative">
                  <button
                    type="button"
                    className="w-full p-4 bg-slate-900/50 border border-slate-600 rounded-xl text-slate-100 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 flex justify-between items-center hover:bg-slate-900/70"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <span className="truncate">{sector}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute z-20 mt-2 w-full bg-slate-900 border border-slate-600 rounded-xl shadow-2xl overflow-hidden">
                      <div className="p-3 border-b border-slate-700">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search sectors..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {filteredSectors.map(s => (
                          <button
                            key={s}
                            type="button"
                            className="w-full p-3 text-left hover:bg-slate-800 text-slate-200 text-sm transition-colors duration-150 border-b border-slate-800 last:border-b-0"
                            onClick={() => handleSectorSelect(s)}
                          >
                            {s}
                          </button>
                        ))}
                        {filteredSectors.length === 0 && (
                          <div className="p-4 text-center text-slate-400 text-sm">
                            No sectors found
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    className="mt-3 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-200 flex items-center group"
                    onClick={() => setShowCustomJob(true)}
                  >
                    <span>My job is not listed</span>
                    <ChevronDown className="w-4 h-4 ml-1 transform rotate-[-90deg] group-hover:translate-x-1 transition-transform duration-200" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <textarea
                      className="w-full p-4 bg-slate-900/50 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                      placeholder="Please describe your job title, role, or industry sector..."
                      value={customJob}
                      onChange={e => setCustomJob(e.target.value)}
                      rows={3}
                    />
                  </div>
                  {customError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                      <p className="text-red-400 text-sm">{customError}</p>
                    </div>
                  )}
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-300 text-sm font-medium transition-colors duration-200 flex items-center group"
                    onClick={() => { 
                      setShowCustomJob(false); 
                      setCustomJob(''); 
                      setCustomError(''); 
                    }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform duration-200" />
                    Back to sector list
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl px-6 py-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              disabled={!username.trim() || isLoadingSector || (showCustomJob && !customJob.trim())}
            >
              {isLoadingSector ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>{showCustomJob && customJob.trim() ? 'Continue Assessment' : 'Start Assessment'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-slate-400 text-xs">
            Secure • Professional • Adaptive Assessment Platform
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;