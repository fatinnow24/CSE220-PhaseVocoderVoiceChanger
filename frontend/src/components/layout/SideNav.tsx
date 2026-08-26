import { NavLink } from 'react-router-dom';

export default function SideNav() {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: 'dashboard' },
    { name: 'Studio', path: '/studio', icon: 'science' },
    { name: 'Signals', path: '/signals', icon: 'show_chart' },
    { name: 'Effects', path: '/effects', icon: 'auto_fix_high' },
    { name: 'Compare', path: '/compare', icon: 'compare_arrows' },
    { name: 'Theory', path: '/theory', icon: 'menu_book' },
    { name: 'Settings', path: '/settings', icon: 'settings' },
  ];

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 bg-surface-container-lowest border-r border-surface-container-high py-6 px-4">
      <div className="mb-8 px-2">
        <h1 className="text-headline-lg text-primary font-bold">Vocoder Lab</h1>
        <p className="text-body-sm text-on-surface-variant">v2.0 — DSP Engine</p>
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-container text-on-primary-container'
                  : 'text-on-surface-variant hover:bg-surface-container-highest'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined ${isActive ? 'icon-fill' : ''}`}>
                  {item.icon}
                </span>
                <span className="font-medium text-body-lg">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
