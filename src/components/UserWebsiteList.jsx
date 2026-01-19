import React, { useState, useEffect } from 'react';
import { Globe, ArrowLeft, ExternalLink, Calendar, BarChart2, ShieldCheck, ChevronDown } from 'lucide-react';
import { apiClient, API } from '../config/api';
import { useAuditStore } from '../hooks/useAuditStore';

export const UserWebsiteList = ({ selectedUser, onBack, onSelectWebsite }) => {
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

    const [expandedDomains, setExpandedDomains] = useState({});

    const toggleDomain = (domain) => {
        setExpandedDomains(prev => ({
            ...prev,
            [domain]: !prev[domain]
        }));
    };

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

        const siteDate = new Date(site.last_scanned_at);
        if (!acc[rootDomain].lastScanned || siteDate > acc[rootDomain].lastScanned) {
            acc[rootDomain].lastScanned = siteDate;
        }

        acc[rootDomain].pages.push({
            ...site,
            manual_audits: manualAudits
        });
        return acc;
    }, {});

    const domainList = Object.values(groupedWebsites).sort((a, b) => b.lastScanned - a.lastScanned);

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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-2">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-3 hover:bg-slate-100 rounded-2xl transition-all group"
                    >
                        <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 group-hover:-translate-x-1 transition-all" />
                    </button>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Audit Registry</h2>
                        <p className="text-slate-500 font-medium text-sm mt-0.5">Select a page to start or resume manual verification.</p>
                    </div>
                </div>
                <div className="inline-flex self-start sm:self-auto px-4 py-2 bg-indigo-50 rounded-full text-indigo-600 text-xs sm:text-sm font-bold border border-indigo-100">
                    {domainList.length} Domains • {websites.length} Pages
                </div>
            </div>

            <div className="flex flex-col gap-6">
                {domainList.map((group, idx) => {
                    const isExpanded = expandedDomains[group.domain];
                    return (
                        <div
                            key={idx}
                            className={`group relative bg-white border border-slate-200 rounded-[32px] overflow-hidden transition-all duration-300 hover:border-indigo-400 ${isExpanded ? 'shadow-xl shadow-indigo-500/5' : 'hover:shadow-lg'}`}
                        >
                            <div
                                onClick={() => toggleDomain(group.domain)}
                                className="p-6 sm:p-8 cursor-pointer hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 ${isExpanded ? 'bg-indigo-600 text-white' : ''}`}>
                                        <Globe className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                                            {group.domain}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                            <Calendar className="w-3 h-3" />
                                            Last scan: {group.lastScanned.toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 justify-between sm:justify-end">
                                    <div className={`p-2 rounded-xl transition-all duration-300 ${isExpanded ? 'bg-indigo-100 text-indigo-600 rotate-180' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
                                        <ChevronDown className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="px-6 pb-8 pt-0 animate-in slide-in-from-top-4 duration-300">
                                    <div className="h-px bg-slate-100 w-full mb-6"></div>
                                    <div className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-4 px-2">Scanned Pages ({group.pages.length})</div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {group.pages.map((site, pIdx) => {
                                            const latestManualAudit = site.manual_audits?.[0];
                                            return (
                                                <div
                                                    key={pIdx}
                                                    onClick={() => onSelectWebsite(site, latestManualAudit?.id)}
                                                    className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-indigo-50 hover:border-indigo-200 hover:translate-x-1 transition-all cursor-pointer group/item"
                                                >
                                                    <div className="flex flex-col gap-3 w-full">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1 min-w-0 mr-4">
                                                                <div className="font-bold text-slate-800 text-sm truncate mb-0.5">
                                                                    {site.page_name || 'Home Page'}
                                                                </div>
                                                                <div className="text-[10px] font-mono text-slate-500 truncate">
                                                                    {site.page_url}
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-1.5">
                                                                    <Calendar className="w-3 h-3 text-slate-400" />
                                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                                        Scanned: {new Date(site.last_scanned_at).toLocaleString()}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                {latestManualAudit && (
                                                                    <div className="flex flex-col items-end">
                                                                        <div className={`text-[10px] font-black px-1.5 py-0.5 rounded border mb-1 ${latestManualAudit.score >= 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : latestManualAudit.score >= 70 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                                                            {latestManualAudit.score}%
                                                                        </div>
                                                                        <div className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter">
                                                                            {latestManualAudit.tested_count || 0}/{latestManualAudit.total_count || 78} Tested
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onSelectWebsite(site, latestManualAudit?.id);
                                                                    }}
                                                                    className={`flex-none px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition shadow-lg ${latestManualAudit
                                                                        ? 'bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 shadow-indigo-500/5'
                                                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                                                                        }`}
                                                                >
                                                                    {latestManualAudit ? 'Resume Audit' : 'Start Audit'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {websites.length === 0 && (
                <div className="text-center py-16 sm:py-24 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                    <Globe className="w-12 h-12 sm:w-16 sm:h-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">No scans found</h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto px-6">
                        This user hasn't performed any accessibility scans in the WCAG-Compliance-Check tool yet.
                    </p>
                </div>
            )}
        </div>
    );
};
