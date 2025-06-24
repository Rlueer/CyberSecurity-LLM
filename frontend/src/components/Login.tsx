import React, { useState, useRef, useEffect } from 'react';
// DEĞİŞİKLİK: uuid kütüphanesini artık kullanmıyoruz, bu yüzden import satırını sildik.

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

async function getSectorFromJob(job: string): Promise<{ sector: string | null; error?: string }> {
  try {
    const response = await fetch('http://localhost:3001/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: job,
        previous_question_id: 999 
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

    // DEĞİŞİKLİK: userId'yi sizin istediğiniz formatta oluşturuyoruz.
    // Örnek: qwe-1234567890
    const randomDigits = Math.random().toString().slice(2, 12); // 10 haneli rastgele sayı
    const userId = `${trimmedUsername}-${randomDigits}`;

    if (showCustomJob && customJob.trim()) {
      setCustomError('');
      setIsLoadingSector(true);
      const { sector, error } = await getSectorFromJob(customJob.trim());
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

  // ... (JSX kısmı aynı kalıyor, değişiklik yok)
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f0f23]">
      <form onSubmit={handleSubmit} className="bg-[#1e1e3f] p-8 rounded-lg shadow-lg w-full max-w-md flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-blue-400 mb-2 text-center">Welcome to CyberSecurity Maturity Test </h2>
        <div>
          <label className="block text-gray-300 mb-2" htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            className="w-full p-3 rounded bg-[#0f0f23] border border-gray-700 text-gray-100 focus:outline-none focus:border-blue-500"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center mb-2">
            <label className="block text-gray-300 mr-2" htmlFor="sector">Sector</label>
            <button
              type="button"
              className="ml-1 text-blue-400 hover:text-blue-200 relative"
              onMouseEnter={() => setShowInfo(true)}
              onMouseLeave={() => setShowInfo(false)}
              tabIndex={-1}
            >
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" fill="none"/><text x="10" y="15" textAnchor="middle" fontSize="12" fill="currentColor">i</text></svg>
              {showInfo && (
                <span className="absolute left-6 top-0 z-20 w-64 bg-gray-900 text-gray-200 text-xs rounded-lg p-3 shadow-lg border border-blue-400">
                  {sectorInfo}
                </span>
              )}
            </button>
          </div>

          <button
            type="button"
            className="w-full p-3 rounded bg-[#0f0f23] border border-gray-700 text-gray-100 text-left focus:outline-none focus:border-blue-500 flex justify-between items-center"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span>{sector}</span>
            <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-[#1e1e3f] border border-gray-700 rounded-lg shadow-lg">
              <input
                type="text"
                placeholder="Search sector..."
                className="w-full p-2 bg-[#0f0f23] border-b border-gray-700 text-gray-100 focus:outline-none"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <ul className="max-h-48 overflow-y-auto">
                {filteredSectors.map(s => (
                  <li
                    key={s}
                    className="p-3 hover:bg-blue-600 cursor-pointer text-gray-200"
                    onClick={() => handleSectorSelect(s)}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!showCustomJob && (
             <button
                type="button"
                className="mt-3 w-full text-blue-400 hover:underline text-sm text-left"
                onClick={() => setShowCustomJob(true)}
             >
                My job is not listed
             </button>
          )}
        </div>
        
        {showCustomJob && (
            <div className="flex flex-col gap-2">
              <label className="block text-gray-300 -mb-1">Describe your job</label>
              <textarea
                className="w-full p-3 rounded bg-[#0f0f23] border border-gray-700 text-gray-100 focus:outline-none focus:border-blue-500"
                placeholder="Please describe your job title or field..."
                value={customJob}
                onChange={e => setCustomJob(e.target.value)}
                rows={2}
              />
              {customError && <span className="text-red-400 text-xs">{customError}</span>}
              <button
                type="button"
                className="text-blue-400 hover:underline text-sm self-start"
                onClick={() => { setShowCustomJob(false); setCustomJob(''); setCustomError(''); }}
              >
                Back to sector list
              </button>
            </div>
          )}

        <button
          type="submit"
          className="bg-blue-600 text-white font-medium rounded-lg px-5 py-3 transition hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
          disabled={!username.trim() || isLoadingSector || (showCustomJob && !customJob.trim())}
        >
          {isLoadingSector ? (
            <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          ) : null}
          {showCustomJob && customJob.trim() ? 'Continue' : 'Enter'}
        </button>
      </form>
    </div>
  );
};

export default Login;