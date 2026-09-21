import { AuthUser } from '../types';

const USERS_STORAGE_KEY = 'dwl_analytics_users';
const SESSION_STORAGE_KEY = 'dwl_analytics_session';

export const INITIAL_AUTHORIZED_USERS: AuthUser[] = [
  {
    id: 'user-admin-1',
    username: 'admin',
    name: 'MD Shahadat Hossen',
    role: 'admin',
    password: 'admin',
    designation: 'Lead Architect & Administrator',
    avatarColor: 'from-amber-500 to-indigo-600',
    canEdit: true,
    canUpload: true,
    createdAt: '2026-01-01'
  },
  {
    id: 'user-shahadat',
    username: 'shahadat',
    name: 'MD Shahadat Hossen',
    role: 'admin',
    password: 'dwl',
    designation: 'Executive Director & Chief Analyst',
    avatarColor: 'from-cyan-500 to-blue-600',
    canEdit: true,
    canUpload: true,
    createdAt: '2026-01-01'
  },
  {
    id: 'user-manager-1',
    username: 'manager',
    name: 'Retail Inventory Manager',
    role: 'manager',
    password: '123',
    designation: 'Branch Stock & Supply Manager',
    avatarColor: 'from-emerald-500 to-teal-600',
    canEdit: true,
    canUpload: true,
    createdAt: '2026-01-15'
  },
  {
    id: 'user-analyst-1',
    username: 'analyst',
    name: 'Outlet Sales Analyst',
    role: 'analyst',
    password: '123',
    designation: 'Commercial Performance Analyst',
    avatarColor: 'from-purple-500 to-pink-600',
    canEdit: false,
    canUpload: false,
    createdAt: '2026-02-01'
  }
];

export function getStoredUsers(): AuthUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_AUTHORIZED_USERS));
      return INITIAL_AUTHORIZED_USERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_AUTHORIZED_USERS;
  } catch (e) {
    console.error('Failed to read users from localStorage:', e);
    return INITIAL_AUTHORIZED_USERS;
  }
}

export function saveStoredUsers(users: AuthUser[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users:', e);
  }
}

export function getCurrentSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function setCurrentSession(user: AuthUser | null): void {
  try {
    if (!user) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } else {
      // Don't store plain password in active session object
      const safeUser = { ...user };
      delete safeUser.password;
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(safeUser));
    }
  } catch (e) {
    console.error('Failed to set session:', e);
  }
}

export function authenticateUser(username: string, password: string): { success: boolean; user?: AuthUser; error?: string } {
  const users = getStoredUsers();
  const cleanUsername = username.trim().toLowerCase();
  const cleanPassword = password.trim();

  const found = users.find(u => u.username.toLowerCase() === cleanUsername);

  if (!found) {
    return { success: false, error: 'Username not recognized. Access restricted to authorized personnel.' };
  }

  if (found.password && found.password !== cleanPassword) {
    return { success: false, error: 'Incorrect password. Please verify your credentials.' };
  }

  return { success: true, user: found };
}

export function addAuthorizedUser(newUser: {
  username: string;
  name: string;
  role: 'admin' | 'manager' | 'analyst';
  password: string;
  designation?: string;
}): { success: boolean; error?: string; user?: AuthUser } {
  const users = getStoredUsers();
  const cleanUsername = newUser.username.trim().toLowerCase();

  if (!cleanUsername || !newUser.password) {
    return { success: false, error: 'Username and password are required.' };
  }

  if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
    return { success: false, error: `User with username "${cleanUsername}" already exists.` };
  }

  const roleColors: Record<string, string> = {
    admin: 'from-amber-500 to-indigo-600',
    manager: 'from-emerald-500 to-teal-600',
    analyst: 'from-purple-500 to-blue-600'
  };

  const user: AuthUser = {
    id: `user-${Date.now()}`,
    username: cleanUsername,
    name: newUser.name.trim() || cleanUsername,
    role: newUser.role,
    password: newUser.password.trim(),
    designation: newUser.designation?.trim() || `${newUser.role.toUpperCase()} User`,
    avatarColor: roleColors[newUser.role] || 'from-blue-500 to-cyan-500',
    canEdit: newUser.role !== 'analyst',
    canUpload: newUser.role !== 'analyst',
    createdAt: new Date().toISOString().split('T')[0]
  };

  const updated = [...users, user];
  saveStoredUsers(updated);
  return { success: true, user };
}

export function deleteAuthorizedUser(userId: string): { success: boolean; error?: string } {
  const users = getStoredUsers();
  // Prevent deleting the primary admin
  const user = users.find(u => u.id === userId);
  if (user?.username === 'admin' || user?.username === 'shahadat') {
    return { success: false, error: 'The primary administrator account cannot be deleted.' };
  }

  const updated = users.filter(u => u.id !== userId);
  saveStoredUsers(updated);
  return { success: true };
}

export function updateUserProfile(userId: string, updates: { name?: string; designation?: string }): { success: boolean; error?: string; user?: AuthUser } {
  const users = getStoredUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) {
    return { success: false, error: 'User not found.' };
  }

  users[index] = {
    ...users[index],
    ...(updates.name ? { name: updates.name.trim() } : {}),
    ...(updates.designation ? { designation: updates.designation.trim() } : {})
  };

  saveStoredUsers(users);
  
  // Also update session if it's the current user
  const session = getCurrentSession();
  if (session && session.id === userId) {
    setCurrentSession(users[index]);
  }

  return { success: true, user: users[index] };
}

export function changeUserPassword(userId: string, currentPass: string, newPass: string): { success: boolean; error?: string } {
  const users = getStoredUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) {
    return { success: false, error: 'User not found.' };
  }

  const user = users[index];
  if (user.password && user.password !== currentPass.trim()) {
    return { success: false, error: 'Current password is incorrect.' };
  }

  if (!newPass || newPass.trim().length < 3) {
    return { success: false, error: 'New password must be at least 3 characters long.' };
  }

  users[index] = {
    ...users[index],
    password: newPass.trim()
  };

  saveStoredUsers(users);
  return { success: true };
}

