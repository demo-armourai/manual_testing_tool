import { useState } from 'react';
import { Edit2, Trash2, ExternalLink, Code, ChevronRight, ChevronDown, Globe, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuditStore } from '../hooks/useAuditStore';

export function FindingsList({ findings, onEditFinding, onAddFinding }) {
  const deleteFinding = useAuditStore(state => state.deleteFinding);
  const [expandedFindings, setExpandedFindings] = useState(new Set());
  const [expandedDomains, setExpandedDomains] = useState(new Set());
  const [expandedPages, setExpandedPages] = useState(new Set());

  const toggleExpanded = (id) => {
    const newExpanded = new Set(expandedFindings);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedFindings(newExpanded);
  };

  const toggleDomain = (domain) => {
    const newExpanded = new Set(expandedDomains);
    if (newExpanded.has(domain)) newExpanded.delete(domain);
    else newExpanded.add(domain);
    setExpandedDomains(newExpanded);
  };

  const togglePage = (pageKey) => {
    const newExpanded = new Set(expandedPages);
    if (newExpanded.has(pageKey)) newExpanded.delete(pageKey);
    else newExpanded.add(pageKey);
    setExpandedPages(newExpanded);
  };

  const getHostname = (url) => {
    try {
      if (!url) return 'Unknown Domain';
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname;
    } catch {
      return url;
    }
  };

  const groupedFindings = findings.reduce((acc, finding) => {
    const domain = getHostname(finding.url);
    const page = finding.page || 'Unknown Page';

    if (!acc[domain]) acc[domain] = {};
    if (!acc[domain][page]) acc[domain][page] = [];

    acc[domain][page].push(finding);
    return acc;
  }, {});

  const SEVERITY_ORDER = { 'Critical': 4, 'Serious': 3, 'Moderate': 2, 'Minor': 1 };

  // Sort findings within each group
  Object.values(groupedFindings).forEach(pages => {
    Object.values(pages).forEach(pageFindings => {
      pageFindings.sort((a, b) => (SEVERITY_ORDER[b.severity] || 0) - (SEVERITY_ORDER[a.severity] || 0));
    });
  });

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'Critical':
        return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500';
      case 'Serious':
        return 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-500';
      case 'Moderate':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500';
      case 'Minor':
        return 'bg-slate-50 text-slate-600 border-slate-200 ring-slate-400';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200 ring-slate-400';
    }
  };

  if (!findings || findings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[32px] text-center max-w-4xl mx-auto">
        <div className="p-4 bg-white rounded-2xl shadow-sm mb-6">
          <AlertCircle className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-2">No findings yet</h3>
        <p className="text-slate-500 text-base max-w-sm mx-auto">
          Findings will appear here as you mark success criteria as "Fail" during your audits.
        </p>
        <button
          onClick={onAddFinding}
          className="mt-8 flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-200"
        >
          <Edit2 className="w-4 h-4" />
          Create First Finding
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-6 px-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-1.5 sm:p-2 rounded-xl bg-indigo-600 text-white flex-shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Findings Registry
            </h2>
          </div>
          <p className="text-slate-500 text-sm sm:text-base md:text-lg">
            Manage and track all accessibility issues across your scanned domains.
          </p>
        </div>
        <button
          onClick={onAddFinding}
          className="inline-flex self-start sm:self-auto px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-bold shadow-lg shadow-indigo-200 text-sm"
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Add Finding
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {Object.entries(groupedFindings).map(([domain, pages], dIdx) => {
          const isDomainExpanded = expandedDomains.has(domain);
          return (
            <div
              key={domain}
              className={`bg-white border border-slate-200 rounded-[32px] overflow-hidden transition-all duration-300 ${isDomainExpanded ? 'shadow-xl shadow-indigo-500/5 border-indigo-200' : 'hover:border-slate-300 active:scale-[0.99]'}`}
            >
              {/* Domain Header */}
              <div
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 cursor-pointer transition-colors ${isDomainExpanded ? 'bg-slate-50/50' : 'hover:bg-slate-50/30'}`}
                onClick={() => toggleDomain(domain)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 bg-indigo-50 text-indigo-600 rounded-2xl transition-all duration-500 ${isDomainExpanded ? 'bg-indigo-600 text-white' : ''}`}>
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900">{domain}</h4>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {Object.keys(pages)?.length || 0} pages • {Object.values(pages)?.flat()?.length || 0} total findings
                    </div>
                  </div>
                </div>

                <div className={`ml-auto p-2 rounded-xl transition-all duration-300 ${isDomainExpanded ? 'bg-indigo-100 text-indigo-600 rotate-180' : 'bg-slate-100 text-slate-400'}`}>
                  <ChevronDown className="w-6 h-6" />
                </div>
              </div>

              {/* Pages & Findings List */}
              {isDomainExpanded && (
                <div className="animate-in slide-in-from-top-4 duration-300">
                  <div className="h-px bg-slate-100 w-full mx-6" />
                  <div className="p-4 sm:p-6 space-y-6">
                    {Object.entries(pages).map(([pageName, pageFindings]) => {
                      const pageKey = `${domain}-${pageName}`;
                      const isPageExpanded = expandedPages.has(pageKey);

                      return (
                        <div key={pageKey} className="bg-slate-50/50 rounded-3xl border border-slate-100 overflow-hidden">
                          {/* Page Header */}
                          <div
                            className={`flex items-center justify-between p-4 px-6 cursor-pointer hover:bg-slate-100/50 transition-colors ${isPageExpanded ? 'bg-slate-100/30' : ''}`}
                            onClick={() => togglePage(pageKey)}
                          >
                            <div className="flex items-center gap-3">
                              {isPageExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                              <h5 className="font-bold text-slate-700 text-sm uppercase tracking-wide">{pageName}</h5>
                            </div>
                            <span className="text-xs font-black text-indigo-600 bg-white border border-slate-100 px-2.5 py-1 rounded-full">{pageFindings.length}</span>
                          </div>

                          {/* Findings within Page */}
                          {isPageExpanded && (
                            <div className="p-4 sm:p-6 space-y-4 bg-white/50 border-t border-slate-100">
                              {pageFindings.map(finding => {
                                const isExpanded = expandedFindings.has(finding.id);
                                const style = getSeverityStyle(finding.severity);
                                return (
                                  <div
                                    key={finding.id}
                                    className={`bg-white border border-slate-200 rounded-2xl transition-all duration-200 leading-relaxed ${isExpanded ? 'shadow-lg border-indigo-200' : 'hover:border-indigo-300 hover:translate-x-1'}`}
                                  >
                                    <div className="p-4 sm:p-5 flex flex-col gap-4 cursor-pointer" onClick={() => toggleExpanded(finding.id)}>
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex flex-wrap items-center gap-3 mb-3">
                                            <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${style}`}>
                                              {finding.severity}
                                            </span>
                                            <div className="flex flex-wrap gap-2 text-[10px] font-mono font-bold text-indigo-500 uppercase">
                                              {(finding.scIds || []).map(id => (
                                                <span key={id} className="bg-indigo-50 px-2 py-0.5 rounded borde border-indigo-100">{id}</span>
                                              ))}
                                            </div>
                                          </div>
                                          <h3 className="text-base font-bold text-slate-800 leading-snug group-hover:text-indigo-600 mb-2">
                                            {finding.description}
                                          </h3>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={(e) => { e.stopPropagation(); onEditFinding(finding); }}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                          >
                                            <Edit2 className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); if (confirm('Delete this finding?')) deleteFinding(finding.id); }}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                          {finding.component && (
                                            <span className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-md text-slate-500 border border-slate-200">
                                              {finding.component}
                                            </span>
                                          )}
                                          <span>{new Date(finding.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-full">
                                          {isExpanded ? 'Hide Details' : 'View Details'}
                                        </div>
                                      </div>
                                    </div>

                                    {isExpanded && (
                                      <div className="px-5 pb-6 space-y-5 animate-in slide-in-from-top-2 duration-300">
                                        <div className="h-px bg-slate-100 w-full" />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                          <div className="space-y-4">
                                            <div>
                                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Detailed Description</span>
                                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 whitespace-pre-wrap">
                                                {finding.description}
                                              </div>
                                            </div>

                                            {finding.notes && (
                                              <div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Auditor Notes</span>
                                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-sm text-slate-700 italic">
                                                  {finding.notes}
                                                </div>
                                              </div>
                                            )}
                                          </div>

                                          <div className="space-y-4">
                                            <div>
                                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">URL Location</span>
                                              <a href={finding.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 p-3 px-4 bg-white border border-slate-200 rounded-2xl text-indigo-600 hover:border-indigo-400 font-bold text-xs truncate max-w-full transition-all group">
                                                {finding.url}
                                                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                              </a>
                                            </div>

                                            {finding.domSnippet && (
                                              <div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 flex items-center gap-1.5">
                                                  <Code className="w-3.5 h-3.5" /> DOM Snippet
                                                </span>
                                                <pre className="p-4 bg-slate-900 text-slate-50 rounded-2xl text-[11px] font-mono overflow-x-auto border border-slate-800 shadow-xl leading-relaxed">
                                                  {finding.domSnippet}
                                                </pre>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
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
    </div>
  );
}
