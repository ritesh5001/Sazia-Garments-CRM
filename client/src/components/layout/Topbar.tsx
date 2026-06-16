import { LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button';

export function Topbar() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div />
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm font-medium text-slate-800">{user?.name}</div>
          <div className="text-xs capitalize text-slate-500">{user?.role}</div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} title="Sign out">
          <LogOut size={16} />
        </Button>
      </div>
    </header>
  );
}
