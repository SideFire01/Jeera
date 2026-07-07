import React, { useState, useEffect } from 'react';
import { Organization, Profile } from '../types';

interface Member {
  id: string; // This is the membership ID
  user_id: string;
  role: string;
  joined_at: string;
  profile?: Profile;
}

interface TeamSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOrg: Organization;
  darkMode: boolean;
  // Actions
  onFetchMembers: () => Promise<Member[]>;
  onRemoveMember: (userId: string) => Promise<void>;
  onUpdateRole: (userId: string, newRole: string) => Promise<void>;
  onUpdateName: (name: string) => Promise<void>;
  onDeleteOrg: () => Promise<void>;
  currentUserId: string;
}

const TeamSettingsModal: React.FC<TeamSettingsModalProps> = ({
  isOpen, onClose, currentOrg, darkMode,
  onFetchMembers, onRemoveMember, onUpdateRole, onDeleteOrg, onUpdateName,
  currentUserId
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [orgName, setOrgName] = useState(currentOrg.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadMembers();
      setOrgName(currentOrg.name);
    }
  }, [isOpen, currentOrg]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await onFetchMembers();
      setMembers(data);
    } catch (e) {
      console.error(e);
      setError('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return;
    try {
      await onRemoveMember(userId);
      setMembers(prev => prev.filter(m => m.user_id !== userId));
    } catch (e) {
      alert('Error removing member');
    }
  };

  const handleTransfer = async (userId: string) => {
      if (!confirm(`Are you sure you want to make this user the LEADER? You will lose ownership privileges.`)) return;
      try {
          await onUpdateRole(userId, 'leader');
          // This might trigger a reload or redirect as permissions change
          onClose();
          window.location.reload(); 
      } catch(e) {
          alert("Error transferring ownership");
      }
  };

  const handleDeleteTeam = async () => {
    const confirmation = prompt(`To confirm deletion, type "${currentOrg.name}"`);
    if (confirmation === currentOrg.name) {
      await onDeleteOrg();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-lg rounded-xl shadow-2xl overflow-hidden ${darkMode ? 'bg-[#1D2125] text-[#B6C2CF]' : 'bg-white text-slate-800'}`}>
        
        {/* Header */}
        <div className={`px-6 py-4 border-b flex justify-between items-center ${darkMode ? 'border-[#38414a]' : 'border-slate-100'}`}>
          <h2 className="text-lg font-bold">Team Settings: {currentOrg.name}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-200/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
            
            {/* General Section */}
            <div>
                 <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2">Name</h3>
                 <div className="flex gap-2">
                     <input 
                         type="text" 
                         value={orgName}
                         onChange={(e) => setOrgName(e.target.value)}
                         className={`flex-1 px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                             darkMode ? 'bg-[#22272B] border-[#38414A] text-white' : 'bg-white border-slate-300'
                         }`}
                     />
                     <button
                        onClick={() => {
                            onUpdateName(orgName);
                            alert("Workspace name updated!");
                        }}
                        disabled={orgName === currentOrg.name || !orgName.trim()}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                            orgName === currentOrg.name || !orgName.trim()
                            ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-500' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                        }`}
                     >
                        Save
                     </button>
                 </div>
            </div>

            {/* Members Section */}
            <div>
                <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-4">Team Members ({members.length})</h3>
                {loading ? (
                    <div className="text-center py-4 opacity-50">Loading members...</div>
                ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {members.map(member => (
                            <div key={member.id} className={`flex items-center justify-between p-3 rounded-lg border ${darkMode ? 'border-[#38414a] bg-[#22272B]' : 'border-slate-100 bg-slate-50'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                        member.role === 'leader' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
                                    }`}>
                                        {(member.profile?.username || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold">
                                            {member.profile?.username || 'Unknown User'} 
                                            {member.user_id === currentUserId && <span className="opacity-50 ml-2">(You)</span>}
                                        </div>
                                        <div className="text-[10px] opacity-60 uppercase tracking-widest">{member.role}</div>
                                    </div>
                                </div>

                                {member.user_id !== currentUserId && (
                                    <div className="flex items-center gap-2">
                                        {currentOrg.role === 'leader' && (
                                            <>
                                                <button 
                                                    onClick={() => handleTransfer(member.user_id)}
                                                    className="text-[10px] px-2 py-1 hover:bg-amber-500/10 text-amber-500 rounded transition-colors"
                                                    title="Make Leader"
                                                >
                                                    Promote
                                                </button>
                                                <button 
                                                    onClick={() => handleRemove(member.user_id)}
                                                    className="text-[10px] px-2 py-1 hover:bg-red-500/10 text-red-500 rounded transition-colors"
                                                    title="Remove User"
                                                >
                                                    Remove
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Danger Zone */}
            {currentOrg.role === 'leader' && (
                <div className="pt-6 border-t border-red-200/20">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-2">Danger Zone</h3>
                    <p className="text-xs opacity-60 mb-4">Permanently delete this team and all its boards, tasks, and data. This action cannot be undone.</p>
                    <button 
                        onClick={handleDeleteTeam}
                        className="w-full py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                    >
                        Delete Workspace
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TeamSettingsModal;
