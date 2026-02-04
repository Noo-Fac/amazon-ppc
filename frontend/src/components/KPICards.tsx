'use client';

import { KPIData } from '@/context/DataContext';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/utils';
import {
    DollarSign,
    CreditCard,
    TrendingUp,
    Percent,
    ShoppingCart,
    Eye,
    MousePointer,
    Target,
    BarChart3,
    Calculator,
} from 'lucide-react';

interface KPICardsProps {
    data: KPIData | null;
    loading?: boolean;
}

interface KPICardProps {
    title: string;
    value: string;
    icon: React.ElementType;
    color: string;
    loading?: boolean;
}

function KPICard({ title, value, icon: Icon, color, loading }: KPICardProps) {
    return (
        <div className="card kpi-card p-5 animate-fade-in hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-sm text-[var(--foreground-muted)] font-medium">{title}</p>
                    {loading ? (
                        <div className="h-8 w-24 bg-[var(--border)] animate-pulse rounded" />
                    ) : (
                        <p className="text-2xl font-bold tracking-tight">{value}</p>
                    )}
                </div>
                <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${color}15` }}
                >
                    <Icon className="w-6 h-6" style={{ color }} />
                </div>
            </div>
        </div>
    );
}

const kpiConfig = [
    {
        key: 'total_sales',
        title: 'Total Sales',
        icon: DollarSign,
        color: '#22c55e',
        format: (v: number) => formatCurrency(v),
    },
    {
        key: 'ad_spend',
        title: 'Ad Spend',
        icon: CreditCard,
        color: '#ef4444',
        format: (v: number) => formatCurrency(v),
    },
    {
        key: 'roas',
        title: 'ROAS',
        icon: TrendingUp,
        color: '#3b82f6',
        format: (v: number) => v.toFixed(2) + 'x',
    },
    {
        key: 'acos',
        title: 'ACOS',
        icon: Percent,
        color: '#f59e0b',
        format: (v: number) => formatPercentage(v),
    },
    {
        key: 'orders',
        title: 'Orders',
        icon: ShoppingCart,
        color: '#8b5cf6',
        format: (v: number) => formatNumber(v),
    },
    {
        key: 'impressions',
        title: 'Impressions',
        icon: Eye,
        color: '#06b6d4',
        format: (v: number) => formatNumber(v),
    },
    {
        key: 'clicks',
        title: 'Clicks',
        icon: MousePointer,
        color: '#ec4899',
        format: (v: number) => formatNumber(v),
    },
    {
        key: 'ctr',
        title: 'CTR',
        icon: Target,
        color: '#14b8a6',
        format: (v: number) => formatPercentage(v),
    },
    {
        key: 'conversion_rate',
        title: 'Conversion Rate',
        icon: BarChart3,
        color: '#6366f1',
        format: (v: number) => formatPercentage(v),
    },
    {
        key: 'avg_cpc',
        title: 'Average CPC',
        icon: Calculator,
        color: '#84cc16',
        format: (v: number) => formatCurrency(v),
    },
] as const;

export default function KPICards({ data, loading }: KPICardsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {kpiConfig.map(({ key, title, icon, color, format }) => (
                <KPICard
                    key={key}
                    title={title}
                    value={data ? format(data[key as keyof KPIData] as number) : '-'}
                    icon={icon}
                    color={color}
                    loading={loading}
                />
            ))}
        </div>
    );
}
