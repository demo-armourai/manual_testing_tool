import React, { useState, useEffect } from 'react';
import { Globe, BarChart, FileBarChart, Calendar, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuditStore } from '../hooks/useAuditStore';

export const Home = ({ onSelectUser, onSelectWebsite }) => {
    const {
        recentComplianceChecks,
        userStats,
        recentScansMeta,
        userStatsMeta,
        fetchRecentScans,
        fetchUserStats
    } = useAuditStore();

    const [searchTerm, setSearchTerm] = useState('');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUserStats(1, userStatsMeta.limit, searchTerm);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm, fetchUserStats]);

    const handleRecentScansPageChange = (newPage) => {
        if (newPage >= 1 && newPage <= recentScansMeta.totalPages) {
            fetchRecentScans(newPage, recentScansMeta.limit);
        }
    };

    const handleUserStatsPageChange = (newPage) => {
        if (newPage >= 1 && newPage <= userStatsMeta.totalPages) {
            fetchUserStats(newPage, userStatsMeta.limit, searchTerm);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">
                    Welcome to WCAG Auditor
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Professional accessibility compliance auditing platform for WCAG 2.1 standards
                </p>
            </div>

            {/* Recent Web Compliance Checks */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        Recent Web Compliance Checks
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-indigo-50 rounded-full text-indigo-600 text-sm font-bold border border-indigo-100">
                            {recentScansMeta.total} Total Scans
                        </div>
                    </div>
                </div>

                {recentComplianceChecks.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                        <Globe className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No recent scans</h3>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto px-6">
                            Scan results will appear here once you complete a compliance check.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recentComplianceChecks.map((check) => (
                                <div
                                    key={check.id}
                                    onClick={() => onSelectWebsite(check, check.audit_id, 'audit')}
                                    className="group relative bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200 transition-all cursor-pointer flex flex-col gap-4"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate mb-1">
                                                {check.page_name || check.domain}
                                            </h3>
                                            <p className="text-xs text-slate-500 font-mono truncate mb-2">{check.url}</p>
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(check.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            {check.auditor_display_name || check.auditor_name || 'System'}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectWebsite(check, check.audit_id, check.status === 'completed' ? 'report' : 'audit');
                                            }}
                                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${check.status === 'completed'
                                                ? 'bg-emerald-500 text-white shadow-sm'
                                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                                }`}
                                        >
                                            <FileBarChart className="w-3 h-3" />
                                            {check.status === 'completed' ? 'Finished' : 'Pending'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Recent Scans Pagination */}
                        {recentScansMeta.totalPages > 1 && (
                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                <p className="text-sm text-slate-500">
                                    Showing page <span className="font-bold text-slate-900">{recentScansMeta.page}</span> of <span className="font-bold text-slate-900">{recentScansMeta.totalPages}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleRecentScansPageChange(recentScansMeta.page - 1)}
                                        disabled={recentScansMeta.page === 1}
                                        className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleRecentScansPageChange(recentScansMeta.page + 1)}
                                        disabled={recentScansMeta.page === recentScansMeta.totalPages}
                                        className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* User List */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        User List
                    </h2>
                    <div className="relative max-w-md w-full sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm font-medium"
                        />
                    </div>
                </div>

                {userStats.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                        <BarChart className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                            {searchTerm ? 'No matching users found' : 'No users found'}
                        </h3>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto px-6">
                            {searchTerm
                                ? `No users match "${searchTerm}"`
                                : 'Team statistics will appear here once audits are started.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex flex-col gap-4">
                            {userStats.map((user) => (
                                <div
                                    key={user.id}
                                    onClick={() => onSelectUser(user)}
                                    className="group relative bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                            <BarChart className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                                                    {user.display_name || user.username}
                                                </h3>
                                                {user.last_active && (
                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] uppercase font-bold rounded-full">
                                                        Active {new Date(user.last_active).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-grow max-w-2xl">
                                        <div className="flex flex-col items-center justify-center px-4 py-2 bg-slate-50 rounded-xl">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Total test</span>
                                            <span className="text-sm font-black text-slate-900">{user.total_tests}</span>
                                        </div>
                                        <div className="flex flex-col items-center justify-center px-4 py-2 bg-slate-50 rounded-xl">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Not started</span>
                                            <span className="text-sm font-black text-slate-700">{user.not_started}</span>
                                        </div>
                                        <div className="flex flex-col items-center justify-center px-4 py-2 bg-amber-50 rounded-xl">
                                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter">In Progress</span>
                                            <span className="text-sm font-black text-amber-700">{user.in_progress}</span>
                                        </div>
                                        <div className="flex flex-col items-center justify-center px-4 py-2 bg-emerald-50 rounded-xl">
                                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Finished</span>
                                            <span className="text-sm font-black text-emerald-700">{user.finished}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* User List Pagination */}
                        {userStatsMeta.totalPages > 1 && (
                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                <p className="text-sm text-slate-500">
                                    Showing page <span className="font-bold text-slate-900">{userStatsMeta.page}</span> of <span className="font-bold text-slate-900">{userStatsMeta.totalPages}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleUserStatsPageChange(userStatsMeta.page - 1)}
                                        disabled={userStatsMeta.page === 1}
                                        className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleUserStatsPageChange(userStatsMeta.page + 1)}
                                        disabled={userStatsMeta.page === userStatsMeta.totalPages}
                                        className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
