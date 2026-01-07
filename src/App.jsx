import { useState, useEffect } from 'react';
import { FileBarChart, CheckSquare, AlertCircle, Menu, X } from 'lucide-react';
import { wcagChecklist, getChecklistByLevel } from './utils/wcag-loader';
import { useAuditStore } from './hooks/useAuditStore';
import { calculateComplianceScore } from './utils/compliance';

import { TargetSelector } from './components/TargetSelector';
import { CheckCard } from './components/CheckCard';
import { ChecklistSidebar } from './components/ChecklistSidebar';
import { FilterPanel } from './components/FilterPanel';
import { FindingForm } from './components/FindingForm';
import { FindingsList } from './components/FindingsList';
import { ComplianceReport } from './components/ComplianceReport';

export default function App() {
  const { currentTarget, audits, findings, getFindingsForTarget, setCurrentTarget, setLastActiveScId, fetchInitialData, loadAuditResults } = useAuditStore();

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Load results for existing currentTarget on mount
  useEffect(() => {
    if (currentTarget) {
      loadAuditResults(currentTarget.id);
    }
  }, [currentTarget?.id, loadAuditResults]);

  const [viewMode, setViewMode] = useState('audit');
  const [selectedSCId, setSelectedSCId] = useState(null);
  const [showFindingForm, setShowFindingForm] = useState(false);
  const [findingFormScId, setFindingFormScId] = useState();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editingFinding, setEditingFinding] = useState();

  const [selectedDomain, setSelectedDomain] = useState(null);

  // Resume progress when target changes
  useEffect(() => {
    if (currentTarget && audits[currentTarget.id]?.lastActiveScId) {
      setSelectedSCId(audits[currentTarget.id].lastActiveScId);
    } else if (!currentTarget) {
      setSelectedSCId(null);
    }
    // If currentTarget exists but no lastActive, we leave selectedSCId as is (or null)
    if (currentTarget && !audits[currentTarget.id]?.lastActiveScId) {
      setSelectedSCId(null);
    }
  }, [currentTarget?.id, audits]);

  // Save progress when SC changes
  useEffect(() => {
    if (currentTarget && selectedSCId) {
      setLastActiveScId(selectedSCId);
    }
  }, [selectedSCId, currentTarget, setLastActiveScId]);

  const [filters, setFilters] = useState({
    principles: [],
    levels: ['A', 'AA'],
    types: []
  });

  const aaChecklist = getChecklistByLevel('AA');
  const currentSC = selectedSCId
    ? wcagChecklist.find(sc => sc.id === selectedSCId)
    : null;

  const currentIndex = selectedSCId
    ? aaChecklist.findIndex(sc => sc.id === selectedSCId)
    : -1;

  const handleNext = () => {
    if (currentIndex < aaChecklist.length - 1) {
      setSelectedSCId(aaChecklist[currentIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setSelectedSCId(aaChecklist[currentIndex - 1].id);
    }
  };

  const handleOpenFindingForm = (scId, finding = undefined) => {
    setEditingFinding(finding);
    setFindingFormScId(scId);
    setShowFindingForm(true);
  };

  const handleCloseAudit = () => {
    setCurrentTarget(null);
    setSelectedSCId(null);
  };

  // Handle Domain Selection
  const handleSelectDomain = (domain) => {
    setSelectedDomain(domain);
    setCurrentTarget(null);
  };

  const getHostname = (url) => {
    try {
      if (!url) return '';
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname;
    } catch {
      return url;
    }
  };

  const SEVERITY_ORDER = { 'Critical': 4, 'Serious': 3, 'Moderate': 2, 'Minor': 1 };

  // Determine findings to show in sidebar
  let targetFindings = currentTarget
    ? findings.filter(f => f.auditId === currentTarget.id || f.url === currentTarget.url)
    : selectedDomain
      ? findings.filter(f => (f.domain === selectedDomain) || (getHostname(f.url) === selectedDomain))
      : findings;

  targetFindings = targetFindings.sort((a, b) => {
    return (SEVERITY_ORDER[b.severity] || 0) - (SEVERITY_ORDER[a.severity] || 0);
  });

  const sidebarTitle = currentTarget
    ? "Findings on this page"
    : selectedDomain
      ? `Findings on ${selectedDomain}`
      : "All Findings";

  const progress = currentTarget ? audits[currentTarget.id] : null;

  const complianceScore = progress
    ? calculateComplianceScore(progress)
    : null;

  const failedCount = complianceScore?.failed || 0;
  const naCount = complianceScore?.na || 0;
  const testedCount = complianceScore?.tested || 0;
  const totalCount = aaChecklist.length;

  return (
    <div className="min-h-screen text-gray-900 font-sans">

      {/* ================= HEADER ================= */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200 print:hidden">
        <div className="w-full px-6 py-4">
          <div className="flex items-center justify-between">

            {/* Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="xl:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 hidden sm:block">
                  WCAG 2.1 Auditor
                </h1>
                <h1 className="text-lg font-bold text-slate-900 sm:hidden">
                  WCAG Audit
                </h1>
                <p className="text-xs text-slate-500 hidden sm:block">Accessibility Compliance Platform</p>
              </div>

              {complianceScore && (
                <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 bg-slate-50 rounded-full border border-slate-200 text-sm">
                  <span>{testedCount}/{totalCount}</span>
                  <span className="text-rose-600 font-semibold">{failedCount} Fail</span>
                  <span className="text-slate-500">{naCount} N/A</span>
                </div>
              )}
            </div>

            {/* View mode tabs */}
            <div className="hidden xl:flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              {['audit', 'findings', 'report'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-5 mx-1 py-2 rounded-lg text-sm font-semibold transition flex items-center
                    ${viewMode === mode
                      ? 'bg-white text-indigo-600 shadow ring-1 ring-black/5'
                      : 'text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {mode === 'audit' && <CheckSquare className="inline w-4 h-4 mr-1" />}
                  {mode === 'findings' && <AlertCircle className="inline w-4 h-4 mr-1" />}
                  {mode === 'report' && <FileBarChart className="inline w-4 h-4 mr-1" />}
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Header spacer */}
      <div className="h-[78px] print:hidden" />

      {/* ================= MAIN LAYOUT ================= */}
      <div className="flex h-[calc(100vh-78px)] w-full border-t border-slate-200 print:block print:h-auto print:border-0">

        {/* ---------- LEFT SIDEBAR ---------- */}
        {viewMode === 'audit' && (
          <aside className="hidden xl:flex w-80 flex-col bg-white border-r border-slate-200">
            <FilterPanel filters={filters} onFilterChange={setFilters} />

            <div className="flex-1 overflow-y-auto">
              <div className="pb-6">
                <ChecklistSidebar
                  selectedSC={selectedSCId}
                  onSelectSC={setSelectedSCId}
                  filters={filters}
                />
              </div>
            </div>
          </aside>
        )}

        {/* ---------- CENTER CONTENT ---------- */}
        <main className="flex-1 overflow-y-auto bg-white print:overflow-visible">
          <div className={`w-full p-6 print:p-0 print:max-w-none`}>

            {viewMode === 'audit' && (
              <>
                {!currentTarget && (
                  <>
                    <TargetSelector
                      selectedDomain={selectedDomain}
                      onSelectDomain={handleSelectDomain}
                    />
                    <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                      <h2 className="text-lg font-semibold text-blue-900 mb-2">
                        Welcome to WCAG Accessibility Auditing Tool
                      </h2>
                      <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                        <li>Create an audit target</li>
                        <li>Review each WCAG success criterion</li>
                        <li>Record findings with evidence</li>
                        <li>Generate compliance reports</li>
                      </ul>
                    </div>
                  </>
                )}

                {currentTarget && !currentSC && (
                  <>
                    <div className="mb-6 flex justify-between items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">{currentTarget.name}</h2>
                        <p className="text-sm text-gray-500 truncate max-w-md">{currentTarget.url}</p>
                      </div>
                      <button
                        onClick={handleCloseAudit}
                        className="bg-white border border-gray-200 text-gray-600 hover:text-rose-600 hover:border-rose-200 px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
                      >
                        Close Audit
                      </button>
                    </div>

                    <div className="mt-8 p-6 border border-slate-200 rounded-lg text-center">
                      <p className="text-slate-600">
                        Select a success criterion from the left panel to begin.
                      </p>
                    </div>
                  </>
                )}

                {currentTarget && currentSC && (
                  <>
                    <div className="mb-4 flex justify-between items-center">
                      <div>
                        {/* Add Audit Header if needed */}
                      </div>
                      <button
                        onClick={handleCloseAudit}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition px-3 py-1.5 rounded-lg hover:bg-slate-100"
                      >
                        <X className="w-5 h-5" />
                        <span className="text-sm font-medium">Close Audit</span>
                      </button>
                    </div>

                    <CheckCard
                      sc={currentSC}
                      onOpenFindingForm={handleOpenFindingForm}
                      onNext={handleNext}
                      onPrevious={handlePrevious}
                      onViewReport={() => setViewMode('report')}
                      hasNext={currentIndex < aaChecklist.length - 1}
                      hasPrevious={currentIndex > 0}
                    />
                  </>
                )}
              </>
            )}

            {viewMode === 'findings' && (
              <FindingsList
                findings={findings}
                onEditFinding={(f) => handleOpenFindingForm(undefined, f)}
                onAddFinding={() => handleOpenFindingForm()}
              />
            )}

            {viewMode === 'report' && (
              <div className="pb-12">
                {!currentTarget ? (
                  <>
                    <TargetSelector
                      selectedDomain={selectedDomain}
                      onSelectDomain={handleSelectDomain}
                    />
                    <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
                      <h2 className="text-lg font-semibold text-blue-900 mb-2">
                        View Compliance Reports
                      </h2>
                      <p className="text-slate-700">
                        Select a target above to view its detailed compliance report and charts.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-6 flex justify-end print:hidden">
                      <button
                        onClick={handleCloseAudit}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition px-3 py-1.5 rounded-lg hover:bg-slate-100"
                      >
                        <X className="w-5 h-5" />
                        <span className="text-sm font-medium">Close Report</span>
                      </button>
                    </div>

                    {progress ? (
                      <ComplianceReport progress={progress} findings={targetFindings} />
                    ) : (
                      <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-500">
                          Initializing report data...
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </main>

        {/* ---------- RIGHT SIDEBAR ---------- */}
        {viewMode === 'audit' && (
          <aside className="hidden xl:flex w-[300px] flex-col bg-white border-l border-slate-200">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-semibold">{sidebarTitle}</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-6 space-y-3">
              {targetFindings.length === 0 ? (
                <p className="text-sm text-slate-500 italic">
                  No findings recorded yet.
                </p>
              ) : (
                targetFindings.map(finding => (
                  <div
                    key={finding.id}
                    onClick={() => handleOpenFindingForm(undefined, finding)}
                    className="p-3 border border-slate-200 rounded-lg cursor-pointer hover:border-indigo-300 hover:shadow-sm transition group"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${finding.severity === 'Critical' ? 'bg-rose-100 text-rose-800' :
                        finding.severity === 'Serious' ? 'bg-orange-100 text-orange-800' :
                          finding.severity === 'Moderate' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-800'
                        }`}>
                        {finding.severity}
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {finding.scIds && finding.scIds[0]}
                      </div>
                    </div>
                    <p className="text-sm text-slate-800 line-clamp-2 group-hover:text-indigo-900">
                      {finding.description}
                    </p>
                    {finding.domSnippet && (
                      <div className="mt-2 p-1.5 bg-slate-900 text-slate-100 rounded text-[9px] font-mono truncate">
                        {finding.domSnippet}
                      </div>
                    )}
                    {finding.selector && (
                      <div className="mt-1 text-[9px] text-indigo-600 font-mono truncate">
                        SEL: {finding.selector}
                      </div>
                    )}
                    {finding.notes && (
                      <p className="mt-1 text-[10px] text-slate-500 italic line-clamp-1">
                        Note: {finding.notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </aside>
        )}
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] xl:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <div className="absolute inset-y-0 left-0 w-full max-w-xs bg-white shadow-2xl transform transition-transform duration-300 flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="font-bold text-slate-900">Menu</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-200 space-y-4">

              {/* Mobile View Mode Switcher */}
              <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-lg">
                {['audit', 'findings', 'report'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => {
                      setViewMode(mode);
                      setMobileMenuOpen(false);
                    }}
                    className={`p-2 rounded-md text-xs font-semibold text-center transition
                      ${viewMode === mode
                        ? 'bg-white text-indigo-600 shadow ring-1 ring-black/5'
                        : 'text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {viewMode === 'audit' && (
                <>
                  <FilterPanel filters={filters} onFilterChange={setFilters} />
                  <div className="px-2 pb-6">
                    <ChecklistSidebar
                      selectedSC={selectedSCId}
                      onSelectSC={(id) => {
                        setSelectedSCId(id);
                        setMobileMenuOpen(false);
                      }}
                      filters={filters}
                    />
                  </div>
                </>
              )}
              {viewMode === 'findings' && (
                <div className="p-4 text-sm text-slate-500 text-center">
                  Findings are displayed in the main view.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------- FINDING MODAL ---------- */}
      {showFindingForm && (
        <FindingForm
          prefillScId={findingFormScId}
          editingFinding={editingFinding}
          onClose={() => {
            setShowFindingForm(false);
            setFindingFormScId(undefined);
            setEditingFinding(undefined);
          }}
        />
      )}
    </div>
  );
}
