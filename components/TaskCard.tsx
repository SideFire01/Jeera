import { getScopeColorConfig } from '../utils';

import React from 'react';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: () => void;
  onMove: (id: string, newStatus: string) => void;
  darkMode: boolean;
  scopes: string[];
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, onMove, darkMode, scopes }) => {
  const now = new Date();
  const deadlineDate = task.deadline ? new Date(task.deadline) : null;
  
  // Logic for urgency states
  const isDone = task.status === 'DONE';
  const isOverdue = !isDone && deadlineDate && deadlineDate < now;
  const isSoon = !isDone && !isOverdue && deadlineDate && (deadlineDate.getTime() - now.getTime()) < (3 * 24 * 60 * 60 * 1000);

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.4';
    setTimeout(() => {
      target.style.opacity = '1';
    }, 0);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getRelativeDeadline = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    // Reset time to ignore hours/minutes for day calculation
    const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = d1.getTime() - d2.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  // Determine card styles based on urgency
  let borderClasses = "border-l-[#0C66E4]";
  let bgClasses = darkMode ? 'bg-[#22272B] border-[#38414a]' : 'bg-white border-slate-200';
  
  if (isOverdue) {
    borderClasses = "border-l-red-600 shadow-sm shadow-red-500/10";
    bgClasses = darkMode ? 'bg-red-950/20 border-red-900/40' : 'bg-red-50/60 border-red-200';
  } else if (isSoon) {
    borderClasses = "border-l-amber-500";
    bgClasses = darkMode ? 'bg-amber-950/10 border-amber-900/40' : 'bg-amber-50/40 border-amber-200';
  }

  return (
    <div 
      draggable={true}
      onDragStart={handleDragStart}
      onClick={() => onEdit(task)}
      className={`rounded-lg shadow-sm border p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-grab active:cursor-grabbing group relative select-none border-l-[4px] 
        ${borderClasses} ${bgClasses} ${darkMode ? 'text-[#B6C2CF]' : 'text-slate-800 shadow-slate-200/50'}`}
    >
      {/* Delete button (hidden until hover) */}
      <div className="flex justify-end items-start absolute top-3 right-3 z-10">
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className={`opacity-0 group-hover:opacity-100 transition-all p-1 rounded
            ${darkMode 
              ? 'text-[#8C9BAB] hover:text-red-400 hover:bg-red-900/20' 
              : 'text-slate-300 hover:text-red-500 hover:bg-red-50'
            }`}
          title="Delete Card"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      
      <div className="flex flex-col">
        {/* Title Section */}
        <div className="flex items-start gap-1.5 mb-2.5">
          {isOverdue && (
            <span className="flex h-2 w-2 mt-1.5 rounded-full bg-red-600 animate-pulse shrink-0" />
          )}
          <h3 className={`text-[13px] font-bold pr-6 leading-tight tracking-tight flex-1 
            ${darkMode ? 'text-[#B6C2CF]' : 'text-slate-900'}`}>
            {task.title}
          </h3>
        </div>
        
        {/* Description Section */}
        <p className={`text-[12px] mb-3 line-clamp-2 leading-snug 
          ${darkMode ? 'text-[#8C9BAB]' : 'text-slate-500'}`}>
          {task.description || "No description provided."}
        </p>
      </div>
      
      <div className={`flex items-center justify-between pt-2.5 border-t 
        ${darkMode ? 'border-[#38414a]' : 'border-slate-100'}`}>
        
        {/* Left Side Group: Created Date & Deadline */}
        <div className="flex items-center gap-2">
          {/* Created Date */}
          <div className={`flex items-center gap-1 opacity-60 ${darkMode ? 'text-[#8C9BAB]' : 'text-slate-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-[10px] font-medium tracking-tight">
              {getRelativeTime(task.createdAt)}
            </span>
          </div>

          {/* Deadline */}
          {task.deadline && (
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-colors
              ${isOverdue 
                ? (darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-100 text-red-700') 
                : isSoon 
                  ? (darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100 text-amber-700')
                  : (darkMode ? 'text-[#B6C2CF]' : 'text-slate-500')}`}>
              
              {isOverdue ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              
              <span className="text-[10px] font-bold tracking-tight">
                {getRelativeDeadline(task.deadline)}
              </span>
            </div>
          )}
        </div>
        
        {/* Right Side: Scope Badge */}
        {task.scope && (
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${getScopeColorConfig(task.scope, scopes)[darkMode ? 'dark' : 'light']}`}>
             <span className="text-[10px] font-bold tracking-tight uppercase max-w-[80px] truncate">{task.scope}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(TaskCard);
