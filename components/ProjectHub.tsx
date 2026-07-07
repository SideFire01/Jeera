import { getScopeColorConfig } from '../utils';
import React, { useMemo } from 'react';
import { Task, ActivityLog, Column } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ProjectHubProps {
  tasks: Task[];
  activities: ActivityLog[];
  columns: Column[];
  darkMode: boolean;
  scopes: string[];
}

const ProjectHub: React.FC<ProjectHubProps> = ({ tasks, activities, columns, darkMode, scopes }) => {
  const now = new Date();
  const activeTasks = tasks.filter(t => t.status !== 'DONE');
  const totalActive = activeTasks.length || 1;

  // Logic for Deadline-based health
  const stats = useMemo(() => {
    const s = {
      Overdue: 0,
      Imminent: 0,    // Within 48 hours
      Approaching: 0, // Within 7 days
      Scheduled: 0    // Farther or No Deadline
    };

    activeTasks.forEach(task => {
      if (!task.deadline) {
        s.Scheduled++;
        return;
      }

      const deadline = new Date(task.deadline);
      const diffTime = deadline.getTime() - now.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffTime < 0) {
        s.Overdue++;
      } else if (diffDays <= 2) {
        s.Imminent++;
      } else if (diffDays <= 7) {
        s.Approaching++;
      } else {
        s.Scheduled++;
      }
    });

    return s;
  }, [activeTasks, now]);

  const upcomingTasks = tasks
    .filter(t => t.deadline && t.status !== 'DONE')
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 3);

  const statusData = useMemo(() => {
    const counts = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([statusId, value]) => {
      const column = columns.find(c => c.id === statusId);
      return {
        name: column ? column.title : statusId.replace(/_/g, ' '),
        value
      };
    });
  }, [tasks, columns]);

  const COLORS = ['#0C66E4', '#579DFF', '#4BADE8', '#1D2125', '#B6C2CF', '#E2B203'];

  const getUrgencyColor = (label: string) => {
    switch (label) {
      case 'Overdue': return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]';
      case 'Imminent': return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]';
      case 'Approaching': return 'bg-blue-500';
      case 'Scheduled': return 'bg-slate-400';
      default: return 'bg-slate-300';
    }
  };

  return (
    <div className={`w-80 h-full flex flex-col border-l transition-all animate-in slide-in-from-right duration-500 hidden xl:flex ${
      darkMode ? 'bg-[#1D2125] border-[#38414a]' : 'bg-white border-slate-200'
    }`}>
      {/* Header */}
      <div className="p-5 border-b">
        <h3 className={`text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 ${darkMode ? 'text-[#B6C2CF]' : 'text-slate-800'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tasks Overview
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-8">
        
        {/* Section: Timeline Health */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-[#8C9BAB]' : 'text-slate-400'}`}>Timeline Health</p>
            </div>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${darkMode ? 'bg-white/10 text-[#B6C2CF]' : 'bg-slate-100 text-slate-600'}`}>
              {activeTasks.length} {activeTasks.length === 1 ? 'Task' : 'Tasks'}
            </span>
          </div>
          <div className="space-y-4">
            {Object.entries(stats).map(([label, count]) => (
              <div key={label} className="space-y-1.5 group">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider opacity-70 group-hover:opacity-100 transition-opacity">
                  <span className={darkMode ? 'text-[#B6C2CF]' : 'text-slate-600'}>{label}</span>
                  <span className={darkMode ? 'text-white' : 'text-slate-900'}>{count}</span>
                </div>
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                  <div 
                    className={`h-full transition-all duration-700 ease-out ${getUrgencyColor(label)}`}
                    style={{ width: `${(Number(count) / Number(totalActive)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Phase Distribution */}
        <section>
          <div className="mb-2">
            <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-[#8C9BAB]' : 'text-slate-400'}`}>Phase Distribution</p>
          </div>
          <div className="h-48 w-full -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#22272B' : 'rgba(255, 255, 255, 0.95)', 
                    border: darkMode ? '1px solid #38414a' : '1px solid #e2e8f0', 
                    borderRadius: '8px', 
                    color: darkMode ? '#B6C2CF' : '#334155',
                    fontSize: '10px',
                    padding: '4px 8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                  itemStyle={{ color: darkMode ? '#B6C2CF' : '#334155' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-2 justify-center px-2">
            {statusData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className={`text-[9px] font-bold uppercase tracking-tight ${darkMode ? 'text-[#B6C2CF]' : 'text-slate-600'}`}>{entry.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Deadlines */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-[#8C9BAB]' : 'text-slate-400'}`}>High Priority</p>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              {upcomingTasks.length}
            </span>
          </div>
          <div className="space-y-2">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map(task => (
                <div key={task.id} className={`p-3 rounded-xl border transition-all ${
                  darkMode ? 'bg-[#22272B] border-[#38414a] hover:bg-[#2C333A]' : 'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-sm'
                }`}>
                  <p className={`text-[12px] font-bold mb-1 truncate ${darkMode ? 'text-[#B6C2CF]' : 'text-slate-800'}`}>{task.title}</p>
                  <div className={`flex items-center gap-1.5 opacity-60 ${darkMode ? 'text-white' : 'text-slate-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-tight">
                      {new Date(task.deadline!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                   {task.scope && (
                    <div className={`mt-2 flex`}>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                        getScopeColorConfig(task.scope, scopes)[darkMode ? 'dark' : 'light']
                      }`}>
                        {task.scope}
                      </span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className={`text-[11px] italic opacity-40 ${darkMode ? 'text-[#8C9BAB]' : 'text-slate-500'}`}>No imminent deadlines.</p>
            )}
          </div>
        </section>

        {/* Section: Activity Feed */}
        <section>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${darkMode ? 'text-[#8C9BAB]' : 'text-slate-400'}`}>Recent Activity</p>
          <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-500/20">
            {activities.length > 0 ? (
              activities.slice(0, 10).map((log) => {
                const isSuccess = log.type === 'success';
                const isDanger = log.type === 'danger';
                return (
                  <div key={log.id} className={`relative pl-8 py-2 pr-2 -ml-3 rounded-xl border transition-all duration-500 group ${
                    isSuccess 
                      ? (darkMode ? 'bg-green-900/10 border-green-500/20' : 'bg-green-50 border-green-200/60 shadow-sm') 
                      : isDanger
                        ? (darkMode ? 'bg-red-900/10 border-red-500/20' : 'bg-red-50 border-red-200/60 shadow-sm')
                        : 'border-transparent hover:bg-slate-100/50 dark:hover:bg-white/5'
                  }`}>
                    {/* Dot container - aligned to parent timeline line at 11px (container shifted -12px, dot at 12px) */}
                    <div className={`absolute left-3 top-2.5 w-[22px] h-[22px] rounded-full border-4 flex items-center justify-center z-10 transition-colors ${
                      darkMode ? 'bg-[#1D2125] border-[#1D2125]' : 'bg-white border-white'
                    } ${isSuccess ? (darkMode ? '!bg-transparent !border-transparent' : '!bg-green-50 !border-green-50') : isDanger ? (darkMode ? '!bg-transparent !border-transparent' : '!bg-red-50 !border-red-50') : ''}`}>
                      <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
                        isSuccess 
                          ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] scale-110' 
                          : isDanger
                            ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                            : (darkMode ? 'bg-[#0C66E4]' : 'bg-blue-600')
                      }`}></div>
                    </div>
                    <div className="flex flex-col">
                      <p className={`text-[11px] leading-snug transition-colors ${
                        isSuccess 
                          ? (darkMode ? 'text-green-400 font-bold' : 'text-green-800 font-bold')
                          : isDanger
                            ? (darkMode ? 'text-red-400 font-bold' : 'text-red-800 font-bold')
                            : (darkMode ? 'text-[#B6C2CF]' : 'text-slate-700')
                      }`}>
                        <span>{log.action}</span>
                        {log.taskTitle && <span className={`italic ml-1 opacity-70 font-normal`}>"{log.taskTitle}"</span>}
                      </p>
                      <span className={`text-[9px] font-bold uppercase tracking-tighter mt-1 transition-colors ${
                        isSuccess
                          ? (darkMode ? 'text-green-400/60' : 'text-green-600/60')
                          : isDanger
                            ? (darkMode ? 'text-red-400/60' : 'text-red-600/60')
                            : (darkMode ? 'text-[#8C9BAB] opacity-40' : 'text-slate-400 opacity-40')
                      }`}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className={`text-[11px] italic opacity-40 pl-7 ${darkMode ? 'text-[#8C9BAB]' : 'text-slate-500'}`}>Waiting for activity...</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default React.memo(ProjectHub);
