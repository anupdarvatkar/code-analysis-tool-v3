import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_PACKAGE_DATA } from '../constants';

const DetailPage: React.FC = () => {
  const { packageName } = useParams<{ packageName: string }>();
  
  if (!packageName) {
    return <div className="text-red-600">Package name not provided.</div>;
  }
  
  const decodedPackageName = decodeURIComponent(packageName);
  const packageData = MOCK_PACKAGE_DATA.find(p => p.name === decodedPackageName);

  if (!packageData) {
    return (
        <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Package not found:</h1>
            <p className="font-mono text-lg bg-gray-200 text-gray-800 p-2 rounded inline-block">{decodedPackageName}</p>
            <div className="mt-8">
                <Link to="/dashboard" className="px-6 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition">
                    &larr; Back to Dashboard
                </Link>
            </div>
        </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-md shadow-sm border border-gray-200">
      <div className="mb-8">
        <Link to="/dashboard" className="text-cyan-600 hover:text-cyan-700 transition-colors">
          &larr; Back to Dashboard
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Package Details</h1>
      <p className="font-mono text-lg text-blue-800 bg-blue-50 px-3 py-1 rounded-md inline-block mb-8">{packageData.name}</p>
      
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Classes in this Package ({packageData.details.classes.length})</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packageData.details.classes.map(className => (
          <div key={className} className="bg-gray-100 p-4 rounded-md border border-gray-200">
            <p className="font-mono text-gray-700">{className}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DetailPage;