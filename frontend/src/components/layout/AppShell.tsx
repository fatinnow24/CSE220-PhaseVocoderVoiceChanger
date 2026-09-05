import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import SideNav from './SideNav';
import TopBar from './TopBar';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const bottomNavItems = [
    { name: 'Dashboard', path: '/', icon: 'dashboard' },
    { name: 'Studio', path: '/studio', icon: 'science' },
    { name: 'Compare', path: '/compare', icon: 'compare_arrows' },
    { name: 'Theory', path: '/theory', icon: 'menu_book' },
    { name: 'Effects', path: '/effects', icon: 'auto_fix_high' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SideNav />
      <TopBar />
      <main className="lg:ml-64 p-4 lg:p-8 pb-24 lg:pb-8">
        {children}
      </main>
      
      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-surface-container-high flex justify-around items-center px-2 py-3 z-20">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 min-w-[64px] ${
                isActive ? 'text-primary' : 'text-on-surface-variant'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined ${isActive ? 'icon-fill' : ''}`}>
                  {item.icon}
                </span>
                <span className="text-[10px] font-medium leading-none">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
