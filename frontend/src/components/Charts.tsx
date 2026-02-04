'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell,
} from 'recharts';
import { MonthlyData, CampaignMetrics } from '@/context/DataContext';
import { formatCurrency, formatCompact } from '@/lib/utils';

interface ChartProps {
    loading?: boolean;
}

interface SalesSpendChartProps extends ChartProps {
    data: MonthlyData[];
}

interface CampaignChartProps extends ChartProps {
    data: CampaignMetrics[];
}

// Custom tooltip style
const customTooltipStyle = {
    backgroundColor: 'var(--card-background)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
};

// Sales vs Spend Chart
export function SalesVsSpendChart({ data, loading }: SalesSpendChartProps) {
    if (loading) {
        return (
            <div className="h-[300px] flex items-center justify-center">
                <div className="spinner" />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-[var(--foreground-muted)]">
                No data available
            </div>
        );
    }

    // Format month labels
    const formattedData = data.map(d => ({
        ...d,
        monthLabel: new Date(d.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    }));

    return (
        <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                        dataKey="monthLabel"
                        tick={{ fill: 'var(--foreground-muted)', fontSize: 12 }}
                        axisLine={{ stroke: 'var(--border)' }}
                    />
                    <YAxis
                        tick={{ fill: 'var(--foreground-muted)', fontSize: 12 }}
                        axisLine={{ stroke: 'var(--border)' }}
                        tickFormatter={(v) => formatCompact(v)}
                    />
                    <Tooltip
                        contentStyle={customTooltipStyle}
                        labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
                        formatter={(value, name) => [
                            formatCurrency(value as number),
                            name === 'sales' ? 'Total Sales' : 'Ad Spend',
                        ]}
                    />
                    <Legend
                        wrapperStyle={{ paddingTop: 10 }}
                        formatter={(value) => (value === 'sales' ? 'Total Sales' : 'Ad Spend')}
                    />
                    <Bar dataKey="sales" fill="#22c55e" radius={[4, 4, 0, 0]} name="sales" />
                    <Bar dataKey="spend" fill="#ef4444" radius={[4, 4, 0, 0]} name="spend" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// Campaign Performance Chart
export function CampaignPerformanceChart({ data, loading }: CampaignChartProps) {
    if (loading) {
        return (
            <div className="h-[400px] flex items-center justify-center">
                <div className="spinner" />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="h-[400px] flex items-center justify-center text-[var(--foreground-muted)]">
                No data available
            </div>
        );
    }

    // Sort by sales and take top 10
    const sortedData = [...data]
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 10)
        .map(d => ({
            ...d,
            name: d.campaign_name.length > 30 ? d.campaign_name.slice(0, 30) + '...' : d.campaign_name,
        }));

    // Generate colors based on ACOS
    const getColor = (acos: number) => {
        if (acos <= 20) return '#22c55e'; // Green
        if (acos <= 30) return '#f59e0b'; // Yellow
        return '#ef4444'; // Red
    };

    return (
        <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={sortedData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={true} vertical={false} />
                    <XAxis
                        type="number"
                        tick={{ fill: 'var(--foreground-muted)', fontSize: 12 }}
                        axisLine={{ stroke: 'var(--border)' }}
                        tickFormatter={(v) => formatCompact(v)}
                    />
                    <YAxis
                        type="category"
                        dataKey="name"
                        width={150}
                        tick={{ fill: 'var(--foreground-muted)', fontSize: 11 }}
                        axisLine={{ stroke: 'var(--border)' }}
                    />
                    <Tooltip
                        contentStyle={customTooltipStyle}
                        labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
                        formatter={(value, name) => {
                            if (name === 'sales') return [formatCurrency(value as number), 'Sales'];
                            if (name === 'spend') return [formatCurrency(value as number), 'Spend'];
                            return [value, name];
                        }}
                    />
                    <Bar dataKey="sales" radius={[0, 4, 4, 0]}>
                        {sortedData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getColor(entry.acos)} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// ACOS Distribution Chart
export function AcosDistributionChart({ data, loading }: CampaignChartProps) {
    if (loading) {
        return (
            <div className="h-[200px] flex items-center justify-center">
                <div className="spinner" />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="h-[200px] flex items-center justify-center text-[var(--foreground-muted)]">
                No data available
            </div>
        );
    }

    // Group by ACOS ranges
    const ranges = [
        { label: '0-15%', min: 0, max: 15, color: '#22c55e' },
        { label: '15-25%', min: 15, max: 25, color: '#84cc16' },
        { label: '25-35%', min: 25, max: 35, color: '#f59e0b' },
        { label: '35-50%', min: 35, max: 50, color: '#f97316' },
        { label: '50%+', min: 50, max: Infinity, color: '#ef4444' },
    ];

    const distributionData = ranges.map(range => ({
        name: range.label,
        count: data.filter(d => d.acos >= range.min && d.acos < range.max).length,
        color: range.color,
    }));

    return (
        <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <XAxis
                        dataKey="name"
                        tick={{ fill: 'var(--foreground-muted)', fontSize: 11 }}
                        axisLine={{ stroke: 'var(--border)' }}
                    />
                    <YAxis
                        tick={{ fill: 'var(--foreground-muted)', fontSize: 11 }}
                        axisLine={{ stroke: 'var(--border)' }}
                    />
                    <Tooltip
                        contentStyle={customTooltipStyle}
                        formatter={(value) => [value, 'Campaigns']}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {distributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
