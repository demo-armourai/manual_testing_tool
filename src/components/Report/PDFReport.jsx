import React from 'react';
import { Check, X, Minus, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { getSCById } from '../../utils/wcag-loader';

const PDFReport = ({ data }) => {
    // Inject print-only styles for page breaks and background colors
    const printStyles = `
        @media print {
            body { 
                print-color-adjust: exact !important; 
                -webkit-print-color-adjust: exact !important; 
            }
            .page-break { 
                page-break-before: always !important; 
                break-before: page !important;
            }
            @page {
                size: A4;
                margin: 0;
            }
        }
    `;

    // Logic from PDFReport.jsx to process data
    let reportData;

    if (data && data.assessment) {
        // New JSON format
        reportData = {
            targetUrl: data.assessment.targetWebsite,
            projectName: data.assessment.projectName,
            date: new Date(data.assessment.assessmentDate).toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            tests: (data.tests || []).sort((a, b) => {
                const scA = a.scId || a.wcagCriteria || a.id || '';
                const scB = b.scId || b.wcagCriteria || b.id || '';
                return scA.localeCompare(scB, undefined, { numeric: true });
            }),
            detailedFindings: (data.findings || []).sort((a, b) => {
                const getSeverityWeight = (severity) => {
                    const s = (severity || '').toLowerCase();
                    if (s.includes('critical')) return 0;
                    if (s.includes('serious')) return 1;
                    if (s.includes('moderate')) return 2;
                    if (s.includes('minor')) return 3;
                    return 4;
                };
                return getSeverityWeight(a.severity) - getSeverityWeight(b.severity);
            }),
            compliance: data.compliance,
            summary: data.summary,
            preparedFor: data.assessment.preparedFor,
            preparedBy: data.assessment.preparedBy,
            wcagVersion: data.assessment.complianceStandard,
            testingTechnology: data.assessment.testingTechnology,
            reportVersion: data.assessment.reportVersion
        };
    } else if (data) {
        // Fallback for simple data structure if passed directly
        reportData = {
            targetUrl: data.targetUrl,
            projectName: data.projectName,
            date: data.date || new Date().toLocaleString(),
            tests: data.tests || [],
            detailedFindings: data.detailedFindings || [],
            compliance: null,
            summary: null,
            preparedFor: 'User',
            preparedBy: {
                organization: 'Professional Accessibility Testing Team',
                email: 'accessibility@wcag-audit.com',
                role: 'Certified WCAG Auditor'
            },
            wcagVersion: 'WCAG 2.2 Level A',
            testingTechnology: 'axe-core v4.10.3',
            reportVersion: '1.0'
        };
    } else {
        return <div className="p-8 text-center text-gray-500">No report data available. Please Start an audit first.</div>;
    }

    const { targetUrl, projectName, date, tests, detailedFindings, compliance, summary, preparedFor, preparedBy, wcagVersion, testingTechnology, reportVersion } = reportData;

    // Debug: Log findings data
    console.log('PDFReport - Total tests:', tests.length);
    console.log('PDFReport - Total detailed findings:', detailedFindings.length);
    console.log('PDFReport - Sample finding:', detailedFindings[0]);

    const totalTests = tests.length;
    const passedTests = compliance?.testsPassed ?? tests.filter(t => t.result === 'Pass').length;
    const failedTests = compliance?.issuesDetected ?? tests.filter(t => t.result === 'Fail').length;
    const score = compliance?.score ?? (totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0);

    return (
        <div className="max-w-4xl mx-auto bg-white shadow-lg my-8 print:shadow-none print:my-0">
            <style dangerouslySetInnerHTML={{ __html: printStyles }} />
            {/* Page 1: Cover */}
            <div className="min-h-[1100px] relative flex flex-col bg-white">
                {/* Header Section */}
                <div className="bg-blue-500 text-white p-12 pb-24 flex flex-col items-center relative h-[45%] justify-center">
                    <div className="absolute top-8 right-8 bg-white px-3 py-1.5 rounded-full shadow-sm">
                        <span className="text-blue-600 text-xs font-bold tracking-wider">WCAG 2.2 CERTIFIED</span>
                    </div>

                    <div className="bg-white p-4 px-8 rounded-xl shadow-lg mb-8 flex items-center space-x-3 text-gray-800">
                        <svg width="30" height="30" viewBox="0 0 24 24" className="text-blue-600">
                            <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                            <path fill="white" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                        <span className="text-xl font-bold uppercase tracking-wider">Auditor</span>
                    </div>

                    <h1 className="text-4xl font-bold text-center mb-2">Web Content Accessibility Guidelines</h1>
                    <h2 className="text-3xl font-bold text-center mb-4">(WCAG) A & AA</h2>
                    <p className="text-blue-100 text-lg">Comprehensive Compliance Testing Report</p>

                    <div className="w-12 h-1 bg-blue-300 rounded mt-8"></div>
                </div>

                {/* Content Container */}
                <div className="p-12">
                    <div className="border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 text-center border-b pb-4">Assessment Details</h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Target Website', value: targetUrl },
                                { label: 'Project Name', value: projectName },
                                { label: 'Assessment Date', value: date },
                                { label: 'Report Version', value: reportVersion },
                                { label: 'Testing Technology', value: testingTechnology },
                                { label: 'Compliance Standard', value: 'A & AA' },
                            ].map((item, i) => (
                                <div key={i} className="flex border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                                    <span className="w-1/3 text-sm font-bold text-gray-500 uppercase tracking-wide">{item.label}</span>
                                    <span className="w-2/3 text-sm text-gray-800 font-medium">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Page 2: Table of Contents */}
            <div className="p-12 bg-white min-h-[1100px] border-t-4 border-gray-100 page-break">
                <div className="flex justify-between items-center border-b-2 border-blue-600 pb-2 mb-8">
                    <span className="text-blue-600 font-semibold">{wcagVersion} Assessment Report</span>
                    <span className="text-gray-500">Table of Contents</span>
                </div>

                <h2 className="text-3xl font-bold text-gray-900 mb-8">Table of Contents</h2>

                <div className="mt-8 space-y-3">
                    {['Executive Summary', 'Findings Overview', 'Detailed Findings', 'All Tests Performed', 'Conclusion', 'Appendix'].map((item, i) => (
                        <div key={i} className="bg-gray-50 border border-gray-200 rounded p-4 text-gray-700 font-bold text-sm">
                            {item}
                        </div>
                    ))}
                </div>
            </div>

            {/* Page 3: Executive Summary */}
            <div className="p-12 bg-white min-h-[1100px] border-t-4 border-gray-100 page-break">
                <div className="flex justify-between items-center border-b-2 border-blue-600 pb-2 mb-8">
                    <span className="text-blue-600 font-semibold">{wcagVersion} Assessment Report</span>
                    <span className="text-gray-500">Executive Summary</span>
                </div>

                <h2 className="text-3xl font-bold text-gray-900 mb-8">Executive Summary</h2>

                <h3 className="text-xl font-bold text-gray-800 mb-4">Compliance Results</h3>

                <div className={`border rounded-lg p-6 mb-8 ${failedTests === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="space-y-4">
                        {[
                            { label: 'Compliance Level', value: compliance?.level || (score === 100 ? "Fully Compliant" : "Partially Compliant") + " A & AA" },
                            { label: 'Overall Score', value: `${score}% compliance` },
                            { label: 'Tests Passed', value: `${passedTests} of ${totalTests} accessibility rules` },
                            { label: 'Issues Detected', value: `${failedTests} violations` },
                            { label: 'Success Rate', value: `${score}% of tested rules passed` },
                            { label: 'Testing Status', value: compliance?.testingStatus || 'Complete' },
                        ].map((item, i) => (
                            <div key={i} className="flex">
                                <span className={`w-40 text-sm font-bold ${failedTests === 0 ? 'text-green-700' : 'text-red-700'}`}>{item.label}:</span>
                                <span className={`flex-1 text-sm ${failedTests === 0 ? 'text-green-800' : 'text-red-900'}`}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Findings Overview */}
            {detailedFindings && detailedFindings.length > 0 && (
                <div className="p-12 bg-white min-h-[1100px] border-t-4 border-gray-100 page-break">
                    <div className="flex justify-between items-center border-b-2 border-blue-600 pb-2 mb-8">
                        <span className="text-blue-600 font-semibold">{wcagVersion} Assessment Report</span>
                        <span className="text-gray-500">Findings Overview</span>
                    </div>

                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Findings Overview</h2>
                    <p className="text-gray-600 mb-8">The following violations were detected during the assessment.</p>

                    <div className="space-y-4">
                        {detailedFindings.map((finding, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-lg p-5 bg-gray-50 break-inside-avoid">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1 pr-4">
                                        <h4 className="text-sm font-bold text-red-700">
                                            {finding.scTitles && finding.scTitles.length > 0 ? finding.scTitles.join(', ') : (finding.wcagCriteria || finding.scId || 'Violation')}
                                        </h4>
                                    </div>
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                                        {finding.severity || finding.impact || 'Critical'}
                                    </span>
                                </div>
                                <div className="space-y-2 text-xs text-gray-600">
                                    {(() => {
                                        // Helper to lookup success criteria ID
                                        const scId = finding.scIds && finding.scIds.length > 0 ? finding.scIds[0] : (finding.scId || '').split(' ')[0];
                                        const scDetails = getSCById(scId);
                                        const displaySC = scDetails && scDetails.id ? scDetails.id : (scId || 'N/A');

                                        return (
                                            <p><span className="font-semibold text-gray-700">WCAG Criterion:</span> <code className="bg-gray-200 px-1 py-0.5 rounded">{displaySC}</code></p>
                                        );
                                    })()}
                                    {finding.htmlSnippet && (
                                        <p><span className="font-semibold text-gray-700">HTML:</span> <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-800 block mt-1 p-1 overflow-x-auto">{(finding.htmlSnippet || '').substring(0, 150)}...</code></p>
                                    )}
                                    <p><span className="font-semibold text-gray-700">Page affected :</span> <a href={finding.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">{finding.url}</a></p>
                                    <p><span className="font-semibold text-gray-700">Notes:</span> {finding.notes || 'No additional notes.'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {detailedFindings && detailedFindings.map((finding, idx) => {
                const severityColor =
                    (finding.severity || '').toLowerCase() === 'critical' ? 'red' :
                        (finding.severity || '').toLowerCase() === 'serious' ? 'orange' :
                            (finding.severity || '').toLowerCase() === 'moderate' ? 'amber' :
                                'blue';

                return (
                    <div key={`detail-${idx}`} className="p-12 bg-white min-h-[1100px] border-t-4 border-gray-100 flex flex-col relative text-gray-800 page-break">
                        {/* Header Section from Image */}
                        <div className="flex justify-between items-center border-b-2 border-blue-600 pb-2 mb-6">
                            <span className="text-blue-600 font-semibold">{wcagVersion} Assessment Report</span>
                            <span className="text-gray-500">Detailed Findings {idx + 1} of {detailedFindings.length}</span>
                        </div>
                        {idx === 0 && (
                            <>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Detailed Findings</h2>
                                <p className="text-gray-600 mb-6">Each issue includes WCAG guideline reference, impact assessment, and AI-generated remediation guidance:</p>
                            </>
                        )}

                        <div className="border-t-4 border-orange-500 bg-orange-50/30 rounded-lg p-6 flex-1 flex flex-col border-x border-b border-gray-200">
                            {/* Issue Header */}
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-xl font-bold text-red-800 flex-1 pr-4">
                                    Issue #{idx + 1}: {finding.description}
                                </h3>
                                <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase text-white tracking-wide ${severityColor === 'red' ? 'bg-red-600' :
                                    severityColor === 'orange' ? 'bg-orange-500' :
                                        severityColor === 'amber' ? 'bg-amber-500' :
                                            'bg-blue-500'
                                    }`}>
                                    {finding.severity || 'Issue'}
                                </span>
                            </div>

                            {/* Meta Data Grid */}
                            <div className="grid grid-cols-[max-content_1fr] gap-x-8 gap-y-2 mb-6 text-sm">
                                <span className="font-bold text-red-800">Page/Component:</span>
                                <span className="font-medium text-gray-900 break-all">{finding.url}</span>

                                <span className="font-bold text-red-800">WCAG Guideline:</span>
                                <span className="font-medium text-gray-900">
                                    {(() => {
                                        const scId = finding.scIds && finding.scIds.length > 0 ? finding.scIds[0] : (finding.scId || '').split(' ')[0];
                                        const scDetails = getSCById(scId);
                                        return scDetails && scDetails.id ? scDetails.id : (scId || finding.wcagCriteria || 'N/A');
                                    })()}
                                </span>

                                <span className="font-bold text-red-800">Impact:</span>
                                <span className="font-medium text-red-800">
                                    {finding.impactDescription || "Users with assistive technologies may face difficulties accessing this content properly."}
                                </span>
                            </div>

                            {/* Location */}
                            <div className="mb-6">
                                <h4 className="font-bold text-red-800 mb-2">Location:</h4>
                                <div className="bg-gray-100 p-3 rounded font-mono text-xs text-gray-800">
                                    {finding.selector || finding.element || 'N/A'}
                                </div>
                            </div>

                            {/* HTML Element */}
                            {finding.htmlSnippet && (
                                <div className="mb-6">
                                    <h4 className="font-bold text-red-800 mb-2">HTML Element:</h4>
                                    <div className="bg-slate-800 text-white p-3 rounded font-mono text-xs overflow-x-auto">
                                        {finding.htmlSnippet}
                                    </div>
                                </div>
                            )}

                            {/* Issue Details */}
                            <div className="mb-6">
                                <h4 className="font-bold text-red-800 mb-2">Issue Details:</h4>
                                <ul className="list-disc pl-5 text-gray-800 text-sm">
                                    <li>{finding.description}</li>
                                    {finding.notes && <li>{finding.notes}</li>}
                                </ul>
                            </div>

                            {/* Website URL */}
                            <div className="mb-6">
                                <h4 className="font-bold text-red-800 mb-2">Website URL:</h4>
                                <div className="bg-blue-50 p-2 rounded border border-blue-100">
                                    <a href={finding.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs break-all">
                                        {finding.url}
                                    </a>
                                </div>
                            </div>

                            {/* Remediation */}
                            <div className="mt-auto">
                                <h4 className="font-bold text-red-800 mb-2">AI-Generated Remediation Solution:</h4>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
                                    <span className="font-bold text-green-800 block mb-1">Recommended Fixes:</span>
                                    <div className="text-gray-800 whitespace-pre-wrap">
                                        {finding.remediation || "Ensure that the content is implemented according to the WCAG guidelines."}
                                    </div>
                                </div>
                            </div>

                            <div className="text-right mt-4">
                                <a href="https://dequeuniversity.com/rules/axe/4.10/" target="_blank" rel="noreferrer" className="text-blue-500 italic text-xs hover:underline">
                                    For more information, see: Deque University Rules
                                </a>
                            </div>
                        </div>

                        {/* Footer for Finding Page */}
                        <div className="border-t border-gray-200 pt-4 mt-8 text-center text-gray-400 text-xs">
                            Generated: {date} | WCAG Compliance Assessment | Page {5 + idx}
                        </div>
                    </div>
                );
            })}

            {/* All Tests Table */}
            <div className="p-12 bg-white min-h-[1100px] border-t-4 border-gray-100 page-break">
                <div className="flex justify-between items-center border-b-2 border-blue-600 pb-2 mb-8">
                    <span className="text-blue-600 font-semibold">{wcagVersion} Assessment Report</span>
                    <span className="text-gray-500">All Tests Performed</span>
                </div>

                <h2 className="text-3xl font-bold text-gray-900 mb-8">All Tests Performed</h2>

                <div className={`border rounded-lg p-4 mb-6 flex justify-between items-center ${failedTests === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <span className={`font-bold ${failedTests === 0 ? 'text-green-700' : 'text-red-700'}`}>Total: {totalTests}</span>
                    <span className="font-bold text-green-700">Passed: {passedTests}</span>
                    <span className="font-bold text-red-700">Failed: {failedTests}</span>
                </div>

                {totalTests > 0 ? (
                    <div className="border border-gray-200 rounded-lg overflow-hidden text-sm">
                        <div className="bg-gray-100 border-b border-gray-200 flex font-bold text-gray-700">
                            <div className="w-1/5 p-3 border-r border-gray-200">Success Criteria</div>
                            <div className="w-1/2 p-3 border-r border-gray-200">Description</div>
                            <div className="w-[15%] p-3 border-r border-gray-200">Result</div>
                            <div className="w-[15%] p-3">Impact</div>
                        </div>
                        {tests.map((test, index) => (
                            <div key={index} className="flex border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                <div className="w-1/5 p-3 border-r border-gray-100 text-gray-600">{test.scId || test.wcagCriteria || test.id}</div>
                                <div className="w-1/2 p-3 border-r border-gray-100 text-gray-800">{test.description}</div>
                                <div className="w-[15%] p-3 border-r border-gray-100">
                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold text-center w-16 ${test.result === 'Pass' ? 'bg-green-100 text-green-800' :
                                        test.result === 'Fail' ? 'bg-red-100 text-red-800' :
                                            'bg-amber-100 text-amber-800'
                                        }`}>
                                        {test.result}
                                    </span>
                                </div>
                                <div className="w-[15%] p-3 text-gray-600 capitalize">{test.impact || 'minor'}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center text-amber-800">
                        No test results available. Please run an audit to generate test data.
                    </div>
                )}
            </div>

            {/* Page: Conclusion */}
            <div className="p-12 bg-white min-h-[1100px] border-t-4 border-gray-100 flex flex-col page-break">
                <div className="flex justify-between items-center border-b-2 border-blue-600 pb-2 mb-8">
                    <span className="text-blue-600 font-semibold">{wcagVersion} Assessment Report</span>
                    <span className="text-gray-500">Conclusion</span>
                </div>

                <h2 className="text-3xl font-bold text-gray-900 mb-8">Conclusion</h2>

                <h3 className="text-xl font-bold text-gray-800 mb-4">Assessment Summary</h3>
                <p className="text-gray-700 mb-8 leading-relaxed">
                    This comprehensive accessibility assessment evaluates the target interface against WCAG 2.2 standards using a hybrid methodology.
                    The automated evaluation found {failedTests === 0 ? 'no automated' : `${failedTests} automated`} accessibility barriers.
                    The overall score of {score}% reflects the combined results of automated scanning and manual verification of success criteria.
                </p>

                <h3 className="text-xl font-bold text-gray-800 mb-4">{score > 89 ? 'Accessibility Excellence' : 'Improvement Strategy'}</h3>
                <p className="text-gray-700 mb-8 leading-relaxed">
                    {score > 89
                        ? 'The website demonstrates a strong commitment to inclusive design. Maintaining this level of accessibility requires ongoing monitoring and regression testing as content updates occur.'
                        : 'To improve compliance, prioritize resolving "Critical" and "Serious" severity issues first, as these present the most significant barriers to users. Subsequent remediation should focus on "Moderate" and "Minor" issues to achieve full conformance.'}
                </p>

                <h3 className="text-xl font-bold text-gray-800 mb-4">Quality Assurance & Methodology</h3>
                <p className="text-gray-700 mb-8 leading-relaxed">
                    This assessment ensures quality through the use of industry-standard tools including {testingTechnology} for automated detection,
                    complemented by manual validation of complex interaction patterns. This hybrid approach maximizes coverage while ensuring practical usability for diverse user needs.
                </p>

                <div className="border-t border-gray-200 pt-4 mt-auto text-gray-400 text-xs flex justify-between">
                    <span>Generated: {date}</span>
                    <span>Conclusion</span>
                </div>
            </div>

            {/* Page: Appendix */}
            <div className="p-12 bg-white min-h-[1100px] border-t-4 border-gray-100 flex flex-col page-break">
                <div className="flex justify-between items-center border-b-2 border-blue-600 pb-2 mb-8">
                    <span className="text-blue-600 font-semibold">{wcagVersion} Assessment Report</span>
                    <span className="text-gray-500">Appendices</span>
                </div>

                <h2 className="text-3xl font-bold text-gray-900 mb-8">Appendices</h2>

                <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Appendix A: Assessment Methodology</h3>
                    <p className="text-gray-700 mb-2">This audit utilizes a comprehensive two-stage testing process:</p>
                    <ol className="list-decimal list-inside text-gray-700 space-y-2 ml-2">
                        <li><span className="font-bold">Automated Analysis:</span> Using Deque's axe-core engine to scan for programmatic violations.</li>
                        <li><span className="font-bold">Manual Verification:</span> Human review of success criteria that require context.</li>
                    </ol>
                </div>

                <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Appendix B: Glossary of Terms</h3>
                    <dl className="space-y-4 text-gray-700">
                        <div>
                            <dt className="font-bold text-gray-900">WCAG 2.2</dt>
                            <dd>International standard for web accessibility developed by the W3C.</dd>
                        </div>
                        <div>
                            <dt className="font-bold text-gray-900">Success Criterion (SC)</dt>
                            <dd>A specific, testable statement used to determine conformance to WCAG.</dd>
                        </div>
                        <div>
                            <dt className="font-bold text-gray-900">Severity Levels</dt>
                            <dd className="space-y-1 mt-1">
                                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-600"></span><span className="font-semibold text-red-700">Critical:</span> Blocks access. Urgent.</div>
                                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-600"></span><span className="font-semibold text-orange-700">Serious:</span> Significant frustration. High priority.</div>
                                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-600"></span><span className="font-semibold text-amber-700">Moderate:</span> Some difficulty. Medium priority.</div>
                                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-600"></span><span className="font-semibold text-green-700">Minor:</span> Annoyance. Low priority.</div>
                            </dd>
                        </div>
                    </dl>
                </div>

                <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Appendix C: References</h3>
                    <ul className="list-disc list-inside text-blue-600 space-y-1 text-sm">
                        <li><a href="https://www.w3.org/WAI/WCAG22/quickref/" target="_blank" rel="noreferrer" className="hover:underline">WCAG 2.2 Quick Reference</a></li>
                        <li><a href="https://github.com/dequelabs/axe-core/blob/master/doc/rule-descriptions.md" target="_blank" rel="noreferrer" className="hover:underline">axe-core Rules</a></li>
                        <li><a href="https://www.w3.org/WAI/ARIA/apg/" target="_blank" rel="noreferrer" className="hover:underline">WAI-ARIA Authoring Practices (APG)</a></li>
                    </ul>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-auto text-gray-400 text-xs flex justify-between">
                    <span>Generated: {date}</span>
                    <span>Appendix</span>
                </div>
            </div>

            {/* Report Footer on each printed page logic is hard in HTML/CSS without print specific CSS, but ignoring for on-screen view */}
        </div>
    );
};

export default PDFReport;
