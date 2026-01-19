import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient, API } from '../config/api';
import { calculateComplianceScore } from '../utils/compliance';

const getHostname = (url) => {
    try {
        if (!url) return '';
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        return urlObj.hostname;
    } catch (e) {
        return url;
    }
};

export const useAuditStore = create()(persist((set, get) => ({
    targets: [],
    currentTarget: null,
    audits: {}, // { [targetId]: AuditData }
    findings: [],
    loading: false,
    error: null,

    fetchInitialData: async () => {
        set({ loading: true, error: null });
        try {
            const [auditData, findingsData] = await Promise.all([
                apiClient.get(API.AUDITS.LIST),
                apiClient.get(API.FINDINGS.LIST)
            ]);

            // Transform backend data to frontend store structure
            const targets = [];
            const audits = {};

            auditData.forEach(item => {
                const targetId = item.page_audit_id; // Use UUID as ID

                targets.push({
                    id: targetId,
                    page_id: item.page_id,
                    name: item.page_name || getHostname(item.page_url),
                    url: item.page_url,
                    domain: item.domain,
                    type: 'page',
                    createdAt: item.started_at,
                    status: item.status,
                    score: item.score,
                    compliance_score_id: item.compliance_score_id,
                    tested_count: parseInt(item.tested_count) || 0,
                    total_count: parseInt(item.total_count) || 78
                });

                audits[targetId] = {
                    targetId: targetId,
                    targetName: item.page_name,
                    targetUrl: item.page_url,
                    checks: {}, // Will be loaded per-audit when selected
                    startedAt: item.started_at,
                    lastUpdatedAt: item.started_at,
                    lastActiveScId: null,
                    page_audit_id: item.page_audit_id,
                    compliance_score_id: item.compliance_score_id,
                    score: item.score || 0,
                    status: item.status || 'not_started',
                    tested_count: parseInt(item.tested_count) || 0,
                    total_count: parseInt(item.total_count) || 78
                };
            });

            // Transform and load all findings
            const allFindings = findingsData.map(f => ({
                id: f.finding_id,
                result_id: f.result_id,
                severity: f.severity,
                description: f.description,
                selector: f.selector,
                domSnippet: f.html_snippet || f.domSnippet || '',
                notes: f.notes || '',
                scIds: Array.isArray(f.sc_id) ? f.sc_id : [f.sc_id],
                auditId: f.auditId || f.auditid || f.page_audit_id,
                createdAt: f.created_at,
                updatedAt: f.created_at,
                status: 'open',
                url: f.url || '',
                page: f.page || '',
                domain: f.domain || ''
            }));

            console.log(`[fetchInitialData] Processed ${allFindings.length} findings`);
            if (allFindings.length > 0) {
                console.log('[fetchInitialData] Sample finding:', {
                    id: allFindings[0].id,
                    auditId: allFindings[0].auditId,
                    hasSnippet: !!allFindings[0].domSnippet,
                    hasNotes: !!allFindings[0].notes
                });
            }

            set({ targets, audits, findings: allFindings, loading: false });
        } catch (error) {
            console.error('Failed to fetch initial data:', error);
            set({ error: error.message, loading: false });
        }
    },

    addTarget: async (target, explicitAuditId = null) => {
        set({ loading: true, error: null });
        try {
            const hostname = getHostname(target.url);
            const response = await apiClient.post(API.AUDITS.START, {
                domain: hostname,
                page_url: target.url,
                page_name: target.name,
                compliance_score_id: target.compliance_score_id,
                audit_id: explicitAuditId
            });

            const targetId = response.page_audit_id;

            // Check if we already have this target in state
            const existingTarget = get().targets.find(t => t.id === targetId);
            const existingAudit = get().audits[targetId];

            const newTarget = {
                ...(existingTarget || {}),
                ...target,
                id: targetId,
                domain: hostname,
                createdAt: existingAudit?.startedAt || existingTarget?.createdAt || new Date(),
                score: existingAudit?.score ?? existingTarget?.score ?? 0,
                tested_count: existingAudit?.tested_count ?? existingTarget?.tested_count ?? 0,
                total_count: existingAudit?.total_count ?? existingTarget?.total_count ?? 78,
                status: existingAudit?.status || existingTarget?.status || 'in_progress'
            };

            const newAudit = {
                targetId,
                targetName: target.name,
                targetUrl: target.url,
                checks: existingAudit?.checks || {}, // Preserve existing checks if resuming
                startedAt: existingAudit?.startedAt || existingTarget?.createdAt || new Date(),
                lastUpdatedAt: new Date(),
                lastActiveScId: existingAudit?.lastActiveScId || null,
                page_audit_id: response.page_audit_id,
                page_id: response.page_id,
                score: existingAudit?.score ?? existingTarget?.score ?? 0,
                tested_count: existingAudit?.tested_count ?? existingTarget?.tested_count ?? 0,
                total_count: existingAudit?.total_count ?? existingTarget?.total_count ?? 78,
                status: existingAudit?.status || existingTarget?.status || 'in_progress',
                compliance_score_id: target.compliance_score_id
            };

            set((state) => ({
                targets: existingTarget
                    ? state.targets.map(t => t.id === targetId ? newTarget : t)
                    : [...state.targets, newTarget],
                audits: { ...state.audits, [targetId]: { ...(state.audits[targetId] || {}), ...newAudit } },
                loading: false
            }));

            return targetId;
        } catch (error) {
            console.error('Failed to add target:', error);
            set({ error: error.message, loading: false });
        }
    },

    deleteTarget: async (id) => {
        try {
            await apiClient.delete(API.AUDITS.DELETE(id));

            set((state) => {
                const targetToDelete = state.targets.find(t => t.id === id);
                const { [id]: deletedAudit, ...remainingAudits } = state.audits;
                const remainingFindings = targetToDelete
                    ? state.findings.filter(f => f.url !== targetToDelete.url && f.page !== targetToDelete.name)
                    : state.findings;

                return {
                    targets: state.targets.filter((t) => t.id !== id),
                    audits: remainingAudits,
                    findings: remainingFindings,
                    currentTarget: state.currentTarget?.id === id ? null : state.currentTarget,
                };
            });
        } catch (error) {
            console.error('Failed to delete target:', error);
            set({ error: error.message });
        }
    },

    setCurrentTarget: async (target) => {
        set({ currentTarget: target });
        if (target) {
            await get().loadAuditResults(target.id);
        }
    },

    loadAuditResults: async (targetId) => {
        set({ loading: true });
        try {
            const results = await apiClient.get(API.RESULTS.BY_AUDIT(targetId));
            // Fetch all findings for this audit in one request
            const allFindingsData = await apiClient.get(API.FINDINGS.BY_AUDIT(targetId));

            const target = get().targets.find(t => t.id === targetId);
            const allFindings = [];

            // Map findings to frontend structure
            allFindingsData.forEach(f => {
                allFindings.push({
                    id: f.finding_id,
                    result_id: f.result_id,
                    severity: f.severity,
                    description: f.description,
                    selector: f.selector,
                    domSnippet: f.html_snippet || f.domSnippet || '',
                    notes: f.notes || '',
                    scIds: Array.isArray(f.sc_id) ? f.sc_id : [f.sc_id],
                    auditId: targetId, // CRITICAL: Use targetId to ensure correct audit association
                    createdAt: f.created_at,
                    updatedAt: f.created_at,
                    status: 'open',
                    url: f.url || target?.url || '',
                    page: f.page || target?.name || '',
                    domain: f.domain || ''
                });
            });

            // Process results
            const checks = results.reduce((acc, res) => {
                // Ensure checkedConditions is parsed if it's a string, though apiClient usually handles JSON
                let checkedConditions = res.checked_conditions || {};

                // Normalization: Ensure all conditions are objects { status, tag }
                // This handles migration from old string-only status format
                const normalizedConditions = {};
                Object.entries(checkedConditions).forEach(([key, value]) => {
                    if (typeof value === 'string') {
                        normalizedConditions[key] = { status: value, tag: 'manual' };
                    } else {
                        normalizedConditions[key] = value;
                    }
                });

                acc[res.sc_id] = {
                    status: res.result,
                    justification: res.notes,
                    checkedConditions: normalizedConditions,
                    result_id: res.result_id
                };
                return acc;
            }, {});

            set((state) => {
                // Merge findings: Exclude current audit's findings, then add freshly loaded ones
                // This ensures we always have the latest findings from the backend for this audit
                console.log(`[loadAuditResults] Filtering out ${state.findings.filter(f => (f.auditId || f.auditid) === targetId).length} existing findings for ${targetId}`);

                const findingsMap = new Map(
                    state.findings
                        .filter(f => {
                            const fId = (f.auditId || f.auditid || '').toString().toLowerCase();
                            const tId = (targetId || '').toString().toLowerCase();
                            return fId !== tId;
                        })
                        .map(f => [f.id, f])
                );

                // Add all findings from the current audit (freshly loaded from backend)
                allFindings.forEach(f => {
                    findingsMap.set(f.id, f);
                    console.log(`[loadAuditResults] Loaded finding ${f.id} from backend for ${targetId}`);
                });

                const updatedAudit = {
                    ...state.audits[targetId],
                    checks
                };

                // Recalculate metrics
                const compliance = calculateComplianceScore(updatedAudit);
                updatedAudit.score = compliance.score;
                updatedAudit.tested_count = compliance.tested;
                updatedAudit.total_count = compliance.total;

                console.log(`[loadAuditResults] Loaded ${allFindings.length} findings for audit ${targetId}`);
                console.log(`[loadAuditResults] Total findings in store: ${findingsMap.size}`);

                return {
                    audits: {
                        ...state.audits,
                        [targetId]: updatedAudit
                    },
                    targets: state.targets.map(t => t.id === targetId ? {
                        ...t,
                        score: compliance.score,
                        tested_count: compliance.tested,
                        total_count: compliance.total
                    } : t),
                    findings: Array.from(findingsMap.values()),
                    loading: false
                };
            });
        } catch (error) {
            console.error('Failed to load audit results/findings:', error);
            set({ error: error.message, loading: false });
        }
    },

    startAudit: (targetId) => {
        // This is now partially handled by addTarget or loadAuditResults
        const target = get().targets.find((t) => t.id === targetId);
        if (!target) return;

        const audits = get().audits;
        if (audits[targetId]) return;

        const newAudit = {
            targetId,
            targetName: target.name,
            targetUrl: target.url,
            checks: {},
            startedAt: new Date(),
            lastUpdatedAt: new Date(),
            lastActiveScId: null,
            score: 0,
            status: 'in_progress'
        };

        set((state) => ({
            audits: { ...state.audits, [targetId]: newAudit }
        }));
    },

    setLastActiveScId: (scId) => {
        const target = get().currentTarget;
        if (!target) return;

        set((state) => {
            const audit = state.audits[target.id];
            if (!audit) return state;

            return {
                audits: {
                    ...state.audits,
                    [target.id]: {
                        ...audit,
                        lastActiveScId: scId,
                        lastUpdatedAt: new Date(),
                    },
                },
            };
        });
    },

    syncResultToBackend: async (targetId, scId) => {
        const audit = get().audits[targetId];
        if (!audit) return null; // Return result_id if possible

        const check = audit.checks[scId] || { status: 'pending', justification: '', checkedConditions: {} };

        set({ loading: true, error: null });
        try {
            const response = await apiClient.post(API.RESULTS.CREATE, {
                page_audit_id: targetId,
                sc_id: scId,
                result: check.status === 'untested' ? 'pending' : (check.status || 'pending'),
                checked_conditions: check.checkedConditions || {},
                notes: check.justification || ''
            });

            const result_id = response.result_id;

            // Store the result_id for future finding associations
            set((state) => {
                const updatedAudit = state.audits[targetId] || audit;
                return {
                    audits: {
                        ...state.audits,
                        [targetId]: {
                            ...updatedAudit,
                            checks: {
                                ...updatedAudit.checks,
                                [scId]: {
                                    ...(updatedAudit.checks[scId] || check),
                                    result_id: result_id
                                }
                            }
                        }
                    },
                    loading: false
                };
            });
            return result_id;
        } catch (error) {
            console.error('Failed to sync result:', error);
            set({ error: `Sync failed: ${error.message}`, loading: false });
            return null;
        }
    },

    updateConditionStatus: async (scId, condition, status) => {
        const target = get().currentTarget;
        if (!target) return;

        const audit = get().audits[target.id];
        const existingCheck = audit?.checks[scId] || { status: 'pending', justification: '', checkedConditions: {} };

        const updatedConditions = {
            ...(existingCheck.checkedConditions || {}),
            [condition]: { status, tag: 'manual' }
        };

        // Derive overall status: if any condition is 'fail', the entire SC is 'fail'
        let overallStatus = 'pending';
        const conditionValues = Object.values(updatedConditions);

        if (conditionValues.some(v => (v?.status || v) === 'fail')) {
            overallStatus = 'fail';
        } else if (conditionValues.every(v => (v?.status || v) === 'pass')) {
            overallStatus = 'pass';
        } else if (conditionValues.some(v => (v?.status || v) === 'pass' || (v?.status || v) === 'na')) {
            overallStatus = 'pending';
        }

        const newAuditData = {
            ...audit,
            checks: {
                ...audit?.checks,
                [scId]: {
                    ...existingCheck,
                    status: overallStatus,
                    checkedConditions: updatedConditions
                }
            },
            lastUpdatedAt: new Date(),
        };

        set((state) => ({
            audits: { ...state.audits, [target.id]: newAuditData }
        }));

        await get().syncResultToBackend(target.id, scId);
        await get().syncAuditMetadata(target.id);
    },

    updateCheckStatus: async (scId, status) => {
        const target = get().currentTarget;
        if (!target) return;

        const audit = get().audits[target.id];
        if (!audit) return;

        const currentCheck = audit.checks[scId] || { justification: '', checkedConditions: {} };

        const newAuditData = {
            ...audit,
            checks: {
                ...audit.checks,
                [scId]: { ...currentCheck, status },
            },
            lastUpdatedAt: new Date(),
        };

        set((state) => ({
            audits: { ...state.audits, [target.id]: newAuditData }
        }));

        await get().syncResultToBackend(target.id, scId);
        await get().syncAuditMetadata(target.id);
    },

    updateCheckJustification: async (scId, justification) => {
        const target = get().currentTarget;
        if (!target) return;

        const audit = get().audits[target.id];
        if (!audit) return;

        const currentCheck = audit.checks[scId] || { status: 'pending', checkedConditions: {} };

        const newAuditData = {
            ...audit,
            checks: {
                ...audit.checks,
                [scId]: { ...currentCheck, justification },
            },
            lastUpdatedAt: new Date(),
        };

        set((state) => ({
            audits: { ...state.audits, [target.id]: newAuditData }
        }));

        await get().syncResultToBackend(target.id, scId);
        await get().syncAuditMetadata(target.id);
    },

    getCheckStatus: (scId) => {
        const target = get().currentTarget;
        if (!target) return 'untested';
        const audit = get().audits[target.id];
        return audit?.checks[scId]?.status || 'untested';
    },

    getCheckJustification: (scId) => {
        const target = get().currentTarget;
        if (!target) return '';
        const audit = get().audits[target.id];
        return audit?.checks[scId]?.justification || '';
    },

    addFinding: async (finding) => {
        const target = get().currentTarget;
        if (!target) return;

        set({ loading: true, error: null });
        try {
            // Try to get result_id for the first SC in focus
            const scId = finding.scIds && finding.scIds.length > 0 ? finding.scIds[0] : null;
            if (!scId) throw new Error('No Success Criterion selected for this finding.');

            const audit = get().audits[target.id];
            let result_id = audit?.checks[scId]?.result_id;

            // If no result_id, sync the result first and get it back
            if (!result_id) {
                console.log(`[addFinding] No result_id found for ${scId}, syncing now...`);
                result_id = await get().syncResultToBackend(target.id, scId);
            }

            if (!result_id) {
                throw new Error('Could not establish a database record for this Success Criterion. Please ensure it is marked as Pass/Fail first.');
            }

            const response = await apiClient.post(API.FINDINGS.CREATE, {
                result_id,
                severity: finding.severity,
                description: finding.description,
                selector: finding.selector || finding.cssSelector || '',
                html_snippet: finding.domSnippet || '',
                notes: finding.notes || ''
            });

            const newFinding = {
                ...finding,
                id: response.finding_id,
                auditId: target.id,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            console.log('[addFinding] Created new finding:', newFinding);
            console.log('[addFinding] Finding auditId:', newFinding.auditId);
            console.log('[addFinding] Current target id:', target.id);

            set((state) => {
                const updatedFindings = [...state.findings, newFinding];
                console.log('[addFinding] Total findings after add:', updatedFindings.length);
                console.log('[addFinding] Findings for this audit:', updatedFindings.filter(f => f.auditId === target.id).length);
                return {
                    findings: updatedFindings,
                    loading: false
                };
            });
        } catch (error) {
            console.error('Failed to add finding:', error);
            set({ error: `Failed to save finding: ${error.message}`, loading: false });
        }
    },

    updateFinding: async (id, updates) => {
        set({ loading: true });
        try {
            const response = await apiClient.put(API.FINDINGS.UPDATE(id), {
                severity: updates.severity,
                description: updates.description,
                selector: updates.selector || updates.cssSelector || '',
                html_snippet: updates.html_snippet || updates.domSnippet || '',
                notes: updates.notes || ''
            });

            set((state) => ({
                findings: state.findings.map((f) => f.id === id ? {
                    ...f,
                    ...updates,
                    selector: updates.selector || updates.cssSelector || f.selector,
                    domSnippet: updates.html_snippet || updates.domSnippet || f.domSnippet,
                    id: response.finding_id,
                    updatedAt: new Date()
                } : f),
                loading: false
            }));
        } catch (error) {
            console.error('Failed to update finding:', error);
            set({ error: error.message, loading: false });
        }
    },

    deleteFinding: async (id) => {
        set({ loading: true });
        try {
            await apiClient.delete(API.FINDINGS.DELETE(id));
            set((state) => ({
                findings: state.findings.filter((f) => f.id !== id),
                loading: false
            }));
        } catch (error) {
            console.error('Failed to delete finding:', error);
            set({ error: error.message, loading: false });
        }
    },

    getFindingsForTarget: (targetId) => {
        return get().findings.filter((f) => f.auditId === targetId);
    },

    getFindingsBySC: (scId) => {
        return get().findings.filter((f) => f.scIds?.includes(scId));
    },

    syncAuditMetadata: async (targetId) => {
        const audit = get().audits[targetId];
        if (!audit) return;

        const compliance = calculateComplianceScore(audit);

        try {
            await apiClient.put(API.AUDITS.UPDATE(targetId), {
                score: compliance.score,
                status: compliance.score === 100 ? 'completed' : 'in_progress'
            });

            set((state) => ({
                audits: {
                    ...state.audits,
                    [targetId]: {
                        ...state.audits[targetId],
                        score: compliance.score,
                        tested_count: compliance.tested,
                        total_count: compliance.total,
                        status: compliance.score === 100 ? 'completed' : 'in_progress'
                    }
                },
                targets: state.targets.map(t => t.id === targetId ? {
                    ...t,
                    score: compliance.score,
                    tested_count: compliance.tested,
                    total_count: compliance.total
                } : t)
            }));
        } catch (error) {
            console.error('Failed to sync audit metadata:', error);
        }
    },

    syncAutomatedChecks: async (targetId) => {
        set({ loading: true, error: null });
        try {
            const response = await apiClient.post(API.AUDITS.SYNC_AUTOMATED(targetId));

            // Reload results to reflect the sync
            await get().loadAuditResults(targetId);

            set({ loading: false });
            return response;
        } catch (error) {
            console.error('Failed to sync automated checks:', error);
            set({ error: `Automation sync failed: ${error.message}`, loading: false });
            throw error;
        }
    },

    generateReport: async (targetId) => {
        set({ loading: true });
        try {
            const report = await apiClient.post(API.REPORTS.GENERATE, {
                page_audit_id: targetId
            });

            // Optionally update state with report data if needed
            set({ loading: false });
            return report;
        } catch (error) {
            console.error('Failed to generate report:', error);
            set({ error: error.message, loading: false });
        }
    },

    clearAll: () => {
        set({
            targets: [],
            currentTarget: null,
            audits: {},
            findings: [],
        });
    },
}), {
    name: 'wcag-audit-storage',
    version: 2, // Bump version to force clear old cache with ghost data
}));
