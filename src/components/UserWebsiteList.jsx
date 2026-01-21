import React, { useState, useEffect } from 'react';
import { Globe, ArrowLeft, ExternalLink, Calendar, BarChart2, ShieldCheck, ChevronDown } from 'lucide-react';
import { apiClient, API } from '../config/api';
import { useAuditStore } from '../hooks/useAuditStore';

export const UserWebsiteList = ({ selectedUser, onBack, onSelectWebsite, selectedDomain, setSelectedDomain }) => {
    const { targets } = useAuditStore();
    const [websites, setWebsites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (selectedUser) {
            apiClient.get(API.USERS.WEBSITES(selectedUser.id))
                .then(data => {
                    setWebsites(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Error fetching websites:', err);
                    setError('Failed to load websites');
                    setLoading(false);
                });
        }
    }, [selectedUser]);

    const [statusFilter, setStatusFilter] = useState('all');

    const groupedWebsites = websites.reduce((acc, site) => {
        const rawDomain = site.domain || 'Unknown Domain';
        const cleanDomain = rawDomain.replace(/^https?:\/\//, '');
        const rootDomain = cleanDomain.split('/')[0] || 'Unknown Domain';

        if (!acc[rootDomain]) {
            acc[rootDomain] = {
                domain: rootDomain,
                pages: [],
                lastScanned: null
            };
        }

        // Find manual audit specifically linked to this compliance scan
        const manualAudits = targets.filter(t => t.compliance_score_id === site.compliance_score_id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const siteDate = new Date(site.last_scanned_at || site.created_at);
        if (!acc[rootDomain].lastScanned || siteDate > acc[rootDomain].lastScanned) {
            acc[rootDomain].lastScanned = siteDate;
        }

        // Determine status from backend API response
        let status = 'Not started';
        if (site.manual_audit_status) {
            status = site.manual_audit_status === 'completed' ? 'Finished' : 'Resume';
        } else if (site.manual_audit_id) {
            // Fallback: if there's an audit ID but no status, default to Resume
            status = 'Resume';
        }

        acc[rootDomain].pages.push({
            ...site,
            manual_audits: manualAudits,
            currentStatus: status
        });
        return acc;
    }, {});

    const domainList = Object.values(groupedWebsites).sort((a, b) => b.lastScanned - a.lastScanned);

    // Find the active domain group correctly even if selectedDomain is passed as a minimal object from App.jsx
    const activeDomainGroup = selectedDomain
        ? Object.values(groupedWebsites).find(g => g.domain === (selectedDomain.domain || selectedDomain))
        : null;

    let displayedPages = activeDomainGroup ? activeDomainGroup.pages : [];
    if (statusFilter !== 'all') {
        displayedPages = displayedPages.filter(p => p.currentStatus === statusFilter);
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[40px] border border-slate-100">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Scanned Sites...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-2">
                <div className="flex items-center gap-4">
                    <button
                        onClick={selectedDomain ? () => setSelectedDomain(null) : onBack}
                        className="p-3 hover:bg-slate-100 rounded-2xl transition-all group"
                    >
                        <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 group-hover:-translate-x-1 transition-all" />
                    </button>
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                            Audit Registry
                        </h2>
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg border border-slate-200 mt-1">
                            {selectedUser?.email || selectedUser?.username}
                        </span>
                    </div>
                </div>
                {!selectedDomain && websites.length > 0 && (
                    <div className="inline-flex self-start sm:self-auto px-4 py-2 bg-indigo-50 rounded-full text-indigo-600 text-xs sm:text-sm font-bold border border-indigo-100">
                        {domainList.length} Domains • {websites.length} Pages
                    </div>
                )}

                {selectedDomain && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
                        {['all', 'Not started', 'Resume', 'Finished'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setStatusFilter(filter)}
                                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border
                                    ${statusFilter === filter
                                        ? 'bg-cyan-400 text-white border-cyan-400 shadow-lg shadow-cyan-200'
                                        : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200 hover:border-slate-300'}`}
                            >
                                {filter === 'all' ? 'All' : filter}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-6">
                {!selectedDomain ? (
                    // Domain List View - Redesigned to match screenshot
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {domainList.map((group, idx) => (
                            <div
                                key={idx}
                                onClick={() => setSelectedDomain(group)}
                                className="group bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200 transition-all cursor-pointer flex items-center gap-5"
                            >
                                <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                                    <div className="w-5 h-5 border-2 border-slate-300 rounded group-hover:border-indigo-400"></div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                                        {group.domain}
                                    </h3>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                        {group.pages.length} Pages Scanned
                                    </div>
                                </div>
                                <div className="p-2 bg-slate-100 text-slate-400 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-all duration-300">
                                    <ExternalLink className="w-5 h-5" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Page List View for Selected Domain
                    <div className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-sm">
                        <div className="flex flex-col">
                            {displayedPages.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-slate-400 font-bold">No pages found for this filter.</p>
                                </div>
                            ) : (
                                displayedPages.map((site, pIdx) => {
                                    const latestManualAudit = site.manual_audits?.[0];
                                    const dateStr = new Date(site.last_scanned_at || site.created_at).toLocaleDateString();
                                    const timeStr = new Date(site.last_scanned_at || site.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                                    return (
                                        <div
                                            key={pIdx}
                                            className={`flex items-center justify-between py-6 ${pIdx !== displayedPages.length - 1 ? 'border-b border-slate-100' : ''}`}
                                        >
                                            <div className="flex items-center gap-6 flex-1 min-w-0">
                                                <div className="w-6 h-6 rounded border border-slate-300 flex-shrink-0"></div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-slate-700 text-sm truncate mb-0.5">
                                                        {site.page_url}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                        <span>Date: {dateStr}</span>
                                                        <span>Time: {timeStr}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {site.currentStatus === 'Finished' ? (
                                                    <>
                                                        <button
                                                            onClick={() => onSelectWebsite(site, latestManualAudit?.id, 'report')}
                                                            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                        >
                                                            View Report
                                                        </button>
                                                        <button
                                                            onClick={() => onSelectWebsite(site, latestManualAudit?.id, 'audit')}
                                                            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                        >
                                                            Edit
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => onSelectWebsite(site, latestManualAudit?.id)}
                                                        className={`px-8 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition min-w-[120px] text-center
                                                          ${site.currentStatus === 'Resume'
                                                                ? 'bg-[#D1E9FF] text-[#1D4ED8] hover:bg-[#B3D9FF]'
                                                                : 'bg-[#FF7A30] text-white hover:bg-[#E66928] shadow-lg shadow-orange-200'
                                                            }`}
                                                    >
                                                        {site.currentStatus}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>

            {
                websites.length === 0 && (
                    <div className="text-center py-16 sm:py-24 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                        <Globe className="w-12 h-12 sm:w-16 sm:h-16 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">No scans found</h3>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto px-6">
                            This user hasn't performed any accessibility scans in the WCAG-Compliance-Check tool yet.
                        </p>
                    </div>
                )
            }
        </div >
    );
};
