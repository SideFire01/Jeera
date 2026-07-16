import React from 'react';

interface SidebarProps {
  view: 'board' | 'dashboard' | 'scopes';
  setView: (view: 'board' | 'dashboard' | 'scopes') => void;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ view, setView, darkMode, setDarkMode }) => {
  return (
    <aside className={`w-16 md:w-56 border-r flex flex-col items-center py-4 z-20 transition-all ${
      darkMode ? 'bg-[#1D2125] border-[#38414a] text-[#B6C2CF]' : 'bg-white border-slate-200 text-slate-800'
    }`}>
      <div className="mb-8 px-4 flex items-center gap-2">
        <div className={`${darkMode ? 'bg-[#0C66E4] text-white' : 'bg-[#0052CC] text-white'} w-7 h-7 rounded flex items-center justify-center shadow-sm`}>
          <span className="font-bold text-sm">J</span>
        </div>
        <span className={`hidden md:block font-extrabold text-lg tracking-tight ${darkMode ? 'text-[#B6C2CF]' : 'text-slate-900'}`}>Jeera</span>
      </div>
      
      <nav className="flex-1 w-full px-2 space-y-1">
        <button 
          onClick={() => setView('board')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
            view === 'board' 
            ? (darkMode ? 'bg-[#1C2B41] text-[#579DFF] font-bold border border-[#0C66E4]/30' : 'bg-blue-50 text-blue-700 font-bold border border-blue-100 shadow-sm') 
            : (darkMode ? 'hover:bg-[#A6C5E2]/10 text-[#B6C2CF]' : 'text-slate-600 hover:bg-slate-100')
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="hidden md:block text-[11px] font-semibold uppercase tracking-wider">Board</span>
        </button>
        
        <button 
          onClick={() => setView('dashboard')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
            view === 'dashboard' 
            ? (darkMode ? 'bg-[#1C2B41] text-[#579DFF] font-bold border border-[#0C66E4]/30' : 'bg-blue-50 text-blue-700 font-bold border border-blue-100 shadow-sm') 
            : (darkMode ? 'hover:bg-[#A6C5E2]/10 text-[#B6C2CF]' : 'text-slate-600 hover:bg-slate-100')
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="hidden md:block text-[11px] font-semibold uppercase tracking-wider">Analytics</span>
        </button>

        <button 
          onClick={() => setView('scopes')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
            view === 'scopes' 
            ? (darkMode ? 'bg-[#1C2B41] text-[#579DFF] font-bold border border-[#0C66E4]/30' : 'bg-blue-50 text-blue-700 font-bold border border-blue-100 shadow-sm') 
            : (darkMode ? 'hover:bg-[#A6C5E2]/10 text-[#B6C2CF]' : 'text-slate-600 hover:bg-slate-100')
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span className="hidden md:block text-[11px] font-semibold uppercase tracking-wider">Scopes</span>
        </button>
      </nav>
      
      <div className="px-2 py-4 w-full mt-auto">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all text-[10px] font-semibold uppercase tracking-widest border shadow-sm ${
              darkMode ? 'bg-[#22272B] border-[#38414a] text-[#B6C2CF] hover:bg-[#2C333A]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {darkMode ? 'Light' : 'Dark'}
          </button>
      </div>
    </aside>
  );
};

export default Sidebar;
