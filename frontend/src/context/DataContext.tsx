'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types
import { DecisionCenterResponse } from '@/lib/api';

export interface SearchTermResult {
    id: number;
    date: string | null;
    campaign_name: string;
    campaign_id?: string;
    ad_group_name: string;
    ad_group_id?: string;
    portfolio: string | null;
    portfolio_id?: string;
    targeting: string;
    match_type: string;
    customer_search_term: string;
    impressions: number;
    clicks: number;
    spend: number;
    sales: number;
    acos: number | null;
    orders: number;
    rule_triggered: string;
    is_asin: boolean;
    negative_match_type: string;
    selected: boolean;
}

export interface KPIData {
    total_sales: number;
    ad_spend: number;
    roas: number;
    acos: number;
    orders: number;
    impressions: number;
    clicks: number;
    ctr: number;
    conversion_rate: number;
    avg_cpc: number;
}

export interface CampaignMetrics {
    campaign_name: string;
    portfolio: string | null;
    impressions: number;
    clicks: number;
    spend: number;
    sales: number;
    orders: number;
    acos: number;
    roas: number;
}

export interface MonthlyData {
    month: string;
    sales: number;
    spend: number;
}

export interface FilterOptions {
    campaigns: string[];
    ad_groups: string[];
    portfolios: string[];
    date_range: {
        start: string | null;
        end: string | null;
    };
}

interface DataContextType {
    sessionId: string | null;
    setSessionId: (id: string | null) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    kpis: KPIData | null;
    setKpis: (kpis: KPIData | null) => void;
    campaigns: CampaignMetrics[];
    setCampaigns: (campaigns: CampaignMetrics[]) => void;
    monthlyData: MonthlyData[];
    setMonthlyData: (data: MonthlyData[]) => void;
    filters: FilterOptions | null;
    setFilters: (filters: FilterOptions | null) => void;
    analysisResults: SearchTermResult[];
    setAnalysisResults: (results: SearchTermResult[]) => void;
    decisionData: DecisionCenterResponse | null;
    setDecisionData: (data: DecisionCenterResponse | null) => void;
    selectedFilters: {
        campaign: string | null;
        adGroup: string | null;
        startDate: string | null;
        endDate: string | null;
    };
    setSelectedFilters: (filters: {
        campaign: string | null;
        adGroup: string | null;
        startDate: string | null;
        endDate: string | null;
    }) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [kpis, setKpis] = useState<KPIData | null>(null);
    const [campaigns, setCampaigns] = useState<CampaignMetrics[]>([]);
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
    const [filters, setFilters] = useState<FilterOptions | null>(null);
    const [analysisResults, setAnalysisResults] = useState<SearchTermResult[]>([]);
    const [decisionData, setDecisionData] = useState<DecisionCenterResponse | null>(null);
    const [selectedFilters, setSelectedFilters] = useState({
        campaign: null as string | null,
        adGroup: null as string | null,
        startDate: null as string | null,
        endDate: null as string | null,
    });

    // Auto-fetch data when sessionId changes
    React.useEffect(() => {
        if (!sessionId) {
            setKpis(null);
            setCampaigns([]);
            setMonthlyData([]);
            setFilters(null);
            setAnalysisResults([]);
            setDecisionData(null);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Determine if we should import these dynamically or if they are available
                // To avoid circular deps if api imports context (api shouldn't import context)
                // We'll assume the api functions are available globally or imported here

                // We need to import the API functions at the top of the file
                const { getKPIs, getCampaigns, getMonthlyData, getFilters, getDecisionCenterData } = await import('@/lib/api');

                const [kpisData, campaignsData, monthlyDataRes, filtersData, decisionRes] = await Promise.all([
                    getKPIs(sessionId),
                    getCampaigns(sessionId),
                    getMonthlyData(sessionId),
                    getFilters(sessionId),
                    getDecisionCenterData(sessionId)
                ]);

                setKpis(kpisData);
                setCampaigns(campaignsData);
                setMonthlyData(monthlyDataRes);
                setFilters(filtersData);
                setDecisionData(decisionRes);
            } catch (error) {
                console.error("Failed to fetch session data:", error);
                // Optionally handle error state here
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [sessionId]);

    return (
        <DataContext.Provider
            value={{
                sessionId,
                setSessionId,
                isLoading,
                setIsLoading,
                kpis,
                setKpis,
                campaigns,
                setCampaigns,
                monthlyData,
                setMonthlyData,
                filters,
                setFilters,
                analysisResults,
                setAnalysisResults,
                decisionData,
                setDecisionData,
                selectedFilters,
                setSelectedFilters,
            }}
        >
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
