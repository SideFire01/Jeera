
import { getScopeColorConfig } from '../utils';
import React, { useState } from 'react';

interface ScopesManagerProps {
  scopes: string[];
  onAddScope: (scope: string) => void;
  onDeleteScope: (scope: string) => void;
  onRenameScope: (oldScope: string, newScope: string) => void;
  darkMode: boolean;
}

const ScopesManager: React.FC<ScopesManagerProps> = ({ scopes, onAddScope, onDeleteScope, onRenameScope, darkMode }) => {
  const [newScope, setNewScope] = useState('');
  const [editingScope, setEditingScope] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newScope.trim()) {
      onAddScope(newScope.trim());
      setNewScope('');
    }
  };

  const startEditing = (scope: string) => {
    setEditingScope(scope);
    setEditValue(scope);
  };

  const saveEdit = () => {
    if (editingScope && editValue.trim() && editValue !== editingScope) {
      onRenameScope(editingScope, editValue.trim());
    }
    setEditingScope(null);
  };

  const cancelEdit = () => {
    setEditingScope(null);
    setEditValue('');
  };

  return (
    <div className={`p-8 max-w-4xl mx-auto ${darkMode ? 'text-[#B6C2CF]' : 'text-slate-800'}`}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">My Scopes</h1>
        <p className={`text-sm ${darkMode ? 'text-[#8C9BAB]' : 'text-slate-500'}`}>
          Manage the contexts for your tasks (e.g., University, Work, Personal).
        </p>
      </div>

      <div className={`rounded-xl border p-6 mb-8 ${darkMode ? 'bg-[#1D2125] border-[#38414a]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <form onSubmit={handleSubmit} className="flex gap-4">
          <div className="flex-1">
            <label className={`block text-[10px] font-bold uppercase tracking-wide mb-1.5 ${darkMode ? 'text-[#8C9BAB]' : 'text-slate-400'}`}>
              New Scope Name
            </label>
            <input
              type="text"
              value={newScope}
              onChange={(e) => setNewScope(e.target.value)}
              placeholder="e.g. University Project"
              className={`w-full border rounded-lg px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 transition-all ${
                darkMode 
                  ? 'bg-[#22272B] border-[#38414a] focus:ring-[#0C66E4] text-white' 
                  : 'bg-slate-50 border-slate-200 focus:ring-blue-500 text-slate-900'
              }`}
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={!newScope.trim()}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                darkMode 
                  ? 'bg-[#0C66E4] hover:bg-[#0055CC] text-white' 
                  : 'bg-[#0052CC] hover:bg-blue-700 text-white shadow-blue-500/20'
              }`}
            >
              Add Scope
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scopes.map(scope => (
          <div 
            key={scope}
            className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
              darkMode 
                ? 'bg-[#1D2125] border-[#38414a] hover:border-[#0C66E4]/50' 
                : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm'
            }`}
          >
            {editingScope === scope ? (
              <div className="flex flex-1 items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit();
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  className={`flex-1 min-w-0 text-sm font-semibold bg-transparent border-b outline-none ${
                     darkMode ? 'text-white border-[#0C66E4]' : 'text-slate-900 border-blue-500'
                  }`}
                />
                <button onClick={saveEdit} className="text-green-500 hover:text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button onClick={cancelEdit} className="text-red-500 hover:text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold uppercase border ${getScopeColorConfig(scope, scopes)[darkMode ? 'dark' : 'light']}`}>
                    {scope.substring(0, 2)}
                  </span>
                  <span className="font-semibold text-sm">{scope}</span>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEditing(scope)}
                    className={`p-2 rounded-lg transition-colors ${
                      darkMode 
                        ? 'hover:bg-blue-500/10 text-[#8C9BAB] hover:text-blue-400' 
                        : 'hover:bg-blue-50 text-slate-400 hover:text-blue-500'
                    }`}
                    title="Rename Scope"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeleteScope(scope)}
                    className={`p-2 rounded-lg transition-colors ${
                      darkMode 
                        ? 'hover:bg-red-500/10 text-[#8C9BAB] hover:text-red-400' 
                        : 'hover:bg-red-50 text-slate-400 hover:text-red-500'
                    }`}
                    title="Delete Scope"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {scopes.length === 0 && (
          <div className={`col-span-full py-12 text-center rounded-xl border border-dashed ${
            darkMode ? 'border-[#38414a] text-[#8C9BAB]' : 'border-slate-300 text-slate-500'
          }`}>
            <p className="text-sm">No scopes defined yet. Add one above to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScopesManager;
