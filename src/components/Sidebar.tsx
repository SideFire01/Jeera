
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Organization, JoinCode } from '../types';
import { TeamSwitcher } from './TeamSwitcher';
import InviteManager from './InviteManager';
import { useJeeraContext } from '../contexts/JeeraContext';

interface SidebarProps {
  view: 'board' | 'dashboard' | 'scopes';
  setView: (view: 'board' | 'dashboard' | 'scopes') => void;
  darkMode: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    view, setView, darkMode
}) => {
  const { 
    currentOrg, 
    createInvite: onGenerateInvite, 
    fetchInvites: onFetchInvites, 
    deleteInvite: onDeleteInvite
  } = useJeeraContext();

  const [invites, setInvites] = useState<JoinCode[]>([]);

  const handleFetchInvites = async () => {
    const data = await onFetchInvites();
    setInvites(data);
  };
  
  // FIX: Depend only on ID to avoid infinite re-renders if object reference changes
  useEffect(() => {
    handleFetchInvites();
  }, [currentOrg?.id]); 

  return (
    <aside className={`w-16 md:w-56 border-r flex flex-col items-center py-6 z-20 transition-all ${
      darkMode ? 'bg-[#1D2125] border-[#38414a] text-[#B6C2CF]' : 'bg-white border-slate-200 text-slate-800'
    }`}>
      <div className="mb-10 px-4 flex items-center justify-center gap-2 w-full">
        <div className={`${darkMode ? 'bg-[#0C66E4] text-white' : 'bg-[#0052CC] text-white'} w-7 h-7 rounded flex-shrink-0 flex items-center justify-center shadow-sm`}>
          <span className="font-bold text-sm">J</span>
        </div>
        <span className={`hidden md:block font-extrabold text-lg tracking-tight ${darkMode ? 'text-[#B6C2CF]' : 'text-slate-900'}`}>Jeera</span>
      </div>
      
      <div className="w-full px-2 mb-6">
        <TeamSwitcher 
            darkMode={darkMode}
        />
      </div>

      <nav className="flex-1 w-full px-2 space-y-4">
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
          <span className="hidden md:block text-[11px] font-semibold uppercase tracking-wider">Tags</span>
        </button>

        {currentOrg?.role === 'leader' && (
            <InviteManager 
                currentOrg={currentOrg}
                onGenerate={onGenerateInvite} 
                invites={invites}
                onRefresh={handleFetchInvites}
                onDelete={onDeleteInvite}
                darkMode={darkMode}
            />
        )}
      </nav>
      

    </aside>
  );
};

export default Sidebar;
