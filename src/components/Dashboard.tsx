
import React, { useMemo, useState } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  ResponsiveContainer, Tooltip, Cell 
} from 'recharts';
import { Task, ActivityLog, Column } from '../types';

interface DashboardProps {
  tasks: Task[];
  columns: Column[];
  finishedColumnId: string | null;
  activities: ActivityLog[];
  darkMode: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ tasks, columns, finishedColumnId, activities, darkMode }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('7d');

  const productivityData = useMemo(() => {
    let days = 7;
    // Dynamic X-axis formatting based on range
    let dateFormat: Intl.DateTimeFormatOptions = { weekday: 'short' };

    if (timeRange === '30d') {
      days = 30;
      dateFormat = { day: 'numeric', month: 'short' };
    }
    if (timeRange === '90d') {
      days = 90;
      dateFormat = { day: 'numeric', month: 'short' };
    }
    if (timeRange === '1y') {
      days = 365;
      dateFormat = { month: 'short' };
    }

    const dates = Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return dates.map(date => {
      const count = activities.filter(a => a.created_at?.startsWith(date)).length;
      return {
        date: new Date(date).toLocaleDateString('en-US', dateFormat),
        fullDate: date,
        actions: count
      };
    });
  }, [activities, timeRange]);



  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Productivity Trends (Left Column) */}
        <div className={`p-6 rounded-xl shadow-sm border transition-colors flex flex-col ${
          darkMode ? 'bg-[#1D2125] border-[#38414a]' : 'bg-white border-slate-200'
        }`}>
          <div className="mb-6 flex items-start justify-between">
             <div>
               <h3 className={`text-lg font-bold ${darkMode ? 'text-[#B6C2CF]' : 'text-slate-800'}`}>Productivity Trends</h3>
               <p className={`text-xs mt-1 ${darkMode ? 'text-[#8C9BAB]' : 'text-slate-500'}`}>Activity volume over time</p>
             </div>
             
             {/* Time Range Selector */}
             <div className={`flex p-1 rounded-lg border ${darkMode ? 'bg-[#22272B] border-[#38414a]' : 'bg-slate-50 border-slate-200'}`}>
                {(['7d', '30d', '90d', '1y'] as const).map(range => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${
                      timeRange === range 
                        ? (darkMode ? 'bg-[#0C66E4] text-white shadow-sm' : 'bg-white text-blue-600 shadow-sm') 
                        : (darkMode ? 'text-[#8C9BAB] hover:bg-white/5' : 'text-slate-500 hover:bg-slate-200/50')
                    }`}
                  >
                    {range === '7d' ? '1W' : range === '30d' ? '1M' : range === '90d' ? '3M' : '1Y'}
                  </button>
                ))}
             </div>
          </div>
          <div className="h-64 mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productivityData}>
                <defs>
                  <linearGradient id="colorActions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0C66E4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0C66E4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#38414a' : '#e2e8f0'} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: darkMode ? '#8C9BAB' : '#64748b', fontSize: 11 }} 
                  dy={10}
                />
                <YAxis 
                  hide={true} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#22272B' : 'rgba(255, 255, 255, 0.95)', 
                    border: darkMode ? '1px solid #38414a' : '1px solid #e2e8f0', 
                    borderRadius: '8px', 
                    color: darkMode ? '#B6C2CF' : '#334155',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{ color: '#0C66E4' }}
                  cursor={{ stroke: darkMode ? '#579DFF' : '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="actions" 
                  stroke="#0C66E4" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorActions)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#0C66E4' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Focus History */}
        <div className={`p-6 rounded-xl shadow-sm border transition-colors flex flex-col ${
          darkMode ? 'bg-[#1D2125] border-[#38414a]' : 'bg-white border-slate-200'
        }`}>
           <div className="mb-6">
             <h3 className={`text-lg font-bold ${darkMode ? 'text-[#B6C2CF]' : 'text-slate-800'}`}>Focus Performance</h3>
             <p className={`text-xs mt-1 ${darkMode ? 'text-[#8C9BAB]' : 'text-slate-500'}`}>Weekly completion rate (Last 6 weeks)</p>
           </div>
           
           <div className="h-48 mt-auto">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={useMemo(() => {
                  const weeks = [];
                  for (let i = 5; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - (i * 7));
                    const weekStart = new Date(d);
                    weekStart.setDate(d.getDate() - d.getDay()); // Sunday
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);

                    // Count completions in this week
                    const completed = activities.filter(a => {
                      if (!a.created_at) return false;
                      const ad = new Date(a.created_at);
                      return ad >= weekStart && ad <= weekEnd && a.type === 'success' && a.action.startsWith('Moved to');
                    }).length;

                    // Count creations in this week
                    const created = activities.filter(a => {
                      if (!a.created_at) return false;
                      const ad = new Date(a.created_at);
                      return ad >= weekStart && ad <= weekEnd && (a.action === 'Created task' || a.action.startsWith('Created tag')); 
                      // Note: 'Created scope' isn't task but activity log is mixed. 
                      // Ideally we filter strictly for task creations if log messages were structured better.
                      // 'Created task' handles standard create.
                    }).length;

                    const total = completed + created;
                    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
                    
                    weeks.push({
                      name: `W${getWeekNumber(weekStart)}`,
                      rate: rate,
                      completed: completed
                    });
                  }
                  
                  function getWeekNumber(d: Date) {
                      d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
                      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
                      var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
                      var weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
                      return weekNo;
                  }

                  return weeks;
               }, [activities])}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#38414a' : '#e2e8f0'} />
                 <XAxis 
                   dataKey="name" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: darkMode ? '#8C9BAB' : '#64748b', fontSize: 11 }} 
                   dy={10}
                 />
                 <Tooltip 
                   cursor={{fill: darkMode ? '#2C333A' : '#F1F5F9'}}
                   content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className={`px-3 py-2 rounded-lg shadow-lg border ${darkMode ? 'bg-[#22272B] border-[#38414a] text-[#B6C2CF]' : 'bg-white border-slate-200 text-slate-700'}`}>
                            <p className="text-xs font-bold mb-1">{payload[0].payload.name}</p>
                            <p className="text-[10px] opacity-70">Rate: <span className="font-bold">{payload[0].value}%</span></p>
                            <p className="text-[10px] opacity-70">Done: <span className="font-bold">{payload[0].payload.completed} tasks</span></p>
                          </div>
                        );
                      }
                      return null;
                   }}
                 />
                 <Bar dataKey="rate" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {Array.from({length: 6}).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={darkMode ? '#0C66E4' : '#3B82F6'} fillOpacity={0.8 + (index * 0.05)} />
                    ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Right Column (Metrics + Task Aging) */}
        <div className={`p-6 rounded-xl shadow-sm border transition-colors ${
          darkMode ? 'bg-[#1D2125] border-[#38414a]' : 'bg-white border-slate-200'
        }`}>
          <h3 className={`text-lg font-bold mb-6 ${darkMode ? 'text-[#B6C2CF]' : 'text-slate-800'}`}>Project Health</h3>
          <div className="flex flex-col gap-6">
            
            {/* Executive Metrics Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border transition-colors ${
                darkMode ? 'bg-[#22272B] border-[#38414a]' : 'bg-slate-50 border-slate-200'
              }`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-[#8C9BAB]' : 'text-slate-400'}`}>Total Tasks</p>
                <p className={`text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{tasks.length}</p>
              </div>
              <div className={`p-4 rounded-xl border transition-colors ${
                darkMode ? 'bg-[#1C2B41] border-[#0C66E4]/20' : 'bg-blue-50 border-blue-100'
              }`}>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-[#579DFF]' : 'text-blue-500'}`}>Progress</p>
                <p className={`text-3xl font-extrabold ${darkMode ? 'text-[#579DFF]' : 'text-blue-800'}`}>
                  {tasks.length > 0 ? Math.round((tasks.filter(t => finishedColumnId ? t.status === finishedColumnId : false).length / tasks.length) * 100) : 0}%
                </p>
              </div>
            </div>

            {/* Task Aging Section */}
            {/* Weekly Completion Rate Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-[#B6C2CF]' : 'text-slate-700'}`}>Weekly Focus</p>
                <span className={`text-[10px] ${darkMode ? 'text-[#8C9BAB]' : 'text-slate-400'}`}>Last 7 Days</span>
              </div>
              
              <div className={`p-5 rounded-xl border flex flex-col items-center justify-center h-40 ${
                darkMode ? 'bg-[#1C2B41]/50 border-[#0C66E4]/20' : 'bg-blue-50/50 border-blue-100'
              }`}>
                {(() => {
                   // Calculate metrics inline
                   const now = new Date();
                   const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                   
                   // Count completions from activity log
                   const completedInWeek = activities.filter(a => {
                       if (!a.created_at) return false;
                       const date = new Date(a.created_at);
                       return date >= oneWeekAgo && a.type === 'success' && a.action.startsWith('Moved to');
                   }).length;

                   // Active tasks (not done)
                   const activeTasks = tasks.filter(t => finishedColumnId ? t.status !== finishedColumnId : true).length;
                   
                   // Denominator: Active tasks now + tasks we finished this week. 
                   // This represents the "total plate" for the week.
                   const totalLoad = activeTasks + completedInWeek;
                   const rate = totalLoad === 0 ? 0 : Math.round((completedInWeek / totalLoad) * 100);

                   return (
                     <>
                        <div className="relative flex items-center justify-center mb-2">
                           <svg className="w-20 h-20 transform -rotate-90">
                             <circle
                               cx="40"
                               cy="40"
                               r="36"
                               stroke="currentColor"
                               strokeWidth="8"
                               fill="transparent"
                               className={`${darkMode ? 'text-[#22272B]' : 'text-slate-200'}`}
                             />
                             <circle
                               cx="40"
                               cy="40"
                               r="36"
                               stroke="currentColor"
                               strokeWidth="8"
                               fill="transparent"
                               strokeDasharray={2 * Math.PI * 36}
                               strokeDashoffset={2 * Math.PI * 36 * (1 - rate / 100)}
                               className={`${darkMode ? 'text-[#0C66E4]' : 'text-blue-600'} transition-all duration-1000 ease-out`}
                               strokeLinecap="round"
                             />
                           </svg>
                           <span className={`absolute text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                             {rate}%
                           </span>
                        </div>
                        <p className={`text-xs font-medium text-center ${darkMode ? 'text-[#8C9BAB]' : 'text-slate-500'}`}>
                          You've finished <strong className={darkMode ? 'text-[#B6C2CF]' : 'text-slate-700'}>{completedInWeek}</strong> tasks this week
                        </p>
                     </>
                   );
                })()}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
