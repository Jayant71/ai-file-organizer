/**
 * Welcome Modal Component
 * Onboarding experience for first-time users.
 */

import React, { useState } from 'react';
import { Button, Modal } from '../common';

interface WelcomeModalProps {
    isOpen: boolean;
    onComplete: () => void;
}

const slides = [
    {
        icon: '✨',
        title: 'Welcome to Smart File Organizer!',
        description: 'Your personal assistant for keeping files organized automatically.',
        image: '🗂️',
        details: [
            'Organize files on your computer or Google Drive',
            'AI-powered suggestions make it easy',
            'Preview all changes before applying them',
        ],
    },
    {
        icon: '📁',
        title: 'Step 1: Select Folders',
        description: 'Choose which folders you want to organize.',
        image: '📂',
        details: [
            'Click "Add Folder" to select folders',
            'You can add multiple folders at once',
            'Subdirectories can be included automatically',
        ],
    },
    {
        icon: '🔍',
        title: 'Step 2: Scan & Analyze',
        description: 'We\'ll look through your files and suggest how to organize them.',
        image: '🔬',
        details: [
            'Click "Scan Folders" to see your files',
            'Use "AI Suggestions" for smart organization',
            'Or create your own rules for custom organization',
        ],
    },
    {
        icon: '👀',
        title: 'Step 3: Preview & Apply',
        description: 'Always preview changes before they happen.',
        image: '✅',
        details: [
            'See exactly what will change',
            'Uncheck any changes you don\'t want',
            'Click "Apply" only when you\'re ready',
        ],
    },
    {
        icon: '🎉',
        title: 'You\'re Ready!',
        description: 'Let\'s get your files organized.',
        image: '🚀',
        details: [
            'Your files are safe - we only move, never delete',
            'You can always undo by moving files back',
            'Questions? Look for the 💡 hints throughout the app',
        ],
    },
];

export default function WelcomeModal({ isOpen, onComplete }: WelcomeModalProps) {
    const [currentSlide, setCurrentSlide] = useState(0);

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            onComplete();
        }
    };

    const handlePrev = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    const slide = slides[currentSlide];
    const isLast = currentSlide === slides.length - 1;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleSkip}
            size="lg"
        >
            <div className="py-4">
                {/* Progress dots */}
                <div className="flex justify-center gap-2 mb-8">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentSlide
                                    ? 'w-6 bg-primary-500'
                                    : index < currentSlide
                                        ? 'bg-primary-300'
                                        : 'bg-slate-300 dark:bg-slate-600'
                                }`}
                        />
                    ))}
                </div>

                {/* Slide content */}
                <div className="text-center px-6">
                    {/* Icon */}
                    <div className="text-6xl mb-4 animate-bounce">
                        {slide.image}
                    </div>

                    {/* Title */}
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <span className="text-2xl">{slide.icon}</span>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {slide.title}
                        </h2>
                    </div>

                    {/* Description */}
                    <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                        {slide.description}
                    </p>

                    {/* Details */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 max-w-md mx-auto">
                        <ul className="space-y-3 text-left">
                            {slide.details.map((detail, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    <span className="text-sm text-slate-700 dark:text-slate-300">
                                        {detail}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div>
                        {currentSlide > 0 ? (
                            <Button variant="ghost" onClick={handlePrev}>
                                ← Back
                            </Button>
                        ) : (
                            <Button variant="ghost" onClick={handleSkip}>
                                Skip Tour
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">
                            {currentSlide + 1} of {slides.length}
                        </span>
                        <Button onClick={handleNext}>
                            {isLast ? 'Get Started 🚀' : 'Next →'}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
