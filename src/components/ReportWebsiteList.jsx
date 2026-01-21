import React, { useState, useEffect } from 'react';
import { Globe, ArrowLeft, ExternalLink, Calendar, FileBarChart } from 'lucide-react';
import { apiClient, API } from '../config/api';
import { useAuditStore } from '../hooks/useAuditStore';

export const ReportWebsiteList = ({ selectedUser, onBack, onSelectWebsite, selectedDomain, setSelectedDomain }) => {
    const { targets } = useAuditStore();
    const [websites, setWebsites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (selectedUser) {
            apiClient.get(API.USERS.WEBSITES(selectedUser.id))
                .then(data => {
                    // Filter to only show completed audits
                    const completedAudits = data.filter(site =>
                        site.manual_audit_id && site.manual_audit_status === 'completed'
                    );
                    setWebsites(completedAudits);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Error fetching websites:', err);
                    setError('Failed to load websites');
                    setLoading(false);
                });
        }
    }, [selectedUser]);

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

        const siteDate = new Date(site.last_scanned_at);
        if (!acc[rootDomain].lastScanned || siteDate > acc[rootDomain].lastScanned) {
            acc[rootDomain].lastScanned = siteDate;
        }

        acc[rootDomain].pages.push(site);
        return acc;
    }, {});

    const toggleDomain = (domainName) => {
        const domainGroup = Object.values(groupedWebsites).find(g => g.domain === domainName);
        if (domainGroup) {
            setSelectedDomain(domainGroup);
        }
    };

    const domainList = Object.values(groupedWebsites).sort((a, b) => b.lastScanned - a.lastScanned);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[40px] border border-slate-100">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Reports...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-2">
                <div className="flex items-center gap-4">
                    <button
                        onClick={selectedDomain ? () => setSelectedDomain(null) : onBack}
                        className="p-3 hover:bg-slate-100 rounded-2xl transition-all group"
                    >
                        <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 group-hover:-translate-x-1 transition-all" />
                    </button>
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                            Reports
                        </h2>
                        {selectedDomain && (
                            <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg border border-slate-200 mt-1">
                                {selectedUser?.email || selectedUser?.username}
                            </span>
                        )}
                    </div>
                </div>
                {!selectedDomain && (
                    <div className="inline-flex self-start sm:self-auto px-4 py-2 bg-emerald-50 rounded-full text-emerald-600 text-xs sm:text-sm font-bold border border-emerald-100">
                        {domainList.length} Domains • {websites.length} Reports
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-6">
                {!selectedDomain ? (
                    // Domain List View
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {domainList.map((group, idx) => (
                            <div
                                key={idx}
                                onClick={() => setSelectedDomain(group)}
                                className="group relative bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200 transition-all cursor-pointer flex flex-col items-center text-center gap-4"
                            >
                                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
                                    <Globe className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors mb-1">
                                        {group.domain}
                                    </h3>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        {group.pages.length} Reports Available
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Page List View for Selected Domain
                    <div className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-sm">
                        <div className="flex flex-col">
                            {selectedDomain.pages.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-slate-400 font-bold">No reports found for this domain.</p>
                                </div>
                            ) : (
                                selectedDomain.pages.map((site, pIdx) => {
                                    const dateStr = new Date(site.last_scanned_at || site.created_at).toLocaleDateString();
                                    const timeStr = new Date(site.last_scanned_at || site.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                                    return (
                                        <div
                                            key={pIdx}
                                            className={`flex items-center justify-between py-6 ${pIdx !== selectedDomain.pages.length - 1 ? 'border-b border-slate-100' : ''}`}
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

                                            <button
                                                onClick={() => onSelectWebsite(site, site.manual_audit_id, 'report')}
                                                className="px-8 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition min-w-[140px] text-center bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                                            >
                                                <FileBarChart className="w-3 h-3" />
                                                View Report
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>

            {websites.length === 0 && (
                <div className="text-center py-16 sm:py-24 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                    <FileBarChart className="w-12 h-12 sm:w-16 sm:h-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">No reports available</h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto px-6">
                        This user doesn't have any completed audits yet. Complete an audit to generate a report.
                    </p>
                </div>
            )}
        </div>
    );
};
