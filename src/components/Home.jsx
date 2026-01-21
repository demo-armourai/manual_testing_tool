import React from 'react';
import { Globe, BarChart, FileBarChart, Calendar } from 'lucide-react';
import { useAuditStore } from '../hooks/useAuditStore';

export const Home = ({ onSelectUser, onSelectWebsite }) => {
    const { recentComplianceChecks, userStats } = useAuditStore();

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
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
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        Recent Web Compliance Checks
                    </h2>
                    <div className="px-4 py-2 bg-indigo-50 rounded-full text-indigo-600 text-sm font-bold border border-indigo-100">
                        {recentComplianceChecks.length} Recent Scans
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
                                    {/*  */}
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        {check.auditor_display_name || check.auditor_name || 'System'}
                                    </span>
                                    <button
                                        onClick={() => onSelectWebsite(check, check.audit_id, check.status === 'completed' ? 'report' : 'audit')}
                                        disabled={check.status !== 'completed'}
                                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${check.status === 'completed'
                                            ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            }`}
                                    >
                                        <FileBarChart className="w-3 h-3" />
                                        {check.status === 'completed' ? 'Report' : 'Pending'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* User List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        User List
                    </h2>
                </div>

                {userStats.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                        <BarChart className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No users found</h3>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto px-6">
                            Team statistics will appear here once audits are started.
                        </p>
                    </div>
                ) : (
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
                                        <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                                            {user.display_name || user.username}
                                        </h3>
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
                                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter">Resume</span>
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
                )}
            </div>


        </div>
    );
};
