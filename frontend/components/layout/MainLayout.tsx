import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const MainLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-white text-gray-800">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-gray-100">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;