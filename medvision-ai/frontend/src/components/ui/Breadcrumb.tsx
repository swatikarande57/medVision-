import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Friendly route names mapping
  const routeNameMap: Record<string, string> = {
    dashboard: 'Clinical Dashboard',
    patients: 'Patient Directory',
    upload: 'Ingest DICOM Scan',
    analysis: 'AI Neural Analysis',
    viewer: 'DICOM Viewer 3.0',
    compare: 'Scan Comparison',
    reports: 'Diagnostic Reports',
    settings: 'System & PACS Config',
  };

  if (pathnames.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs font-mono text-slate-400 mb-2">
      <Link
        to="/dashboard"
        className="flex items-center hover:text-cyan-400 transition-colors"
        aria-label="Home"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>

      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const displayName = routeNameMap[name] || name;

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            {isLast ? (
              <span className="text-cyan-400 font-semibold truncate max-w-[200px]" aria-current="page">
                {displayName}
              </span>
            ) : (
              <Link to={routeTo} className="hover:text-cyan-400 transition-colors truncate max-w-[150px]">
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
