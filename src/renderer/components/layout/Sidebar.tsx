/**
 * Sidebar Component
 * Navigation sidebar with app branding and menu items.
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useRules } from '../../context/RulesContext';

// Icons (using emoji for simplicity, can be replaced with Lucide icons)
const icons = {
    local: '📁',
    drive: '☁️',
    rules: '⚙️',
    settings: '🔧',
    logo: '✨',
};

interface NavItemProps {
    to: string;
    icon: string;
    label: string;
    badge?: number;
}

function NavItem({ to, icon, label, badge }: NavItemProps) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${isActive
                    ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
            }
        >
            <span className="text-lg">{icon}</span>
            <span className="flex-1">{label}</span>
            {badge !== undefined && badge > 0 && (
                <span className="badge badge-primary">{badge}</span>
            )}
        </NavLink>
    );
}

export default function Sidebar() {
    const { rules } = useRules();
    const enabledRulesCount = rules.filter((r) => r.enabled).length;

    return (
        <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
            {/* Logo / App Name */}
            <div className="h-14 flex items-center gap-3 px-5 border-b border-slate-200 dark:border-slate-800">
                <span className="text-2xl">{icons.logo}</span>
                <div>
                    <h1 className="text-sm font-bold text-slate-900 dark:text-white">
                        Smart File Organizer
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        v1.0.0
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1">
                {/* Main section */}
                <div className="mb-4">
                    <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Organize
                    </p>
                    <NavItem to="/local" icon={icons.local} label="Local Files" />
                    <NavItem to="/drive" icon={icons.drive} label="Google Drive" />
                </div>

                {/* Configuration section */}
                <div className="mb-4">
                    <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Configuration
                    </p>
                    <NavItem
                        to="/rules"
                        icon={icons.rules}
                        label="Rules"
                        badge={enabledRulesCount}
                    />
                    <NavItem to="/settings" icon={icons.settings} label="Settings" />
                </div>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <div className="p-3 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-lg">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Pro Tip 💡
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Create rules to automate your file organization workflow.
                    </p>
                </div>
            </div>
        </aside>
    );
}
