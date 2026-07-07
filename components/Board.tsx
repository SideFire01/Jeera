
import { getScopeColorConfig } from '../utils';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Task, Column } from '../types';
import TaskCard from './TaskCard';

interface BoardProps {
  tasks: Task[];
  columns: Column[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onMoveTask: (id: string, newStatus: string) => void;
  onAddTask: () => void;
  onClearFinished: () => void;
  onAddColumn: (title: string) => void;
  onRenameColumn: (id: string, title: string) => void;
  onDeleteColumn: (id: string) => void;
  onMoveColumn: (draggedId: string, targetId: string) => void;
  darkMode: boolean;
  scopes: string[];
  selectedScopes: string[];
  onUpdateSelectedScopes: (scopes: string[]) => void;
}

const Board: React.FC<BoardProps> = ({ 
  tasks, 
  columns, 
  onEditTask, 
  onDeleteTask,
  onMoveTask, 
  onAddTask,
  onClearFinished,
  onAddColumn,
  onRenameColumn,
  onDeleteColumn,
  onMoveColumn,
  darkMode,
  scopes,
  selectedScopes,
  onUpdateSelectedScopes
}) => {
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  
  // State for renaming columns
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  
  // Drag logic for columns
  const [isDraggingColumn, setIsDraggingColumn] = useState(false);

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filtering Logic
  // Show task if:
  // 1. No scopes are selected (Show All mode)
  // 2. Task has no scope (Global tasks)
  // 3. Task scope is in the selected list
  const filteredTasks = useMemo(() => tasks.filter(t => {
    if (selectedScopes.length === 0) return true;
    return !t.scope || selectedScopes.includes(t.scope);
  }), [tasks, selectedScopes]);

  const finishedCount = useMemo(() => filteredTasks.filter(t => t.status === 'DONE').length, [filteredTasks]);

  const tasksByColumn = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    columns.forEach(c => groups[c.id] = []);
    
    filteredTasks.forEach(task => {
      // Initialize if not exists (handling deleted columns edge case if needed, though usually columns are stable)
      if (!groups[task.status]) groups[task.status] = [];
      groups[task.status].push(task);
    });

    // Sort valid groups
    Object.keys(groups).forEach(key => {
       groups[key].sort((a, b) => {
         if (a.deadline && !b.deadline) return -1;
         if (!a.deadline && b.deadline) return 1;
         if (a.deadline && b.deadline) {
           return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
         }
         return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
       });
    });
    
    return groups;
  }, [filteredTasks, columns]);

  useEffect(() => {
    if (editingColumnId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingColumnId]);

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Prevent clearing if we're just moving between children
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setDragOverColumn(null);
  };

  const handleDragOverColumnNull = () => {
    setDragOverColumn(null);
  }

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    handleDragOverColumnNull();
    
    const columnId = e.dataTransfer.getData('columnId');
    const taskId = e.dataTransfer.getData('taskId');
    
    if (columnId) {
      onMoveColumn(columnId, status);
      setIsDraggingColumn(false);
    } else if (taskId) {
      onMoveTask(taskId, status);
    }
  };

  const handleColumnDragStart = (e: React.DragEvent, column: Column) => {
    setIsDraggingColumn(true);
    e.dataTransfer.setData('columnId', column.id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Set validation ghost image to the entire column element
    const columnEl = document.getElementById(`column-${column.id}`);
    if (columnEl) {
       e.dataTransfer.setDragImage(columnEl, 0, 0);
    }
  };

  const handleColumnDragEnd = () => {
    setIsDraggingColumn(false);
    handleDragOverColumnNull();
  };

  const submitNewColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (newColumnTitle.trim()) {
      onAddColumn(newColumnTitle.trim());
      setNewColumnTitle('');
      setIsAddingColumn(false);
    }
  };

  const startEditingColumn = (column: Column) => {
    setEditingColumnId(column.id);
    setEditTitleValue(column.title);
  };

  const saveColumnName = () => {
    if (editingColumnId && editTitleValue.trim()) {
      onRenameColumn(editingColumnId, editTitleValue.trim());
    }
    setEditingColumnId(null);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveColumnName();
    if (e.key === 'Escape') setEditingColumnId(null);
  };

  const handleSatisfyingClear = () => {
    // Only clear visible finished tasks
    if (finishedCount === 0) return;
    setIsClearing(true);
    // Visual feedback delay
    setTimeout(() => {
      onClearFinished(); // Note: This might need update if we only want to clear *visible* tasks, but standard is clear all finished. 
                         // However, if the user works on a specific scope, they might expect only that scope's done tasks to clear.
                         // But for now, App.tsx handles clear all. Let's stick to simple clear.
      setIsClearing(false);
    }, 600);
  };

  const toggleScope = (scope: string) => {
    if (selectedScopes.includes(scope)) {
      onUpdateSelectedScopes(selectedScopes.filter(s => s !== scope));
    } else {
      onUpdateSelectedScopes([...selectedScopes, scope]);
    }
  };


// ... existing return ...

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* ... Header buttons ... */}
      <div className="mb-6 flex-shrink-0 flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <button 
            onClick={onAddTask}
            className={`border px-5 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider shadow-sm hover:shadow-md transition-all flex items-center gap-2 group ${
              darkMode ? 'bg-[#22272B] border-[#38414a] text-[#B6C2CF] hover:bg-[#2C333A]' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className={`${darkMode ? 'bg-[#0C66E4]' : 'bg-[#0052CC]'} text-white rounded p-0.5 group-hover:rotate-90 transition-transform duration-300`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            New Task
          </button>

          {/* Scope Filter */}
          {scopes.length > 0 && (
            <div className="relative">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`border px-3 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 ${
                  darkMode 
                    ? `border-[#38414a] ${selectedScopes.length > 0 ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-[#22272B] text-[#B6C2CF] hover:bg-[#2C333A]'}` 
                    : `border-slate-300 ${selectedScopes.length > 0 ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-700 hover:bg-slate-50'}`
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {selectedScopes.length === 0 ? 'All Scopes' : `${selectedScopes.length} Selected`}
              </button>

              {isFilterOpen && (
                <>
                <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)}/>
                <div className={`absolute left-0 mt-2 w-56 rounded-xl border shadow-xl z-20 p-2 animate-in fade-in zoom-in-95 duration-200 ${
                  darkMode ? 'bg-[#1D2125] border-[#38414a]' : 'bg-white border-slate-200'
                }`}>
                  <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 mb-1 opacity-50 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    Filter by Scope
                  </div>
                  <div className="space-y-1">
                    {scopes.map(scope => (
                      <button
                        key={scope}
                        onClick={() => toggleScope(scope)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          selectedScopes.includes(scope)
                            ? (darkMode ? getScopeColorConfig(scope, scopes).dark : getScopeColorConfig(scope, scopes).light)
                            : (darkMode ? 'text-[#B6C2CF] hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50')
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-[3px] border flex items-center justify-center ${
                          selectedScopes.includes(scope)
                            ? (darkMode ? getScopeColorConfig(scope, scopes).solidDark : getScopeColorConfig(scope, scopes).solidLight)
                            : (darkMode ? 'border-[#8C9BAB]' : 'border-slate-300')
                        }`}>
                          {selectedScopes.includes(scope) && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        {scope}
                      </button>
                    ))}
                  </div>
                  <div className={`border-t mt-2 pt-2 ${darkMode ? 'border-[#38414a]' : 'border-slate-100'}`}>
                    <button 
                      onClick={() => { onUpdateSelectedScopes([]); setIsFilterOpen(false); }}
                      className={`w-full text-center text-[10px] uppercase font-bold py-1 rounded hover:underline ${
                        darkMode ? 'text-[#8C9BAB]' : 'text-slate-500'
                      }`}
                    >
                      Reset Filter
                    </button>
                  </div>
                </div>
                </>
              )}
            </div>
          )}

          {finishedCount > 0 && (
            <button 
              onClick={handleSatisfyingClear}
              disabled={isClearing}
              className={`px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 overflow-hidden relative ${
                isClearing 
                  ? 'bg-green-500 text-white scale-95 opacity-50' 
                  : darkMode 
                    ? 'bg-[#1D2125] text-green-400 border border-green-900/30 hover:bg-green-900/10' 
                    : 'bg-white text-green-600 border border-green-100 hover:bg-green-50 shadow-sm'
              }`}
            >
              <span className={`transition-transform duration-500 ${isClearing ? 'scale-150 rotate-[360deg]' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className={isClearing ? 'translate-x-10 opacity-0' : 'opacity-100'}>
                Clear {finishedCount}
              </span>
              {isClearing && (
                <span className="absolute inset-0 flex items-center justify-center animate-ping text-white pointer-events-none">
                   ✨
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 w-full gap-4 pb-4 px-0 items-stretch overflow-x-auto scroll-smooth">
        {columns.map((column, index) => (
          <div 
            key={column.id} 
            id={`column-${column.id}`}
            className="flex-1 min-w-[260px] max-w-[450px] flex flex-col h-full relative transition-transform duration-300 ease-out"
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Rich Gradient Overlay */}
            <div 
              className={`absolute inset-0 z-50 rounded-xl transition-all duration-300 ease-out pointer-events-none flex items-center justify-center ${
                isDraggingColumn && dragOverColumn === column.id
                  ? `opacity-100 backdrop-blur-[1px] scale-100 ${
                      darkMode 
                      ? 'bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 ring-2 ring-inset ring-blue-500/40 shadow-[inset_0_0_20px_rgba(37,99,235,0.1)]' 
                      : 'bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 ring-2 ring-inset ring-blue-400/60 shadow-[inset_0_0_20px_rgba(37,99,235,0.05)]'
                    }`
                  : 'opacity-0 scale-95'
              }`}
            >
              {/* Floating Badge */}
              <div className={`px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-widest shadow-xl border transform transition-all duration-500 ${
                 isDraggingColumn && dragOverColumn === column.id ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              } ${
                 darkMode 
                 ? 'bg-[#1D2125] text-blue-300 border-blue-500/30 shadow-black/20' 
                 : 'bg-white text-blue-600 border-blue-100 shadow-blue-100'
              }`}>
                 Move Phase
              </div>
            </div>

            <div className={`flex flex-col h-full transition-all duration-300 ease-out ${
              isDraggingColumn && dragOverColumn === column.id ? 'opacity-40 scale-[0.97]' : ''
            }`}>
              <div className="flex-shrink-0 flex items-center justify-between mb-3 px-1 group/header h-[20px]">
                {editingColumnId === column.id ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editTitleValue}
                    onChange={(e) => setEditTitleValue(e.target.value)}
                    onBlur={saveColumnName}
                    onKeyDown={handleRenameKeyDown}
                    className={`flex-1 text-[10px] font-black uppercase tracking-[0.15em] bg-transparent border-b outline-none pb-0.5 ${
                      darkMode ? 'text-white border-[#0C66E4]' : 'text-slate-900 border-blue-500'
                    }`}
                  />
                ) : (
                <h2 
                  draggable={true}
                  onDragStart={(e) => handleColumnDragStart(e, column)}
                  onDragEnd={handleColumnDragEnd}
                  className={`text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-2.5 truncate select-none cursor-grab active:cursor-grabbing ${
                  darkMode ? 'text-[#B6C2CF]' : 'text-slate-800'
                }`}>
                  {column.title}
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black flex-shrink-0 ${
                    darkMode ? 'bg-[#38414a] text-[#B6C2CF]' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tasks.filter(t => t.status === column.id).length}
                  </span>
                </h2>
              )}
              
              <div className="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 focus-within:opacity-100 transition-opacity">
                {editingColumnId !== column.id && (
                  <button 
                    onClick={() => startEditingColumn(column)}
                    className={`transition-colors p-1 ${darkMode ? 'text-white/10 hover:text-blue-400' : 'text-slate-300 hover:text-blue-500'}`}
                    title="Rename Phase"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
                <button 
                  onClick={() => onDeleteColumn(column.id)}
                  className={`transition-colors p-1 ${darkMode ? 'text-white/10 hover:text-red-400' : 'text-slate-300 hover:text-red-500'}`}
                  title="Delete Phase"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className={`flex-1 overflow-y-auto rounded-xl p-3 transition-all duration-300 border shadow-sm ${
              darkMode 
              ? `bg-[#1d2125]/40 border-[#38414a] ${dragOverColumn === column.id && !isDraggingColumn ? 'ring-2 ring-[#0C66E4] border-[#0C66E4] bg-[#22272B]' : ''}` 
              : `bg-[#DFE1E6]/40 border-slate-300/30 ${dragOverColumn === column.id && !isDraggingColumn ? 'ring-2 ring-blue-500 bg-blue-100/50 border-blue-500 shadow-inner' : ''}`
            }`}>
              <div className="space-y-3 pb-10">
                {(tasksByColumn[column.id] || [])
                  .map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onEdit={onEditTask} 
                      onDelete={() => onDeleteTask(task.id)}
                      onMove={onMoveTask}
                      darkMode={darkMode}
                      scopes={scopes}
                    />
                  ))}
              </div>
            {/* ... rest of column content ... */}
            </div>
            </div>
          </div>
        ))}

        {/* Add Phase Trigger - Now perfectly balanced with gap-4 and zero external padding */}
        <div className="flex-shrink-0 flex flex-col items-center justify-start pt-[34px]">
          <button 
            onClick={() => setIsAddingColumn(true)}
            className={`p-2 rounded-lg border border-dashed transition-all bg-transparent group ${
              darkMode ? 'text-[#8C9BAB] border-[#38414a] hover:border-[#8C9BAB] hover:bg-white/5' : 'text-slate-400 border-slate-300 hover:border-blue-400 hover:bg-blue-50/30'
            }`}
            title="Add Phase"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Add Phase Centered Modal (Wizard) */}
      {isAddingColumn && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsAddingColumn(false)}
          />
          <div className={`relative w-full max-w-sm rounded-2xl shadow-2xl border p-6 animate-in zoom-in duration-200 ${
            darkMode ? 'bg-[#1D2125] border-[#38414a]' : 'bg-white border-slate-200'
          }`}>
            <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 opacity-70 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Create New Phase</h3>
            <form onSubmit={submitNewColumn} className="space-y-4">
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-tight mb-1.5 ${darkMode ? 'text-[#8C9BAB]' : 'text-slate-400'}`}>Phase Title</label>
                <input 
                  autoFocus
                  type="text"
                  placeholder="e.g. Backlog..."
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 ${
                    darkMode ? 'bg-[#22272B] border-[#38414a] text-white focus:ring-[#0C66E4]' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-blue-500'
                  }`}
                />
              </div>
              <div className="flex gap-2">
                <button 
                  type="submit" 
                  className={`flex-1 px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white shadow-lg transition-transform active:scale-95 ${darkMode ? 'bg-[#0C66E4] hover:bg-[#0055CC]' : 'bg-[#0052CC] hover:bg-blue-700'}`}
                >
                  Create Phase
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsAddingColumn(false)} 
                  className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors ${darkMode ? 'text-[#B6C2CF] hover:bg-white/5' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Board;
