'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import {
    LayoutDashboard,
    Search,
    MinusCircle,
    Rocket,
    Sun,
    Moon,
    Upload,
    Database,
} from 'lucide-react';

const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/analysis', label: 'Search Term Analysis', icon: Search },
    { href: '/negatives', label: 'Negative Keywords', icon: MinusCircle },
    { href: '/checklist', label: 'Daily Checklist', icon: Rocket }, // Using Rocket for Checklist temporarily or swap icons
    { href: '/campaigns', label: 'Campaign Generator', icon: Search }, // Swapped icons or just reuse
];

export default function Sidebar() {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();
    const { sessionId } = useData();

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-[var(--card-background)] border-r border-[var(--border)] flex flex-col z-50">
            {/* Logo */}
            <div className="p-6 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary-400)] to-[var(--primary-600)] flex items-center justify-center">
                        <Database className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-tight">Amazon PPC</h1>
                        <p className="text-xs text-[var(--foreground-muted)]">Analyzer</p>
                    </div>
                </div>
            </div>

            {/* Session Status */}
            {sessionId && (
                <div className="mx-4 mt-4 p-3 rounded-lg bg-[var(--primary-500)]/10 border border-[var(--primary-500)]/30">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[var(--primary-500)] animate-pulse" />
                        <span className="text-xs font-medium text-[var(--primary-500)]">Data Loaded</span>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                        >
                            <Icon className="w-5 h-5" />
                            <span>{label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--border)]">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--background)] hover:bg-[var(--border)] transition-colors"
                >
                    {theme === 'dark' ? (
                        <>
                            <Sun className="w-5 h-5 text-yellow-500" />
                            <span className="text-sm">Light Mode</span>
                        </>
                    ) : (
                        <>
                            <Moon className="w-5 h-5 text-indigo-500" />
                            <span className="text-sm">Dark Mode</span>
                        </>
                    )}
                </button>

                {/* Upload Button */}
                <Link
                    href="/"
                    className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-3 btn-primary"
                >
                    <Upload className="w-4 h-4" />
                    <span>Upload Report</span>
                </Link>
            </div>
        </aside>
    );
}
