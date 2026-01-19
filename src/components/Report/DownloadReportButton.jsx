import React, { useMemo, useState, useEffect } from 'react';
import { useAuditStore } from '../../hooks/useAuditStore';
import { wcagChecklist } from '../../utils/wcag-loader';
import { apiClient } from '../../config/api';
import { API } from '../../config/api';
import { FileText, Download } from 'lucide-react';

const DownloadReportButton = ({ auditedEntity, onTogglePreview, isPreviewVisible }) => {
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
                setReportJsonData(jsonData);
            } catch (err) {
                console.error('Failed to fetch report JSON data:', err);
                setError(err.message);
                setReportJsonData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [currentTarget?.id]);

    const handlePrint = () => {
        if (!isPreviewVisible && onTogglePreview) {
            onTogglePreview(true);
            // Give enough time for the report/charts to render before opening print dialog
            setTimeout(() => {
                window.print();
            }, 1000);
        } else {
            window.print();
        }
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={handlePrint}
                className={`
                    flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors
                    ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                disabled={loading}
                title="Print / Save as PDF"
            >
                <FileText className="w-4 h-4 mr-2" />
                {loading ? 'Preparing...' : 'Print Report'}
            </button>

            {onTogglePreview && (
                <button
                    onClick={() => onTogglePreview(!isPreviewVisible)}
                    className={`
                        flex items-center px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-md shadow-sm hover:bg-blue-50 transition-colors
                    `}
                    title={isPreviewVisible ? "Back to Dashboard" : "Preview Full Report"}
                >
                    {isPreviewVisible ? "Close Preview" : "Preview"}
                </button>
            )}
        </div>
    );
};

export default DownloadReportButton;
