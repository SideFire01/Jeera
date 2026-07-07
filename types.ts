
export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  deadline?: string;
  createdAt: string;
  scope?: string;
}

export interface Column {
  id: string;
  title: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  taskTitle?: string;
  type?: 'success' | 'danger' | 'neutral';
}


