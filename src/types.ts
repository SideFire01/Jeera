
export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  deadline?: string | null;
  created_at: string; // Changed from createdAt to match DB
  scope?: string;
  assignee_id?: string;
  assignee?: Profile; // Joined
}

export interface Column {
  id: string;
  title: string;
}

export interface ActivityLog {
  id: string;
  created_at: string; 
  action: string;
  task_title?: string;
  type?: 'success' | 'danger' | 'neutral';
  organization_id?: string;
  user_id: string;
  username?: string;
}



export interface Organization {
  id: string;
  name: string;
  owner_id: string;
  role?: 'leader' | 'member';
}

export interface JoinCode {
  code: string;
  max_uses: number;
  used_count: number;
  expires_at?: string;
  organization_id: string;
}

export interface Profile {
  id: string;
  username: string;
}
