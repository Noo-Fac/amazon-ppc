'use client';

import { useState } from 'react';
import { generateManualCampaign, downloadBlob } from '@/lib/api';
import { Target, Plus, Trash2, Download, Settings, CheckCircle, Search } from 'lucide-react';

interface KeywordConfig {
    id: string;
    keyword: string;
    match_type: 'exact' | 'phrase' | 'broad';
    bid: number | null;
}

interface ProductTargetConfig {
    id: string;
    asin: string;
    bid: number | null;
}

interface ManualAdGroupConfig {
    id: string;
    ad_group_name: string;
    default_bid: number;
    skus: string;
    keywords: KeywordConfig[];
    product_targets: ProductTargetConfig[];
    // UI State for bulk input
    bulk_keywords: string;
    bulk_match_types: { exact: boolean; phrase: boolean; broad: boolean };
    bulk_bid: number | null;
}

const defaultKeyword = (): KeywordConfig => ({
    id: Math.random().toString(36).substr(2, 9),
    keyword: '',
    match_type: 'exact',
    bid: null,
});

const defaultProductTarget = (): ProductTargetConfig => ({
    id: Math.random().toString(36).substr(2, 9),
    asin: '',
    bid: null,
});

const defaultAdGroup = (): ManualAdGroupConfig => ({
    id: Math.random().toString(36).substr(2, 9),
    ad_group_name: '',
    default_bid: 0.75,
    skus: '',
    keywords: [defaultKeyword()],
    product_targets: [],
    bulk_keywords: '',
    bulk_match_types: { exact: true, phrase: false, broad: false },
    bulk_bid: null,
});

export default function ManualCampaignsPage() {
    const [campaign, setCampaign] = useState({
        campaign_name: '',
        portfolio: '',
        daily_budget: 50,
        bidding_strategy: 'dynamic bids - down only',
        start_date: new Date().toISOString().split('T')[0],
        top_of_search: 0,
        product_pages: 0,
        rest_of_search: 0,
        targeting_type: 'keyword', // 'keyword' or 'product' - primarily for UI guidance
    });

    const [adGroups, setAdGroups] = useState<ManualAdGroupConfig[]>([defaultAdGroup()]);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Add ad group
    const addAdGroup = () => {
        setAdGroups([...adGroups, defaultAdGroup()]);
    };

    // Remove ad group
    const removeAdGroup = (id: string) => {
        if (adGroups.length > 1) {
            setAdGroups(adGroups.filter(ag => ag.id !== id));
        }
    };

    // Update ad group
    const updateAdGroup = (id: string, updates: Partial<ManualAdGroupConfig>) => {
        setAdGroups(adGroups.map(ag =>
            ag.id === id ? { ...ag, ...updates } : ag
        ));
    };

    // Keyword Management
    const addKeyword = (adGroupId: string) => {
        const ag = adGroups.find(g => g.id === adGroupId);
        if (ag) {
            updateAdGroup(adGroupId, { keywords: [...ag.keywords, defaultKeyword()] });
        }
    };

    const handleBulkAddKeywords = (adGroupId: string) => {
        const ag = adGroups.find(g => g.id === adGroupId);
        if (!ag || !ag.bulk_keywords.trim()) return;

        const rawKeywords = ag.bulk_keywords.split('\n').map(k => k.trim()).filter(k => k);
        const newKeywords: KeywordConfig[] = [];

        rawKeywords.forEach(k => {
            if (ag.bulk_match_types.exact) {
                newKeywords.push({
                    id: Math.random().toString(36).substr(2, 9),
                    keyword: k,
                    match_type: 'exact',
                    bid: ag.bulk_bid
                });
            }
            if (ag.bulk_match_types.phrase) {
                newKeywords.push({
                    id: Math.random().toString(36).substr(2, 9),
                    keyword: k,
                    match_type: 'phrase',
                    bid: ag.bulk_bid
                });
            }
            if (ag.bulk_match_types.broad) {
                newKeywords.push({
                    id: Math.random().toString(36).substr(2, 9),
                    keyword: k,
                    match_type: 'broad',
                    bid: ag.bulk_bid
                });
            }
        });

        if (newKeywords.length > 0) {
            updateAdGroup(adGroupId, {
                keywords: [...ag.keywords, ...newKeywords],
                bulk_keywords: '' // Clear input after adding
            });
        }
    };

    const removeKeyword = (adGroupId: string, keywordId: string) => {
        const ag = adGroups.find(g => g.id === adGroupId);
        if (ag) {
            updateAdGroup(adGroupId, { keywords: ag.keywords.filter(k => k.id !== keywordId) });
        }
    };

    const updateKeyword = (adGroupId: string, keywordId: string, updates: Partial<KeywordConfig>) => {
        const ag = adGroups.find(g => g.id === adGroupId);
        if (ag) {
            const updatedKeywords = ag.keywords.map(k =>
                k.id === keywordId ? { ...k, ...updates } : k
            );
            updateAdGroup(adGroupId, { keywords: updatedKeywords });
        }
    };

    // Product Target Management
    const addProductTarget = (adGroupId: string) => {
        const ag = adGroups.find(g => g.id === adGroupId);
        if (ag) {
            updateAdGroup(adGroupId, { product_targets: [...ag.product_targets, defaultProductTarget()] });
        }
    };

    const removeProductTarget = (adGroupId: string, targetId: string) => {
        const ag = adGroups.find(g => g.id === adGroupId);
        if (ag) {
            updateAdGroup(adGroupId, { product_targets: ag.product_targets.filter(t => t.id !== targetId) });
        }
    };

    const updateProductTarget = (adGroupId: string, targetId: string, updates: Partial<ProductTargetConfig>) => {
        const ag = adGroups.find(g => g.id === adGroupId);
        if (ag) {
            const updatedTargets = ag.product_targets.map(t =>
                t.id === targetId ? { ...t, ...updates } : t
            );
            updateAdGroup(adGroupId, { product_targets: updatedTargets });
        }
    };


    // Generate handler
    const handleGenerate = async () => {
        // Validation
        if (!campaign.campaign_name.trim()) {
            setError('Campaign name is required');
            return;
        }

        for (let i = 0; i < adGroups.length; i++) {
            const ag = adGroups[i];
            if (!ag.ad_group_name.trim()) {
                setError(`Ad Group ${i + 1}: Name is required`);
                return;
            }

            // Check if at least one target exists
            const hasKeywords = ag.keywords.some(k => k.keyword.trim() !== '');
            const hasProductTargets = ag.product_targets.some(t => t.asin.trim() !== '');

            if (!hasKeywords && !hasProductTargets) {
                setError(`Ad Group ${i + 1}: Must have at least one keyword or ASIN target`);
                return;
            }
        }

        setGenerating(true);
        setError(null);
        setSuccess(false);

        try {
            const blob = await generateManualCampaign({
                campaign_name: campaign.campaign_name,
                portfolio: campaign.portfolio || null,
                daily_budget: campaign.daily_budget,
                bidding_strategy: campaign.bidding_strategy,
                start_date: campaign.start_date,
                targeting_type: campaign.targeting_type,
                placement_bid_adjustment: (campaign.top_of_search > 0 || campaign.product_pages > 0 || campaign.rest_of_search > 0) ? {
                    top_of_search: campaign.top_of_search,
                    product_pages: campaign.product_pages,
                    rest_of_search: campaign.rest_of_search,
                } : undefined,
                ad_groups: adGroups.map(ag => ({
                    ad_group_name: ag.ad_group_name,
                    default_bid: ag.default_bid,
                    skus: ag.skus.split(/[,\n]/).map(s => s.trim()).filter(s => s.length > 0),
                    keywords: ag.keywords
                        .filter(k => k.keyword.trim() !== '')
                        .map(k => ({
                            keyword: k.keyword,
                            match_type: k.match_type,
                            bid: k.bid
                        })),
                    product_targets: ag.product_targets
                        .filter(t => t.asin.trim() !== '')
                        .map(t => ({
                            asin: t.asin,
                            bid: t.bid
                        }))
                })),
            });

            const safeName = campaign.campaign_name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
            const filename = `manual_campaign_${safeName}_${new Date().toISOString().split('T')[0]}.xlsx`;
            downloadBlob(blob, filename);
            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate campaign');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Target className="w-8 h-8 text-[var(--primary-500)]" />
                    Manual Campaign Generator
                </h1>
                <p className="text-[var(--foreground-muted)] mt-1">
                    Create Sponsored Products Manual campaigns with keyword and ASIN targeting
                </p>
            </div>

            {/* Campaign Settings */}
            <div className="card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-[var(--primary-500)]" />
                    Campaign Settings
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Campaign Name */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">
                            Campaign Name <span className="text-[var(--error)]">*</span>
                        </label>
                        <input
                            type="text"
                            className="input"
                            placeholder="SP | Manual | Product Name"
                            value={campaign.campaign_name}
                            onChange={(e) => setCampaign({ ...campaign, campaign_name: e.target.value })}
                        />
                    </div>

                    {/* Portfolio */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Portfolio</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Optional"
                            value={campaign.portfolio}
                            onChange={(e) => setCampaign({ ...campaign, portfolio: e.target.value })}
                        />
                    </div>

                    {/* Daily Budget */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Daily Budget ($)</label>
                        <input
                            type="number"
                            className="input"
                            min="1"
                            step="1"
                            value={campaign.daily_budget}
                            onChange={(e) => setCampaign({ ...campaign, daily_budget: parseFloat(e.target.value) || 50 })}
                        />
                    </div>

                    {/* Bidding Strategy */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Bidding Strategy</label>
                        <select
                            className="input"
                            value={campaign.bidding_strategy}
                            onChange={(e) => setCampaign({ ...campaign, bidding_strategy: e.target.value })}
                        >
                            <option value="dynamic bids - down only">Dynamic Bids - Down Only</option>
                            <option value="dynamic bids - up and down">Dynamic Bids - Up and Down</option>
                            <option value="fixed bids">Fixed Bids</option>
                        </select>
                    </div>

                    {/* Start Date */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Start Date</label>
                        <input
                            type="date"
                            className="input"
                            value={campaign.start_date}
                            onChange={(e) => setCampaign({ ...campaign, start_date: e.target.value })}
                        />
                    </div>

                    {/* Targeting Type Filter (UI only) */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Primary Targeting</label>
                        <div className="flex gap-4 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="targeting_type"
                                    className="radio"
                                    checked={campaign.targeting_type === 'keyword'}
                                    onChange={() => setCampaign({ ...campaign, targeting_type: 'keyword' })}
                                />
                                <span>Keyword</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="targeting_type"
                                    className="radio"
                                    checked={campaign.targeting_type === 'product'}
                                    onChange={() => setCampaign({ ...campaign, targeting_type: 'product' })}
                                />
                                <span>Product (ASIN)</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Placement Bid Adjustments */}
                <div className="mt-6 pt-6 border-t border-[var(--border)]">
                    <h3 className="text-sm font-semibold mb-4">Placement Bid Adjustments (Optional)</h3>
                    <p className="text-xs text-[var(--foreground-muted)] mb-4">
                        Increase bids by a percentage for specific placements (0-900%)
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Top of Search */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">Top of Search (%)</label>
                            <input
                                type="number"
                                className="input"
                                min="0"
                                max="900"
                                step="1"
                                placeholder="0"
                                value={campaign.top_of_search || ''}
                                onChange={(e) => setCampaign({ ...campaign, top_of_search: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        {/* Product Pages */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">Product Pages (%)</label>
                            <input
                                type="number"
                                className="input"
                                min="0"
                                max="900"
                                step="1"
                                placeholder="0"
                                value={campaign.product_pages || ''}
                                onChange={(e) => setCampaign({ ...campaign, product_pages: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        {/* Rest of Search */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">Rest of Search (%)</label>
                            <input
                                type="number"
                                className="input"
                                min="0"
                                max="900"
                                step="1"
                                placeholder="0"
                                value={campaign.rest_of_search || ''}
                                onChange={(e) => setCampaign({ ...campaign, rest_of_search: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Ad Groups */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Ad Groups</h2>
                    <button onClick={addAdGroup} className="btn-secondary flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add Ad Group
                    </button>
                </div>

                {adGroups.map((ag, index) => (
                    <div key={ag.id} className="card p-6 animate-fade-in">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Ad Group {index + 1}</h3>
                            {adGroups.length > 1 && (
                                <button
                                    onClick={() => removeAdGroup(ag.id)}
                                    className="text-[var(--error)] hover:bg-[var(--error)]/10 p-2 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Ad Group Name */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium">
                                    Ad Group Name <span className="text-[var(--error)]">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Manual - Keywords"
                                    value={ag.ad_group_name}
                                    onChange={(e) => updateAdGroup(ag.id, { ad_group_name: e.target.value })}
                                />
                            </div>

                            {/* Default Bid */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium">Default Bid ($)</label>
                                <input
                                    type="number"
                                    className="input"
                                    min="0.02"
                                    step="0.01"
                                    value={ag.default_bid}
                                    onChange={(e) => updateAdGroup(ag.id, { default_bid: parseFloat(e.target.value) || 0.75 })}
                                />
                            </div>
                        </div>

                        {/* SKUs */}
                        <div className="mt-4 space-y-2">
                            <label className="block text-sm font-medium">
                                SKUs to Advertise
                            </label>
                            <textarea
                                className="input min-h-[80px]"
                                placeholder="Enter SKUs (comma or newline separated)&#10;e.g., SKU-001, SKU-002&#10;or one per line"
                                value={ag.skus}
                                onChange={(e) => updateAdGroup(ag.id, { skus: e.target.value })}
                            />
                            <p className="text-xs text-[var(--foreground-muted)]">
                                Add the SKUs of products you want to advertise in this ad group
                            </p>
                        </div>

                        {/* Keyword Targeting Section */}
                        {campaign.targeting_type === 'keyword' && (
                            <div className="mt-6">
                                <h4 className="text-sm font-medium mb-3">Keyword Targeting</h4>

                                {/* Bulk Input Section */}
                                <div className="bg-[var(--background-muted)]/30 p-4 rounded-lg border border-[var(--border)] mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-semibold uppercase text-[var(--foreground-muted)]">
                                            Bulk Entry
                                        </label>
                                        <span className="text-xs text-[var(--foreground-muted)]">
                                            One keyword per line
                                        </span>
                                    </div>
                                    <textarea
                                        className="input min-h-[100px] mb-4 font-mono text-sm"
                                        placeholder="Enter keywords..."
                                        value={ag.bulk_keywords}
                                        onChange={(e) => updateAdGroup(ag.id, { bulk_keywords: e.target.value })}
                                    />

                                    <div className="flex flex-wrap items-end gap-4">
                                        {/* Match Types */}
                                        <div className="flex-1 min-w-[200px]">
                                            <label className="text-xs text-[var(--foreground-muted)] mb-2 block font-medium">Generate Match Types</label>
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer text-sm hover:text-[var(--primary-500)] transition-colors">
                                                    <input type="checkbox" className="checkbox"
                                                        checked={ag.bulk_match_types.exact}
                                                        onChange={(e) => updateAdGroup(ag.id, { bulk_match_types: { ...ag.bulk_match_types, exact: e.target.checked } })}
                                                    />
                                                    Exact
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer text-sm hover:text-[var(--primary-500)] transition-colors">
                                                    <input type="checkbox" className="checkbox"
                                                        checked={ag.bulk_match_types.phrase}
                                                        onChange={(e) => updateAdGroup(ag.id, { bulk_match_types: { ...ag.bulk_match_types, phrase: e.target.checked } })}
                                                    />
                                                    Phrase
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer text-sm hover:text-[var(--primary-500)] transition-colors">
                                                    <input type="checkbox" className="checkbox"
                                                        checked={ag.bulk_match_types.broad}
                                                        onChange={(e) => updateAdGroup(ag.id, { bulk_match_types: { ...ag.bulk_match_types, broad: e.target.checked } })}
                                                    />
                                                    Broad
                                                </label>
                                            </div>
                                        </div>

                                        {/* Bid */}
                                        <div className="w-[120px]">
                                            <label className="text-xs text-[var(--foreground-muted)] mb-1 block font-medium">Bid ($)</label>
                                            <input
                                                type="number"
                                                className="input py-2"
                                                placeholder="Default"
                                                min="0.02"
                                                step="0.01"
                                                value={ag.bulk_bid ?? ''}
                                                onChange={(e) => updateAdGroup(ag.id, { bulk_bid: e.target.value ? parseFloat(e.target.value) : null })}
                                            />
                                        </div>

                                        {/* Add Button */}
                                        <button
                                            onClick={() => handleBulkAddKeywords(ag.id)}
                                            disabled={!ag.bulk_keywords.trim() || (!ag.bulk_match_types.exact && !ag.bulk_match_types.phrase && !ag.bulk_match_types.broad)}
                                            className="btn-primary py-2 px-6 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Targets
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mb-3">
                                    <h5 className="text-sm font-medium text-[var(--foreground-muted)]">
                                        Active Keywords ({ag.keywords.length})
                                    </h5>
                                    <button
                                        onClick={() => addKeyword(ag.id)}
                                        className="text-xs flex items-center gap-1 text-[var(--primary-500)] hover:underline"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Add Single Row
                                    </button>
                                </div>

                                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-[var(--background-muted)] text-[var(--foreground-muted)]">
                                            <tr>
                                                <th className="p-3 font-medium">Keyword</th>
                                                <th className="p-3 font-medium w-[150px]">Match Type</th>
                                                <th className="p-3 font-medium w-[120px]">Bid ($)</th>
                                                <th className="p-3 font-medium w-[40px]"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border)]">
                                            {ag.keywords.map((kw) => (
                                                <tr key={kw.id}>
                                                    <td className="p-2">
                                                        <input
                                                            type="text"
                                                            className="input bg-transparent border-transparent focus:border-[var(--primary-500)] px-2 py-1"
                                                            placeholder="Enter keyword"
                                                            value={kw.keyword}
                                                            onChange={(e) => updateKeyword(ag.id, kw.id, { keyword: e.target.value })}
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <select
                                                            className="input bg-transparent border-transparent focus:border-[var(--primary-500)] px-2 py-1"
                                                            value={kw.match_type}
                                                            onChange={(e) => updateKeyword(ag.id, kw.id, { match_type: e.target.value as any })}
                                                        >
                                                            <option value="exact">Exact</option>
                                                            <option value="phrase">Phrase</option>
                                                            <option value="broad">Broad</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            type="number"
                                                            className="input bg-transparent border-transparent focus:border-[var(--primary-500)] px-2 py-1"
                                                            placeholder="Default"
                                                            min="0.02"
                                                            step="0.01"
                                                            value={kw.bid ?? ''}
                                                            onChange={(e) => updateKeyword(ag.id, kw.id, { bid: e.target.value ? parseFloat(e.target.value) : null })}
                                                        />
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <button
                                                            onClick={() => removeKeyword(ag.id, kw.id)}
                                                            className="text-[var(--foreground-muted)] hover:text-[var(--error)] transition-colors"
                                                            title="Remove Keyword"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {ag.keywords.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="p-8 text-center text-[var(--foreground-muted)]">
                                                        <p className="italic mb-2">No keywords added yet</p>
                                                        <p className="text-xs">Use the <strong>Bulk Entry</strong> form above to generate targets</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Product Targeting Section */}
                        {campaign.targeting_type === 'product' && (
                            <div className="mt-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-medium">Product Targeting (ASINs)</h4>
                                    <button
                                        onClick={() => addProductTarget(ag.id)}
                                        className="text-xs btn-secondary py-1 px-3 flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Add Target
                                    </button>
                                </div>

                                <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-[var(--background-muted)] text-[var(--foreground-muted)]">
                                            <tr>
                                                <th className="p-3 font-medium">ASIN</th>
                                                <th className="p-3 font-medium w-[120px]">Bid ($)</th>
                                                <th className="p-3 font-medium w-[40px]"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border)]">
                                            {ag.product_targets.map((pt) => (
                                                <tr key={pt.id}>
                                                    <td className="p-2">
                                                        <div className="relative">
                                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                                                            <input
                                                                type="text"
                                                                className="input bg-transparent border-transparent focus:border-[var(--primary-500)] pl-8 pr-2 py-1"
                                                                placeholder="Enter ASIN (e.g. B00...)"
                                                                value={pt.asin}
                                                                onChange={(e) => updateProductTarget(ag.id, pt.id, { asin: e.target.value })}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="p-2">
                                                        <input
                                                            type="number"
                                                            className="input bg-transparent border-transparent focus:border-[var(--primary-500)] px-2 py-1"
                                                            placeholder="Default"
                                                            min="0.02"
                                                            step="0.01"
                                                            value={pt.bid ?? ''}
                                                            onChange={(e) => updateProductTarget(ag.id, pt.id, { bid: e.target.value ? parseFloat(e.target.value) : null })}
                                                        />
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <button
                                                            onClick={() => removeProductTarget(ag.id, pt.id)}
                                                            className="text-[var(--foreground-muted)] hover:text-[var(--error)] transition-colors"
                                                            title="Remove Target"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {ag.product_targets.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="p-4 text-center text-[var(--foreground-muted)] italic">
                                                        No product targets added. Click "Add Target" to start.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                    </div>
                ))}
            </div>

            {/* Generate Button */}
            <div className="card p-6">
                <div className="flex flex-wrap items-center gap-4">
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="btn-primary flex items-center gap-2"
                    >
                        {generating ? (
                            <>
                                <div className="spinner" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Generate Bulk Upload File
                            </>
                        )}
                    </button>

                    {success && (
                        <div className="flex items-center gap-2 text-[var(--success)]">
                            <CheckCircle className="w-5 h-5" />
                            <span>Bulk file downloaded successfully!</span>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mt-4 p-3 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/30 text-[var(--error)] text-sm">
                        {error}
                    </div>
                )}

                {/* Info */}
                <div className="mt-6 p-4 rounded-lg bg-[var(--background)] text-sm text-[var(--foreground-muted)]">
                    <p className="font-medium mb-2">Generated file will include:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Campaign row (Manual targeting) with settings</li>
                        <li>Ad Group rows for each ad group</li>
                        <li>Keyword and Product Targeting rows with custom bids</li>
                        <li>Ready for direct upload to Amazon Ads Console</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
