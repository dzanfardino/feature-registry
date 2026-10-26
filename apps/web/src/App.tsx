import { NavLink, Route, Routes } from 'react-router-dom';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { FeatureDetailPage } from './pages/FeatureDetailPage';
import { AdminAttributesPage } from './pages/AdminAttributesPage';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-3 py-1 text-sm ${isActive ? 'bg-white text-slate-900' : 'text-slate-200 hover:bg-slate-800'}`;

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="bg-slate-900 px-6 py-4 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <strong>Feature Registry</strong>
          <nav className="flex gap-2">
            <NavLink to="/" className={linkClass} end>
              Applications
            </NavLink>
            <NavLink to="/features" className={linkClass}>
              Features
            </NavLink>
            <NavLink to="/admin/attributes" className={linkClass}>
              Attributes
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Routes>
          <Route path="/" element={<ApplicationsPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/features/:id" element={<FeatureDetailPage />} />
          <Route path="/admin/attributes" element={<AdminAttributesPage />} />
        </Routes>
      </main>
    </div>
  );
}
