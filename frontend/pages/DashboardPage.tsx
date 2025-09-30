import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { MOCK_PACKAGE_DATA, BAR_CHART_DATA, PIE_CHART_DATA, TOTAL_CLASSES } from '../constants';

const COLORS = ['#0055A0', '#009B9B', '#FFBB28', '#FF8042', '#8884d8'];

const DashboardPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [transitionKey, setTransitionKey] = useState(0);
  const itemsPerPage = 7;

  const tableData = useMemo(() => {
    return MOCK_PACKAGE_DATA.flatMap(pkg =>
      pkg.details.classes.map(className => ({
        packageName: pkg.name,
        className: className,
        dependencyCount: pkg.count,
      }))
    );
  }, []);

  const totalPages = Math.ceil(tableData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTableData = tableData.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    setTransitionKey(key => key + 1);
  };

  const handleNextPage = () => {
    handlePageChange(currentPage + 1);
  };

  const handlePrevPage = () => {
    handlePageChange(currentPage - 1);
  };


  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-gray-900">Project Dashboard</h1>

      {/* Stats and Table Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-md shadow-sm border border-gray-200 flex flex-col h-[560px]">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex-shrink-0">Package Explorer</h2>
          <div className="flex-grow overflow-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left">
              <caption className="sr-only">A table listing all classes within each package and their dependency counts.</caption>
              <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50">
                <tr>
                  <th scope="col" className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Package Name</th>
                  <th scope="col" className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Class</th>
                  <th scope="col" className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Dependency Count</th>
                </tr>
              </thead>
              <tbody key={transitionKey} className="animate-fade-in">
                {currentTableData.map((item, index) => (
                  <tr key={`${item.packageName}-${item.className}-${index}`} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-gray-700">{item.packageName}</td>
                    <td className="py-3 px-4 font-mono text-gray-700">
                      <Link 
                        to={`/class-details?class=${encodeURIComponent(item.className)}`} 
                        className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        aria-label={`View details for ${item.className}`}
                      >
                        {item.className}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-700">{item.dependencyCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            <nav className="flex-shrink-0 flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-0 mt-4" aria-label="Pagination">
              <div className="hidden sm:block">
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, tableData.length)}</span> of{' '}
                  <span className="font-medium">{tableData.length}</span> results
                </p>
              </div>
              <div className="flex flex-1 justify-between sm:justify-end gap-3">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  aria-disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  aria-disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </nav>
        </div>

        <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200 flex flex-col justify-center items-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Total Classes</h2>
          <p className="text-6xl font-bold text-blue-700">{TOTAL_CLASSES}</p>
          <p className="text-gray-500 mt-2">across all packages</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        <div className="xl:col-span-3 bg-white p-6 rounded-md shadow-sm border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Classes per Package</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={BAR_CHART_DATA} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fill: '#3f3f46' }} fontSize={12} />
              <YAxis stroke="#a1a1aa" tick={{ fill: '#3f3f46' }} fontSize={12} />
              <Tooltip cursor={{fill: 'rgba(200, 200, 200, 0.2)'}} contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }} />
              <Legend />
              <Bar dataKey="value" name="Class Count" fill="#0055A0" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="xl:col-span-2 bg-white p-6 rounded-md shadow-sm border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Package Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={PIE_CHART_DATA} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                 {PIE_CHART_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}/>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <style>{`
        @keyframes fade-in {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }
        .animate-fade-in {
            animation: fade-in 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;