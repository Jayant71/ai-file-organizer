/**
 * Main Application Component
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import LocalOrganizer from './pages/LocalOrganizer';
import DriveOrganizer from './pages/DriveOrganizer';
import RulesPage from './pages/RulesPage';
import SettingsPage from './pages/SettingsPage';

function App() {
    return (
        <MainLayout>
            <Routes>
                <Route path="/" element={<Navigate to="/local" replace />} />
                <Route path="/local" element={<LocalOrganizer />} />
                <Route path="/drive" element={<DriveOrganizer />} />
                <Route path="/rules" element={<RulesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
            </Routes>
        </MainLayout>
    );
}

export default App;
