
import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Task, Column, ActivityLog, Organization, JoinCode, Profile } from '../types';
import { Session } from '@supabase/supabase-js';

const DEFAULT_COLUMNS: Column[] = [
  { id: 'TODO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'REVIEW', title: 'Review' },
  { id: 'DONE', title: 'Done' }
];

export function useJeera(session: Session | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [scopes, setScopes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Organization State
  const [myOrgs, setMyOrgs] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);

  // Profile State
  const [profile, setProfile] = useState<Profile | null>(null);

  // Initial Fetch & Org Resolution
  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    const initWorkspace = async () => {
      setLoading(true);

      // 1. Fetch Profile (and create if missing)
      let userProfile = null;
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();

      if (profileData) {
        userProfile = profileData;
      } else {
        const emailName = session.user.email?.split('@')[0] || 'User';
        const { data: newProfile } = await supabase.from('profiles').insert([{ id: session.user.id, username: emailName }]).select().single();
        userProfile = newProfile;
      }
      setProfile(userProfile);

      // 2. Fetch Organizations
      const { data: orgData } = await supabase.from('organizations').select('*');
      const { data: membershipData } = await supabase.from('organization_members').select('organization_id, role').eq('user_id', session.user.id);

      let enhancedOrgs: Organization[] = [];
      if (orgData && membershipData) {
        enhancedOrgs = orgData
          .filter(o => membershipData.some(m => m.organization_id === o.id))
          .map(o => ({
            ...o,
            role: membershipData.find(m => m.organization_id === o.id)?.role || 'member'
          }));
      }

      // 3. Auto-Create Personal Workspace if None Exists
      if (enhancedOrgs.length === 0) {
        const workspaceName = 'My Workspace';
        const { data: newOrg } = await supabase.from('organizations').insert([{
          name: workspaceName,
          owner_id: session.user.id
        }]).select().single();

        if (newOrg) {
          await supabase.from('organization_members').insert([{ organization_id: newOrg.id, user_id: session.user.id, role: 'leader' }]);
          const createdOrg = { ...newOrg, role: 'leader' };
          enhancedOrgs = [createdOrg];
        }
      }

      setMyOrgs(enhancedOrgs);

      // 4. Resolve Current Org
      let activeOrg = null;
      const lastOrgId = localStorage.getItem('zenjira_last_org');
      if (lastOrgId) {
        activeOrg = enhancedOrgs.find(o => o.id === lastOrgId) || null;
      }
      if (!activeOrg && enhancedOrgs.length > 0) {
        activeOrg = enhancedOrgs[0];
      }

      if (activeOrg) {
        localStorage.setItem('zenjira_last_org', activeOrg.id);
      }
      setCurrentOrg(activeOrg);

      // 5. Fetch Data for Active Org
      if (activeOrg) {
        await fetchOrgData(activeOrg.id);
      } else {
        setLoading(false);
      }
    };

    initWorkspace();

  }, [session?.user?.id]);

  const resolveTaskWithProfile = async (task: Task) => {
    if (!task.assignee_id) return task;

    // Check if we already have the profile in our tasks list (naive cache)
    const existing = tasks.find(t => t.assignee_id === task.assignee_id && t.assignee);
    if (existing?.assignee) {
      return { ...task, assignee: existing.assignee };
    }

    // Otherwise fetch it
    const { data } = await supabase.from('profiles').select('*').eq('id', task.assignee_id).single();
    return { ...task, assignee: data || undefined };
  };

  // Realtime Subscriptions
  useEffect(() => {
    if (!currentOrg) return;

    const channel = supabase.channel(`org_room:${currentOrg.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `organization_id=eq.${currentOrg.id}`
      }, async (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;

        if (eventType === 'INSERT') {
          const taskWithProfile = await resolveTaskWithProfile(newRecord as Task);
          setTasks(prev => {
            if (prev.some(t => t.id === taskWithProfile.id)) return prev;
            return [...prev, taskWithProfile];
          });
        } else if (eventType === 'UPDATE') {
          const updatedRecord = newRecord as Task;

          setTasks(prev => prev.map(t => {
            if (t.id === updatedRecord.id) {
              // If assignee changed, we might need to fetch profile, but since we are inside a map it's hard to async.
              // IMPORTANT: Ideally we should async fetch outside then set state. 
              // But for simple "move task" updates (which are 99% of updates), assignee doesn't change.
              // So we keep the old assignee object if the ID is the same.
              const keptAssignee = (t.assignee_id === updatedRecord.assignee_id) ? t.assignee : undefined;
              return { ...updatedRecord, assignee: keptAssignee };
            }
            return t;
          }));

          // Lazy fetch if assignee changed and we lost the profile object
          if (updatedRecord.assignee_id) {
            // We can't easily check previous state here without complexity. 
            // So we just run a detached resolver that checks if the state has a missing profile for this ID.
            resolveTaskWithProfile(updatedRecord).then(resolved => {
              setTasks(prev => prev.map(t => t.id === resolved.id && !t.assignee ? resolved : t));
            });
          }

        } else if (eventType === 'DELETE') {
          setTasks(prev => prev.filter(t => t.id !== oldRecord.id));
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'activities',
        filter: `organization_id=eq.${currentOrg.id}`
      }, async (payload) => {
        const newAct = payload.new as ActivityLog;

        if (newAct.user_id === session?.user?.id) return;

        let username = 'Unknown';
        // Optimization: Check if we already know this user
        const knownUser = tasks.find(t => t.assignee_id === newAct.user_id && t.assignee)?.assignee;

        if (knownUser) {
          username = knownUser.username;
        } else {
          // Fallback to fetch
          const { data: p } = await supabase.from('profiles').select('username').eq('id', newAct.user_id).single();
          username = p?.username || 'Unknown';
        }

        setActivities(prev => [{ ...newAct, username }, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentOrg?.id, profile?.username]);

  // Effect to refetch when switching Orgs
  useEffect(() => {
    if (currentOrg) fetchOrgData(currentOrg.id);
  }, [currentOrg?.id]);


  const fetchOrgData = async (orgId: string, showLoading = true) => {
    if (showLoading) setLoading(true);

    // 1. Parallel Fetching of Core Data
    const [tasksRes, colsRes, scopeRes, actRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('organization_id', orgId).order('created_at', { ascending: true }),
      supabase.from('columns').select('*').eq('organization_id', orgId).order('position', { ascending: true }),
      supabase.from('scopes').select('*').eq('organization_id', orgId).order('created_at', { ascending: true }),
      supabase.from('activities').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(50)
    ]);

    // 2. Process Tasks & Collect Profile IDs
    const tasksData = tasksRes.data;
    const profileIds = new Set<string>();
    let hydratedTasks: Task[] = [];

    if (tasksData) {
      tasksData.forEach(t => { if (t.assignee_id) profileIds.add(t.assignee_id); });
    }

    // 3. Process Activities & Collect Profile IDs
    const actData = actRes.data;
    if (actData) {
      actData.forEach(a => { if (a.user_id) profileIds.add(a.user_id); });
    }

    // 4. Batch Fetch Profiles (Optimization: Single query for all needed users)
    const profileMap = new Map<string, Profile>();
    if (profileIds.size > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', Array.from(profileIds));
      if (profiles) {
        profiles.forEach(p => profileMap.set(p.id, p));
      }
    }

    // 5. Hydrate Tasks
    if (tasksData) {
      hydratedTasks = tasksData.map(t => ({
        ...t,
        assignee: t.assignee_id ? profileMap.get(t.assignee_id) : undefined
      }));
      setTasks(hydratedTasks);
    }

    // 6. Hydrate Activities
    if (actData) {
      const hydratedActs = actData.map(a => ({
        ...a,
        username: a.username || profileMap.get(a.user_id)?.username || 'Unknown'
      }));
      setActivities(hydratedActs as ActivityLog[]);
    }

    // 7. Process Columns (with Default Seeding)
    const colsData = colsRes.data;
    if (colsData && colsData.length > 0) {
      setColumns(colsData);
    } else {
      // Seed Defaults for new Org
      const defaults = DEFAULT_COLUMNS.map((c, i) => ({ ...c, user_id: session!.user.id, position: i, organization_id: orgId }));
      await supabase.from('columns').insert(defaults);
      setColumns(DEFAULT_COLUMNS.map(c => ({ ...c, organization_id: orgId } as Column))); // Optimistic
    }

    // 8. Process Scopes
    const scopeData = scopeRes.data;
    if (scopeData) setScopes(scopeData.map(s => s.title));

    setLoading(false);
  };


  // --- CRUD Operations (Unified) ---

  const addTask = useCallback(async (task: Partial<Task>) => {
    if (!session || !currentOrg) return;
    const cleanTask = {
      ...task,
      organization_id: currentOrg.id,
      user_id: session.user.id,
      assignee_id: task.assignee_id || session.user.id // Default to creator
    };
    if (cleanTask.deadline === '') delete cleanTask.deadline;

    // Optimistic
    const tempId = 'temp-' + Date.now();
    setTasks(prev => [...prev, { ...cleanTask, id: tempId, created_at: new Date().toISOString() } as Task]);

    const { data } = await supabase.from('tasks').insert([cleanTask]).select().single();
    if (data) {
      setTasks(prev => {
        if (prev.some(t => t.id === data.id)) {
          return prev.filter(t => t.id !== tempId);
        }
        return prev.map(t => t.id === tempId ? data : t);
      });
    }
  }, [session, currentOrg]);

  const updateTask = useCallback(async (task: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...task } as Task : t)); // Optimistic

    // Remove complex objects (assignee) before sending to DB
    const { assignee, ...dbTask } = task;
    await supabase.from('tasks').update(dbTask).eq('id', task.id);
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await supabase.from('tasks').delete().eq('id', id);
  }, []);

  const moveTask = useCallback(async (id: string, newStatus: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
  }, []);

  const addColumn = useCallback(async (title: string) => {
    if (!currentOrg || !session) return;
    const newCol = {
      id: title.toUpperCase().replace(/\s+/g, '_'),
      title,
      user_id: session.user.id,
      position: columns.length,
      organization_id: currentOrg.id
    };
    setColumns(prev => [...prev, newCol]);
    await supabase.from('columns').insert([newCol]);
  }, [currentOrg, session, columns.length]);

  const deleteColumn = useCallback(async (id: string) => {
    setColumns(prev => prev.filter(c => c.id !== id));
    await supabase.from('columns').delete().eq('id', id);
  }, []);

  const updateColumn = useCallback(async (id: string, title: string) => {
    setColumns(prev => prev.map(c => c.id === id ? { ...c, title } : c));
    await supabase.from('columns').update({ title }).eq('id', id);
  }, []);

  const reorderColumns = useCallback(async (newColumns: Column[]) => {
    setColumns(newColumns);
    for (let i = 0; i < newColumns.length; i++) {
      await supabase.from('columns').update({ position: i }).eq('id', newColumns[i].id);
    }
  }, []);

  const addScope = useCallback(async (title: string) => {
    if (!currentOrg || !session) return;
    setScopes(prev => [...prev, title]);
    await supabase.from('scopes').insert([{ title, organization_id: currentOrg.id, user_id: session.user.id }]);
  }, [currentOrg, session]);

  const deleteScope = useCallback(async (title: string) => {
    setScopes(prev => prev.filter(s => s !== title));
    await supabase.from('scopes').delete().eq('title', title).eq('organization_id', currentOrg?.id);
  }, [currentOrg]);

  const renameScope = useCallback(async (oldTitle: string, newTitle: string) => {
    setScopes(prev => prev.map(s => s === oldTitle ? newTitle : s));
    setTasks(prev => prev.map(t => t.scope === oldTitle ? { ...t, scope: newTitle } : t));
    await supabase.from('scopes').update({ title: newTitle }).eq('title', oldTitle).eq('organization_id', currentOrg?.id);
  }, [currentOrg]);

  const addActivity = useCallback(async (action: string, taskTitle?: string, type: 'success' | 'danger' | 'neutral' = 'neutral') => {
    if (!session || !currentOrg) return;
    const tempId = 'temp-' + Date.now();
    const newActivity = {
      user_id: session.user.id,
      action,
      task_title: taskTitle,
      type,
      organization_id: currentOrg.id,
      username: profile?.username || 'User'
    };

    // Optimistic
    setActivities(prev => [{ ...newActivity, id: tempId, created_at: new Date().toISOString() } as ActivityLog, ...prev]);

    // Finalize
    const { data } = await supabase.from('activities').insert([newActivity]).select().single();
    if (data) {
      setActivities(prev => prev.map(a => a.id === tempId ? { ...a, id: data.id } : a));
    }
  }, [session, currentOrg, profile]);

  // --- Org Management (Simplified) ---

  const createOrg = useCallback(async (name: string) => {
    if (!session) return;
    const { data: org } = await supabase.from('organizations').insert([{ name, owner_id: session.user.id }]).select().single();
    if (org) {
      await supabase.from('organization_members').insert([{ organization_id: org.id, user_id: session.user.id, role: 'leader' }]);
      const newOrg = { ...org, role: 'leader' };
      setMyOrgs(prev => [...prev, newOrg]);
      setCurrentOrg(newOrg);
    }
    return org;
  }, [session]);

  const switchOrg = useCallback((org: Organization | null) => {
    if (org) {
      setCurrentOrg(org);
      localStorage.setItem('zenjira_last_org', org.id);
    }
  }, []);

  // Profile
  const updateProfile = useCallback(async (username: string) => {
    if (!session) return;
    setProfile(prev => ({ ...prev, id: session.user.id, username }));
    await supabase.from('profiles').upsert({ id: session.user.id, username });
  }, [session]);

  // Team Features (Passthrough)
  const fetchMembers = useCallback(async () => {
    if (!currentOrg) return [];
    const { data } = await supabase.from('organization_members').select('*').eq('organization_id', currentOrg.id);
    if (!data) return [];
    const userIds = data.map(m => m.user_id);
    const { data: profs } = await supabase.from('profiles').select('*').in('id', userIds);
    const map = new Map(profs?.map(p => [p.id, p]));
    return data.map(m => ({ ...m, profile: map.get(m.user_id) || { username: 'Unknown' } }));
  }, [currentOrg]);

  const deleteOrg = useCallback(async () => {
    if (!currentOrg) return;
    const { error } = await supabase.rpc('delete_organization', { org_id: currentOrg.id });
    if (error) { throw error; }
    setMyOrgs(prev => prev.filter(o => o.id !== currentOrg.id));
    setCurrentOrg(myOrgs.find(o => o.id !== currentOrg.id) || null);
  }, [currentOrg, myOrgs]);

  const updateOrgName = useCallback(async (name: string) => {
    if (!currentOrg) return;
    setMyOrgs(prev => prev.map(o => o.id === currentOrg.id ? { ...o, name } : o));
    setCurrentOrg(prev => prev ? { ...prev, name } : null);
    await supabase.from('organizations').update({ name }).eq('id', currentOrg.id);
  }, [currentOrg]);

  const joinOrg = useCallback(async (code: string) => {
    const { data } = await supabase.rpc('join_team_via_code', { code_input: code });
    if (data.success) {
      const { data: org } = await supabase.from('organizations').select('*').eq('id', data.org_id).single();
      if (org) {
        const newOrg = { ...org, role: 'member' };
        setMyOrgs(prev => [...prev, newOrg]);
        setCurrentOrg(newOrg);
      }
    }
    return data;
  }, []);

  const createInvite = useCallback(async (maxUses: number = 5, expiresInHours: number = 24) => {
    if (!currentOrg || currentOrg.role !== 'leader') return null;

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const { data } = await supabase.from('join_codes').insert([{
      code,
      organization_id: currentOrg.id,
      max_uses: maxUses,
      expires_at: expiresAt.toISOString()
    }]).select().single();

    return data;
  }, [currentOrg]);

  const fetchInvites = useCallback(async () => {
    if (!currentOrg || currentOrg.role !== 'leader') return [];
    const { data } = await supabase.from('join_codes').select('*').eq('organization_id', currentOrg.id);
    return data || [];
  }, [currentOrg]);

  const deleteInvite = useCallback(async (code: string) => {
    const { error } = await supabase.from('join_codes').delete().eq('code', code);
    if (error) {
      console.error("Error deleting invite:", error);
      alert("Failed to delete invite. Check permissions.");
    }
  }, []);

  const leaveOrg = useCallback(async (id: string) => {
    await supabase.from('organization_members').delete().eq('organization_id', id).eq('user_id', session?.user.id);
    const remaining = myOrgs.filter(o => o.id !== id);
    setMyOrgs(remaining);
    if (currentOrg?.id === id) setCurrentOrg(remaining[0] || null);
  }, [session?.user.id, myOrgs, currentOrg]);

  const removeMember = useCallback(async (uid: string) => { if (currentOrg) await supabase.from('organization_members').delete().eq('organization_id', currentOrg.id).eq('user_id', uid); }, [currentOrg]);
  const updateMemberRole = useCallback(async (uid: string, role: string) => { if (currentOrg) await supabase.from('organization_members').update({ role }).eq('organization_id', currentOrg.id).eq('user_id', uid); }, [currentOrg]);
  return useMemo(() => ({
    tasks, columns, activities, scopes, loading,
    addTask, updateTask, deleteTask, moveTask,
    addColumn, deleteColumn, updateColumn, reorderColumns,
    addScope, deleteScope, renameScope,
    addActivity,
    myOrgs, currentOrg, switchOrg, createOrg,
    updateOrgName,
    profile, updateProfile,
    joinOrg,
    createInvite,
    fetchInvites,
    deleteInvite,
    leaveOrg,
    fetchMembers,
    removeMember,
    updateMemberRole,
    deleteOrg
  }), [
    tasks, columns, activities, scopes, loading,
    addTask, updateTask, deleteTask, moveTask,
    addColumn, deleteColumn, updateColumn, reorderColumns,
    addScope, deleteScope, renameScope,
    addActivity,
    myOrgs, currentOrg, switchOrg, createOrg,
    updateOrgName,
    profile, updateProfile,
    joinOrg,
    createInvite,
    fetchInvites,
    deleteInvite,
    leaveOrg,
    fetchMembers,
    removeMember,
    updateMemberRole,
    deleteOrg
  ]);
}

