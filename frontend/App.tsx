import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import DetailPage from './pages/DetailPage';
import HomePage from './pages/HomePage';
import ClassDetailsPage from './pages/ClassDetailsPage';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/detail/:packageName" element={<DetailPage />} />
          <Route path="/class-details" element={<ClassDetailsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;
