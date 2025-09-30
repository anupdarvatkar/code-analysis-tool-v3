import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DocumentTextIcon } from '../components/icons/Icons';

const API_URL = "http://127.0.0.1:8085";

const ClassDetailsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [specification, setSpecification] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [allClasses, setAllClasses] = useState<string[]>([]);

  // Fetch all classes where package_name contains 'jtspringproject'
  useEffect(() => {
    fetch(`${API_URL}/classes/dependencies`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch class dependencies');
        return res.json();
      })
      .then((data) => {
        const filtered = data
          .filter((item: any) => item.package_name && item.package_name.includes('jtspringproject'))
          .map((item: any) => item.class_name);
        setAllClasses(filtered.sort());
      })
      .catch((err) => {
        setAllClasses([]);
        console.error("Fetch error:", err);
      });
  }, []);

  // Fetch specification for selected class
  const fetchSpecification = useCallback(async (className: string) => {
    if (!className) {
      setSpecification('');
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSpecification('');

    try {
      const res = await fetch(`${API_URL}/classes/functional-specification?class_name=${encodeURIComponent(className)}`);
      if (!res.ok) throw new Error('Failed to fetch functional specification');
      const result = await res.json();
      setSpecification(result.functional_specification);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Failed to generate specification. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle query param selection
  useEffect(() => {
    const classNameFromQuery = searchParams.get('class');
    if (classNameFromQuery && allClasses.includes(classNameFromQuery)) {
      setSelectedClass(classNameFromQuery);
      fetchSpecification(classNameFromQuery);
    }
  }, [searchParams, allClasses, fetchSpecification]);

  const handleClassChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const className = event.target.value;
    setSelectedClass(className);
    fetchSpecification(className);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-gray-900">Class Functional Details</h1>
      
      <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200">
        <div className="mb-6">
          <label htmlFor="class-selector" className="block text-lg font-medium text-gray-700 mb-2">
            Select a Class
          </label>
          <select
            id="class-selector"
            value={selectedClass}
            onChange={handleClassChange}
            className="w-full max-w-md p-3 bg-gray-50 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            aria-label="Select a class to view its specification"
          >
            <option value="">-- Choose a class --</option>
            {allClasses.map(className => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6 min-h-[300px] flex flex-col justify-center">
          {isLoading && (
            <div className="flex items-center justify-center text-gray-500">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Generating specification, please wait...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-md">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          )}
          
          {specification && !isLoading && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <DocumentTextIcon className="w-6 h-6 mr-3 text-blue-700"/>
                Details for <code className="ml-2 font-mono bg-gray-100 text-blue-800 px-2 py-1 rounded">{selectedClass}</code>
              </h2>
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-md">
                 <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">{specification}</div>
              </div>
            </div>
          )}
          
          {!selectedClass && !isLoading && !error && (
            <div className="text-center py-12 text-gray-500">
              <p>Select a class from the dropdown above to see its generated functional specification.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassDetailsPage;