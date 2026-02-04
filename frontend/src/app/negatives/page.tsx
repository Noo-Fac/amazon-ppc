'use client';

import { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { exportNegatives, downloadBlob } from '@/lib/api';
import { MinusCircle, Download, Search, AlertTriangle, Check, X } from 'lucide-react';
import Link from 'next/link';

export default function NegativesPage() {
    const { sessionId, analysisResults, setAnalysisResults } = useData();

    const [selectAll, setSelectAll] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRule, setFilterRule] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const [useNegativePhrase, setUseNegativePhrase] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter and search results
    const filteredResults = useMemo(() => {
        return analysisResults.filter(item => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!item.customer_search_term.toLowerCase().includes(query) &&
                    !item.campaign_name.toLowerCase().includes(query)) {
                    return false;
                }
            }

            // Rule filter
            if (filterRule !== 'all' && item.rule_triggered !== filterRule) {
                return false;
            }

            // Type filter
            if (filterType === 'keyword' && item.is_asin) return false;
            if (filterType === 'asin' && !item.is_asin) return false;

            return true;
        });
    }, [analysisResults, searchQuery, filterRule, filterType]);

    // Count selected
    const selectedCount = filteredResults.filter(r => r.selected).length;
    const totalKeywords = filteredResults.filter(r => !r.is_asin && r.selected).length;
    const totalAsins = filteredResults.filter(r => r.is_asin && r.selected).length;

    // Toggle selection
    const toggleSelection = (id: number) => {
        setAnalysisResults(
            analysisResults.map(item =>
                item.id === id ? { ...item, selected: !item.selected } : item
            )
        );
    };

    // Toggle all
    const toggleAll = () => {
        const newValue = !selectAll;
        setSelectAll(newValue);
        setAnalysisResults(
            analysisResults.map(item => ({
                ...item,
                selected: filteredResults.some(f => f.id === item.id) ? newValue : item.selected
            }))
        );
    };

    // Export handler
    const handleExport = async () => {
        if (!sessionId) return;

        const selectedIds = analysisResults
            .filter(item => item.selected)
            .map(item => item.id);

        const selectedItems = analysisResults.filter(item => item.selected);

        if (selectedIds.length === 0) {
            setError('Please select at least one item to export');
            return;
        }

        setExporting(true);
        setError(null);

        try {
            const blob = await exportNegatives(sessionId, selectedIds, useNegativePhrase, selectedItems);
            const filename = `negative_keywords_${new Date().toISOString().split('T')[0]}.xlsx`;
            downloadBlob(blob, filename);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Export failed');
        } finally {
            setExporting(false);
        }
    };

    if (!sessionId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <AlertTriangle className="w-16 h-16 text-[var(--warning)] mb-4" />
                <h2 className="text-2xl font-bold mb-2">No Data Loaded</h2>
                <p className="text-[var(--foreground-muted)] mb-6">
                    Please upload a Search Term Report first.
                </p>
                <Link href="/" className="btn-primary">
                    Go to Dashboard
                </Link>
            </div>
        );
    }

    if (analysisResults.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <Search className="w-16 h-16 text-[var(--foreground-muted)] mb-4" />
                <h2 className="text-2xl font-bold mb-2">No Analysis Results</h2>
                <p className="text-[var(--foreground-muted)] mb-6">
                    Run the Search Term Analysis first to identify negative candidates.
                </p>
                <Link href="/analysis" className="btn-primary">
                    Go to Analysis
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <MinusCircle className="w-8 h-8 text-[var(--primary-500)]" />
                        Negative Keywords
                    </h1>
                    <p className="text-[var(--foreground-muted)] mt-1">
                        Review and export negative keyword candidates
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card p-4">
                    <p className="text-sm text-[var(--foreground-muted)]">Total Candidates</p>
                    <p className="text-2xl font-bold">{analysisResults.length}</p>
                </div>
                <div className="card p-4">
                    <p className="text-sm text-[var(--foreground-muted)]">Selected</p>
                    <p className="text-2xl font-bold text-[var(--primary-500)]">{selectedCount}</p>
                </div>
                <div className="card p-4">
                    <p className="text-sm text-[var(--foreground-muted)]">Negative Keywords</p>
                    <p className="text-2xl font-bold text-[var(--success)]">{totalKeywords}</p>
                </div>
                <div className="card p-4">
                    <p className="text-sm text-[var(--foreground-muted)]">Negative ASINs</p>
                    <p className="text-2xl font-bold text-[var(--info)]">{totalAsins}</p>
                </div>
            </div>

            {/* Filters and Actions */}
            <div className="card p-4">
                <div className="flex flex-wrap items-center gap-4">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                            <input
                                type="text"
                                placeholder="Search terms or campaigns..."
                                className="input pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Rule Filter */}
                    <select
                        className="input w-auto"
                        value={filterRule}
                        onChange={(e) => setFilterRule(e.target.value)}
                    >
                        <option value="all">All Rules</option>
                        <option value="High ACOS">High ACOS</option>
                        <option value="Spend Without Sales">Spend Without Sales</option>
                    </select>

                    {/* Type Filter */}
                    <select
                        className="input w-auto"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all">All Types</option>
                        <option value="keyword">Keywords Only</option>
                        <option value="asin">ASINs Only</option>
                    </select>

                    {/* Toggle Selection */}
                    <button onClick={toggleAll} className="btn-secondary flex items-center gap-2">
                        {selectAll ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        {selectAll ? 'Deselect All' : 'Select All'}
                    </button>
                </div>

                {/* Export Options */}
                <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-[var(--border)]">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            className="checkbox"
                            checked={useNegativePhrase}
                            onChange={(e) => setUseNegativePhrase(e.target.checked)}
                        />
                        <span className="text-sm">Use Negative Phrase (instead of Exact)</span>
                    </label>

                    <div className="flex-1" />

                    <button
                        onClick={handleExport}
                        disabled={exporting || selectedCount === 0}
                        className="btn-primary flex items-center gap-2"
                    >
                        {exporting ? (
                            <>
                                <div className="spinner" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Export Selected ({selectedCount})
                            </>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="mt-4 p-3 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/30 text-[var(--error)] text-sm">
                        {error}
                    </div>
                )}
            </div>

            {/* Results Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th className="w-12">
                                    <input
                                        type="checkbox"
                                        className="checkbox"
                                        checked={selectAll}
                                        onChange={toggleAll}
                                    />
                                </th>
                                <th>Search Term / ASIN</th>
                                <th>Campaign</th>
                                <th>Ad Group</th>
                                <th>Match Type</th>
                                <th className="text-right">Spend</th>
                                <th className="text-right">Sales</th>
                                <th className="text-right">ACOS</th>
                                <th>Rule</th>
                                <th>Negative Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredResults.map((item) => (
                                <tr
                                    key={item.id}
                                    className={!item.selected ? 'opacity-50' : ''}
                                >
                                    <td>
                                        <input
                                            type="checkbox"
                                            className="checkbox"
                                            checked={item.selected}
                                            onChange={() => toggleSelection(item.id)}
                                        />
                                    </td>
                                    <td className="font-medium max-w-[200px]">
                                        <div className="truncate" title={item.customer_search_term}>
                                            {item.customer_search_term}
                                        </div>
                                    </td>
                                    <td className="max-w-[150px]">
                                        <div className="truncate text-[var(--foreground-muted)]" title={item.campaign_name}>
                                            {item.campaign_name}
                                        </div>
                                    </td>
                                    <td className="max-w-[120px]">
                                        <div className="truncate text-[var(--foreground-muted)]" title={item.ad_group_name}>
                                            {item.ad_group_name}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge badge-info text-xs">{item.match_type}</span>
                                    </td>
                                    <td className="text-right">${item.spend.toFixed(2)}</td>
                                    <td className="text-right">${item.sales.toFixed(2)}</td>
                                    <td className="text-right">
                                        {item.acos !== null ? `${item.acos.toFixed(1)}%` : '-'}
                                    </td>
                                    <td>
                                        <span className={`badge text-xs ${item.rule_triggered === 'High ACOS' ? 'badge-warning' : 'badge-error'
                                            }`}>
                                            {item.rule_triggered}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge text-xs ${item.is_asin ? 'badge-info' : 'badge-success'}`}>
                                            {item.negative_match_type}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredResults.length === 0 && (
                    <div className="p-8 text-center text-[var(--foreground-muted)]">
                        No results match your filters
                    </div>
                )}
            </div>
        </div>
    );
}
