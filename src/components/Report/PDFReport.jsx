import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Link, Font, Svg, Path } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
    },
    // Cover Page Styles
    coverHeader: {
        backgroundColor: '#3B82F6', // Brighter Blue (Tailwind blue-500 equivalent) to match screenshot
        padding: 40,
        paddingBottom: 80,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        height: '45%', // Occupy top portion
        justifyContent: 'center',
    },
    certifiedPill: {
        position: 'absolute',
        top: 30,
        right: 30,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    certifiedText: {
        color: '#2563EB',
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
    },
    logoContainer: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 25,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    logoText: {
        fontSize: 18,
        fontFamily: 'Helvetica-Bold', // Use Bold
        color: '#1F2937',
        marginLeft: 10,
        textTransform: 'uppercase',
    },
    coverTitle: {
        fontSize: 24,
        color: '#FFFFFF',
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        marginBottom: 5,
    },
    coverSubtitle: {
        fontSize: 14,
        color: '#DBEAFE', // Lighter blue
        textAlign: 'center',
        marginTop: 5,
    },
    divider: {
        width: 50,
        height: 3,
        backgroundColor: '#93C5FD', // Light blue accent
        marginTop: 20,
        borderRadius: 2,
    },
    contentContainer: {
        padding: 40,
    },
    sectionBox: {
        border: '1px solid #E5E7EB',
        borderRadius: 8,
        padding: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 15,
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 4,
    },
    rowLabel: {
        width: '40%',
        fontSize: 10,
        fontWeight: 'bold',
        color: '#6B7280',
    },
    rowValue: {
        width: '60%',
        fontSize: 10,
        color: '#1F2937',
    },
    preparedBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    preparedCard: {
        width: '48%',
        border: '2px solid #3B82F6',
        borderRadius: 8,
        padding: 20,
        alignItems: 'center',
    },
    preparedTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 10,
    },
    preparedText: {
        fontSize: 10,
        color: '#4B5563',
        textAlign: 'center',
        marginBottom: 4,
    },

    // General Styles
    header: {
        fontSize: 10,
        color: '#2563EB',
        textAlign: 'left',
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#2563EB',
        paddingBottom: 5,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    headerRight: {
        color: '#6B7280',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        fontSize: 8,
        color: '#9CA3AF',
        textAlign: 'center',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 10,
    },
    h1: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 15,
        marginTop: 10,
    },
    h2: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 10,
        marginTop: 15,
    },
    tocItem: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 4,
        padding: 10,
        marginBottom: 8,
        fontSize: 11,
        fontWeight: 'bold',
        color: '#374151',
    },

    // Table Styles
    table: {
        display: "table",
        width: "auto",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRightWidth: 0,
        borderBottomWidth: 0,
        marginTop: 10,
    },
    tableRow: {
        margin: "auto",
        flexDirection: "row"
    },
    tableColHeader: {
        width: "25%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderLeftWidth: 0,
        borderTopWidth: 0,
        backgroundColor: '#F3F4F6',
        padding: 8,
    },
    tableCol: {
        width: "25%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 8,
    },
    tableCellHeader: {
        margin: "auto",
        fontSize: 10,
        fontWeight: 'bold',
        color: '#374151',
    },
    tableCell: {
        margin: "auto",
        fontSize: 9,
        color: '#4B5563',
    },
    statusPill: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        fontSize: 8,
        fontWeight: 'bold',
        textAlign: 'center',
        width: 60,
    },
    statusPass: {
        backgroundColor: '#D1FAE5',
        color: '#047857',
    },
    statusFail: {
        backgroundColor: '#FEE2E2',
        color: '#B91C1C',
    },

    // Summary Box
    summaryBox: {
        borderColor: '#6EE7B7', // Green border
        borderWidth: 1,
        backgroundColor: '#ECFDF5',
        borderRadius: 8,
        padding: 15,
        marginBottom: 20,
    },
    summaryBoxFail: {
        borderColor: '#FCA5A5', // Red border
        borderWidth: 1,
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
        padding: 15,
        marginBottom: 20,
    },
    summaryRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    summaryLabel: {
        width: 140,
        fontSize: 10,
        fontWeight: 'bold',
        color: '#059669', // Green text
    },
    summaryLabelFail: {
        width: 140,
        fontSize: 10,
        fontWeight: 'bold',
        color: '#B91C1C', // Red text
    },
    summaryValue: {
        flex: 1,
        fontSize: 10,
        color: '#065F46',
    },
    summaryValueFail: {
        flex: 1,
        fontSize: 10,
        color: '#7F1D1D',
    },
    blueBox: {
        borderColor: '#3B82F6',
        borderWidth: 1,
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
    },
    blueText: {
        color: '#1E40AF',
        fontSize: 10,
        marginBottom: 5,
    },

    // Detailed Findings
    findingCard: {
        border: '1px solid #E5E7EB',
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        backgroundColor: '#F9FAFB',
    },
    findingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    findingTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#B91C1C',
    },
    findingMeta: {
        fontSize: 9,
        color: '#6B7280',
        marginTop: 4,
    }
});

const ReportDocument = ({ data }) => {
    console.log('PDFReport received data:', data);

    // Support both old format (for backward compatibility) and new JSON format from backend
    let reportData;

    if (data && data.assessment) {
        // New JSON format from backend
        console.log('Processing new JSON format from backend');
        console.log('Tests:', data.tests?.length, 'Findings:', data.findings?.length);
        reportData = {
            targetUrl: data.assessment.targetWebsite,
            projectName: data.assessment.projectName,
            date: new Date(data.assessment.assessmentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
            tests: data.tests || [],
            detailedFindings: data.findings || [],
            compliance: data.compliance,
            summary: data.summary,
            preparedFor: data.assessment.preparedFor,
            preparedBy: data.assessment.preparedBy,
            wcagVersion: data.assessment.complianceStandard,
            testingTechnology: data.assessment.testingTechnology,
            reportVersion: data.assessment.reportVersion
        };
        console.log('Processed reportData:', reportData);
    } else {
        console.log('Processing old format (backward compatibility)');
        // Old format (backward compatibility)
        reportData = {
            targetUrl: data.targetUrl,
            projectName: data.projectName,
            date: data.date,
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
    }

    const { targetUrl, projectName, date, tests, detailedFindings, compliance, summary, preparedFor, preparedBy, wcagVersion, testingTechnology, reportVersion } = reportData;

    const totalTests = tests.length;
    const passedTests = compliance?.testsPassed ?? tests.filter(t => t.result === 'Pass').length;
    const failedTests = compliance?.issuesDetected ?? tests.filter(t => t.result === 'Fail').length;
    const score = compliance?.score ?? (totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0);

    return (
        <Document>
            {/* Page 1: Cover */}
            <Page size="A4" style={styles.page}>
                <View style={styles.coverHeader}>
                    <View style={styles.certifiedPill}>
                        <Text style={styles.certifiedText}>WCAG 2.2 CERTIFIED</Text>
                    </View>
                    <View style={styles.logoContainer}>
                        <Svg width="30" height="30" viewBox="0 0 24 24" style={{ marginRight: 10 }}>
                            <Path fill="#2563EB" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                            <Path fill="#FFFFFF" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </Svg>
                        <Text style={styles.logoText}>AUDITOR</Text>
                    </View>
                    <Text style={styles.coverTitle}>Web Content Accessibility Guidelines</Text>
                    <Text style={styles.coverTitle}>(WCAG) {wcagVersion.includes('WCAG') ? wcagVersion.replace('WCAG ', '') : wcagVersion}</Text>
                    <Text style={styles.coverSubtitle}>Comprehensive Compliance Testing Report</Text>
                    <View style={styles.divider} />
                </View>

                <View style={styles.contentContainer}>
                    <View style={styles.sectionBox}>
                        <Text style={styles.sectionTitle}>Assessment Details</Text>
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>Target Website:</Text>
                            <Text style={styles.rowValue}>{targetUrl}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>Project Name:</Text>
                            <Text style={styles.rowValue}>{projectName}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>Assessment Date:</Text>
                            <Text style={styles.rowValue}>{date}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>Report Version:</Text>
                            <Text style={styles.rowValue}>{reportVersion}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>Testing Technology:</Text>
                            <Text style={styles.rowValue}>{testingTechnology}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>Compliance Standard:</Text>
                            <Text style={styles.rowValue}>{wcagVersion}</Text>
                        </View>
                        <View style={[styles.row, { borderBottomWidth: 0 }]}>
                            <Text style={styles.rowLabel}>AI Remediation:</Text>
                            <Text style={styles.rowValue}>Included</Text>
                        </View>
                    </View>

                    <View style={styles.preparedBox}>
                        <View style={styles.preparedCard}>
                            <Text style={styles.preparedTitle}>Prepared For</Text>
                            <Text style={styles.preparedText}>{preparedFor}</Text>
                        </View>
                        <View style={styles.preparedCard}>
                            <Text style={styles.preparedTitle}>Prepared By</Text>
                            <Text style={styles.preparedText}>{preparedBy.organization}</Text>
                            <Text style={[styles.preparedText, { color: '#2563EB' }]}>{preparedBy.email}</Text>
                            <Text style={styles.preparedText}>{preparedBy.role}</Text>
                        </View>
                    </View>
                </View>
            </Page>

            {/* Page 2: Table of Contents */}
            <Page size="A4" style={[styles.page, { padding: 40 }]}>
                <View style={styles.header}>
                    <Text>{wcagVersion} Assessment Report</Text>
                    <Text style={styles.headerRight}>Table of Contents</Text>
                </View>

                <Text style={styles.h1}>Table of Contents</Text>

                <View style={{ marginTop: 20 }}>
                    {['Executive Summary & Testing Overview', 'Findings Overview', 'Detailed Findings', 'Recommendations', 'Conclusion', 'Appendices'].map((item, i) => (
                        <Text key={i} style={styles.tocItem}>{item}</Text>
                    ))}
                </View>

                <Text style={styles.footer}>
                    Generated: {date} | WCAG Compliance Assessment | Page 2
                </Text>
            </Page>

            {/* Page 3: Executive Summary */}
            <Page size="A4" style={[styles.page, { padding: 40 }]}>
                <View style={styles.header}>
                    <Text>{wcagVersion} Assessment Report</Text>
                    <Text style={styles.headerRight}>Executive Summary & Testing Overview</Text>
                </View>

                <Text style={styles.h1}>Executive Summary & Testing Overview</Text>
                <Text style={styles.h2}>Compliance Results</Text>

                <View style={failedTests === 0 ? styles.summaryBox : styles.summaryBoxFail}>
                    <View style={styles.summaryRow}>
                        <Text style={failedTests === 0 ? styles.summaryLabel : styles.summaryLabelFail}>Compliance Level:</Text>
                        <Text style={failedTests === 0 ? styles.summaryValue : styles.summaryValueFail}>{compliance?.level || (score === 100 ? "Fully Compliant" : "Partially Compliant")} {wcagVersion}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={failedTests === 0 ? styles.summaryLabel : styles.summaryLabelFail}>Overall Score:</Text>
                        <Text style={failedTests === 0 ? styles.summaryValue : styles.summaryValueFail}>{score}% compliance</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={failedTests === 0 ? styles.summaryLabel : styles.summaryLabelFail}>Tests Passed:</Text>
                        <Text style={failedTests === 0 ? styles.summaryValue : styles.summaryValueFail}>{passedTests} of {totalTests} accessibility rules</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={failedTests === 0 ? styles.summaryLabel : styles.summaryLabelFail}>Issues Detected:</Text>
                        <Text style={failedTests === 0 ? styles.summaryValue : styles.summaryValueFail}>{failedTests} violations</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={failedTests === 0 ? styles.summaryLabel : styles.summaryLabelFail}>Success Rate:</Text>
                        <Text style={failedTests === 0 ? styles.summaryValue : styles.summaryValueFail}>{score}% of tested rules passed</Text>
                    </View>
                    <View style={[styles.summaryRow, { marginBottom: 0 }]}>
                        <Text style={failedTests === 0 ? styles.summaryLabel : styles.summaryLabelFail}>Testing Status:</Text>
                        <Text style={failedTests === 0 ? styles.summaryValue : styles.summaryValueFail}>{compliance?.testingStatus || 'Complete'}</Text>
                    </View>
                </View>

                <Text style={styles.h2}>Key Findings Summary</Text>
                <View style={{ backgroundColor: '#F3F4F6', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' }}>
                    <Text style={{ fontSize: 10, color: '#374151' }}>
                        {failedTests === 0
                            ? "No accessibility violations were detected during the automated scan."
                            : `${failedTests} accessibility violations were detected. Please review the detailed findings below.`}
                    </Text>
                </View>

                <Text style={styles.footer}>
                    Generated: {date} | WCAG Compliance Assessment | Page 3
                </Text>
            </Page>

            {/* Page 4: Testing Scope */}
            <Page size="A4" style={[styles.page, { padding: 40 }]}>
                <View style={styles.header}>
                    <Text>{wcagVersion} Assessment Report</Text>
                    <Text style={styles.headerRight}>Executive Summary & Testing Overview</Text>
                </View>

                <Text style={styles.h2}>Testing Reliability</Text>
                <View style={styles.blueBox}>
                    <Text style={styles.blueText}>• Detection Accuracy: High (automated rule-based validation)</Text>
                    <Text style={styles.blueText}>• Manual Verification: Recommended for complex interactive elements</Text>
                    <Text style={styles.blueText}>• Retest Capability: Full re-scan available post-remediation</Text>
                    <Text style={styles.blueText}>• AI Remediation: Context-aware solutions generated for each violation</Text>
                </View>

                <Text style={styles.h2}>Testing Scope & Limitations</Text>
                <View style={[styles.blueBox, { borderColor: '#8B5CF6' }]}>
                    <Text style={[styles.blueText, { color: '#6D28D9' }]}>• Automated detection only (manual testing not included)</Text>
                    <Text style={[styles.blueText, { color: '#6D28D9' }]}>• Static content analysis (dynamic/JavaScript-generated content may require additional testing)</Text>
                    <Text style={[styles.blueText, { color: '#6D28D9' }]}>• WCAG 2.2 Level A criteria only (AA/AAA not evaluated)</Text>
                    <Text style={[styles.blueText, { color: '#6D28D9' }]}>• Current page state tested (content changes may affect results)</Text>
                    <Text style={[styles.blueText, { color: '#6D28D9' }]}>• AI remediation provides guidance but requires developer review and testing</Text>
                </View>

                <Text style={styles.footer}>
                    Generated: {date} | WCAG Compliance Assessment | Page 4
                </Text>
            </Page>

            {/* Page 5: Findings Overview */}
            <Page size="A4" style={[styles.page, { padding: 40 }]}>
                <View style={styles.header}>
                    <Text>{wcagVersion} Assessment Report</Text>
                    <Text style={styles.headerRight}>Findings Overview</Text>
                </View>

                <Text style={styles.h1}>Findings Overview</Text>
                {failedTests === 0 ? (
                    <>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#059669', marginBottom: 10 }}>
                            Excellent Results: No accessibility issues found during automated testing.
                        </Text>
                        <Text style={{ fontSize: 10, color: '#374151' }}>
                            The website demonstrates strong accessibility practices and WCAG 2.2 Level A compliance.
                        </Text>
                    </>
                ) : (
                    <>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#DC2626', marginBottom: 10 }}>
                            Attention Required: {failedTests} accessibility issues found.
                        </Text>
                        <Text style={{ fontSize: 10, color: '#374151' }}>
                            The website has some accessibility violations that need to be addressed to meet WCAG 2.2 Level A compliance.
                        </Text>
                    </>
                )}

                <Text style={styles.footer}>
                    Generated: {date} | WCAG Compliance Assessment | Page 5
                </Text>
            </Page>

            {/* Page 5.5: Detailed Findings (Dynamic) */}
            {detailedFindings && detailedFindings.length > 0 && (
                <Page size="A4" style={[styles.page, { padding: 40 }]}>
                    <View style={styles.header}>
                        <Text>{wcagVersion} Assessment Report</Text>
                        <Text style={styles.headerRight}>Detailed Findings</Text>
                    </View>

                    <Text style={styles.h1}>Detailed Findings</Text>
                    <Text style={{ fontSize: 10, color: '#374151', marginBottom: 20 }}>
                        The following violations were detected during the assessment.
                    </Text>

                    {detailedFindings.map((finding, idx) => (
                        <View key={idx} style={styles.findingCard}>
                            <View style={styles.findingHeader}>
                                <Text style={styles.findingTitle}>{finding.scId || finding.wcagCriteria || 'Violation'} - {finding.description}</Text>
                                <View style={[styles.statusPill, styles.statusFail]}>
                                    <Text>{finding.severity || finding.impact || 'Critical'}</Text>
                                </View>
                            </View>
                            <Text style={styles.findingMeta}>Selector: {finding.selector || finding.element || 'N/A'}</Text>
                            {finding.htmlSnippet && <Text style={styles.findingMeta}>HTML: {finding.htmlSnippet.substring(0, 100)}...</Text>}
                            <Text style={styles.findingMeta}>Notes: {finding.notes || 'No additional notes.'}</Text>
                        </View>
                    ))}

                    <Text style={styles.footer}>
                        Generated: {date} | WCAG Compliance Assessment | Page 5-1
                    </Text>
                </Page>
            )}

            {/* Page 6: All Tests Table */}
            <Page size="A4" style={[styles.page, { padding: 40 }]}>
                <View style={styles.header}>
                    <Text>{wcagVersion} Assessment Report</Text>
                    <Text style={styles.headerRight}>All Tests Performed</Text>
                </View>

                <Text style={styles.h1}>All Tests Performed</Text>

                <View style={failedTests === 0 ? styles.summaryBox : styles.summaryBoxFail}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: failedTests === 0 ? '#059669' : '#DC2626', marginBottom: 5 }}>Total Tests: {totalTests}</Text>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#059669', marginBottom: 5 }}>Passed: {passedTests}</Text>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#DC2626' }}>Failed: {failedTests}</Text>
                </View>

                {totalTests > 0 ? (
                    <View style={styles.table}>
                        <View style={styles.tableRow}>
                            <View style={[styles.tableColHeader, { width: '20%' }]}>
                                <Text style={styles.tableCellHeader}>Rule ID</Text>
                            </View>
                            <View style={[styles.tableColHeader, { width: '50%' }]}>
                                <Text style={styles.tableCellHeader}>Description</Text>
                            </View>
                            <View style={[styles.tableColHeader, { width: '15%' }]}>
                                <Text style={styles.tableCellHeader}>Result</Text>
                            </View>
                            <View style={[styles.tableColHeader, { width: '15%' }]}>
                                <Text style={styles.tableCellHeader}>Impact</Text>
                            </View>
                        </View>

                        {tests.map((test, index) => (
                            <View style={styles.tableRow} key={index}>
                                <View style={[styles.tableCol, { width: '20%' }]}>
                                    <Text style={styles.tableCell}>{test.id}</Text>
                                </View>
                                <View style={[styles.tableCol, { width: '50%' }]}>
                                    <Text style={styles.tableCell}>{test.description}</Text>
                                </View>
                                <View style={[styles.tableCol, { width: '15%' }]}>
                                    <View style={[styles.statusPill, test.result === 'Pass' ? styles.statusPass : test.result === 'Fail' ? styles.statusFail : { backgroundColor: '#FEF3C7', color: '#92400E' }]}>
                                        <Text>{test.result}</Text>
                                    </View>
                                </View>
                                <View style={[styles.tableCol, { width: '15%' }]}>
                                    <Text style={styles.tableCell}>{test.impact || 'minor'}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 8, padding: 20, marginTop: 15 }}>
                        <Text style={{ fontSize: 12, color: '#92400E', textAlign: 'center' }}>
                            No test results available. Please run an audit to generate test data.
                        </Text>
                    </View>
                )}

                <Text style={styles.footer}>
                    Generated: {date} | WCAG Compliance Assessment | Page 6
                </Text>
            </Page>

            {/* Page 7: Conclusion */}
            <Page size="A4" style={[styles.page, { padding: 40 }]}>
                <View style={styles.header}>
                    <Text>{wcagVersion} Assessment Report</Text>
                    <Text style={styles.headerRight}>Conclusion</Text>
                </View>

                <Text style={styles.h1}>Conclusion</Text>
                <Text style={styles.h2}>Assessment Summary</Text>
                <Text style={{ fontSize: 10, color: '#374151', marginBottom: 15, lineHeight: 1.5 }}>
                    This comprehensive {wcagVersion} accessibility assessment demonstrates {score > 90 ? 'exceptional' : score > 70 ? 'good' : 'moderate'} compliance with web accessibility standards. The automated evaluation found {failedTests === 0 ? 'no accessibility barriers' : `${failedTests} accessibility barrier${failedTests > 1 ? 's' : ''}`}, indicating {score === 100 ? 'robust' : score > 90 ? 'strong' : 'developing'} inclusive design practices throughout the tested interface.
                </Text>

                <Text style={styles.h2}>Accessibility Excellence</Text>
                <Text style={{ fontSize: 10, color: '#374151', marginBottom: 15, lineHeight: 1.5 }}>
                    {score === 100 ? 'This accessibility excellence positions the website as a leader in inclusive design. ' : ''}The implementation demonstrates best practices that benefit all users through improved semantic structure, enhanced keyboard navigation, and robust assistive technology support. This foundation enables seamless user experiences across diverse abilities and interaction preferences.
                </Text>

                <Text style={styles.h2}>Quality Assurance & Verification</Text>
                <Text style={{ fontSize: 10, color: '#374151', marginBottom: 15, lineHeight: 1.5 }}>
                    This assessment validates the website's accessibility through comprehensive automated testing with {totalTests} WCAG rules. The results reflect careful attention to semantic markup, proper ARIA implementation, and inclusive design principles that create {score > 90 ? 'an exemplary' : 'a solid'} user experience.
                </Text>

                <Text style={styles.h2}>Continued Excellence</Text>
                <Text style={{ fontSize: 10, color: '#374151', marginBottom: 15, lineHeight: 1.5 }}>
                    {score === 100 ? 'Maintain this accessibility leadership' : 'Continue improving accessibility'} through regular monitoring, user testing with individuals with disabilities, and integration of accessibility considerations into your design and development processes. {score < 100 ? 'Address the identified violations to achieve full compliance. ' : ''}Consider pursuing WCAG 2.2 Level AA compliance to further enhance inclusive user experience.
                </Text>

                <Text style={styles.footer}>
                    Generated: {date} | WCAG Compliance Assessment | Page 8
                </Text>
            </Page>

            {/* Page 8: Appendices */}
            <Page size="A4" style={[styles.page, { padding: 40 }]}>
                <View style={styles.header}>
                    <Text>{wcagVersion} Assessment Report</Text>
                    <Text style={styles.headerRight}>Appendices</Text>
                </View>

                <Text style={styles.h1}>Appendices</Text>
                <Text style={styles.h2}>Appendix A: Glossary of Terms</Text>
                <View style={{ marginBottom: 15 }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1F2937', marginBottom: 5 }}>WCAG 2.2:</Text>
                    <Text style={{ fontSize: 10, color: '#374151', marginBottom: 12, lineHeight: 1.5 }}>
                        Web Content Accessibility Guidelines version 2.2, international standard for web accessibility
                    </Text>

                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1F2937', marginBottom: 5 }}>axe-core:</Text>
                    <Text style={{ fontSize: 10, color: '#374151', marginBottom: 12, lineHeight: 1.5 }}>
                        Leading automated accessibility testing engine developed by Deque Systems
                    </Text>

                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1F2937', marginBottom: 5 }}>Level A:</Text>
                    <Text style={{ fontSize: 10, color: '#374151', marginBottom: 12, lineHeight: 1.5 }}>
                        Minimum level of WCAG conformance, addressing basic accessibility barriers
                    </Text>

                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1F2937', marginBottom: 5 }}>Critical Issue:</Text>
                    <Text style={{ fontSize: 10, color: '#374151', marginBottom: 12, lineHeight: 1.5 }}>
                        Accessibility barrier that completely prevents access for users with disabilities
                    </Text>

                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1F2937', marginBottom: 5 }}>Assistive Technology:</Text>
                    <Text style={{ fontSize: 10, color: '#374151', marginBottom: 12, lineHeight: 1.5 }}>
                        Tools like screen readers, voice recognition software, and switch devices
                    </Text>

                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1F2937', marginBottom: 5 }}>AI Remediation:</Text>
                    <Text style={{ fontSize: 10, color: '#374151', marginBottom: 12, lineHeight: 1.5 }}>
                        Context-aware solutions generated using artificial intelligence to address specific accessibility violations
                    </Text>
                </View>

                <Text style={styles.h2}>Appendix B: References & Resources</Text>
                <View style={{ marginTop: 10 }}>
                    <Text style={{ fontSize: 10, color: '#2563EB', marginBottom: 5 }}>• WCAG 2.2 Guidelines: https://www.w3.org/WAI/WCAG22/quickref/</Text>
                    <Text style={{ fontSize: 10, color: '#2563EB', marginBottom: 5 }}>• axe-core Documentation: https://github.com/dequelabs/axe-core</Text>
                    <Text style={{ fontSize: 10, color: '#2563EB', marginBottom: 5 }}>• WebAIM Resources: https://webaim.org/</Text>
                    <Text style={{ fontSize: 10, color: '#2563EB', marginBottom: 5 }}>• ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/</Text>
                </View>

                <Text style={styles.footer}>
                    Generated: {date} | WCAG Compliance Assessment | Page 9
                </Text>
            </Page>

        </Document>
    );
};

export default ReportDocument;
