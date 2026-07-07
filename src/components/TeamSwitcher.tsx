
import React, { useState, useRef, useEffect } from 'react';
import { Organization, JoinCode } from '../types';
import TeamSettingsModal from './TeamSettingsModal';
import { useJeeraContext } from '../contexts/JeeraContext';

interface TeamSwitcherProps {
  darkMode: boolean;
  // Previously passed props are now fetched from context
}

export const TeamSwitcher: React.FC<TeamSwitcherProps> = ({ darkMode }) => {
  const { 
    myOrgs, currentOrg, switchOrg: onSwitch, createOrg: onCreate, 
    updateOrgName: onUpdateName, joinOrg: onJoin, leaveOrg: onLeaveOrg,
    // Management
    profile, fetchMembers: onFetchMembers, removeMember: onRemoveMember,
    updateMemberRole: onUpdateRole, deleteOrg: onDeleteOrg
  } = useJeeraContext();
  
  const currentUserId = profile?.id || '';

  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  const [newTeamName, setNewTeamName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreate = () => {
      if(newTeamName.trim()) {
          onCreate(newTeamName);
          setNewTeamName('');
          setShowCreateModal(false);
          setIsOpen(false);
      }
  };

  const handleJoin = async () => {
      if(joinCode.trim()) {
           const res = await onJoin(joinCode);
           if(res.success) {
               setJoinCode('');
               setShowJoinModal(false);
               setIsOpen(false);
           } else {
               alert(res.message || 'Failed to join');
           }
      }
  };

  return (
    <div ref={containerRef} className="relative w-full z-30">
        {/* Trigger Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-3 py-3.5 rounded-xl border transition-all shadow-sm group ${
             darkMode 
               ? 'bg-blue-900/10 border-blue-500/20 text-blue-100 hover:bg-blue-900/20 hover:border-blue-500/40' 
               : 'bg-blue-50/50 border-blue-200 text-slate-800 hover:bg-blue-50 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
             <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold transition-colors ${
                 darkMode ? 'bg-blue-500/20 text-blue-300 group-hover:bg-blue-500/30' : 'bg-white border border-blue-100 text-blue-700 group-hover:border-blue-200'
             }`}>
                {currentOrg ? currentOrg.name.substring(0,2).toUpperCase() : 'PS'}
             </div>
             <div className="flex flex-col items-start min-w-0">
                <span className="truncate text-sm font-bold leading-tight">
                    {currentOrg ? currentOrg.name : 'Select Workspace'}
                </span>
                <span className="text-[10px] opacity-60 uppercase tracking-wider font-semibold leading-tight">
                    {currentOrg?.role || 'Guest'}
                </span>
             </div>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''} opacity-50`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
            <div className={`absolute top-full left-0 mt-1 w-full md:w-64 rounded-xl border shadow-xl p-1.5 z-50 ${
                darkMode ? 'bg-[#1D2125] border-[#38414A]' : 'bg-white border-slate-200'
            }`}>
                <div className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1.5 mb-1 opacity-50 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    My Workspaces
                </div>
                
                <div className="space-y-0.5 max-h-48 overflow-y-auto mb-2 custom-scrollbar">
                    {myOrgs.map(org => (
                        <div
                          key={org.id}
                          onClick={() => { onSwitch(org); setIsOpen(false); }}
                          className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 text-xs transition-colors group cursor-pointer ${
                             currentOrg?.id === org.id 
                               ? (darkMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-700')
                               : (darkMode ? 'hover:bg-[#A6C5E2]/10 text-slate-300' : 'hover:bg-slate-50 text-slate-700')
                          }`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${currentOrg?.id === org.id ? 'bg-blue-500' : 'bg-transparent'}`} />
                            <span className="truncate flex-1">{org.name}</span>
                            
                            {/* Role Label */}
                            {org.role === 'leader' && <span className="opacity-50 text-[9px] uppercase border px-1 rounded flex-shrink-0">Leader</span>}

                            {/* Leave Button for NON-Leaders */}
                            {org.role !== 'leader' && (
                                <button
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        if(confirm(`Are you sure you want to leave ${org.name}?`)) {
                                            onLeaveOrg(org.id);
                                        }
                                    }}
                                    className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all flex-shrink-0 ${
                                        darkMode ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-100 text-red-500'
                                    }`}
                                    title="Leave Team"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    ))}
                    {myOrgs.length === 0 && (
                        <div className="px-2 py-2 text-xs opacity-50 italic">No organizations found.</div>
                    )}
                </div>

                <div className={`h-px w-full my-1 ${darkMode ? 'bg-[#38414A]' : 'bg-slate-100'}`} />

                <div className="grid grid-cols-2 gap-1 mb-1">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className={`px-2 py-1.5 rounded text-[10px] font-semibold uppercase flex items-center justify-center gap-1 transition-colors ${
                             darkMode ? 'bg-[#22272B] hover:bg-[#2C333A] text-blue-400' : 'bg-slate-50 hover:bg-slate-100 text-blue-600'
                        }`}
                    >
                        <span>+ New</span>
                    </button>
                    <button
                        onClick={() => setShowJoinModal(true)}
                        className={`px-2 py-1.5 rounded text-[10px] font-semibold uppercase flex items-center justify-center gap-1 transition-colors ${
                             darkMode ? 'bg-[#22272B] hover:bg-[#2C333A] text-emerald-400' : 'bg-slate-50 hover:bg-slate-100 text-emerald-600'
                        }`}
                    >
                        <span>Join</span>
                    </button>
                </div>
                
                {currentOrg && currentOrg.role === 'leader' && (
                   <button
                        onClick={() => { setShowSettingsModal(true); setIsOpen(false); }}
                        className={`w-full text-center px-2 py-1.5 rounded text-[10px] font-semibold uppercase transition-colors ${
                              darkMode ? 'hover:bg-red-900/20 text-red-400' : 'hover:bg-red-50 text-red-600'
                        }`}
                   >
                        Manage Workspace
                   </button>
                )}
            </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
               <div className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl border ${darkMode ? 'bg-[#1D2125] border-[#38414A]' : 'bg-white'}`}>
                  <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Create New Workspace</h3>
                  <input 
                      type="text" 
                      placeholder="Workspace Name (e.g. Design Team)" 
                      value={newTeamName}
                      onChange={e => setNewTeamName(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border mb-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                         darkMode ? 'bg-[#22272B] border-[#38414A] text-white' : 'bg-white border-slate-300'
                      }`}
                  />
                  <div className="flex justify-end gap-2">
                       <button onClick={() => setShowCreateModal(false)} className="px-3 py-2 text-xs font-semibold rounded hover:bg-gray-100 dark:hover:bg-[#2C333A] opacity-70">Cancel</button>
                       <button onClick={handleCreate} disabled={!newTeamName.trim()} className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50">Create</button>
                  </div>
               </div>
            </div>
        )}

        {/* Join Modal */}
        {showJoinModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
               <div className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl border ${darkMode ? 'bg-[#1D2125] border-[#38414A]' : 'bg-white'}`}>
                  <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Join via Code</h3>
                  <input 
                      type="text" 
                      placeholder="Enter 6-character code" 
                      value={joinCode}
                      onChange={e => setJoinCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      className={`w-full px-3 py-2 text-center text-xl tracking-widest font-mono rounded-lg border mb-4 outline-none focus:ring-2 focus:ring-green-500 uppercase placeholder:text-sm placeholder:tracking-normal placeholder:normal-case ${
                         darkMode ? 'bg-[#22272B] border-[#38414A] text-white' : 'bg-white border-slate-300'
                      }`}
                  />
                  <div className="flex justify-end gap-2">
                       <button onClick={() => setShowJoinModal(false)} className="px-3 py-2 text-xs font-semibold rounded hover:bg-gray-100 dark:hover:bg-[#2C333A] opacity-70">Cancel</button>
                       <button onClick={handleJoin} disabled={joinCode.length < 6} className="px-4 py-2 text-xs font-bold text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50">Join</button>
                  </div>
               </div>
            </div>
        )}

        {/* Team Settings Modal */}
        {showSettingsModal && currentOrg && (
            <TeamSettingsModal 
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                currentOrg={currentOrg}
                currentUserId={currentUserId}
                onFetchMembers={onFetchMembers}
                onRemoveMember={onRemoveMember}
                onUpdateRole={onUpdateRole}
                onDeleteOrg={onDeleteOrg}
                onUpdateName={onUpdateName}
                darkMode={darkMode}
            />
        )}
    </div>
  );
};
