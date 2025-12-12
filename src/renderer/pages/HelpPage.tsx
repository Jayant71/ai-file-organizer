/**
 * Help Page Component
 * A dedicated help page for users who need guidance.
 */

import React, { useState } from 'react';
import { Button } from '../components/common';

const faqs = [
    {
        question: '🤔 How do I organize my files?',
        answer: `It's easy! Just follow these steps:
1. Go to "My Computer" from the sidebar
2. Click "Add Folder" and select a folder (like Downloads)
3. Click "Scan Folders" to see what files are there
4. Click "AI Suggestions" to get organization recommendations
5. Review the changes and click "Apply" when ready!`
    },
    {
        question: '🔒 Will this delete my files?',
        answer: `No, absolutely not! This app only MOVES files to organize them - it never deletes anything. You can always find your files in the new locations, and you can move them back manually if needed.`
    },
    {
        question: '🔄 Can I undo changes?',
        answer: `There's no automatic undo, but since we only move files (never delete), you can always find your files in their new locations and move them back manually. Always review changes before applying them!`
    },
    {
        question: '✨ What does the AI do?',
        answer: `The AI analyzes your files and suggests how to organize them based on:
• File types (documents, images, videos, etc.)
• File names and content
• File dates
• Common organization patterns

You can choose between Quick (fast), Smart (balanced), or Deep (thorough) analysis modes in Settings.`
    },
    {
        question: '📋 Do I need to create rules?',
        answer: `No! Rules are optional and for advanced users who want specific behavior. The AI Suggestions feature works great without any rules. Rules are useful when you want to create your own custom organization patterns.`
    },
    {
        question: '☁️ What about Google Drive?',
        answer: `Google Drive integration requires additional setup (OAuth credentials). If you just want to organize files on your computer, you can ignore this feature completely.`
    },
    {
        question: '🔑 What is an API key?',
        answer: `An API key is only needed if you want to use the "Deep" analysis mode, which uses advanced AI. The "Quick" and "Smart" modes work perfectly without any API key! Most users don't need one.`
    },
];

export default function HelpPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    💡 Help Center
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Everything you need to know about organizing your files
                </p>
            </div>

            {/* Quick Start */}
            <div className="card p-6 bg-gradient-to-br from-primary-500 to-accent-500 text-white">
                <h2 className="text-xl font-bold mb-4">🚀 Quick Start Guide</h2>
                <div className="grid md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl">1</span>
                        </div>
                        <p className="font-medium">Select Folder</p>
                        <p className="text-sm opacity-80">Choose what to organize</p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl">2</span>
                        </div>
                        <p className="font-medium">Scan Files</p>
                        <p className="text-sm opacity-80">See what's there</p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl">3</span>
                        </div>
                        <p className="font-medium">Get Suggestions</p>
                        <p className="text-sm opacity-80">AI analyzes your files</p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl">4</span>
                        </div>
                        <p className="font-medium">Apply Changes</p>
                        <p className="text-sm opacity-80">Review and confirm</p>
                    </div>
                </div>
            </div>

            {/* FAQs */}
            <div className="card overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        ❓ Frequently Asked Questions
                    </h2>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {faqs.map((faq, index) => (
                        <div key={index}>
                            <button
                                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                    {faq.question}
                                </span>
                                <span className={`text-slate-400 transition-transform ${openFaq === index ? 'rotate-180' : ''}`}>
                                    ▼
                                </span>
                            </button>
                            {openFaq === index && (
                                <div className="px-4 pb-4">
                                    <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line text-sm leading-relaxed">
                                        {faq.answer}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Safety Info */}
            <div className="card p-6 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
                <h2 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-4 flex items-center gap-2">
                    🛡️ Your Files Are Safe
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                        <span className="text-green-500">✓</span>
                        <div>
                            <p className="font-medium text-green-700 dark:text-green-400">Never Deleted</p>
                            <p className="text-sm text-green-600 dark:text-green-300">
                                Files are only moved, never removed
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-green-500">✓</span>
                        <div>
                            <p className="font-medium text-green-700 dark:text-green-400">Always Preview</p>
                            <p className="text-sm text-green-600 dark:text-green-300">
                                See changes before they happen
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-green-500">✓</span>
                        <div>
                            <p className="font-medium text-green-700 dark:text-green-400">You're In Control</p>
                            <p className="text-sm text-green-600 dark:text-green-300">
                                Uncheck any change you don't want
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-green-500">✓</span>
                        <div>
                            <p className="font-medium text-green-700 dark:text-green-400">Reversible</p>
                            <p className="text-sm text-green-600 dark:text-green-300">
                                Manually move files back anytime
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Get Started Button */}
            <div className="text-center py-4">
                <Button
                    onClick={() => window.location.href = '#/local'}
                    size="lg"
                >
                    Start Organizing My Files →
                </Button>
            </div>
        </div>
    );
}
