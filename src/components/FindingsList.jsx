import { useState } from 'react';
import { Edit2, Trash2, ExternalLink, Code, ChevronRight, ChevronDown, Globe } from 'lucide-react';
import { useAuditStore } from '../hooks/useAuditStore';
export function FindingsList({ findings, onEditFinding, onAddFinding }) {
  const deleteFinding = useAuditStore(state => state.deleteFinding);
  const [expandedFindings, setExpandedFindings] = useState(new Set());
  const toggleExpanded = (id) => {
    const newExpanded = new Set(expandedFindings);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    }
    else {
      newExpanded.add(id);
    }
    setExpandedFindings(newExpanded);
  };

  const [expandedDomains, setExpandedDomains] = useState(new Set());

  const toggleDomain = (domain) => {
    const newExpanded = new Set(expandedDomains);
    if (newExpanded.has(domain)) newExpanded.delete(domain);
    else newExpanded.add(domain);
    setExpandedDomains(newExpanded);
  };

  const [expandedPages, setExpandedPages] = useState(new Set());

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

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical':
        return 'bg-rose-500 text-white shadow-sm shadow-rose-200 ring-1 ring-rose-500/50';
      case 'Serious':
        return 'bg-orange-500 text-white shadow-sm shadow-orange-200 ring-1 ring-orange-500/50';
      case 'Moderate':
        return 'bg-amber-400 text-amber-900 shadow-sm shadow-amber-200 ring-1 ring-amber-400/50';
      case 'Minor':
        return 'bg-gray-200 text-gray-700 ring-1 ring-gray-300';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (findings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-center">
        <div className="bg-white p-3 rounded-full shadow-sm mb-4">
          <Edit2 className="w-6 h-6 text-gray-300" />
        </div>
        <h3 className="text-gray-900 font-medium mb-1">No findings recorded</h3>
        <p className="text-gray-500 text-sm max-w-sm">Mark checks as "Fail" during your audit to automatically generate findings here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Findings Registry</h2>
          <p className="text-sm text-gray-500">Manage and track all accessibility issues across all domains.</p>
        </div>
        <button
          onClick={onAddFinding}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all font-medium text-sm"
        >
          <Edit2 className="w-4 h-4" />
          Add Finding
        </button>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedFindings).map(([domain, pages]) => (
          <div key={domain} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
            {/* Domain Header */}
            <div
              className="flex items-center gap-3 p-4 bg-gray-50/80 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleDomain(domain)}
            >
              {expandedDomains.has(domain) ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
              <Globe className="w-4 h-4 text-indigo-500" />
              <h4 className="flex-1 font-semibold text-gray-800 text-sm">{domain}</h4>
              <span className="text-xs font-medium text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                {Object.values(pages).flat().length} findings
              </span>
            </div>

            {/* Pages List (Visible when domain is expanded) */}
            {expandedDomains.has(domain) && (
              <div className="border-t border-gray-100 bg-slate-50/30">
                {Object.entries(pages).map(([pageName, pageFindings]) => {
                  const pageKey = `${domain}-${pageName}`;
                  const isPageExpanded = expandedPages.has(pageKey);

                  return (
                    <div key={pageKey} className="border-b border-gray-100 last:border-0">
                      {/* Page Header */}
                      <div
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-100/50 transition-colors pl-8"
                        onClick={() => togglePage(pageKey)}
                      >
                        {isPageExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                        <div className="flex-1">
                          <h5 className="font-medium text-slate-700 text-sm">{pageName}</h5>
                          {/* Optional: Show URL if different from page name */}
                          {pageFindings[0] && pageFindings[0].url && pageFindings[0].url !== pageName && (
                            <p className="text-xs text-slate-400 truncate max-w-md">{pageFindings[0].url}</p>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                          {pageFindings.length}
                        </span>
                      </div>

                      {/* Findings List (Visible when page is expanded) */}
                      {isPageExpanded && (
                        <div className="p-4 space-y-4 pl-12 bg-slate-100/30">
                          {pageFindings.map(finding => {
                            const isExpanded = expandedFindings.has(finding.id);
                            return (
                              <div key={finding.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                                <div className="p-4 cursor-pointer hover:bg-slate-50/50 transition-colors" onClick={() => toggleExpanded(finding.id)}>
                                  <div className="flex items-start gap-4">
                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-md shadow-sm ${getSeverityColor(finding.severity)}`}>
                                      {finding.severity}
                                    </span>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-4 mb-2">
                                        <div className="flex-1">
                                          <h3 className="text-base font-medium text-gray-900 mb-1.5 leading-snug">{finding.description}</h3>
                                          <div className="flex flex-wrap gap-2">
                                            {(finding.scTitles || finding.scIds || []).map((title, idx) => (
                                              <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-xs font-medium">
                                                {title}
                                              </span>
                                            ))}
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onEditFinding(finding);
                                            }}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit finding"
                                          >
                                            <Edit2 className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (confirm('Delete this finding?')) {
                                                deleteFinding(finding.id);
                                              }
                                            }}
                                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                            title="Delete finding"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                        {finding.component && (
                                          <>
                                            <span className=" bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{finding.component}</span>
                                          </>
                                        )}
                                        <span className="text-gray-300 ml-auto flex items-center gap-1">
                                          {isExpanded ? 'Hide details' : 'Show details'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="border-t border-gray-100 bg-slate-50/50 p-5 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">URL</div>
                                        <a href={finding.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 text-sm font-medium break-all">
                                          {finding.url}
                                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                        </a>
                                      </div>

                                      <div className="text-xs text-gray-400 flex items-end justify-end">
                                        Created {new Date(finding.createdAt).toLocaleDateString()}
                                      </div>
                                    </div>

                                    {finding.domSnippet && (
                                      <div>
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                          <Code className="w-3 h-3" />
                                          DOM Snippet
                                        </div>
                                        <pre className="p-3 bg-slate-900 text-slate-50 rounded-lg text-xs font-mono overflow-x-auto border border-slate-800 shadow-inner">
                                          {finding.domSnippet}
                                        </pre>
                                      </div>
                                    )}

                                    {finding.notes && (
                                      <div>
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Notes</div>
                                        <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-600 shadow-sm">
                                          {finding.notes}
                                        </div>
                                      </div>
                                    )}
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
