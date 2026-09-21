import React, { useState } from 'react';
import {
  X,
  Users,
  UserPlus,
  ShieldCheck,
  Trash2,
  KeyRound,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import { AuthUser, UserRole } from '../types';
import {
  getStoredUsers,
  addAuthorizedUser,
  deleteAuthorizedUser
} from '../utils/authEngine';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [users, setUsers] = useState<AuthUser[]>(getStoredUsers());
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('manager');
  const [newDesignation, setNewDesignation] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const refreshUsers = () => {
    setUsers(getStoredUsers());
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const res = addAuthorizedUser({
      username: newUsername,
      name: newName,
      role: newRole,
      password: newPassword,
      designation: newDesignation
    });

    if (res.success) {
      setSuccessMessage(`User "${newUsername}" successfully authorized!`);
      setNewUsername('');
      setNewName('');
      setNewPassword('');
      setNewDesignation('');
      setIsAddingUser(false);
      refreshUsers();
      setTimeout(() => setSuccessMessage(''), 4000);
    } else {
      setErrorMessage(res.error || 'Failed to add user.');
    }
  };

  const handleDelete = (userId: string, username: string) => {
    if (confirm(`Are you sure you want to revoke access for user "${username}"?`)) {
      const res = deleteAuthorizedUser(userId);
      if (res.success) {
        refreshUsers();
      } else {
        alert(res.error || 'Failed to remove user.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Authorized Access Control</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  {users.length} Active Users
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Manage accounts allowed to login, inspect redistribution data, and execute transfers.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Notifications */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 flex items-center gap-2 text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 flex items-center gap-2 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Current User Role Notice */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white uppercase">
                {currentUser?.username.substring(0, 2) || 'AU'}
              </div>
              <div>
                <span className="text-slate-400">Logged in as:</span>{' '}
                <strong className="text-white">{currentUser?.name}</strong>{' '}
                <span className="text-cyan-400 font-mono">(@{currentUser?.username})</span>
                <div className="text-[11px] text-slate-400">
                  Role: <span className="capitalize font-semibold text-slate-200">{currentUser?.role}</span> • {currentUser?.designation}
                </div>
              </div>
            </div>

            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setIsAddingUser(!isAddingUser)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isAddingUser ? 'Cancel' : 'Add New User'}</span>
              </button>
            )}
          </div>

          {/* Add User Form if toggled */}
          {isAddingUser && (
            <form onSubmit={handleAddSubmit} className="bg-slate-950 p-4 rounded-2xl border border-indigo-900/60 space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                <UserPlus className="w-4 h-4" />
                <span>Grant System Access to New Employee / Colleague</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. rahim, outlet_dhaka"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Abdur Rahim"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Set access password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Designation / Branch</label>
                  <input
                    type="text"
                    placeholder="e.g. Gulshan Outlet Manager"
                    value={newDesignation}
                    onChange={(e) => setNewDesignation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-300">Security Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="admin">Administrator (Full Control, User Management & Uploads)</option>
                    <option value="manager">Inventory Manager (Can execute transfers & download PO)</option>
                    <option value="analyst">Analyst / Read-Only (Can view dashboards & charts)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Save & Authorize User
                </button>
              </div>
            </form>
          )}

          {/* List of Authorized Users */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Authorized Personnel List ({users.length})
            </h4>

            <div className="space-y-2">
              {users.map((u) => {
                const isPrimaryAdmin = u.username === 'admin' || u.username === 'shahadat';
                return (
                  <div
                    key={u.id}
                    className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center font-extrabold text-white shrink-0">
                        {u.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm truncate">{u.name}</span>
                          <span className="text-xs font-mono text-cyan-400">@{u.username}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            u.role === 'admin'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : u.role === 'manager'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          }`}>
                            {u.role}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 truncate mt-0.5">
                          {u.designation || 'Authorized User'} • Password: <span className="font-mono text-slate-300">••••••</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isPrimaryAdmin ? (
                        <span className="text-[11px] text-amber-400/80 font-medium px-2 py-1 rounded bg-amber-950/40 border border-amber-900/60 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          System Owner
                        </span>
                      ) : currentUser?.role === 'admin' ? (
                        <button
                          onClick={() => handleDelete(u.id, u.username)}
                          className="p-2 rounded-xl text-red-400 hover:text-white hover:bg-red-950/80 transition-colors cursor-pointer"
                          title="Revoke Access"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">Authorized</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between text-xs text-slate-400">
          <span>DWL Analytics Security Engine • Developed by MD Shahadat Hossen</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
