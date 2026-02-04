'use client';

import { useState } from 'react';
import { useData, SearchTermResult } from '@/context/DataContext';
import { analyzeSearchTerms } from '@/lib/api';
import { Search, Settings, Play, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function AnalysisPage() {
    const { sessionId, analysisResults, setAnalysisResults, isLoading, setIsLoading } = useData();

    // Analysis config state
    const [config, setConfig] = useState({
        target_acos: 30,
        min_spend: 10,
        max_sales: 0,
        use_negative_phrase: false,
        exclude_branded: false,
        branded_terms: '',
        include_poor_roas: false,
    });

    const [analysisComplete, setAnalysisComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!sessionId) return;

        setIsLoading(true);
        setError(null);
        setAnalysisComplete(false);

        try {
            const result = await analyzeSearchTerms(sessionId, {
                ...config,
                branded_terms: config.branded_terms.split(',').map(t => t.trim()).filter(Boolean),
            });

            setAnalysisResults(result.results);
            setAnalysisComplete(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Analysis failed');
        } finally {
            setIsLoading(false);
        }
    };

    if (!sessionId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <AlertTriangle className="w-16 h-16 text-[var(--warning)] mb-4" />
                <h2 className="text-2xl font-bold mb-2">No Data Loaded</h2>
                <p className="text-[var(--foreground-muted)] mb-6">
                    Please upload a Search Term Report first to analyze your data.
                </p>
                <Link href="/" className="btn-primary">
                    Go to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Search className="w-8 h-8 text-[var(--primary-500)]" />
                    Search Term Analysis
                </h1>
                <p className="text-[var(--foreground-muted)] mt-1">
                    Identify underperforming search terms for negative keyword optimization
                </p>
            </div>

            {/* Configuration Panel */}
            <div className="card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-[var(--primary-500)]" />
                    Analysis Configuration
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Target ACOS */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Target ACOS (%)</label>
                        <input
                            type="number"
                            className="input"
                            value={config.target_acos}
                            onChange={(e) => setConfig({ ...config, target_acos: parseFloat(e.target.value) || 0 })}
                            min="0"
                            max="100"
                            step="1"
                        />
                        <p className="text-xs text-[var(--foreground-muted)]">
                            Flag search terms with ACOS ≥ this value
                        </p>
                    </div>

                    {/* Minimum Spend */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Minimum Spend ($)</label>
                        <input
                            type="number"
                            className="input"
                            value={config.min_spend}
                            onChange={(e) => setConfig({ ...config, min_spend: parseFloat(e.target.value) || 0 })}
                            min="0"
                            step="1"
                        />
                        <p className="text-xs text-[var(--foreground-muted)]">
                            Minimum spend for &quot;no sales&quot; rule
                        </p>
                    </div>

                    {/* Maximum Sales */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Maximum Sales ($)</label>
                        <input
                            type="number"
                            className="input"
                            value={config.max_sales}
                            onChange={(e) => setConfig({ ...config, max_sales: parseFloat(e.target.value) || 0 })}
                            min="0"
                            step="1"
                        />
                        <p className="text-xs text-[var(--foreground-muted)]">
                            Maximum sales for &quot;no sales&quot; rule
                        </p>
                    </div>
                </div>

                {/* Toggles */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            className="checkbox"
                            checked={config.use_negative_phrase}
                            onChange={(e) => setConfig({ ...config, use_negative_phrase: e.target.checked })}
                        />
                        <div>
                            <span className="font-medium">Use Negative Phrase</span>
                            <p className="text-xs text-[var(--foreground-muted)]">Instead of Negative Exact</p>
                        </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            className="checkbox"
                            checked={config.exclude_branded}
                            onChange={(e) => setConfig({ ...config, exclude_branded: e.target.checked })}
                        />
                        <div>
                            <span className="font-medium">Exclude Branded</span>
                            <p className="text-xs text-[var(--foreground-muted)]">Skip branded keywords</p>
                        </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            className="checkbox"
                            checked={config.include_poor_roas}
                            onChange={(e) => setConfig({ ...config, include_poor_roas: e.target.checked })}
                        />
                        <div>
                            <span className="font-medium">Include Poor ROAS</span>
                            <p className="text-xs text-[var(--foreground-muted)]">Converting but unprofitable</p>
                        </div>
                    </label>
                </div>

                {/* Branded Terms */}
                {config.exclude_branded && (
                    <div className="mt-4 space-y-2">
                        <label className="block text-sm font-medium">Branded Terms (comma-separated)</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="brand1, brand2, brand3"
                            value={config.branded_terms}
                            onChange={(e) => setConfig({ ...config, branded_terms: e.target.value })}
                        />
                    </div>
                )}

                {/* Run Button */}
                <div className="mt-6 flex items-center gap-4">
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className="btn-primary flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="spinner" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" />
                                Run Analysis
                            </>
                        )}
                    </button>

                    {analysisComplete && (
                        <div className="flex items-center gap-2 text-[var(--success)]">
                            <CheckCircle className="w-5 h-5" />
                            <span>Found {analysisResults.length} candidates</span>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mt-4 p-4 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/30 text-[var(--error)]">
                        {error}
                    </div>
                )}
            </div>

            {/* Rules Explanation */}
            <div className="card p-6">
                <h3 className="font-semibold mb-4">Analysis Rules</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg bg-[var(--background)]">
                        <h4 className="font-medium text-[var(--warning)] mb-2">Rule 1: High ACOS</h4>
                        <ul className="text-sm text-[var(--foreground-muted)] space-y-1">
                            <li>• ACOS ≥ Target ACOS</li>
                            <li>• Match Type is NOT Exact</li>
                            <li>• Target is NOT an ASIN</li>
                        </ul>
                    </div>
                    <div className="p-4 rounded-lg bg-[var(--background)]">
                        <h4 className="font-medium text-[var(--error)] mb-2">Rule 2: Spend Without Sales</h4>
                        <ul className="text-sm text-[var(--foreground-muted)] space-y-1">
                            <li>• Spend ≥ Minimum Spend</li>
                            <li>• Sales ≤ Maximum Sales</li>
                            <li>• Match Type is NOT Exact</li>
                            <li>• Target is NOT an ASIN</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Results Preview */}
            {analysisResults.length > 0 && (
                <div className="card overflow-hidden">
                    <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Negative Candidates Preview</h3>
                        <Link href="/negatives" className="btn-primary">
                            Review & Export →
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Search Term</th>
                                    <th>Campaign</th>
                                    <th>Match Type</th>
                                    <th className="text-right">Spend</th>
                                    <th className="text-right">Sales</th>
                                    <th className="text-right">ACOS</th>
                                    <th>Rule</th>
                                    <th>Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analysisResults.slice(0, 10).map((item) => (
                                    <tr key={item.id}>
                                        <td className="font-medium max-w-[200px] truncate">
                                            {item.customer_search_term}
                                        </td>
                                        <td className="max-w-[150px] truncate text-[var(--foreground-muted)]">
                                            {item.campaign_name}
                                        </td>
                                        <td>
                                            <span className="badge badge-info">{item.match_type}</span>
                                        </td>
                                        <td className="text-right">${item.spend.toFixed(2)}</td>
                                        <td className="text-right">${item.sales.toFixed(2)}</td>
                                        <td className="text-right">
                                            {item.acos !== null ? `${item.acos.toFixed(2)}%` : '-'}
                                        </td>
                                        <td>
                                            <span className={`badge ${item.rule_triggered === 'High ACOS' ? 'badge-warning' : 'badge-error'}`}>
                                                {item.rule_triggered}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${item.is_asin ? 'badge-info' : 'badge-success'}`}>
                                                {item.is_asin ? 'ASIN' : 'Keyword'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {analysisResults.length > 10 && (
                        <div className="p-4 text-center text-[var(--foreground-muted)] border-t border-[var(--border)]">
                            Showing 10 of {analysisResults.length} results.
                            <Link href="/negatives" className="text-[var(--primary-500)] ml-1 hover:underline">
                                View all →
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
