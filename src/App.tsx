
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';
import Auth from './components/Auth';
import { JeeraProvider, useJeeraContext } from './contexts/JeeraContext';

// Components
import { Task, Column, ActivityLog } from './types';
import Board from './components/Board';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import TaskModal from './components/TaskModal';
import ProjectHub from './components/ProjectHub';
import ScopesManager from './components/ScopesManager';
import ProfileDropdown from './components/ProfileDropdown';
import confetti from 'canvas-confetti';

const JeeraApp: React.FC<{ session: Session }> = ({ session }) => {
  // Now we consume context instead of hook directly
  const {
    tasks, columns, activities, scopes, loading,
    addTask, updateTask, deleteTask, moveTask,
    addColumn, deleteColumn, updateColumn, reorderColumns,
    addScope, deleteScope, renameScope,
    addActivity,
    // Org props (Consumed by Sidebar internally now, but some might be needed)
    // Org props (Consumed by Sidebar internally now, but some might be needed)
    currentOrg,
    // Profile
    profile, updateProfile, fetchMembers
  } = useJeeraContext();

  const [selectedScopes, setSelectedScopes] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tags = params.get('tags');
      return tags ? tags.split(',') : [`assignee:${session.user.id}`];
    }
    return [`assignee:${session.user.id}`];
  });

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [view, setView] = useState<'board' | 'dashboard' | 'scopes'>('board');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Partial<Task>>({});

  // Theme State (Local UI state, not needed in context yet)
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('zenjira_theme') === 'dark';
  });

  // Fetch Members for Assignee usage
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    if (currentOrg && fetchMembers) {
      fetchMembers().then(setMembers);
    }
  }, [currentOrg, fetchMembers]);

  const handleAddTask = React.useCallback(() => {
    setCurrentTask({
      status: columns[0]?.id || 'TODO',
      deadline: undefined,
      assignee_id: session.user.id // Default to current user
    });
    setIsModalOpen(true);
  }, [columns, session.user.id]);

  const handleEditTask = React.useCallback((task: Task) => {
    setCurrentTask(task);
    setIsModalOpen(true);
  }, []);

  const handleDeleteTask = React.useCallback(async (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    await deleteTask(id);
    if (taskToDelete) addActivity("Deleted task", taskToDelete.title, 'danger');
  }, [tasks, deleteTask, addActivity]);

  const finishedColumnId = columns.length > 0 ? columns[columns.length - 1].id : null;

  const handleClearFinished = React.useCallback(async () => {
    if (!finishedColumnId) return;
    const finishedTasks = tasks.filter(t => t.status === finishedColumnId);
    for (const t of finishedTasks) {
      await deleteTask(t.id);
    }
    addActivity(`Cleared ${finishedTasks.length} completed tasks`, undefined, 'success');
  }, [finishedColumnId, tasks, deleteTask, addActivity]);

  const handleSaveTask = React.useCallback(async (taskToSave: Partial<Task>) => {
    if (!taskToSave.title) return;

    if (taskToSave.id) {
      await updateTask(taskToSave);
      addActivity("Updated task", taskToSave.title);
    } else {
      await addTask(taskToSave);
      addActivity("Created task", taskToSave.title);
    }
    setIsModalOpen(false);
    setCurrentTask({});
  }, [updateTask, addTask, addActivity]);

  const handleMoveTask = React.useCallback((id: string, newStatus: string) => {
    const task = tasks.find(t => t.id === id);
    const targetCol = columns.find(c => c.id === newStatus);

    moveTask(id, newStatus);

    if (task && targetCol) {
      const isDone = finishedColumnId ? newStatus === finishedColumnId : false;
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
  }, [tasks, columns, moveTask, finishedColumnId, addActivity]);

  const handleAddColumn = React.useCallback(async (title: string) => {
    addColumn(title);
    addActivity("Added new phase", title);
  }, [addColumn, addActivity]);

  const handleDeleteColumn = React.useCallback((id: string) => {
    const col = columns.find(c => c.id === id);
    deleteColumn(id);
    if (col) addActivity("Removed phase", col.title);
  }, [columns, deleteColumn, addActivity]);

  const handleRenameColumn = React.useCallback((id: string, title: string) => {
    updateColumn(id, title);
    addActivity("Renamed phase", title);
  }, [updateColumn, addActivity]);

  const handleMoveColumn = React.useCallback((draggedId: string, targetId: string) => {
    const draggedIndex = columns.findIndex(c => c.id === draggedId);
    const targetIndex = columns.findIndex(c => c.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) return;

    const newColumns = [...columns];
    const [draggedCol] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(targetIndex, 0, draggedCol);

    reorderColumns(newColumns);
  }, [columns, reorderColumns]);

  const handleAddScope = React.useCallback((scope: string) => {
    addScope(scope);
    addActivity("Created tag", scope);
  }, [addScope, addActivity]);

  const handleDeleteScope = React.useCallback((scope: string) => {
    deleteScope(scope);
    if (selectedScopes.includes(scope)) {
      setSelectedScopes(prev => prev.filter(s => s !== scope));
    }
    addActivity("Deleted tag", scope, 'danger');
  }, [deleteScope, selectedScopes, addActivity]);

  const handleUpdateSelectedScopes = React.useCallback((newSelected: string[]) => {
    setSelectedScopes(newSelected);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (newSelected.length > 0) {
        params.set('tags', newSelected.join(','));
      } else {
        params.delete('tags');
      }
      const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const handleRenameScope = React.useCallback((oldScope: string, newScope: string) => {
    renameScope(oldScope, newScope);
    if (selectedScopes.includes(oldScope)) {
      setSelectedScopes(prev => prev.map(s => s === oldScope ? newScope : s));
    }
    addActivity("Renamed tag", `${oldScope} -> ${newScope}`);
  }, [renameScope, selectedScopes, addActivity]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#EBECF0]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }



  return (
    <div className={`flex h-screen transition-colors duration-300 ${darkMode ? 'dark bg-[#101214]' : 'bg-[#EBECF0]'}`}>
      <Sidebar
        view={view}
        setView={setView}
        darkMode={darkMode}
      // Sidebar now consumes its own data from Context!
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className={`border-b px-6 py-2 flex items-center justify-between shadow-sm z-10 transition-colors ${darkMode ? 'bg-[#1D2125] border-[#38414a] text-[#B6C2CF]' : 'bg-white border-slate-200 text-slate-900'
          }`}>
          <div className="flex items-center gap-4">
            <h1 className="text-[11px] font-bold uppercase tracking-widest opacity-80">Task Management Board</h1>
          </div>

          <div className="relative">
            <button
              id="profile-trigger-btn"
              onClick={() => setIsProfileOpen(prev => !prev)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors text-xs font-medium border shadow-sm ${darkMode
                  ? 'bg-blue-900/10 border-blue-500/20 text-blue-100 hover:bg-blue-900/20'
                  : 'bg-blue-50/50 border-blue-200 text-slate-800 hover:bg-blue-50'
                } ${isProfileOpen ? (darkMode ? 'bg-blue-900/20' : 'bg-blue-50 border-blue-300') : ''}`}
            >
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold">
                {(profile?.username || session.user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="opacity-80 max-w-[100px] truncate">
                {profile?.username || session.user.email?.split('@')[0] || 'User'}
              </span>
            </button>
            <ProfileDropdown
              isOpen={isProfileOpen}
              onClose={() => setIsProfileOpen(false)}
              currentUsername={profile?.username}
              userEmail={session.user.email}
              onUpdateProfile={async (name) => {
                await updateProfile(name);
              }}
              darkMode={darkMode}
              toggleTheme={() => {
                const newVal = !darkMode;
                setDarkMode(newVal);
                localStorage.setItem('zenjira_theme', newVal ? 'dark' : 'light');
              }}
              onSignOut={() => supabase.auth.signOut()}
            />
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
                finishedColumnId={finishedColumnId}
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
                currentOrg={currentOrg}
                members={members}
              />
            ) : view === 'dashboard' ? (
              <Dashboard
                tasks={tasks}
                columns={columns}
                activities={activities}
                finishedColumnId={finishedColumnId}
                darkMode={darkMode}
              />
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
              finishedColumnId={finishedColumnId}
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
        members={members}
        darkMode={darkMode}
        onSave={handleSaveTask}
      />
    </div>
  );
};

// Main Entry Point
const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return <Auth />;
  }

  return (
    <JeeraProvider session={session}>
      <JeeraApp session={session} />
    </JeeraProvider>
  );
};

export default App;
