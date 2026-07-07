import React, { useState, useEffect } from 'react';
import { Task, Column, Profile } from '../types';
import CalendarPicker from './CalendarPicker';

interface Member {
    user_id: string;
    organization_id: string;
    role: string;
    profile: Profile;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTask: Partial<Task>;
  columns: Column[];
  scopes: string[];
  members?: Member[];
  darkMode: boolean;
  onSave: (task: Partial<Task>) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ 
  isOpen, 
  onClose, 
  initialTask, 
  columns, 
  scopes, 
  members = [],
  darkMode, 
  onSave 
}) => {
  const [task, setTask] = useState<Partial<Task>>(initialTask);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    setTask(initialTask);
  }, [initialTask]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.title) return;
    onSave(task);
  };

  const formatDateLabel = (dateStr?: string) => {
    if (!dateStr) return 'Set Deadline';
    return new Date(dateStr).toLocaleDateString(undefined, { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-all">
      <div className={`${darkMode ? 'bg-[#1D2125] text-[#B6C2CF] border border-[#38414a]' : 'bg-white text-slate-800'} rounded-xl shadow-2xl w-full max-w-lg animate-in zoom-in duration-200 relative`}>
        <div className={`px-6 py-4 border-b flex justify-between items-center ${darkMode ? 'bg-[#22272B] border-[#38414a]' : 'bg-slate-50 border-slate-200'} rounded-t-xl`}>
          <h2 className="text-xs font-bold uppercase tracking-widest opacity-90">{task.id ? 'Edit Task' : 'Create Task'}</h2>
          <button onClick={onClose} className={`${darkMode ? 'text-[#B6C2CF]/40 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={`block text-[10px] font-semibold uppercase tracking-tight mb-1.5 ${darkMode ? 'text-[#8C9BAB]' : 'text-slate-400'}`}>Title</label>
            <input 
              type="text" 
              autoFocus
              value={task.title || ''}
              onChange={e => setTask({...task, title: e.target.value})}
              className={`w-full border rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 transition-all ${
                darkMode ? 'bg-[#22272B] border-[#38414a] focus:ring-[#0C66E4] text-white' : 'bg-white border-slate-200 focus:ring-blue-400'
              }`}
              required
            />
          </div>
          <div>
            <label className={`block text-[10px] font-semibold uppercase tracking-tight mb-1.5 ${darkMode ? 'text-[#8C9BAB]' : 'text-slate-400'}`}>Description</label>
            <textarea 
              rows={3}
              value={task.description || ''}
              onChange={e => setTask({...task, description: e.target.value})}
              className={`w-full border rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 transition-all resize-none ${
                darkMode ? 'bg-[#22272B] border-[#38414a] focus:ring-[#0C66E4] text-white' : 'bg-white border-slate-200 focus:ring-blue-400'
              }`}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-[10px] font-semibold uppercase tracking-tight mb-1.5 ${darkMode ? 'text-[#8C9BAB]' : 'text-slate-400'}`}>Phase</label>
              <select 
                value={task.status}
                onChange={e => setTask({...task, status: e.target.value})}
                className={`w-full border rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 transition-all ${
                  darkMode ? 'bg-[#22272B] border-[#38414a] focus:ring-[#0C66E4] text-white' : 'bg-white border-slate-200 focus:ring-blue-400 text-slate-800'
                }`}
              >
                {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
                 <label className={`block text-[10px] font-semibold uppercase tracking-tight mb-1.5 ${darkMode ? 'text-[#8C9BAB]' : 'text-slate-400'}`}>Assignee</label>
                 <select 
                   value={task.assignee_id || ''}
                   onChange={e => {
                       const member = members.find(m => m.user_id === e.target.value);
                       setTask({
                           ...task, 
                           assignee_id: e.target.value,
                           assignee: member?.profile // Optimistic update support
                       });
                   }}
                   className={`w-full border rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 transition-all ${
                     darkMode ? 'bg-[#22272B] border-[#38414a] focus:ring-[#0C66E4] text-white' : 'bg-white border-slate-200 focus:ring-blue-400 text-slate-800'
                   }`}
                 >
                   <option value="">Unassigned</option>
                   {members.map(m => (
                       <option key={m.user_id} value={m.user_id}>
                           {m.profile.username} {m.user_id === task.user_id ? '(You)' : ''}
                       </option>
                   ))}
                 </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className={`block text-[10px] font-semibold uppercase tracking-tight mb-1.5 ${darkMode ? 'text-[#8C9BAB]' : 'text-slate-400'}`}>Tag</label>
                 <select 
                   value={task.scope || ''}
                   onChange={e => setTask({...task, scope: e.target.value})}
                   className={`w-full border rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 transition-all ${
                     darkMode ? 'bg-[#22272B] border-[#38414a] focus:ring-[#0C66E4] text-white' : 'bg-white border-slate-200 focus:ring-blue-400 text-slate-800'
                   }`}
                 >
                   <option value="">None</option>
                   {scopes.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
              </div>
              <div className="relative">
                <label className={`block text-[10px] font-semibold uppercase tracking-tight mb-1.5 ${darkMode ? 'text-[#8C9BAB]' : 'text-slate-400'}`}>Deadline</label>
                <button 
                  type="button"
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className={`w-full flex items-center gap-2 border rounded-lg px-3 py-2 outline-none transition-all text-left ${
                    darkMode ? 'bg-[#22272B] border-[#38414a] text-[#B6C2CF] hover:bg-[#2C333A]' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-medium truncate">{formatDateLabel(task.deadline)}</span>
                </button>

                {isCalendarOpen && (
                  <div className="absolute bottom-full right-0 z-[60] mb-2">
                    <CalendarPicker 
                      selectedDate={task.deadline}
                      darkMode={darkMode}
                      onSelect={(date) => {
                        setTask({ ...task, deadline: date ?? null });
                        setIsCalendarOpen(false);
                      }}
                      onClose={() => setIsCalendarOpen(false)}
                    />
                  </div>
                )}
              </div>
            </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                darkMode ? 'text-[#B6C2CF] hover:bg-white/5' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className={`px-6 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider shadow-lg transition-all active:scale-95 ${
                darkMode ? 'bg-[#0C66E4] hover:bg-[#0055CC] text-white' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
              }`}
            >
              {task.id ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
