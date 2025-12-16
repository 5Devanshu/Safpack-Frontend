import { FileSpreadsheet, GitGraph, HomeIcon } from 'lucide-react';

const features = [
  {
    featureName: 'Home',
    displayName: 'Home',
    logoUsed: HomeIcon,
    route: '/',
  },
  {
    featureName: 'ViewSheets',
    displayName: 'Sheets',
    logoUsed: FileSpreadsheet,
    route: '/sheets',
  },
  {
    featureName: 'Restructure',
    displayName: 'Restructure',
    logoUsed: GitGraph,
    route: '/restructure',
  },
];

export { features };
