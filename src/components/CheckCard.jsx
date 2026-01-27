import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  CheckCircle,
  ExternalLink,
  MessageSquare,
  FileBarChart
} from 'lucide-react';
import { useAuditStore } from '../hooks/useAuditStore';
import checksData from '../data/checks.json';

export function CheckCard({ sc, onOpenFindingForm, onNext, onPrevious, onViewReport, hasNext, hasPrevious }) {
  const {
    getCheckStatus,
    updateCheckStatus,
    getCheckJustification,
    updateCheckJustification,
    updateConditionStatus,
    deleteFinding,
    syncAutomatedChecks,
    syncAutomatedBySC,
    audits,
    currentTarget,
    findings
  } = useAuditStore();

  const [syncing, setSyncing] = useState(false);


  const status = getCheckStatus(sc.id);
  const justification = getCheckJustification(sc.id);

  const [quickNote, setQuickNote] = useState(justification);
  const [showJustification, setShowJustification] = useState(!!justification); // Show if exists

  useEffect(() => {
    const note = getCheckJustification(sc.id);
    setQuickNote(note);
    if (note) setShowJustification(true);
  }, [sc.id, getCheckJustification]);

  const handleStatusChange = (newStatus) => {
    updateCheckStatus(sc.id, newStatus);
  };

  const handleNoteBlur = () => {
    updateCheckJustification(sc.id, quickNote);
  };

  // Condition Verification Logic
  const currentAudit = currentTarget ? audits[currentTarget.id] : null;
  const checkState = currentAudit?.checks?.[sc.id];
  const storedConditions = checkState?.checkedConditions || {};

  // Aggregate all entries for this SC from checksData
  // Strict check: Ensure exact ID match (followed by space) to avoid substring matches (e.g. 1.4.1 matching 1.4.10)
  const allRelatedChecks = checksData.filter(c =>
    c["Success Criterion"] && (
      c["Success Criterion"].startsWith(`${sc.id} `) ||
      c["Success Criterion"] === sc.id
    )
  );

  // Collect all unique conditions
  const conditions = Array.from(new Set(
    allRelatedChecks.flatMap(c => c["Total conditions"] || [])
  ));

  // Collect all unique automated checks
  const autoChecks = Array.from(new Set(
    allRelatedChecks.flatMap(c => c["automated checks (axe core rules )"] || [])
  ));

  const getConditionStatus = (condition) => {
    const stored = storedConditions[condition];
    if (stored !== undefined && stored !== null) {
      return typeof stored === 'object' ? stored.status : stored;
    }
    return null;
  };

  const getConditionTag = (condition) => {
    const stored = storedConditions[condition];
    if (stored !== undefined && stored !== null && typeof stored === 'object') {
      return stored.tag;
    }
    if (autoChecks.includes(condition)) {
      return 'axe-core';
    }
    if (conditions.includes(condition)) {
      return 'manual';
    }
    return null;
  };

  const handleConditionStatusChange = async (condition, newStatus) => {
    const currentStatus = getConditionStatus(condition);
    // Toggle off if clicking same status
    const nextStatus = (currentStatus === newStatus) ? null : newStatus;

    // Auto-update SC Status Logic
    // Check if ANY condition will be 'fail' after this change
    const willHaveFail = conditions.some(c => {
      if (c === condition) return nextStatus === 'fail';
      return getConditionStatus(c) === 'fail';
    });

    if (willHaveFail) {
      updateCheckStatus(sc.id, 'fail');

      // Auto-open findings form if newly failed
      if (nextStatus === 'fail' && currentStatus !== 'fail') {
        const existingFinding = findings.find(f =>
          f.auditId === currentTarget?.id &&
          f.scIds?.includes(sc.id) &&
          f.condition === condition
        );
        onOpenFindingForm(sc.id, existingFinding, condition);
      }
    } else {
      // If there is no failed condition, make Success Criteria pass automatically
      updateCheckStatus(sc.id, 'pass');
    }

    await updateConditionStatus(sc.id, condition, nextStatus);
  };

  const hasFailedCondition = conditions.some(c => getConditionStatus(c) === 'fail');

  const getStatusButton = (buttonStatus, label, Icon) => {
    const isSelected = status === buttonStatus;

    // Check if all conditions have been attempted (are strictly not undefined/null)
    const allConditionsVerified = conditions.every(c => {
      const s = getConditionStatus(c);
      return s !== null && s !== undefined;
    });

    const isDisabled = !allConditionsVerified;

    return (
      <button
        onClick={() => !isDisabled && handleStatusChange(buttonStatus)}
        disabled={isDisabled}
        title={isDisabled ? "Verify all conditions first" : label}
        className={`flex flex-col items-center gap-2 px-12 py-4 rounded-lg border transition-all duration-200
          ${isDisabled ? 'opacity-50 cursor-not-allowed grayscale bg-slate-50 border-slate-100' : ''}
          ${isSelected
            ? buttonStatus === 'pass'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500 shadow-sm'
              : buttonStatus === 'fail'
                ? 'border-rose-500 bg-rose-50 text-rose-700 ring-1 ring-rose-500 shadow-sm'
                : 'border-slate-400 bg-slate-100 text-slate-700 ring-1 ring-slate-400 shadow-sm'
            : !isDisabled && 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-slate-50'}`}
      >
        <Icon className={`w-7 h-7 ${isSelected ? 'fill-current opacity-20' : ''}`} />
        <span className="text-sm font-medium">{label}</span>
      </button>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 w-full">
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider border border-slate-200">
                {sc.level}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider border border-slate-200">
                {sc.principle}
              </span>
              <a
                href={sc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-slate-400 hover:text-indigo-600"
              >
                {/* <ExternalLink className="w-4 h-4" /> */}
              </a>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2 leading-tight">
              {sc.id}: {sc.title}
            </h2>
            <div className="flex gap-2 text-sm text-slate-500">
              <span className="font-medium text-slate-700">Guideline {sc.guidelineNumber}:</span> {sc.guideline}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${sc.automationCoverage === 'full'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : sc.automationCoverage === 'partial'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
              {sc.automationCoverage === 'full' ? 'Automated' : sc.automationCoverage === 'partial' ? 'Partial Auto' : 'Manual Only'}
            </span>
            <button
              onClick={async () => {
                setSyncing(true);
                try {
                  await syncAutomatedBySC(currentTarget.id, sc.id);
                  // Optional: You might want to reload the specific audit results here
                  // although the store action already does a reload.
                } catch (e) {
                  alert("Sync failed: " + e.message);
                } finally {
                  setSyncing(false);
                }
              }}
              disabled={syncing}
              className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all
                ${syncing
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-600 hover:text-white'}`}
            >
              {syncing ? 'Syncing...' : 'Sync Automated'}
            </button>
          </div>
        </div>
      </div>

      {/* Verification Checklist */}
      {conditions.length > 0 && (
        <div className="mb-8 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-100/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-indigo-600" />
              Verification Checklist
            </h3>
            <div className="text-xs text-slate-500 font-medium">
              {conditions.filter(c => getConditionStatus(c)).length}/{conditions.length} Verified
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {conditions.map((condition, index) => {
              const isAuto = autoChecks.includes(condition);
              const status = getConditionStatus(condition); // 'pass', 'fail', 'na', or null

              return (
                <div
                  key={index}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 transition-colors group
                                    ${status
                      ? 'bg-white'
                      : 'bg-slate-50 hover:bg-white'
                    }`}
                >
                  <div className="flex-1">
                    <p className={`text-sm leading-relaxed transition-colors ${status ? 'text-slate-900' : 'text-slate-600'}`}>
                      {condition}
                    </p>
                    {getConditionTag(condition) && (
                      <span className={`mt-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border
                        ${getConditionTag(condition) === 'manual'
                          ? 'bg-slate-100 text-slate-600 border-slate-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                        {getConditionTag(condition) === 'manual' ? 'Manual Verification' :
                          getConditionTag(condition) === 'axe-core' ? 'Automated (axe-core)' :
                            'Automated Check'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Finding Button for specific condition failure */}
                    {status === 'fail' && (
                      <button
                        onClick={() => {
                          const existingFinding = findings.find(f =>
                            f.auditId === currentTarget?.id &&
                            f.scIds?.includes(sc.id) &&
                            f.condition === condition // Check if finding exists for this condition
                          );
                          onOpenFindingForm(sc.id, existingFinding, condition);
                        }}
                        title={findings.some(f => f.scIds?.includes(sc.id) && f.condition === condition) ? "Edit Finding" : "Add Finding"}
                        className={`p-1.5 rounded-md border transition-all ${findings.some(f => f.scIds?.includes(sc.id) && f.condition === condition)
                          ? 'bg-rose-100 border-rose-500 text-rose-700'
                          : 'bg-white border-slate-200 text-slate-300 hover:border-rose-300 hover:text-rose-400'
                          }`}
                      >
                        <FileBarChart className="w-5 h-5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleConditionStatusChange(condition, 'pass')}
                      title="Pass"
                      className={`p-1.5 rounded-md border transition-all ${status === 'pass'
                        ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-300 hover:border-emerald-300 hover:text-emerald-400'
                        }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleConditionStatusChange(condition, 'fail')}
                      title="Fail"
                      className={`p-1.5 rounded-md border transition-all ${status === 'fail'
                        ? 'bg-rose-100 border-rose-500 text-rose-700'
                        : 'bg-white border-slate-200 text-slate-300 hover:border-rose-300 hover:text-rose-400'
                        }`}
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleConditionStatusChange(condition, 'na')}
                      title="Not Applicable"
                      className={`p-1.5 rounded-md border transition-all ${status === 'na'
                        ? 'bg-slate-200 border-slate-400 text-slate-700'
                        : 'bg-white border-slate-200 text-slate-300 hover:border-slate-300 hover:text-slate-400'
                        }`}
                    >
                      <MinusCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-16 mb-6">
        {getStatusButton('pass', 'Pass', CheckCircle2)}
        {getStatusButton('fail', 'Fail', XCircle)}
        {getStatusButton('na', 'N/A', MinusCircle)}
      </div>

      <div className="mb-6 flex justify-center">
        <button
          onClick={() => setShowJustification(!showJustification)}
          className={`flex items-center gap-2 text-sm font-medium transition-colors ${showJustification ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          <MessageSquare className="w-4 h-4" />
          {showJustification ? 'Hide Review Notes' : 'Add Review Note / Justification'}
        </button>
      </div>

      {showJustification && (
        <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-200">
          <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
            Justification / Review Notes
          </label>
          <textarea
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            onBlur={handleNoteBlur}
            className="w-full p-4 border border-slate-300 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none shadow-sm placeholder:text-slate-400"
            rows={3}
            placeholder="Add observations, reasoning for N/A, or internal review notes..."
          />
        </div>
      )}


      <div className="flex items-center justify-between pt-6 border-t border-slate-200">
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="px-5 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          Previous
        </button>



        {/* Check if all conditions have been verified */}
        {(() => {
          const allConditionsVerified = conditions.every(c => {
            const s = getConditionStatus(c);
            return s !== null && s !== undefined;
          });
          const canProceed = allConditionsVerified && status && status !== 'pending';

          return (
            <button
              onClick={() => {
                if (!canProceed) return;
                hasNext ? onNext() : onViewReport();
              }}
              disabled={!canProceed}
              title={
                !allConditionsVerified
                  ? "Verify all conditions first"
                  : (!status || status === 'pending')
                    ? "Select a final status (Pass/Fail/N/A) before proceeding"
                    : hasNext ? "Next Criterion" : "View Report"
              }
              className={`px-6 py-2.5 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2
                ${!canProceed
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                  : hasNext
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
                }`}
            >
              {hasNext ? (
                'Next Criterion'
              ) : (
                <>
                  <FileBarChart className="w-4 h-4" />
                  View Report
                </>
              )}
            </button>
          );
        })()}
      </div>
    </div>
  );
}
