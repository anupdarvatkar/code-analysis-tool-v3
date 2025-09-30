import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, BarChartIcon, MessageSquareIcon, CodeIcon, DocumentTextIcon } from '../icons/Icons';

const Sidebar: React.FC = () => {
  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-3 text-base font-medium rounded-md transition-colors duration-200 ${
      isActive
        ? 'bg-blue-700 text-white'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col p-4">
      <div className="flex items-center mb-10 px-2">
        <CodeIcon className="w-10 h-10 text-blue-700" />
        <h1 className="text-2xl font-bold ml-3 text-gray-800">Talk to the Code</h1>
      </div>
      <nav className="flex flex-col space-y-2">
        <NavLink to="/home" className={navLinkClasses}>
          <HomeIcon className="w-6 h-6 mr-4" />
          Home
        </NavLink>
        <NavLink to="/dashboard" className={navLinkClasses}>
          <BarChartIcon className="w-6 h-6 mr-4" />
          Dashboard
        </NavLink>
         <NavLink to="/class-details" className={navLinkClasses}>
          <DocumentTextIcon className="w-6 h-6 mr-4" />
          Class Functional Details
        </NavLink>
        <NavLink to="/chat" className={navLinkClasses}>
          <MessageSquareIcon className="w-6 h-6 mr-4" />
          Chat
        </NavLink>       
      </nav>
    </div>
  );
};

export default Sidebar;
