import { useState, useEffect } from 'react';
import { X, ChevronDown, Trash2 } from 'lucide-react';
import { wcagChecklist, getSCById } from '../utils/wcag-loader';
import { useAuditStore } from '../hooks/useAuditStore';

export function FindingForm({ prefillScId, prefillCondition, editingFinding, onClose }) {
  const { addFinding, updateFinding, deleteFinding, progress, audits, findings, currentTarget, error, loading } = useAuditStore();

  // Helper to strip [N] numbering from incoming data for the editable textareas
  const cleanInput = (val) => val?.replace(/^\[\d+\]\s*/, '') || '';

  const [selectedSCs, setSelectedSCs] = useState(editingFinding?.scIds || (prefillScId ? [prefillScId] : []));
  const [severity, setSeverity] = useState(editingFinding?.severity ||
    (prefillScId ? getSCById(prefillScId)?.defaultSeverity || '' : ''));
  const [description, setDescription] = useState(editingFinding?.description || '');
  const [url, setUrl] = useState(editingFinding?.url || progress?.targetUrl || '');
  const [page, setPage] = useState(editingFinding?.page || progress?.targetName || '');
  const [component, setComponent] = useState(editingFinding?.component || '');
  const [selectors, setSelectors] = useState(
    editingFinding?.cssSelectors
      ? editingFinding.cssSelectors.map(cleanInput)
      : (editingFinding?.cssSelector || editingFinding?.selector
        ? (editingFinding.cssSelector || editingFinding.selector).split('\n\n').map(cleanInput)
        : [''])
  );
  const [viewport, setViewport] = useState(editingFinding?.viewport || '');
  const [device, setDevice] = useState(editingFinding?.device || '');
  const [role, setRole] = useState(editingFinding?.role || '');


  const [snippets, setSnippets] = useState(
    editingFinding?.htmlSnippets
      ? editingFinding.htmlSnippets.map(cleanInput)
      : (editingFinding?.domSnippet || editingFinding?.htmlSnippet
        ? (editingFinding.domSnippet || editingFinding.htmlSnippet).split('\n\n').map(cleanInput)
        : [''])
  );
  const [notes, setNotes] = useState(editingFinding?.notes || '');
  const [condition, setCondition] = useState(editingFinding?.condition || prefillCondition || '');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Pre-fill template description/condition or fetch existing automated data
  useEffect(() => {
    // Logic for EXISTING findings or AUTO-FETCHING from store
    if (!editingFinding && (prefillScId || prefillCondition)) {
      // 1. Proactively search for an existing finding in the store that matches this condition
      // This handles "fetching data which comes from wcag-compliance"
      const autoMatch = findings.find(f =>
        (f.auditId || f.auditid)?.toString().toLowerCase() === currentTarget?.id?.toString().toLowerCase() &&
        f.scIds?.includes(prefillScId) &&
        f.condition === prefillCondition
      );

      if (autoMatch) {
        // If we found a data match in the store, use it as the source of truth
        if (!url) setUrl(autoMatch.url || currentTarget?.url || '');
        if (!page) setPage(autoMatch.page || currentTarget?.name || '');
        if (!description) setDescription(autoMatch.description || prefillCondition || '');

        // Split joined snippets back into array for UI
        if (snippets.length === 1 && snippets[0] === '') {
          let matchedSnippets = [];
          if (autoMatch.htmlSnippets && Array.isArray(autoMatch.htmlSnippets)) {
            matchedSnippets = autoMatch.htmlSnippets;
          } else {
            const snippetStr = autoMatch.domSnippet || autoMatch.htmlSnippet || '';
            // Split by double newline if present (our standard delimiter)
            matchedSnippets = snippetStr.includes('\n\n') ? snippetStr.split('\n\n') : [snippetStr];
          }
          const cleanedSnippets = matchedSnippets.map(cleanInput);
          setSnippets(cleanedSnippets.filter(s => s.trim().length > 0).length ? cleanedSnippets : ['']);
        }

        if (selectors.length === 1 && selectors[0] === '') {
          let matchedSelectors = [];
          if (autoMatch.cssSelectors && Array.isArray(autoMatch.cssSelectors)) {
            matchedSelectors = autoMatch.cssSelectors;
          } else {
            const selectorStr = autoMatch.cssSelector || autoMatch.selector || '';
            matchedSelectors = selectorStr.includes('\n\n') ? selectorStr.split('\n\n') : [selectorStr];
          }
          const cleanedSelectors = matchedSelectors.map(cleanInput);
          setSelectors(cleanedSelectors.filter(s => s.trim().length > 0).length ? cleanedSelectors : ['']);
        }

        if (!notes) setNotes(autoMatch.notes || '');
        return; // Skip other pre-fill logic if matched
      }

      // 2. Fallback: Auto-fill URL and Page from current target if available
      if (currentTarget) {
        if (!url) setUrl(currentTarget.url);
        if (!page) setPage(currentTarget.name);
      }

      // 3. Auto-generate description from condition if provided
      if (prefillCondition && !description) {
        setDescription(prefillCondition);
      }
      // 4. Traceback: Auto-generate description from failed conditions if sc-level
      else if (!description && currentTarget) {
        const currentAudit = audits[currentTarget.id];
        const checkState = currentAudit?.checks?.[prefillScId];
        const storedConditions = checkState?.checkedConditions || {};

        const failedConditions = Object.entries(storedConditions)
          .filter(([_, status]) => (status === 'fail' || (typeof status === 'object' && status.status === 'fail')))
          .map(([condition]) => condition);

        if (failedConditions.length > 0) {
          const generatedDesc = prefillCondition || failedConditions.join('\n');
          setDescription(generatedDesc);
        } else {
          const sc = getSCById(prefillScId);
          if (sc?.templateDescription) setDescription(sc.templateDescription);
        }
      }
    }
  }, [prefillScId, prefillCondition, editingFinding, findings, currentTarget, audits]);

  const isFormValid =
    selectedSCs.length > 0 &&
    !!severity &&
    description.trim().length > 0 &&
    page.trim().length > 0 &&
    url.trim().length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isFormValid) return;

    const scTitles = selectedSCs.map(id => {
      const sc = getSCById(id);
      return sc ? `${sc.id} ${sc.title}` : id;
    });

    // Filter out empty snippets and re-apply sequence numbering
    const cleanSnippetsArray = snippets.filter(s => s.trim().length > 0).map(cleanInput);
    const numberedSnippets = cleanSnippetsArray.map((s, i) => `[${i + 1}] ${s}`);
    const primarySnippet = numberedSnippets.join('\n\n');

    // Filter out empty selectors and re-apply sequence numbering
    const cleanSelectorsArray = selectors.filter(s => s.trim().length > 0).map(cleanInput);
    const numberedSelectors = cleanSelectorsArray.map((s, i) => `[${i + 1}] ${s}`);
    const primarySelector = numberedSelectors.join('\n\n');

    const findingData = {
      scIds: selectedSCs,
      scTitles,
      severity,
      description,
      url,
      page,
      domSnippet: primarySnippet,
      htmlSnippet: primarySnippet,
      htmlSnippets: cleanSnippetsArray,
      cssSelector: primarySelector,
      selector: primarySelector,
      cssSelectors: cleanSelectorsArray,
      notes,
      condition,
      status: 'open',
    };
    if (editingFinding) {
      updateFinding(editingFinding.id, findingData);
    }
    else {
      addFinding(findingData);
    }
    onClose();
  };

  const handleAddSnippet = () => {
    setSnippets([...snippets, '']);
  };

  const handleRemoveSnippet = (index) => {
    const newSnippets = snippets.filter((_, i) => i !== index);
    setSnippets(newSnippets.length ? newSnippets : ['']);
  };

  const handleSnippetChange = (index, value) => {
    const newSnippets = [...snippets];
    newSnippets[index] = value;
    setSnippets(newSnippets);
  };

  const handleAddSelector = () => {
    setSelectors([...selectors, '']);
  };

  const handleRemoveSelector = (index) => {
    const newSelectors = selectors.filter((_, i) => i !== index);
    setSelectors(newSelectors.length ? newSelectors : ['']);
  };

  const handleSelectorChange = (index, value) => {
    const newSelectors = [...selectors];
    newSelectors[index] = value;
    setSelectors(newSelectors);
  };

  const toggleSC = (scId) => {
    setSelectedSCs(prev => prev.includes(scId)
      ? prev.filter(id => id !== scId)
      : [...prev, scId]);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex-none px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            {editingFinding ? 'Edit Finding' : 'Add New Finding'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2 text-sm shadow-sm animate-in fade-in slide-in-from-top-1">
              <span className="text-lg">❌</span>
              <div className="pt-0.5">
                <p className="font-bold mb-0.5">Storage Error</p>
                <p className="opacity-90">{error}</p>
              </div>
            </div>
          )}
          <form id="finding-form" onSubmit={handleSubmit} className="space-y-6">
            {/* WCAG SC Selection */}
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                WCAG Success Criteria <span className="text-rose-500">*</span>
              </label>

              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg text-sm text-left focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all hover:bg-gray-50"
              >
                <div className="flex-1 truncate mr-2">
                  {selectedSCs.length === 0 ? (
                    <span className="text-gray-400">Select Success Criteria...</span>
                  ) : (
                    <span className="text-gray-900 font-medium">
                      {selectedSCs.map(id => {
                        const sc = getSCById(id);
                        return sc ? sc.id : id;
                      }).join(', ')}
                      {selectedSCs.length === 1 && getSCById(selectedSCs[0]) ? ` - ${getSCById(selectedSCs[0]).title}` : ''}
                      {selectedSCs.length > 1 ? ` (${selectedSCs.length} selected)` : ''}
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {wcagChecklist.map(sc => (
                    <label key={sc.id} className="flex items-start gap-3 p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedSCs.includes(sc.id)}
                        onChange={() => toggleSC(sc.id)}
                        className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <span className="text-sm text-gray-700">
                        <span className="font-medium text-gray-900">{sc.id} {sc.title}</span>
                        <span className="text-gray-500 mx-1">•</span>
                        <span className="text-xs uppercase tracking-wide text-gray-500 bg-slate-200/50 px-1.5 py-0.5 rounded">{sc.level}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Severity <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-3">
                {['Critical', 'Serious', 'Moderate', 'Minor'].map(sev => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverity(sev)}
                    className={`
                      px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border
                      ${severity === sev
                        ? sev === 'Critical' ? 'bg-rose-50 border-rose-200 text-rose-700 ring-2 ring-rose-500 ring-offset-1'
                          : sev === 'Serious' ? 'bg-orange-50 border-orange-200 text-orange-700 ring-2 ring-orange-500 ring-offset-1'
                            : sev === 'Moderate' ? 'bg-amber-50 border-amber-200 text-amber-700 ring-2 ring-amber-400 ring-offset-1'
                              : 'bg-slate-100 border-slate-200 text-slate-700 ring-2 ring-slate-400 ring-offset-1'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Description <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedSCs.length > 0 && currentTarget) {
                      const currentAudit = audits[currentTarget.id];
                      const allFailedConditions = [];
                      selectedSCs.forEach(scId => {
                        const checkState = currentAudit?.checks?.[scId];
                        const storedConditions = checkState?.checkedConditions || {};
                        const failed = Object.entries(storedConditions)
                          .filter(([_, status]) => (status === 'fail' || (typeof status === 'object' && status.status === 'fail')))
                          .map(([condition]) => condition);
                        allFailedConditions.push(...failed);
                      });

                      if (allFailedConditions.length > 0) {
                        setDescription(allFailedConditions.join('\n'));
                      } else {
                        alert("No failed conditions found for the selected criteria.");
                      }
                    }
                  }}
                  className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-700 px-2 py-1 bg-indigo-50 rounded border border-indigo-100 transition-colors"
                >
                  Fetch from failed conditions
                </button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400 resize-none min-h-[120px]"
                placeholder="Describe the accessibility issue clearly..."
              />
            </div>

            {/* Location Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Page / Modal / Flow <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={page}
                  onChange={(e) => setPage(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400"
                  placeholder="e.g. Checkout Page"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400"
                  placeholder="https://example.com/page"
                />
              </div>
            </div>

            {/* Selectors Area */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">CSS Selectors</label>
              <div className="space-y-3">
                {selectors.map((sel, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-none p-2 bg-slate-100 rounded text-[10px] font-bold text-slate-500 w-8 text-center mt-1">
                      #{index + 1}
                    </div>
                    <input
                      type="text"
                      value={sel}
                      onChange={(e) => handleSelectorChange(index, e.target.value)}
                      className="flex-1 p-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400"
                      placeholder=".my-button[id='submit']"
                    />
                    {selectors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSelector(index)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors mt-0.5"
                        title="Remove selector"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddSelector}
                  className="text-sm text-indigo-600 font-medium hover:text-indigo-800 flex items-center gap-1 mt-2"
                >
                  + Add another selector
                </button>
              </div>
            </div>

            {/* Evidence */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">DOM Snippets</label>
              <div className="space-y-3">
                {snippets.map((snippet, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-none p-2 bg-slate-100 rounded text-[10px] font-bold text-slate-500">
                      #{index + 1}
                    </div>
                    <textarea
                      value={snippet}
                      onChange={(e) => handleSnippetChange(index, e.target.value)}
                      className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400 resize-none"
                      rows={3}
                      placeholder="<button class='btn'>Click me</button>"
                    />
                    {snippets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSnippet(index)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove snippet"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddSnippet}
                  className="text-sm text-indigo-600 font-medium hover:text-indigo-800 flex items-center gap-1 mt-2"
                >
                  + Add another snippet
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400 resize-none"
                rows={2}
                placeholder="Any extra context (optional)..."
              />
            </div>
          </form>
        </div>

        {/* Footer (Actions) */}
        <div className="flex-none px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3 rounded-b-xl">
          <div>
            {editingFinding && (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Are you sure you want to delete this finding?')) {
                    await deleteFinding(editingFinding.id);
                    onClose();
                  }
                }}
                className="px-5 py-2.5 text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Finding
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="finding-form"
              disabled={!isFormValid || loading}
              className="px-5 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Saving...' : editingFinding ? 'Update Finding' : 'Add Finding'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
