import { useState, useEffect } from 'react';
import { apiClient, API } from '../config/api';
import { BarChart, TrendingUp, Calendar, ExternalLink, AlertCircle } from 'lucide-react';

export function ComplianceScoresView() {
    const [userId, setUserId] = useState('');
    const [complianceScores, setComplianceScores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedScore, setSelectedScore] = useState(null);

    const fetchScores = async () => {
        if (!userId.trim()) {
            setError('Please enter a user ID');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const scores = await apiClient.get(API.COMPLIANCE_SCORES.BY_USER(userId));
            setComplianceScores(scores);
            if (scores.length === 0) {
                setError('No compliance scores found for this user');
            }
        } catch (err) {
            setError(err.message || 'Failed to fetch compliance scores');
            setComplianceScores([]);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (scoreId) => {
        try {
            const score = await apiClient.get(API.COMPLIANCE_SCORES.BY_ID(scoreId));
            setSelectedScore(score);
        } catch (err) {
            setError('Failed to load score details');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getScoreColor = (score) => {
        if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
        if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">WCAG Compliance Scores</h1>
                <p className="text-slate-600">View automated WCAG scan results from WebComply</p>
            </div>

            {/* Search Section */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                    User ID
                </label>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && fetchScores()}
                        placeholder="Enter user UUID"
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        onClick={fetchScores}
                        disabled={loading}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed font-semibold transition"
                    >
                        {loading ? 'Loading...' : 'Fetch Scores'}
                    </button>
                </div>
                {error && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}
            </div>

            {/* Results Grid */}
            {complianceScores.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {complianceScores.map((score) => (
                        <div
                            key={score.id}
                            className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition cursor-pointer"
                            onClick={() => handleViewDetails(score.id)}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                                        {score.page_name || score.domain}
                                        <ExternalLink className="w-4 h-4 text-slate-400" />
                                    </h3>
                                    <p className="text-sm text-slate-500 truncate">{score.page_url}</p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-4 gap-3 mb-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{score.passes}</div>
                                    <div className="text-xs text-slate-500">Passes</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-red-600">{score.violations}</div>
                                    <div className="text-xs text-slate-500">Violations</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-yellow-600">{score.incomplete}</div>
                                    <div className="text-xs text-slate-500">Incomplete</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-slate-400">{score.inapplicable}</div>
                                    <div className="text-xs text-slate-500">N/A</div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Calendar className="w-4 h-4" />
                                    {formatDate(score.created_at)}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-indigo-600 font-semibold">
                                    <BarChart className="w-4 h-4" />
                                    View Details
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Details Modal */}
            {selectedScore && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{selectedScore.page_name || selectedScore.domain}</h2>
                                <p className="text-sm text-slate-500">{selectedScore.page_url}</p>
                            </div>
                            <button
                                onClick={() => setSelectedScore(null)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            >
                                Close
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Score Summary */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <div className="text-3xl font-bold text-green-600">{selectedScore.passes}</div>
                                    <div className="text-sm text-slate-600 mt-1">Passes</div>
                                </div>
                                <div className="text-center p-4 bg-red-50 rounded-lg">
                                    <div className="text-3xl font-bold text-red-600">{selectedScore.violations}</div>
                                    <div className="text-sm text-slate-600 mt-1">Violations</div>
                                </div>
                                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                    <div className="text-3xl font-bold text-yellow-600">{selectedScore.incomplete}</div>
                                    <div className="text-sm text-slate-600 mt-1">Incomplete</div>
                                </div>
                                <div className="text-center p-4 bg-slate-50 rounded-lg">
                                    <div className="text-3xl font-bold text-slate-400">{selectedScore.inapplicable}</div>
                                    <div className="text-sm text-slate-600 mt-1">N/A</div>
                                </div>
                            </div>

                            {/* Audit Results */}
                            {selectedScore.audit_results && (
                                <div className="bg-slate-50 rounded-lg p-4">
                                    <h3 className="font-semibold text-slate-900 mb-3">Detailed Audit Results</h3>
                                    <pre className="text-xs text-slate-700 overflow-x-auto bg-white p-4 rounded border border-slate-200">
                                        {JSON.stringify(selectedScore.audit_results, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {/* Metadata */}
                            <div className="mt-6 pt-6 border-t border-slate-200">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-semibold text-slate-700">Scan ID:</span>
                                        <span className="ml-2 text-slate-600">{selectedScore.id}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-slate-700">Scanned:</span>
                                        <span className="ml-2 text-slate-600">{formatDate(selectedScore.created_at)}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-slate-700">Page ID:</span>
                                        <span className="ml-2 text-slate-600 font-mono text-xs">{selectedScore.page_id}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-slate-700">User ID:</span>
                                        <span className="ml-2 text-slate-600 font-mono text-xs">{selectedScore.user_id}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
