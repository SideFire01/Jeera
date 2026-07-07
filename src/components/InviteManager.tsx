import React, { useState } from 'react';
import { JoinCode } from '../types';

interface InviteManagerProps {
  currentOrg: any;
  onGenerate: (maxUses: number, hours: number) => Promise<any>;
  invites: JoinCode[];
  onRefresh: () => void;
  onDelete: (code: string) => Promise<void>; 
  darkMode: boolean;
}

const InviteManager: React.FC<InviteManagerProps> = ({ 
  currentOrg, 
  onGenerate, 
  invites, 
  onRefresh, 
  onDelete,
  darkMode 
}) => {
  const [loading, setLoading] = useState(false);
  const [maxUses, setMaxUses] = useState(5);

  const handleCreate = async () => {
    setLoading(true);
    await onGenerate(maxUses, 24);
    setLoading(false);
    onRefresh();
  };

  const handleDelete = async (code: string) => {
      if (confirm('Are you sure you want to delete this invite code?')) {
          await onDelete(code);
          onRefresh();
      }
  };

  if (currentOrg?.role !== 'leader') return null;

  return (
    <div className={`mt-auto p-4 border-t ${darkMode ? 'border-[#38414a] bg-[#161A1D]' : 'border-slate-200 bg-slate-50'} shadow-inner`}> 
      <h3 className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-3">
        Invite Management
      </h3>

      <div className="flex gap-2 mb-4">
        <input 
          type="number"
          min="1"
          value={maxUses}
          onChange={(e) => setMaxUses(parseInt(e.target.value))}
          className={`w-16 px-2 py-1 text-xs rounded border outline-none focus:ring-1 focus:ring-blue-500 ${
              darkMode ? 'bg-[#22272B] border-[#38414a] text-[#B6C2CF]' : 'bg-white border-slate-200 text-slate-700'
          }`}
          title="Max Uses"
        />
        <button
          onClick={handleCreate}
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-3 rounded transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'Create Code'}
        </button>
      </div>

      <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
        {invites.length === 0 && (
           <p className="text-[10px] opacity-40 italic text-center py-2">No active codes</p>
        )}
        {invites.map((invite) => {
           const isExpired = new Date(invite.expires_at!) < new Date();
           return (
            <div 
              key={invite.code} 
              className={`p-2 rounded border flex items-center justify-between group ${
                  darkMode ? 'bg-[#1D2125] border-[#38414a]' : 'bg-white border-slate-200'
              } ${isExpired ? 'opacity-50' : ''}`}
            >
              <div>
                <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold tracking-wider select-all cursor-pointer text-blue-500">
                    {invite.code}
                    </span>
                    {isExpired && <span className="text-[8px] bg-red-100 text-red-600 px-1 rounded">Exp</span>}
                </div>
                <div className="text-[9px] opacity-60 mt-0.5">
                  {invite.used_count} / {invite.max_uses} used
                </div>
              </div>
              
              <button 
                  onClick={() => handleDelete(invite.code)}
                  className="p-1 hover:bg-red-500/10 text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete Code"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
              </button>
            </div>
           );
        })}
      </div>
    </div>
  );
};

export default InviteManager;
