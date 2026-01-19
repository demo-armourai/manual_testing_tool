import { wcagChecklist } from '../utils/wcag-loader';

export const calculateComplianceScore = (progress) => {
    const checks = progress?.checks || {};
    const scIds = Object.keys(checks);
    const tested = scIds.length;

    // Helper to get status safely
    const getStatus = (id) => checks[id]?.status || 'untested';

    const passed = scIds.filter(id => getStatus(id) === 'pass').length;
    const failed = scIds.filter(id => getStatus(id) === 'fail').length;
    const na = scIds.filter(id => getStatus(id) === 'na').length;

    const total = wcagChecklist.length;
    const untested = total - tested;

    // Calculate score as percentage of applicable (passed / (total - na))
    const applicable = total - na;
    const score = applicable > 0 ? Math.round((passed / applicable) * 100) : 0;

    return {
        total,
        tested,
        passed,
        failed,
        na,
        untested,
        score
    };
};

export const calculatePrincipleScores = (progress) => {
    const principles = ['Perceivable', 'Operable', 'Understandable', 'Robust'];
    const checks = progress?.checks || {};
    const getStatus = (id) => checks[id]?.status || 'untested';

    return principles.map(principle => {
        const principleSCs = wcagChecklist.filter(sc => sc.principle === principle);

        const total = principleSCs.length;
        // Count scs that have an entry in checks
        const tested = principleSCs.filter(sc => checks[sc.id]).length;

        const passed = principleSCs.filter(sc => getStatus(sc.id) === 'pass').length;
        const failed = principleSCs.filter(sc => getStatus(sc.id) === 'fail').length;
        const na = principleSCs.filter(sc => getStatus(sc.id) === 'na').length;

        const untested = total - tested;
        const applicable = total - na;
        const score = applicable > 0 ? Math.round((passed / applicable) * 100) : 0;

        return {
            principle,
            score: {
                total,
                tested,
                passed,
                failed,
                na,
                untested,
                score
            }
        };
    });
};

export const getAutomationGaps = (progress) => {
    const checks = progress.checks;
    const getStatus = (id) => checks[id]?.status || 'untested';

    // Get SCs that need manual review and haven't been tested
    const manualSCs = wcagChecklist.filter(sc => sc.automationCoverage === 'none' || sc.automationCoverage === 'partial');
    const untestedManual = manualSCs.filter(sc => !checks[sc.id] || getStatus(sc.id) === 'untested');
    const partialAutomation = wcagChecklist.filter(sc => sc.automationCoverage === 'partial');

    return {
        untestedManual,
        partialAutomation,
        totalManualRequired: manualSCs.length,
        manualCompleted: manualSCs.length - untestedManual.length
    };
};

export const exportToJSON = (progress, findings) => {
    const score = calculateComplianceScore(progress);
    const principleScores = calculatePrincipleScores(progress);

    // Clean up checks to be simple map if needed, or export full object
    return {
        audit: {
            target: progress.targetName,
            url: progress.targetUrl,
            startedAt: progress.startedAt,
            lastUpdatedAt: progress.lastUpdatedAt,
            auditor: progress.auditor
        },
        compliance: {
            overall: score,
            byPrinciple: principleScores
        },
        checks: progress.checks, // Now exports { scId: { status, justification } } which is good
        findings: findings.map(f => ({
            id: f.id,
            scIds: f.scIds,
            scTitles: f.scTitles,
            severity: f.severity,
            description: f.description,
            url: f.url,
            page: f.page,
            component: f.component,
            cssSelector: f.cssSelector,
            status: f.status,
            createdAt: f.createdAt
        }))
    };
};

export const exportToCSV = (findings) => {
    const headers = [
        'ID',
        'WCAG SC',
        'Severity',
        'Description',
        'Page',
        'URL',
        'CSS Selector',
        'Status',
        'Created At'
    ];

    const rows = findings.map(f => [
        f.id,
        f.scIds.join('; '),
        f.severity,
        f.description,
        f.page,
        f.url,
        f.cssSelector || '',
        f.status,
        new Date(f.createdAt).toLocaleDateString()
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
};
