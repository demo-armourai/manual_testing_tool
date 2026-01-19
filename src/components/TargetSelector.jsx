import { useState } from 'react';
import { Plus, ExternalLink, Trash2, CheckCircle, AlertCircle, PieChart, ChevronDown, ChevronRight, Globe } from 'lucide-react';
import { useAuditStore } from '../hooks/useAuditStore';
import { calculateComplianceScore } from '../utils/compliance';

export function TargetSelector({ selectedDomain, onSelectDomain }) {
  const { targets, currentTarget, addTarget, deleteTarget, setCurrentTarget, audits, error, loading } = useAuditStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('page');
  const [expandedDomains, setExpandedDomains] = useState(new Set()); // Track expanded domains

  // Helper to get hostname
  const getHostname = (url) => {
    try {
      if (!url) return 'Unknown Domain';
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname;
    } catch {
      return url;
    }
  };

  // Group targets by domain
  const groupedTargets = targets.reduce((acc, target) => {
    const domain = getHostname(target.url);
    if (!acc[domain]) acc[domain] = [];
    acc[domain].push(target);
    return acc;
  }, {});

  const handleDomainClick = (domain) => {
    const newExpanded = new Set(expandedDomains);
    if (newExpanded.has(domain)) newExpanded.delete(domain);
    else newExpanded.add(domain);
    setExpandedDomains(newExpanded);

    // Also select the domain for sidebar updates
    if (onSelectDomain) {
      onSelectDomain(domain);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addTarget({ name, url, description, type });
    setName('');
    setUrl('');
    setDescription('');
    setType('page');
    setShowAddForm(false);
  };

  return (
    <div className="bg-white border-b border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Audit Targets</h3>
          <p className="text-sm text-gray-500">Manage pages, flows, or components for this audit.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${showAddForm
            ? 'bg-gray-100 text-gray-700'
            : 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-200 shadow-sm hover:bg-blue-700 '
            }`}
        >
          <Plus className="w-4 h-4 " />
          {showAddForm ? 'Cancel' : 'New Target'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 border border-gray-200 rounded-xl bg-gray-50/50 space-y-5 shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Add New Target</h4>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
              <span className="sr-only">Close</span>
              {/* Icon could go here */}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Name <span className="text-rose-500">*</span></label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                placeholder="e.g., Checkout Flow"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Type <span className="text-rose-500">*</span></label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="page">Page</option>
                <option value="flow">Flow</option>
                <option value="component">Component</option>
                <option value="site">Site</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">URL <span className="text-rose-500">*</span></label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
              placeholder="https://example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400 resize-none"
              rows={2}
              placeholder="Optional description..."
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200/50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all"
            >
              Add Target
            </button>
          </div>
        </form>
      )}

      {targets.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-500 text-sm font-medium">No targets defined yet. Create a target to begin your audit.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedTargets).map(([domain, domainTargets]) => {
            const isDomainSelected = selectedDomain === domain;
            return (
              <div key={domain} className={`border rounded-xl overflow-hidden shadow-sm transition-colors ${isDomainSelected ? 'border-indigo-300 ring-2 ring-indigo-100 bg-white' : 'border-gray-200 bg-white'
                }`}>
                {/* Domain Header */}
                <div
                  className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${isDomainSelected ? 'bg-indigo-50/50' : 'bg-gray-50/80 hover:bg-gray-100'
                    }`}
                  onClick={() => handleDomainClick(domain)}
                >
                  {expandedDomains.has(domain) ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  <Globe className={`w-4 h-4 ${isDomainSelected ? 'text-indigo-600' : 'text-indigo-500'}`} />
                  <h4 className={`flex-1 font-semibold text-sm ${isDomainSelected ? 'text-indigo-900' : 'text-gray-800'}`}>{domain}</h4>
                  <span className="text-xs font-medium text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                    {domainTargets.length} targets
                  </span>
                </div>

                {/* Targets List (Collapsible) */}
                {expandedDomains.has(domain) && (
                  <div className="divide-y divide-gray-100 border-t border-gray-100">
                    {domainTargets.map(target => {
                      const audit = audits[target.id];
                      const stats = audit ? calculateComplianceScore(audit) : null;
                      const isSelected = currentTarget?.id === target.id;

                      return (
                        <div
                          key={target.id}
                          className={`p-4 cursor-pointer transition-all duration-200 ${isSelected
                            ? 'bg-blue-50/50'
                            : 'hover:bg-gray-50'
                            }`}
                          onClick={() => setCurrentTarget(target)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2.5 mb-1.5">
                                {/* Show selection indicator */}
                                <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-blue-600' : 'bg-gray-200'}`} />
                                <h4 className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>{target.name}</h4>
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium uppercase tracking-wide rounded border border-gray-200">
                                  {target.type}
                                </span>
                              </div>
                              {/* URL and Desc */}
                              <div className="pl-4.5">
                                <a
                                  href={target.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium truncate mb-1"
                                >
                                  {target.url}
                                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                </a>
                                {target.description && (
                                  <p className="text-xs text-gray-500 line-clamp-1">{target.description}</p>
                                )}
                                {/* Stats & Status */}
                                <div className="flex items-center gap-3 mt-2 text-[10px] uppercase tracking-wide font-semibold">
                                  {audit ? (
                                    <>
                                      <span className={`px-2 py-0.5 rounded-full border ${audit.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                        audit.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                          'bg-gray-50 text-gray-600 border-gray-100'
                                        }`}>
                                        {audit.status.replace('_', ' ')}
                                      </span>
                                      {stats && stats.tested > 0 && (
                                        <>
                                          <span className="text-slate-400">
                                            {stats.tested}/{stats.total} Checked
                                          </span>
                                        </>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-slate-400 italic">Not started</span>
                                  )}
                                </div>
                              </div>

                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete target "${target.name}"?`)) {
                                  deleteTarget(target.id);
                                }
                              }}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-2"
                              title="Delete target"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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
  );
}
