/**
 * Sidebar Component
 * Navigation sidebar with app branding and helpful guidance.
 */

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useRules } from '../../context/RulesContext';

// Icons (using emoji for simplicity, can be replaced with Lucide icons)
const icons = {
    local: '📁',
    drive: '☁️',
    rules: '📋',
    settings: '⚙️',
    logo: '✨',
    help: '💡',
};

interface NavItemProps {
    to: string;
    icon: string;
    label: string;
    description?: string;
    badge?: number;
}

function NavItem({ to, icon, label, description, badge }: NavItemProps) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-150 ${isActive
                    ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`
            }
        >
            <span className="text-xl">{icon}</span>
            <div className="flex-1">
                <span className="font-medium block">{label}</span>
                {description && (
                    <span className="text-xs text-slate-400 dark:text-slate-500 block">
                        {description}
                    </span>
                )}
            </div>
            {badge !== undefined && badge > 0 && (
                <span className="badge badge-primary">{badge}</span>
            )}
        </NavLink>
    );
}

export default function Sidebar() {
    const { rules } = useRules();
    const enabledRulesCount = rules.filter((r) => r.enabled).length;
    const [showTip, setShowTip] = useState(true);

    // Rotating tips for new users
    const tips = [
        {
            title: 'Getting Started',
            text: 'Start by selecting a folder to organize, then let AI suggest how to sort your files.',
        },
        {
            title: 'Safe Changes',
            text: 'Don\'t worry! You\'ll always preview changes before they happen.',
        },
        {
            title: 'Custom Rules',
            text: 'Create your own rules to automate organization for specific file types.',
        },
    ];
    const [currentTip] = useState(Math.floor(Math.random() * tips.length));

    return (
        <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
            {/* Logo / App Name */}
            <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-200 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xl">
                    {icons.logo}
                </div>
                <div>
                    <h1 className="text-sm font-bold text-slate-900 dark:text-white">
                        Smart Organizer
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        File management made easy
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1">
                {/* Main section */}
                <div className="mb-4">
                    <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <span>📂</span> Organize Files
                    </p>
                    <NavItem
                        to="/local"
                        icon={icons.local}
                        label="My Computer"
                        description="Organize local files"
                    />
                    <NavItem
                        to="/drive"
                        icon={icons.drive}
                        label="Google Drive"
                        description="Organize cloud files"
                    />
                </div>

                {/* Configuration section */}
                <div className="mb-4">
                    <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <span>🔧</span> Customize
                    </p>
                    <NavItem
                        to="/rules"
                        icon={icons.rules}
                        label="My Rules"
                        description={enabledRulesCount > 0 ? `${enabledRulesCount} active` : 'Create custom rules'}
                        badge={enabledRulesCount}
                    />
                    <NavItem
                        to="/settings"
                        icon={icons.settings}
                        label="Settings"
                        description="Preferences & appearance"
                    />
                </div>

                {/* Help section */}
                <div className="mb-4">
                    <NavItem
                        to="/help"
                        icon={icons.help}
                        label="Help & Guide"
                        description="How to use the app"
                    />
                </div>
            </nav>


            {/* Tip of the day */}
            {showTip && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="relative p-4 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-xl">
                        <button
                            onClick={() => setShowTip(false)}
                            className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs"
                        >
                            ✕
                        </button>
                        <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 flex items-center gap-1 mb-1">
                            {icons.help} {tips[currentTip].title}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {tips[currentTip].text}
                        </p>
                    </div>
                </div>
            )}

            {/* Quick help link */}
            <div className="p-4 pt-0">
                <button
                    onClick={() => {
                        // Could open help modal or documentation
                        localStorage.removeItem('smartFileOrganizer_hasVisited');
                        window.location.reload();
                    }}
                    className="w-full px-4 py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <span>🎓</span>
                    <span>Show Tutorial Again</span>
                </button>
            </div>
        </aside>
    );
}
