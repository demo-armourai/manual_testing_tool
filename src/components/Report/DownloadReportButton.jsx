import React, { useMemo, useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ReportDocument from './PDFReport';
import { useAuditStore } from '../../hooks/useAuditStore';
import { wcagChecklist } from '../../utils/wcag-loader';
import { apiClient } from '../../config/api';
import { API } from '../../config/api';

const DownloadReportButton = () => {
    const { currentTarget, audits, findings } = useAuditStore();
    const [reportJsonData, setReportJsonData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch comprehensive JSON data from backend when currentTarget changes
    useEffect(() => {
        const fetchReportData = async () => {
            if (!currentTarget?.id) {
                return;
            }

            setLoading(true);
            setError(null);

            try {
                // First ensure report is generated
                await apiClient.post(API.REPORTS.GENERATE, {
                    page_audit_id: currentTarget.id
                });

                // Then fetch comprehensive JSON data
                const jsonData = await apiClient.get(API.REPORTS.BY_AUDIT_JSON(currentTarget.id));
                console.log('Fetched report JSON data:', jsonData);
                console.log('Tests count:', jsonData.tests?.length);
                console.log('Findings count:', jsonData.findings?.length);
                setReportJsonData(jsonData);
            } catch (err) {
                console.error('Failed to fetch report JSON data:', err);
                console.error('Error details:', err.message, err.stack);
                setError(err.message);
                // Fall back to client-side data generation
                setReportJsonData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [currentTarget?.id]);

    const reportData = useMemo(() => {
        // If we have JSON data from backend, use it directly
        if (reportJsonData) {
            console.log('Using JSON data from backend:', reportJsonData);
            return reportJsonData;
        }

        console.log('Using fallback client-side data generation');

        // Fallback to client-side data generation (backward compatibility)
        const activeTarget = currentTarget || { url: 'https://example.com', name: 'ArmourWebComply', id: 'unknown' };
        const audit = activeTarget.id && audits[activeTarget.id] ? audits[activeTarget.id] : null;

        const targetUrl = activeTarget.url;
        const projectName = activeTarget.name;
        const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

        // Filter findings for this specific audit
        const activeFindings = findings.filter(f => f.auditId === activeTarget.id);

        // 1. Map findings for easy lookup
        const findingsMap = new Map(); // key -> [findings]
        activeFindings.forEach(f => {
            if (f.scIds && f.scIds.length > 0) {
                f.scIds.forEach(id => {
                    if (!findingsMap.has(id)) findingsMap.set(id, []);
                    findingsMap.get(id).push(f);
                });
            }
            // Also map by axe rule id if stored directly (fallback)
            if (f.ruleId) {
                if (!findingsMap.has(f.ruleId)) findingsMap.set(f.ruleId, []);
                findingsMap.get(f.ruleId).push(f);
            }
        });

        // 2. Use full Checklist (matches report scope)
        const allChecks = wcagChecklist;

        // 3. Map checklist items to report tests using AUDIT STATE
        const tests = allChecks.map(sc => {
            // Get status from the audit checks if available
            // audit.checks is { [scId]: { status: 'pass'|'fail'|'na'|'untested', ... } }
            const check = audit && audit.checks && audit.checks[sc.id];
            const status = check ? check.status : 'untested';

            // Normalize status for PDF (Pass, Fail, Untested, N/A)
            let result = 'Untested';
            if (status === 'pass') result = 'Pass';
            if (status === 'fail') result = 'Fail';
            if (status === 'na') result = 'N/A';

            // Get findings for this SC
            const scFindings = findingsMap.get(sc.id) || [];

            // Determine impact
            // If failed, use finding severity. If passed/untested, 'minor' (or N/A)
            const impact = (result === 'Fail' && scFindings.length > 0)
                ? (scFindings[0].severity || 'minor')
                : 'minor';

            return {
                id: sc.id,
                description: `${sc.title}: ${sc.description}`,
                result: result,
                impact: impact,
                findings: scFindings
            };
        });

        return {
            targetUrl,
            projectName,
            date,
            tests,
            detailedFindings: activeFindings
        };
    }, [currentTarget, audits, findings, reportJsonData]);

    // Only render PDF when we have data
    const isReady = reportData && Object.keys(reportData).length > 0 && currentTarget;

    // Don't render PDFDownloadLink until data is ready
    if (!isReady) {
        return (
            <div>
                <button
                    className="flex items-center px-4 py-2 bg-gray-400 text-white rounded-md shadow-md cursor-not-allowed opacity-50"
                    disabled
                    title="Waiting for report data..."
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {loading ? 'Loading Data...' : 'Preparing Report...'}
                </button>
            </div>
        );
    }

    return (
        <div>
            {error && (
                <div className="mb-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                    Warning: {error}. Using available data.
                </div>
            )}
            <PDFDownloadLink
                document={<ReportDocument data={reportData} />}
                fileName={`wcag-report-${currentTarget?.name?.replace(/\s+/g, '-') || 'report'}-${Date.now()}.pdf`}
            >
                {({ blob, url, loading: pdfLoading, error: pdfError }) => (
                    <button
                        className={`
                            flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors
                            ${pdfLoading ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        disabled={pdfLoading}
                        title="Download PDF Report"
                    >
                        <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {pdfLoading ? 'Generating...' : 'Report'}
                    </button>
                )}
            </PDFDownloadLink>
        </div>
    );
};

export default DownloadReportButton;
