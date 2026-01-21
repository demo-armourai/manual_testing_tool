import { useState, useEffect } from 'react';
import { FileBarChart, CheckSquare, AlertCircle, Menu, X, BarChart, Globe, LogOut, User as UserIcon, ShieldCheck, Home as HomeIcon, CheckCircle2 } from 'lucide-react';
import { wcagChecklist, getChecklistByLevel } from './utils/wcag-loader';
import { useAuditStore } from './hooks/useAuditStore';
import { calculateComplianceScore } from './utils/compliance';
import { apiClient, API } from './config/api';

import { TargetSelector } from './components/TargetSelector';
import { CheckCard } from './components/CheckCard';
import { ChecklistSidebar } from './components/ChecklistSidebar';
import { FilterPanel } from './components/FilterPanel';
import { FindingForm } from './components/FindingForm';
import { FindingsList } from './components/FindingsList';
import { ComplianceReport } from './components/ComplianceReport';
import { ComplianceScoresView } from './components/ComplianceScoresView';
import { UserSelection } from './components/UserSelection';
import { UserWebsiteList } from './components/UserWebsiteList';
import { ReportWebsiteList } from './components/ReportWebsiteList';
import { Home } from './components/Home';
import { Login } from './components/Login';

const getHostname = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

export default function App() {
  const {
    currentTarget,
    audits,
    findings,
    currentUser,
    login,
    logout,
    getFindingsForTarget,
    setCurrentTarget,
    setLastActiveScId,
    userStats,
    fetchInitialData,
    loadAuditResults,
    addTarget,
    syncAuditMetadata
  } = useAuditStore();

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Load results for existing currentTarget on mount
  useEffect(() => {
    if (currentTarget) {
      loadAuditResults(currentTarget.id);
    }
  }, [currentTarget?.id, loadAuditResults]);

  const [viewMode, setViewMode] = useState('home');
  const [selectedSCId, setSelectedSCId] = useState(null);
  const [showFindingForm, setShowFindingForm] = useState(false);
  const [findingFormScId, setFindingFormScId] = useState();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editingFinding, setEditingFinding] = useState();
  const [viewedReportOnce, setViewedReportOnce] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(null);

  // Constants derived from checklist - Move these up to avoid TDZ in useEffect
  const aaChecklist = getChecklistByLevel('AA');

  // Logic to determine if all A/AA checks are filled (non-pending)
  // AAA is optional and should NOT block report generation
  const isAuditComplete = aaChecklist.every(sc => {
    // Only check A and AA levels explicitly
    if (sc.level !== 'A' && sc.level !== 'AA') {
      return true; // Skip AAA criteria
    }

    // If no target or audits loaded yet, treat as incomplete
    if (!currentTarget || !audits[currentTarget.id]) return false;

    const check = audits[currentTarget.id].checks?.[sc.id];
    const status = check?.status;

    // Check is considered "filled" if status exists and is not 'pending'
    return status && status !== 'pending' && status !== 'untested';
  });

  const currentSC = selectedSCId
    ? wcagChecklist.find(sc => sc.id === selectedSCId)
    : null;

  const currentIndex = selectedSCId
    ? aaChecklist.findIndex(sc => sc.id === selectedSCId)
    : -1;

  // Resume progress when target changes
  useEffect(() => {
    if (currentTarget) {
      const auditProgress = audits[currentTarget.id];
      if (auditProgress?.lastActiveScId) {
        setSelectedSCId(auditProgress.lastActiveScId);
      } else {
        // Smart Resume: Start from first SC (1.1.1) if no history
        setSelectedSCId(aaChecklist[0]?.id);
      }
    } else {
      setSelectedSCId(null);
    }
  }, [currentTarget?.id, audits, aaChecklist]);

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
    // Keep selectedDomain if we want to return to the page list view for that domain
  };

  // Handle Domain Selection
  const handleSelectDomain = (domain) => {
    setSelectedDomain(domain);
    setCurrentTarget(null);
  };



  const SEVERITY_ORDER = { 'Critical': 4, 'Serious': 3, 'Moderate': 2, 'Minor': 1 };

  // Determine findings to show in sidebar - only when a specific audit is selected
  let targetFindings = currentTarget
    ? findings.filter(f => {
      const fAuditId = (f.auditId || f.auditid || '').toString().toLowerCase();
      const tId = (currentTarget.id || '').toString().toLowerCase();
      return fAuditId === tId;
    })
    : [];

  // Debug logging
  console.log('[App] Current target:', currentTarget?.id);
  console.log('[App] Total findings in store:', findings.length);
  console.log('[App] Findings for current target:', targetFindings.length);
  if (findings.length > 0) {
    console.log('[App] Sample finding auditId:', findings[0]?.auditId);
    console.log('[App] All finding auditIds:', findings.map(f => f.auditId));
  }

  // Log when findings or currentTarget changes
  useEffect(() => {
    console.log('[App useEffect] Findings changed. Total:', findings.length);
    console.log('[App useEffect] Current target:', currentTarget?.id);
    if (currentTarget) {
      const targetSpecificFindings = findings.filter(f => f.auditId === currentTarget.id);
      console.log('[App useEffect] Findings for current target:', targetSpecificFindings.length);
    }
  }, [findings, currentTarget]);

  targetFindings = targetFindings.sort((a, b) => {
    return (SEVERITY_ORDER[b.severity] || 0) - (SEVERITY_ORDER[a.severity] || 0);
  });

  const sidebarTitle = currentTarget
    ? "Findings on this page"
    : "Findings";

  const progress = currentTarget ? audits[currentTarget.id] : null;

  const complianceScore = progress
    ? calculateComplianceScore(progress)
    : null;

  const failedCount = complianceScore?.failed || 0;
  const naCount = complianceScore?.na || 0;
  const testedCount = complianceScore?.tested || 0;
  const totalCount = aaChecklist.length;

  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="min-h-screen text-gray-900 font-sans bg-slate-50/50">

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
              <button
                onClick={() => setViewMode('home')}
                className="flex items-center gap-4 text-left hover:opacity-80 transition-opacity"
              >
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
              </button>

              {complianceScore && (
                <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 bg-slate-50 rounded-full border border-slate-200 text-sm">
                  <span>{testedCount}/{totalCount}</span>
                  <span className="text-rose-600 font-semibold">{failedCount} Fail</span>
                  <span className="text-slate-500">{naCount} N/A</span>
                </div>
              )}
            </div>

            {/* View mode tabs */}
            <div className="flex items-center gap-4">
              <div className="hidden xl:flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                {['home', 'audit', 'findings', 'report'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-5 mx-1 py-2 rounded-lg text-sm font-semibold transition flex items-center
                      ${viewMode === mode
                        ? 'bg-white text-indigo-600 shadow ring-1 ring-black/5'
                        : 'text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    {mode === 'home' && <HomeIcon className="inline w-4 h-4 mr-1" />}
                    {mode === 'audit' && <CheckSquare className="inline w-4 h-4 mr-1" />}
                    {mode === 'findings' && <AlertCircle className="inline w-4 h-4 mr-1" />}
                    {mode === 'report' && <FileBarChart className="inline w-4 h-4 mr-1" />}
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-slate-900">{currentUser?.username}</span>
                  <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Tester</span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors group"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              </div>
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

            {viewMode === 'home' && (
              <Home
                onSelectUser={(user) => {
                  setSelectedUser(user);
                  setViewMode('audit');
                }}
                onSelectWebsite={async (site, auditId, targetMode) => {
                  if (targetMode === 'report') {
                    // Navigate to report view
                    setViewMode('report');

                    // Set user from site data
                    if (site.user_id) {
                      const foundUser = userStats.find(u => (u.id || u.user_id) === site.user_id);
                      if (foundUser) {
                        setSelectedUser(foundUser);
                      } else {
                        setSelectedUser({
                          id: site.user_id,
                          username: site.auditor_name || site.username,
                          display_name: site.auditor_display_name || site.auditor_name || site.username
                        });
                      }
                    }

                    // Find the selected audit to resume report viewing
                    const selectedAudit = targets.find(t => t.id === auditId);
                    if (selectedAudit) {
                      setCurrentTarget({
                        id: selectedAudit.targetId,
                        name: selectedAudit.targetName || site.page_name || site.domain,
                        url: selectedAudit.targetUrl || site.page_url
                      });
                    }
                  } else {
                    // Navigate to Audit Registry -> Domain Page List
                    setViewMode('audit');

                    // Set the selected user based on the site's user_id
                    console.log('[App] onSelectWebsite site:', site);
                    console.log('[App] onSelectWebsite userStats:', userStats);

                    if (site.user_id) {
                      const foundUser = userStats.find(u => (u.id || u.user_id) === site.user_id);
                      console.log('[App] foundUser:', foundUser);
                      if (foundUser) {
                        setSelectedUser(foundUser);
                      } else {
                        // Fallback to minimal user object supplemented with names from the site object
                        const fallbackUser = {
                          id: site.user_id,
                          username: site.auditor_name || site.username,
                          display_name: site.auditor_display_name || site.auditor_name || site.username
                        };
                        console.log('[App] Using fallbackUser:', fallbackUser);
                        setSelectedUser(fallbackUser);
                      }
                    }

                    // Extract and set the domain from the site URL
                    const rawDomain = site.domain || getHostname(site.url || site.page_url);
                    const cleanDomain = rawDomain.replace(/^https?:\/\//, '').split('/')[0];

                    setSelectedDomain({ domain: cleanDomain });

                    const target = {
                      name: site.page_name || getHostname(site.page_url || site.url),
                      url: site.page_url || site.url,
                      compliance_score_id: site.compliance_score_id
                    };

                    if (auditId && auditId !== 'new') {
                      setCurrentTarget({
                        id: auditId,
                        name: target.name,
                        url: target.url
                      });
                    } else {
                      const targetId = await addTarget(target, auditId);
                      if (targetId) {
                        setCurrentTarget({
                          id: targetId,
                          name: target.name,
                          url: target.url
                        });
                      }
                    }
                  }
                }}
              />
            )}

            {viewMode === 'audit' && (
              <>
                {!currentTarget && (
                  <div className="max-w-6xl mx-auto px-4">
                    {!selectedUser ? (
                      <UserSelection onSelectUser={setSelectedUser} />
                    ) : (
                      <UserWebsiteList
                        selectedUser={selectedUser}
                        onBack={() => setSelectedUser(null)}
                        selectedDomain={selectedDomain}
                        setSelectedDomain={setSelectedDomain}
                        onSelectWebsite={async (site, auditId, targetMode = 'audit') => {
                          if (targetMode === 'report') {
                            setViewMode('report');
                            // Ensure currentTarget is set for the report view
                            const target = {
                              name: site.page_name || getHostname(site.page_url),
                              url: site.page_url,
                              compliance_score_id: site.compliance_score_id
                            };
                            if (auditId) {
                              setCurrentTarget({
                                id: auditId,
                                name: target.name,
                                url: target.url
                              });
                            }
                            return;
                          }

                          // Default 'audit' mode behavior
                          const target = {
                            name: site.page_name || getHostname(site.page_url),
                            url: site.page_url,
                            compliance_score_id: site.compliance_score_id
                          };

                          const targetId = await addTarget(target, auditId);
                          if (targetId) {
                            setCurrentTarget({
                              id: targetId,
                              name: target.name,
                              url: target.url
                            });
                          }
                        }}
                      />
                    )}
                  </div>
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
                    <div className="mb-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-100">
                              User
                            </span>
                            <span className="text-slate-600 font-bold text-sm">
                              {selectedUser?.display_name || selectedUser?.username || 'Unknown User'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-100">
                              Domain
                            </span>
                            <span className="text-slate-800 font-black text-base truncate">
                              {getHostname(currentTarget.url)}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-200">
                              Target URL
                            </span>
                            <span className="text-slate-400 font-medium text-xs truncate">
                              {currentTarget.url}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap lg:flex-row items-center lg:items-center justify-end gap-3 lg:border-l lg:border-slate-100 lg:pl-6">
                          <button
                            onClick={async () => {
                              try {
                                await syncAuditMetadata(currentTarget.id);
                                alert("Audit progress saved successfully!");
                              } catch (e) {
                                alert("Failed to save audit: " + e.message);
                              }
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest border border-indigo-100"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Save Audit
                          </button>

                          <button
                            onClick={() => setViewMode('report')}
                            disabled={!isAuditComplete}
                            title={!isAuditComplete ? "Complete all A and AA checks to view report" : "View Report"}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest border
                              ${!isAuditComplete
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-75'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100'}`}
                          >
                            <FileBarChart className="w-4 h-4" />
                            Report
                          </button>

                          <button
                            onClick={handleCloseAudit}
                            className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest border border-rose-100"
                          >
                            <X className="w-4 h-4" />
                            Close
                          </button>
                        </div>
                      </div>
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
                  <div className="max-w-6xl mx-auto px-4">
                    {!selectedUser ? (
                      <UserSelection onSelectUser={setSelectedUser} />
                    ) : (
                      <ReportWebsiteList
                        selectedUser={selectedUser}
                        onBack={() => setSelectedUser(null)}
                        selectedDomain={selectedDomain}
                        setSelectedDomain={setSelectedDomain}
                        onSelectWebsite={(site, auditId) => {
                          if (auditId && auditId !== 'new') {
                            const selectedAudit = audits[auditId];
                            if (selectedAudit) {
                              // Calculate if audit is complete
                              const auditProgress = audits[selectedAudit.targetId];
                              const score = calculateComplianceScore(auditProgress);

                              // Relaxed: Allow report generation even if not all SCs are tested
                              // We can show a warning instead of a hard block
                              if (score.untested > 0) {
                                if (!confirm(`This audit is incomplete (${score.untested} criteria pending). Do you want to view the partial report anyway?`)) {
                                  return;
                                }
                              }

                              setCurrentTarget({
                                id: selectedAudit.targetId,
                                name: selectedAudit.targetName || site.page_name || site.domain,
                                url: selectedAudit.targetUrl || site.page_url
                              });
                            }
                          } else {
                            alert("Please select an existing completed audit from the history list to generate a report.");
                          }
                        }}
                      />
                    )}
                  </div>
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

                    <ComplianceReport
                      progress={progress || {}}
                      findings={targetFindings}
                      auditedEntity={selectedUser?.display_name || selectedUser?.username || 'Client'}
                    />
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
                      <div className="mt-2 p-1.5 bg-slate-900 text-slate-100 rounded text-[9px] font-mono whitespace-pre-wrap overflow-x-auto max-h-32">
                        {finding.domSnippet}
                      </div>
                    )}
                    {finding.selector && (
                      <div className="mt-1 text-[9px] text-indigo-600 font-mono break-all">
                        SEL: {finding.selector}
                      </div>
                    )}
                    {finding.notes && (
                      <p className="mt-1 text-[10px] text-slate-500 italic">
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
              <div className="grid grid-cols-4 gap-2 bg-slate-100 p-1 rounded-lg">
                {['home', 'audit', 'findings', 'report'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => {
                      setViewMode(mode);
                      setMobileMenuOpen(false);
                    }}
                    className={`p-2 rounded-md text-[10px] font-semibold text-center transition
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
