'use client';

import { useState } from 'react';
import { generateAutoCampaign, downloadBlob } from '@/lib/api';
import { Rocket, Plus, Trash2, Download, Settings, CheckCircle } from 'lucide-react';

interface AdGroupConfig {
    id: string;
    ad_group_name: string;
    default_bid: number;
    skus: string;
    close_match: boolean;
    close_match_bid: number | null;
    loose_match: boolean;
    loose_match_bid: number | null;
    substitutes: boolean;
    substitutes_bid: number | null;
    complements: boolean;
    complements_bid: number | null;
}

const defaultAdGroup = (): AdGroupConfig => ({
    id: Math.random().toString(36).substr(2, 9),
    ad_group_name: '',
    default_bid: 0.75,
    skus: '',
    close_match: true,
    close_match_bid: null,
    loose_match: true,
    loose_match_bid: null,
    substitutes: true,
    substitutes_bid: null,
    complements: true,
    complements_bid: null,
});

export default function AutoCampaignsPage() {
    const [campaign, setCampaign] = useState({
        campaign_name: '',
        portfolio: '',
        daily_budget: 50,
        bidding_strategy: 'dynamic bids - down only',
        start_date: new Date().toISOString().split('T')[0],
        top_of_search: 0,
        product_pages: 0,
        rest_of_search: 0,
    });

    const [adGroups, setAdGroups] = useState<AdGroupConfig[]>([defaultAdGroup()]);
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
    const updateAdGroup = (id: string, updates: Partial<AdGroupConfig>) => {
        setAdGroups(adGroups.map(ag =>
            ag.id === id ? { ...ag, ...updates } : ag
        ));
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
            if (!ag.close_match && !ag.loose_match && !ag.substitutes && !ag.complements) {
                setError(`Ad Group ${i + 1}: At least one targeting type must be enabled`);
                return;
            }
        }

        setGenerating(true);
        setError(null);
        setSuccess(false);

        try {
            const blob = await generateAutoCampaign({
                campaign_name: campaign.campaign_name,
                portfolio: campaign.portfolio || null,
                daily_budget: campaign.daily_budget,
                bidding_strategy: campaign.bidding_strategy,
                start_date: campaign.start_date,
                placement_bid_adjustment: (campaign.top_of_search > 0 || campaign.product_pages > 0 || campaign.rest_of_search > 0) ? {
                    top_of_search: campaign.top_of_search,
                    product_pages: campaign.product_pages,
                    rest_of_search: campaign.rest_of_search,
                } : undefined,
                ad_groups: adGroups.map(ag => ({
                    ad_group_name: ag.ad_group_name,
                    default_bid: ag.default_bid,
                    skus: ag.skus.split(/[,\n]/).map(s => s.trim()).filter(s => s.length > 0),
                    close_match: ag.close_match,
                    close_match_bid: ag.close_match_bid,
                    loose_match: ag.loose_match,
                    loose_match_bid: ag.loose_match_bid,
                    substitutes: ag.substitutes,
                    substitutes_bid: ag.substitutes_bid,
                    complements: ag.complements,
                    complements_bid: ag.complements_bid,
                })),
            });

            const safeName = campaign.campaign_name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
            const filename = `auto_campaign_${safeName}_${new Date().toISOString().split('T')[0]}.xlsx`;
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
                    <Rocket className="w-8 h-8 text-[var(--primary-500)]" />
                    Auto Campaign Generator
                </h1>
                <p className="text-[var(--foreground-muted)] mt-1">
                    Create Sponsored Products Auto campaigns with bulk upload files
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
                            placeholder="SP | Auto | Product Name"
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
                                    placeholder="Auto - All Targets"
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

                        {/* Targeting Types */}
                        <div className="mt-6">
                            <h4 className="text-sm font-medium mb-3">Auto Targeting Types</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Close Match */}
                                <div className="p-4 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="checkbox"
                                            checked={ag.close_match}
                                            onChange={(e) => updateAdGroup(ag.id, { close_match: e.target.checked })}
                                        />
                                        <span className="font-medium">Close Match</span>
                                    </label>
                                    {ag.close_match && (
                                        <div className="mt-3">
                                            <label className="text-xs text-[var(--foreground-muted)]">Bid Override</label>
                                            <input
                                                type="number"
                                                className="input mt-1 text-sm"
                                                placeholder="Use default"
                                                min="0.02"
                                                step="0.01"
                                                value={ag.close_match_bid ?? ''}
                                                onChange={(e) => updateAdGroup(ag.id, {
                                                    close_match_bid: e.target.value ? parseFloat(e.target.value) : null
                                                })}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Loose Match */}
                                <div className="p-4 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="checkbox"
                                            checked={ag.loose_match}
                                            onChange={(e) => updateAdGroup(ag.id, { loose_match: e.target.checked })}
                                        />
                                        <span className="font-medium">Loose Match</span>
                                    </label>
                                    {ag.loose_match && (
                                        <div className="mt-3">
                                            <label className="text-xs text-[var(--foreground-muted)]">Bid Override</label>
                                            <input
                                                type="number"
                                                className="input mt-1 text-sm"
                                                placeholder="Use default"
                                                min="0.02"
                                                step="0.01"
                                                value={ag.loose_match_bid ?? ''}
                                                onChange={(e) => updateAdGroup(ag.id, {
                                                    loose_match_bid: e.target.value ? parseFloat(e.target.value) : null
                                                })}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Substitutes */}
                                <div className="p-4 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="checkbox"
                                            checked={ag.substitutes}
                                            onChange={(e) => updateAdGroup(ag.id, { substitutes: e.target.checked })}
                                        />
                                        <span className="font-medium">Substitutes</span>
                                    </label>
                                    {ag.substitutes && (
                                        <div className="mt-3">
                                            <label className="text-xs text-[var(--foreground-muted)]">Bid Override</label>
                                            <input
                                                type="number"
                                                className="input mt-1 text-sm"
                                                placeholder="Use default"
                                                min="0.02"
                                                step="0.01"
                                                value={ag.substitutes_bid ?? ''}
                                                onChange={(e) => updateAdGroup(ag.id, {
                                                    substitutes_bid: e.target.value ? parseFloat(e.target.value) : null
                                                })}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Complements */}
                                <div className="p-4 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="checkbox"
                                            checked={ag.complements}
                                            onChange={(e) => updateAdGroup(ag.id, { complements: e.target.checked })}
                                        />
                                        <span className="font-medium">Complements</span>
                                    </label>
                                    {ag.complements && (
                                        <div className="mt-3">
                                            <label className="text-xs text-[var(--foreground-muted)]">Bid Override</label>
                                            <input
                                                type="number"
                                                className="input mt-1 text-sm"
                                                placeholder="Use default"
                                                min="0.02"
                                                step="0.01"
                                                value={ag.complements_bid ?? ''}
                                                onChange={(e) => updateAdGroup(ag.id, {
                                                    complements_bid: e.target.value ? parseFloat(e.target.value) : null
                                                })}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
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
                        <li>Campaign row with settings</li>
                        <li>Ad Group rows for each ad group</li>
                        <li>Auto targeting rows only for enabled targeting types</li>
                        <li>Ready for direct upload to Amazon Ads Console</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
