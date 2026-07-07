
import React, { useState, useEffect, useRef } from 'react';
import { Task, Column, ActivityLog } from './types';
import Board from './components/Board';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import TaskModal from './components/TaskModal';
import ProjectHub from './components/ProjectHub';
import ScopesManager from './components/ScopesManager';
import confetti from 'canvas-confetti';

const DEFAULT_COLUMNS: Column[] = [
  { id: 'TODO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'REVIEW', title: 'Review' },
  { id: 'DONE', title: 'Done' }
];

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('zenjira_tasks');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: '1',
        title: 'Design System Implementation',
        description: 'Create a reusable Tailwind component library for consistent UI.',
        status: 'IN_PROGRESS',
        createdAt: new Date().toISOString(),
        deadline: new Date(Date.now() + 86400000 * 5).toISOString()
      }
    ];
  });

  const [columns, setColumns] = useState<Column[]>(() => {
    const saved = localStorage.getItem('zenjira_columns');
    return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
  });

  const [activities, setActivities] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('zenjira_activities');
    return saved ? JSON.parse(saved) : [];
  });

  const [scopes, setScopes] = useState<string[]>(() => {
    const saved = localStorage.getItem('zenjira_scopes');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);

  const [view, setView] = useState<'board' | 'dashboard' | 'scopes'>('board');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Partial<Task>>({});
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('zenjira_theme') === 'dark';
  });



  useEffect(() => {
    localStorage.setItem('zenjira_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('zenjira_columns', JSON.stringify(columns));
  }, [columns]);

  useEffect(() => {
    localStorage.setItem('zenjira_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('zenjira_scopes', JSON.stringify(scopes));
  }, [scopes]);

  useEffect(() => {
    localStorage.setItem('zenjira_theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const addActivity = (action: string, taskTitle?: string, type: 'success' | 'danger' | 'neutral' = 'neutral') => {
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      action,
      taskTitle,
      type
    };
    setActivities(prev => [newLog, ...prev].slice(0, 1000)); // Keep last 1000 actions
  };

  const handleAddTask = () => {
    setCurrentTask({
      status: columns[0]?.id || 'TODO',
      deadline: ''
    });
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setCurrentTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    if (taskToDelete) addActivity("Deleted task", taskToDelete.title, 'danger');
  };

  const handleClearFinished = () => {
    const count = tasks.filter(t => t.status === 'DONE').length;
    setTasks(prev => prev.filter(t => t.status !== 'DONE'));
    addActivity(`Cleared ${count} completed tasks`, undefined, 'success');
  };

  const handleSaveTask = (taskToSave: Partial<Task>) => {
    if (!taskToSave.title) return;

    if (taskToSave.id) {
      setTasks(prev => prev.map(t => t.id === taskToSave.id ? { ...t, ...taskToSave } as Task : t));
      addActivity("Updated task", taskToSave.title);
    } else {
      const newTask: Task = {
        ...taskToSave as any,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      setTasks(prev => [...prev, newTask]);
      addActivity("Created task", newTask.title);
    }
    setIsModalOpen(false);
    setCurrentTask({});
  };


  const handleMoveTask = (id: string, newStatus: string) => {
    const task = tasks.find(t => t.id === id);
    const targetCol = columns.find(c => c.id === newStatus);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    if (task && targetCol) {
      const isDone = newStatus === 'DONE';
      addActivity(`Moved to ${targetCol.title}`, task.title, isDone ? 'success' : 'neutral');
      if (isDone) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          zIndex: 9999,
        });
      }
    }
  };

  const handleAddColumn = (title: string) => {
    const newCol: Column = {
      id: title.toUpperCase().replace(/\s+/g, '_'),
      title
    };
    setColumns(prev => [...prev, newCol]);
    addActivity("Added new phase", title);
  };

  const handleDeleteColumn = (id: string) => {
    const col = columns.find(c => c.id === id);
    setColumns(prev => prev.filter(c => c.id !== id));
    if (col) addActivity("Removed phase", col.title);
  };

  const handleRenameColumn = (id: string, title: string) => {
    setColumns(prev => prev.map(c => c.id === id ? { ...c, title } : c));
    addActivity("Renamed phase", title);
  };


  const handleMoveColumn = (draggedId: string, targetId: string) => {
    const draggedIndex = columns.findIndex(c => c.id === draggedId);
    const targetIndex = columns.findIndex(c => c.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) return;

    const newColumns = [...columns];
    const [draggedCol] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(targetIndex, 0, draggedCol);
    
    setColumns(newColumns);
  };

  const handleAddScope = (scope: string) => {
    if (!scopes.includes(scope)) {
      setScopes(prev => [...prev, scope]);
      addActivity("Created scope", scope);
    }
  };

  const handleDeleteScope = (scope: string) => {
    // 1. Remove from scopes list
    setScopes(prev => prev.filter(s => s !== scope));

    // 2. Remove scope from any tasks that have it
    setTasks(prev => prev.map(t => t.scope === scope ? { ...t, scope: undefined } : t));

    // 3. Remove from selected filters if present
    if (selectedScopes.includes(scope)) {
      setSelectedScopes(prev => prev.filter(s => s !== scope));
    }

    addActivity("Deleted scope", scope, 'danger');
  };

  const handleUpdateSelectedScopes = (newSelected: string[]) => {
    setSelectedScopes(newSelected);
  };

  const handleRenameScope = (oldScope: string, newScope: string) => {
    // 1. Update list of scopes
    setScopes(prev => prev.map(s => s === oldScope ? newScope : s));
    
    // 2. Update tasks that use this scope
    setTasks(prev => prev.map(t => t.scope === oldScope ? { ...t, scope: newScope } : t));

    // 3. Update selected filter if needed
    if (selectedScopes.includes(oldScope)) {
      setSelectedScopes(prev => prev.map(s => s === oldScope ? newScope : s));
    }

    addActivity("Renamed scope", `${oldScope} -> ${newScope}`);
  };



  return (
    <div className={`flex h-screen transition-colors duration-300 ${darkMode ? 'dark bg-[#101214]' : 'bg-[#EBECF0]'}`}>
      <Sidebar 
        view={view} 
        setView={setView} 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className={`border-b px-6 py-2 flex items-center justify-between shadow-sm z-10 transition-colors ${
          darkMode ? 'bg-[#1D2125] border-[#38414a] text-[#B6C2CF]' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center gap-4">
            <h1 className="text-[11px] font-bold uppercase tracking-widest opacity-80">Task Management</h1>
          </div>
        </header>

        <section className="flex-1 flex overflow-hidden">
          <div className="flex-1 p-4 overflow-hidden">
            {view === 'board' ? (
              <Board 
                tasks={tasks} 
                columns={columns}
                scopes={scopes}
                selectedScopes={selectedScopes}
                onUpdateSelectedScopes={handleUpdateSelectedScopes}
                onEditTask={handleEditTask} 
                onDeleteTask={handleDeleteTask}
                onMoveTask={handleMoveTask} 
                onAddTask={handleAddTask}
                onClearFinished={handleClearFinished}
                onAddColumn={handleAddColumn}
                onRenameColumn={handleRenameColumn}
                onDeleteColumn={handleDeleteColumn}
                onMoveColumn={handleMoveColumn}
                darkMode={darkMode}
              />
            ) : view === 'dashboard' ? (
              <Dashboard tasks={tasks} activities={activities} darkMode={darkMode} />
            ) : (
              <ScopesManager 
                scopes={scopes} 
                onAddScope={handleAddScope} 
                onDeleteScope={handleDeleteScope}
                onRenameScope={handleRenameScope}
                darkMode={darkMode}
              />
            )}
          </div>
          {view === 'board' && (
            <ProjectHub 
              tasks={tasks} 
              activities={activities}
              columns={columns}
              darkMode={darkMode} 
              scopes={scopes}
            />
          )}
        </section>
      </main>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialTask={currentTask}
        columns={columns}
        scopes={scopes}
        darkMode={darkMode}
        onSave={handleSaveTask}
      />
    </div>
  );
};

export default App;


