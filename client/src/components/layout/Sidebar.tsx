import { NavLink } from 'react-router-dom';
import { navItems } from './navItems';
import { useAuth } from '@/features/auth/AuthContext';
import { cn } from '@/lib/cn';

export function Sidebar() {
  const { user } = useAuth();
  const visible = navItems.filter((item) => !item.roles || (user && item.roles.includes(user.role)));

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center px-6">
        <span className="text-lg font-bold text-brand-700">Sazia CRM</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {visible.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
