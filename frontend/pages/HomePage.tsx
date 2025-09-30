import React from 'react';
import { Link } from 'react-router-dom';
import { BarChartIcon, MessageSquareIcon } from '../components/icons/Icons';

const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <div className="max-w-4xl w-full">
        <header className="mb-12">
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 animate-fade-in-down">
            Welcome to <span className="text-blue-700">Talk to the Code</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up">
            Visualize your code architecture, analyze packages, and interact with your codebase using generative AI.
            </p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link
            to="/dashboard"
            className="group bg-white p-8 rounded-md shadow-sm border border-gray-200 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-700 rounded-full mx-auto mb-6 transition-colors">
              <BarChartIcon className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Project Dashboard</h2>
            <p className="text-gray-500">
              Get a high-level overview of your project's structure with interactive charts and package explorers.
            </p>
          </Link>

          <Link
            to="/chat"
            className="group bg-white p-8 rounded-md shadow-sm border border-gray-200 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-700 rounded-full mx-auto mb-6 transition-colors">
              <MessageSquareIcon className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">AI Code Chat</h2>
            <p className="text-gray-500">
              Generate and visualize Mermaid diagrams by chatting with an AI expert. Understand complex flows effortlessly.
            </p>
          </Link>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-down {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .animate-fade-in-down {
            animation: fade-in-down 0.6s ease-out forwards;
        }

        @keyframes fade-in-up {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
       .animate-fade-in-up {
            animation: fade-in-up 0.6s ease-out 0.2s forwards;
            opacity: 0; /* Start hidden */
        }
      `}</style>
    </div>
  );
};

export default HomePage;