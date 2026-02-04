// API configuration
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Upload file
export async function uploadFile(file: File): Promise<{
    session_id: string;
    row_count: number;
    columns: string[];
    date_range: { start: string | null; end: string | null };
    campaigns: string[];
    message: string;
}> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/api/upload/search-term-report`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to upload file');
    }

    return response.json();
    return response.json();
}

// Upload Bulk File
export async function uploadBulkFile(file: File, sessionId: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/api/upload/bulk-file?session_id=${sessionId}`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to upload bulk file');
    }

    return response.json();
}

// Get KPIs

// Get KPIs
export async function getKPIs(sessionId: string, filters?: {
    campaign?: string;
    ad_group?: string;
    start_date?: string;
    end_date?: string;
}) {
    const params = new URLSearchParams();
    if (filters?.campaign) params.set('campaign', filters.campaign);
    if (filters?.ad_group) params.set('ad_group', filters.ad_group);
    if (filters?.start_date) params.set('start_date', filters.start_date);
    if (filters?.end_date) params.set('end_date', filters.end_date);

    const url = `${API_BASE}/api/analysis/kpis/${sessionId}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch KPIs');
    }

    return response.json();
}

// Get campaign metrics
export async function getCampaigns(sessionId: string) {
    const response = await fetch(`${API_BASE}/api/analysis/campaigns/${sessionId}`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch campaigns');
    }

    return response.json();
}

// Get monthly data
export async function getMonthlyData(sessionId: string, campaign?: string) {
    const params = new URLSearchParams();
    if (campaign) params.set('campaign', campaign);

    const url = `${API_BASE}/api/analysis/monthly/${sessionId}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch monthly data');
    }

    return response.json();
}

// Get filter options
export async function getFilters(sessionId: string) {
    const response = await fetch(`${API_BASE}/api/analysis/filters/${sessionId}`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch filters');
    }

    return response.json();
}

// Run search term analysis
export async function analyzeSearchTerms(sessionId: string, config: {
    target_acos: number;
    min_spend: number;
    max_sales: number;
    use_negative_phrase: boolean;
    exclude_branded: boolean;
    branded_terms: string[];
    include_poor_roas: boolean;
}) {
    const response = await fetch(`${API_BASE}/api/analysis/search-terms/${sessionId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to analyze search terms');
    }

    return response.json();
}

// Export negatives
export async function exportNegatives(sessionId: string, selectedIds: number[], useNegativePhrase: boolean = false, items?: any[]) {
    const response = await fetch(`${API_BASE}/api/export/negatives`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            session_id: sessionId,
            selected_ids: selectedIds,
            use_negative_phrase: useNegativePhrase,
            items: items
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Export failed';
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.detail || errorMessage;
        } catch (e) {
            errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
    }

    // Return blob for download
    return response.blob();
}

// Generate auto campaign
export async function generateAutoCampaign(config: {
    campaign_name: string;
    portfolio: string | null;
    daily_budget: number;
    bidding_strategy: string;
    start_date: string;
    placement_bid_adjustment?: {
        top_of_search: number;
        product_pages: number;
        rest_of_search: number;
    };
    ad_groups: Array<{
        ad_group_name: string;
        default_bid: number;
        skus: string[];
        close_match: boolean;
        close_match_bid: number | null;
        loose_match: boolean;
        loose_match_bid: number | null;
        substitutes: boolean;
        substitutes_bid: number | null;
        complements: boolean;
        complements_bid: number | null;
    }>;
}) {
    const response = await fetch(`${API_BASE}/api/export/auto-campaign`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to generate campaign');
    }

    return response.blob();
}

// Generate manual campaign
export async function generateManualCampaign(config: {
    campaign_name: string;
    portfolio: string | null;
    daily_budget: number;
    bidding_strategy: string;
    start_date: string;
    targeting_type: string;
    placement_bid_adjustment?: {
        top_of_search: number;
        product_pages: number;
        rest_of_search: number;
    };
    ad_groups: Array<{
        ad_group_name: string;
        default_bid: number;
        skus: string[];
        keywords: Array<{
            keyword: string;
            match_type: string;
            bid: number | null;
        }>;
        product_targets: Array<{
            asin: string;
            bid: number | null;
        }>;
    }>;
}) {
    const response = await fetch(`${API_BASE}/api/export/manual-campaign`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to generate campaign');
    }

    return response.blob();
}

// Helper to download blob
export function downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}


// --- Decision Engine Types ---

export interface BleedingSpendItem {
    id: number;
    search_term: string;
    campaign_name: string;
    ad_group_name: string;
    campaign_id?: string;
    ad_group_id?: string;
    match_type: string;
    spend: number;
    clicks: number;
    severity_score: number;
    action_type: string;
}

export interface HighACOSItem {
    id: number;
    search_term: string;
    targeting: string;
    match_type: string;
    campaign_name: string;
    campaign_id?: string;
    ad_group_id?: string;
    acos: number;
    spend: number;
    sales: number;
    root_cause: string;
    value: number;
    avg_value: number;
    action_type: string;
}

export interface ScaleOpportunityItem {
    id: number;
    search_term: string;
    targeting: string;
    match_type: string;
    campaign_name: string;
    campaign_id?: string;
    ad_group_id?: string;
    acos: number;
    orders: number;
    conversion_rate: number;
    current_bid: number;
    suggested_bid: number;
    action_type: string;
}

export interface BudgetSaturationItem {
    campaign_name: string;
    daily_budget: number;
    spend: number;
    utilization: number;
    acos: number;
    suggested_budget: number;
    action_type: string;
}

export interface HealthScore {
    score: number;
    spend_efficiency_score: number;
    acos_stability_score: number;
    exact_match_score: number;
    details: {
        wasted_spend: number;
        waste_ratio: number;
        overall_acos: number;
    };
}

export interface DecisionCenterResponse {
    bleeding_spend: BleedingSpendItem[];
    high_acos: HighACOSItem[];
    scale_opportunities: ScaleOpportunityItem[];
    budget_saturation: BudgetSaturationItem[];
    health_score: HealthScore;
    total_urgent_actions: number;
    total_growth_actions: number;
}

// --- Decision Engine Endpoints ---

// Get Decision Center Data
export async function getDecisionCenterData(sessionId: string): Promise<DecisionCenterResponse> {
    const response = await fetch(`${API_BASE}/api/analysis/decision-center/${sessionId}`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch decision data');
    }

    return response.json();
}

// Export Bid Optimization
export async function exportBidOptimization(sessionId: string, items: any[]) {
    const response = await fetch(`${API_BASE}/api/export/bid-optimization`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            session_id: sessionId,
            items: items,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to export bid optimizations');
    }

    return response.blob();
}

// Export Budget Optimization
export async function exportBudgetOptimization(sessionId: string, items: any[]) {
    const response = await fetch(`${API_BASE}/api/export/budget-optimization`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            session_id: sessionId,
            items: items,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to export budget optimizations');
    }

    return response.blob();
}
