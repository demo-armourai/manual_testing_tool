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

            // Track seen items to avoid duplicates if backend returns historical records
            const seenPageIds = new Set();

            auditData.forEach(item => {
                const targetId = item.page_audit_id; // Use UUID as ID

                if (!seenPageIds.has(item.page_id)) {
                    targets.push({
                        id: targetId,
                        name: item.page_name || getHostname(item.page_url),
                        url: item.page_url,
                        domain: item.domain,
                        type: 'page',
                        createdAt: item.started_at,
                    });
                    seenPageIds.add(item.page_id);
                }

                audits[targetId] = {
                    targetId: targetId,
                    targetName: item.page_name,
                    targetUrl: item.page_url,
                    checks: {}, // Will be loaded per-audit when selected
                    startedAt: item.started_at,
                    lastUpdatedAt: item.started_at,
                    lastActiveScId: null,
                    page_audit_id: item.page_audit_id,
                    score: item.score || 0,
                    status: item.status || 'not_started'
                };
            });

            // Transform and load all findings
            const allFindings = findingsData.map(f => ({
                id: f.finding_id,
                result_id: f.result_id,
                severity: f.severity,
                description: f.description,
                selector: f.selector,
                domSnippet: f.html_snippet,
                notes: f.notes,
                scIds: [f.sc_id],
                auditId: f.auditId,
                createdAt: f.created_at,
                updatedAt: f.created_at,
                status: 'open',
                url: f.url || '',
                page: f.page || '',
                domain: f.domain || ''
            }));

            set({ targets, audits, findings: allFindings, loading: false });
        } catch (error) {
            console.error('Failed to fetch initial data:', error);
            set({ error: error.message, loading: false });
        }
    },

    addTarget: async (target) => {
        set({ loading: true, error: null });
        try {
            const hostname = getHostname(target.url);
            const response = await apiClient.post(API.AUDITS.START, {
                domain: hostname,
                page_url: target.url,
                page_name: target.name
            });

            const targetId = response.page_audit_id;
            const newTarget = {
                ...target,
                id: targetId,
                domain: hostname,
                createdAt: new Date(),
            };

            const newAudit = {
                targetId,
                targetName: target.name,
                targetUrl: target.url,
                checks: {},
                startedAt: new Date(),
                lastUpdatedAt: new Date(),
                lastActiveScId: null,
                page_audit_id: response.page_audit_id,
                page_id: response.page_id,
                score: 0,
                status: 'in_progress'
            };

            set((state) => ({
                targets: [...state.targets, newTarget],
                audits: { ...state.audits, [targetId]: newAudit },
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

            // Get target info to inject into findings (since findings table doesn't have url/page)
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
                    domSnippet: f.html_snippet,
                    notes: f.notes,
                    scIds: [f.sc_id],
                    auditId: f.auditId,
                    createdAt: f.created_at,
                    updatedAt: f.created_at,
                    status: 'open',
                    url: target?.url || '',
                    page: target?.name || ''
                });
            });

            // Process results
            const checks = results.reduce((acc, res) => {
                acc[res.sc_id] = {
                    status: res.result,
                    justification: res.notes,
                    checkedConditions: res.checked_conditions,
                    result_id: res.result_id
                };
                return acc;
            }, {});

            set((state) => {
                // Merge findings: Create map of existing, add/update with new
                const findingsMap = new Map(state.findings.map(f => [f.id, f]));
                allFindings.forEach(f => findingsMap.set(f.id, f));

                return {
                    audits: {
                        ...state.audits,
                        [targetId]: {
                            ...state.audits[targetId],
                            checks
                        }
                    },
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
        if (!audit) return;
        const check = audit.checks[scId];
        if (!check) return;

        set({ loading: true, error: null });
        try {
            const response = await apiClient.post(API.RESULTS.CREATE, {
                page_audit_id: targetId,
                sc_id: scId,
                result: check.status === 'untested' ? 'pending' : check.status,
                checked_conditions: check.checkedConditions || {},
                notes: check.justification || ''
            });

            // Store the result_id for future finding associations
            set((state) => ({
                audits: {
                    ...state.audits,
                    [targetId]: {
                        ...state.audits[targetId],
                        checks: {
                            ...state.audits[targetId].checks,
                            [scId]: {
                                ...state.audits[targetId].checks[scId],
                                result_id: response.result_id
                            }
                        }
                    }
                },
                loading: false
            }));
        } catch (error) {
            console.error('Failed to sync result:', error);
            set({ error: `Sync failed: ${error.message}`, loading: false });
        }
    },

    updateConditionStatus: async (scId, condition, status) => {
        const target = get().currentTarget;
        if (!target) return;

        const audit = get().audits[target.id];
        const existingCheck = audit?.checks[scId] || { status: 'pending', justification: '', checkedConditions: {} };

        const updatedConditions = {
            ...(existingCheck.checkedConditions || {}),
            [condition]: status
        };

        // Derive overall status: if any condition is 'fail', the entire SC is 'fail'
        let overallStatus = 'pending';
        const conditionValues = Object.values(updatedConditions);

        if (conditionValues.some(s => s === 'fail')) {
            overallStatus = 'fail';
        } else if (conditionValues.every(s => s === 'pass')) {
            overallStatus = 'pass';
        } else if (conditionValues.some(s => s === 'pass' || s === 'na')) {
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
            const scId = finding.scIds[0];
            const audit = get().audits[target.id];
            let result_id = audit?.checks[scId]?.result_id;

            // If no result_id, sync the result first
            if (!result_id) {
                await get().syncResultToBackend(target.id, scId);
                const updatedAudit = get().audits[target.id];
                result_id = updatedAudit?.checks[scId]?.result_id;
            }

            if (!result_id) {
                throw new Error('No result record found for this Success Criterion. Please set a status first.');
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
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            set((state) => ({
                findings: [...state.findings, newFinding],
                loading: false
            }));
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
                    id: response.finding_id, // ensure ID is correct from response
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
                        status: compliance.score === 100 ? 'completed' : 'in_progress'
                    }
                }
            }));
        } catch (error) {
            console.error('Failed to sync audit metadata:', error);
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
