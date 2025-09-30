
import type { PackageData, ChartData } from './types';

export const MOCK_PACKAGE_DATA: PackageData[] = [
  { 
    name: 'com.example.ui.components', 
    count: 25, 
    details: { name: 'com.example.ui.components', classes: ['Button', 'Card', 'Input', 'Modal', 'Spinner'] } 
  },
  { 
    name: 'com.example.data.repository', 
    count: 12, 
    details: { name: 'com.example.data.repository', classes: ['UserRepository', 'ProductRepository', 'OrderRepository'] } 
  },
  { 
    name: 'com.example.core.network', 
    count: 8, 
    details: { name: 'com.example.core.network', classes: ['ApiClient', 'AuthInterceptor', 'ResponseHandler'] } 
  },
  { 
    name: 'com.example.feature.auth', 
    count: 18, 
    details: { name: 'com.example.feature.auth', classes: ['LoginScreen', 'SignupViewModel', 'AuthService'] } 
  },
  { 
    name: 'com.example.util.helpers', 
    count: 32, 
    details: { name: 'com.example.util.helpers', classes: ['DateFormatter', 'StringUtils', 'Validator'] } 
  },
];

export const BAR_CHART_DATA: ChartData[] = MOCK_PACKAGE_DATA.map(pkg => ({
    name: pkg.name.split('.').pop() || pkg.name,
    value: pkg.count,
}));

export const PIE_CHART_DATA: ChartData[] = MOCK_PACKAGE_DATA.slice(0, 5).map(pkg => ({
    name: pkg.name.split('.').pop() || pkg.name,
    value: pkg.count
}));

export const TOTAL_CLASSES = MOCK_PACKAGE_DATA.reduce((sum, pkg) => sum + pkg.count, 0);
