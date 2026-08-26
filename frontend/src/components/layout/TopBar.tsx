import { useLocation } from 'react-router-dom';

export default function TopBar() {
  const location = useLocation();
  const pageName = location.pathname === '/' ? 'Dashboard' 
                 : location.pathname.substring(1).charAt(0).toUpperCase() + location.pathname.substring(2);

  return (
    <header className="lg:hidden flex items-center justify-between px-4 py-4 bg-surface-container-lowest border-b border-surface-container-high sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button className="text-on-surface-variant hover:text-on-surface transition-colors p-1">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="font-semibold text-title-md text-on-surface">{pageName}</span>
      </div>
    </header>
  );
}
