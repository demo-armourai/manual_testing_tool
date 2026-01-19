import { useEffect, useState } from 'react';
import { FileText, FileJson, Printer, FileSpreadsheet, Calendar, ArrowLeft } from 'lucide-react';
import { calculateComplianceScore, calculatePrincipleScores, exportToJSON, exportToCSV } from '../utils/compliance';
import { useAuditStore } from '../hooks/useAuditStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

import DownloadReportButton from './Report/DownloadReportButton';
import PDFReport from './Report/PDFReport';
import { wcagChecklist } from '../utils/wcag-loader';

export function ComplianceReport({ progress, findings, auditedEntity }) {
  const { generateReport } = useAuditStore();
  const [showFullReport, setShowFullReport] = useState(false);

  useEffect(() => {
    if (progress?.page_audit_id) {
      generateReport(progress.page_audit_id);
    }
  }, [progress?.page_audit_id, generateReport]);

  const overallScore = calculateComplianceScore(progress);
  const principleScores = calculatePrincipleScores(progress);

  const handleExportJSON = () => {
    const data = exportToJSON(progress, findings);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wcag-audit-${progress.targetName.replace(/\s+/g, '-')}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  console.log('[ComplianceReport] Findings received:', findings.length);
  console.log('[ComplianceReport] Sample finding:', findings[0]);

  const radarData = principleScores.map(ps => ({
    principle: ps.principle.substring(0, 12),
    score: ps.score.score
  }));

  const barData = principleScores.map(ps => ({
    name: ps.principle,
    Passed: ps.score.passed,
    Failed: ps.score.failed,
    'N/A': ps.score.na
  }));

  const severityCounts = findings.reduce((acc, f) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1;
    return acc;
  }, {});

  // Prepare data for PDFReport (mimicking backend structure for fallback)
  const reportData = {
    targetUrl: progress.targetUrl,
    projectName: progress.targetName,
    date: progress.startedAt ? new Date(progress.startedAt).toLocaleString() : new Date().toLocaleString(),
    tests: wcagChecklist.map(sc => {
      const check = progress.checks && progress.checks[sc.id];
      const status = check ? check.status : 'untested';
      let result = 'Untested';
      if (status === 'pass') result = 'Pass';
      if (status === 'fail') result = 'Fail';
      if (status === 'na') result = 'N/A';

      const scFindings = findings.filter(f => f.scIds && f.scIds.includes(sc.id));
      const impact = (result === 'Fail' && scFindings.length > 0)
        ? (scFindings[0].severity || 'minor')
        : 'minor';

      return {
        id: sc.id,
        scId: sc.id, // Add scId for PDFReport table
        description: `${sc.title}: ${sc.description}`,
        wcagCriteria: sc.id,
        result: result,
        impact: impact
      };
    }),
    detailedFindings: findings.map(f => {
      // Handle both scId (string) and scIds (array) formats
      let scId;
      if (f.scIds && Array.isArray(f.scIds) && f.scIds.length > 0) {
        scId = f.scIds[0];
      } else if (f.scId) {
        scId = f.scId;
      } else if (f.sc_id) {
        scId = f.sc_id;
      }

      const sc = wcagChecklist.find(item => item.id === scId);
      return {
        ...f,
        scId: scId,
        scIds: [scId], // Ensure scIds is always an array
        scTitles: sc ? [sc.title] : [],
        htmlSnippet: f.htmlSnippet || f.domSnippet || f.html_snippet || '',
        notes: f.notes || '',
        wcagCriteria: scId,
        url: f.url || progress.targetUrl
      };
    }),
    preparedFor: auditedEntity
  };

  if (showFullReport) {
    return (
      <div className="w-full">
        <div className="mb-6 flex justify-between items-center print:hidden bg-white p-4 rounded-xl border border-slate-200 sticky top-0 z-10 shadow-sm">
          <button
            onClick={() => setShowFullReport(false)}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Summary
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold shadow-md shadow-blue-200"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
          </div>
        </div>
        <PDFReport data={reportData} />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full print:hidden">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 print:border-none print:shadow-none print:p-0">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Compliance Report</h2>
            <p className="text-gray-600 font-medium">Target: {progress.targetName || 'Loading...'}</p>
            <p className="text-sm text-gray-500">{progress.targetUrl || 'URL Pending'}</p>
            {progress.startedAt && (
              <p className="text-xs text-slate-400 mt-1 font-semibold flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Audit Run: {new Date(progress.startedAt).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}
              </p>
            )}
          </div>

          <div className="flex gap-2 print:hidden items-center">
            <button onClick={handleExportJSON} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium text-sm h-[40px]">
              <FileJson className="w-4 h-4" />
              JSON
            </button>

            <DownloadReportButton
              auditedEntity={auditedEntity}
              onTogglePreview={setShowFullReport}
              isPreviewVisible={showFullReport}
            />
          </div>
        </div>

        {/* Overall Score */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="text-3xl font-bold text-blue-700 mb-1">{overallScore.score}%</div>
            <div className="text-sm font-medium text-blue-900/70">Compliance Score</div>
          </div>
          <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-100">
            <div className="text-3xl font-bold text-emerald-700 mb-1">{overallScore.passed}</div>
            <div className="text-sm font-medium text-emerald-900/70">Passed</div>
          </div>
          <div className="text-center p-4 bg-rose-50 rounded-lg border border-rose-100">
            <div className="text-3xl font-bold text-rose-700 mb-1">{overallScore.failed}</div>
            <div className="text-sm font-medium text-rose-900/70">Failed</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-3xl font-bold text-gray-700 mb-1">{overallScore.na}</div>
            <div className="text-sm font-medium text-gray-500">N/A</div>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-100">
            <div className="text-3xl font-bold text-amber-700 mb-1">{overallScore.untested}</div>
            <div className="text-sm font-medium text-amber-900/70">Untested</div>
          </div>
          <div className="text-center p-4 bg-violet-50 rounded-lg border border-violet-100">
            <div className="text-3xl font-bold text-violet-700 mb-1">{overallScore.tested}</div>
            <div className="text-sm font-medium text-violet-900/70">Total Tested</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Compliance by POUR Principle</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="principle" tick={{ fill: '#64748b', fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 100]} angle={30} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Radar name="Compliance Score" dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.6} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Results by Principle</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend />
              <Bar dataKey="Passed" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Failed" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="N/A" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Findings Summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Findings Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/50">
            <div className="text-2xl font-bold text-gray-900 mb-1">{findings.length}</div>
            <div className="text-sm text-gray-500 font-medium">Total Findings</div>
          </div>
          <div className="p-4 border border-rose-200 bg-rose-50 rounded-lg">
            <div className="text-2xl font-bold text-rose-700 mb-1">
              {(severityCounts.Critical || 0) + (severityCounts.Serious || 0)}
            </div>
            <div className="text-sm text-rose-800/70 font-medium">Critical/Serious</div>
          </div>
          <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
            <div className="text-2xl font-bold text-amber-700 mb-1">{severityCounts.Moderate || 0}</div>
            <div className="text-sm text-amber-800/70 font-medium">Moderate</div>
          </div>
          <div className="p-4 border border-gray-200 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-700 mb-1">{severityCounts.Minor || 0}</div>
            <div className="text-sm text-gray-600/70 font-medium">Minor</div>
          </div>
        </div>
      </div>

      {/* Principle Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Detailed Breakdown by Principle</h3>
        <div className="space-y-4">
          {principleScores.map(ps => (
            <div key={ps.principle} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{ps.principle}</h4>
                <span className={`text-xl font-bold ${ps.score.score >= 90 ? 'text-emerald-600' : ps.score.score >= 70 ? 'text-amber-600' : 'text-rose-600'}`}>{ps.score.score}%</span>
              </div>
              <div className="grid grid-cols-5 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 mb-1">Total</div>
                  <div className="font-medium text-gray-900">{ps.score.total}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Passed</div>
                  <div className="font-medium text-emerald-600">{ps.score.passed}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Failed</div>
                  <div className="font-medium text-rose-600">{ps.score.failed}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">N/A</div>
                  <div className="font-medium text-gray-600">{ps.score.na}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Untested</div>
                  <div className="font-medium text-amber-600">{ps.score.untested}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
