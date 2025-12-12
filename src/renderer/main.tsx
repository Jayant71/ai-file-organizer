/**
 * React Application Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { RulesProvider } from './context/RulesContext';
import { SettingsProvider } from './context/SettingsContext';
import { FileOrganizerProvider } from './context/FileOrganizerContext';

// Render the application
// Using HashRouter for Electron compatibility (file:// protocol)
ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <HashRouter>
            <ThemeProvider>
                <SettingsProvider>
                    <RulesProvider>
                        <FileOrganizerProvider>
                            <App />
                        </FileOrganizerProvider>
                    </RulesProvider>
                </SettingsProvider>
            </ThemeProvider>
        </HashRouter>
    </React.StrictMode>
);
