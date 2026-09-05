import { NavLink, useNavigate } from 'react-router-dom';
import { useAudioStore } from '../../store/useAudioStore';
import { deleteAllFiles } from '../../api/client';

export default function SideNav() {
  const navigate = useNavigate();
  const clearFiles = useAudioStore((state) => state.clearFiles);

  const handleClearSessions = async () => {
    if (window.confirm('Are you sure you want to remove all recent sessions? This will permanently delete all uploaded and processed audio files.')) {
      try {
        await deleteAllFiles();
        clearFiles();
        navigate('/');
      } catch (error) {
        console.error('Failed to clear sessions:', error);
        alert('Failed to clear sessions from the server.');
      }
    }
  };

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
        <h1 className="text-headline-lg text-primary font-bold">PhasePlay</h1>
        <p className="text-body-sm text-on-surface-variant">v1.0 — Phase Vocoder</p>
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
      <div className="mt-auto pt-4 border-t border-surface-container-high">
        <button
          onClick={handleClearSessions}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-error hover:bg-surface-container-highest transition-colors text-left"
        >
          <span className="material-symbols-outlined">delete_sweep</span>
          <span className="font-medium text-body-lg">Clear Sessions</span>
        </button>
      </div>
    </aside>
  );
}
