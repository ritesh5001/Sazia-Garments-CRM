import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Wallet,
  Boxes,
  Truck,
  Users,
  ClipboardList,
  BarChart3,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/types';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles?: UserRole[]; // if omitted, visible to all authenticated users
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Invoices', path: '/invoices', icon: FileText },
  { label: 'Purchases', path: '/purchases', icon: ShoppingCart },
  { label: 'Payments', path: '/payments', icon: Wallet },
  { label: 'Inventory', path: '/inventory', icon: Boxes },
  { label: 'Vendors', path: '/vendors', icon: Truck },
  { label: 'Customers', path: '/customers', icon: Users },
  { label: 'Orders', path: '/orders', icon: ClipboardList },
  { label: 'Reports', path: '/reports', icon: BarChart3 },
  { label: 'Users', path: '/users', icon: ShieldCheck, roles: ['admin'] },
];
