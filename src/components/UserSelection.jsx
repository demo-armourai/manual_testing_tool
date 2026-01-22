import React, { useState, useEffect } from 'react';
import { Users, Search, ChevronRight, User } from 'lucide-react';
import { apiClient, API } from '../config/api';

export const UserSelection = ({ onSelectUser }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        apiClient.get(API.USERS.LIST)
            .then(data => {
                setUsers(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching users:', err);
                setError('Failed to load users');
                setLoading(false);
            });
    }, []);

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.display_name && user.display_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <div className="rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-slate-600 font-medium">Loading users...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-xl">
                <p className="text-rose-600 font-medium">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 text-indigo-600 font-semibold hover:underline"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 sm:p-6">
            <div className="mb-8 text-center px-4">
                <div className="inline-flex p-3 rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
                    <Users className="w-8 h-8" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                    Select a User
                </h2>
                <p className="text-slate-500 text-sm sm:text-lg">
                    Choose a user to view report
                </p>
            </div>

            <div className="relative mb-8 max-w-md mx-auto px-2">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                />
            </div>

            <div className="flex flex-col gap-4">
                {filteredUsers.map(user => (
                    <div
                        key={user.id}
                        onClick={() => onSelectUser(user)}
                        className="group relative bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer overflow-hidden flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                <User className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate text-lg">
                                    {user.display_name || user.username}
                                </h3>
                                <p className="text-sm text-slate-500 truncate mt-0.5">@{user.username}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    </div>
                ))}
            </div>

            {filteredUsers.length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200 mt-8 mx-4">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium px-4">No users found matching "{searchTerm}"</p>
                </div>
            )}
        </div >
    );
};
