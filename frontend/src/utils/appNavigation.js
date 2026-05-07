import {
  BellRing,
  BookOpenText,
  Boxes,
  Network,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Ticket
} from 'lucide-react';

import { hasPermission } from './accessControl.js';

export const navigationGroups = [
  {
    label: 'Operación',
    items: [
      { key: 'tickets', path: '/tickets', label: 'Tickets', icon: Ticket, requiredPermission: 'tickets.view' },
      { key: 'inventory', path: '/inventory', label: 'Inventario', icon: Boxes, requiredPermission: 'inventory.view' },
      { key: 'access', path: '/access', label: 'Accesos', icon: ShieldCheck, requiredPermission: 'access.view' },
      { key: 'telephony', path: '/telephony', label: 'Telefonía', icon: Smartphone, requiredPermission: 'telephony.view' },
      { key: 'services', path: '/services', label: 'Servicios', icon: ReceiptText, requiredPermission: 'services.view' },
      { key: 'infrastructure', path: '/infrastructure', label: 'Infraestructura', icon: Network, requiredPermission: 'infrastructure.view' }
    ]
  },
  {
    label: 'Apoyo',
    items: [
      { key: 'notifications', path: '/notifications', label: 'Notificaciones', icon: BellRing, requiredPermission: 'notifications.view' },
      { key: 'knowledge-base', path: '/knowledge-base', label: 'Base de conocimiento', icon: BookOpenText, requiredPermission: 'knowledge_base.view' }
    ]
  }
];

export const flatNavigation = navigationGroups.flatMap((group) => (
  group.items.map((item) => ({
    ...item,
    groupLabel: group.label
  }))
));

export const filterNavigationGroupsByAccess = (groups = navigationGroups, authUser = null) => (
  groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasPermission(authUser, item.requiredPermission))
    }))
    .filter((group) => group.items.length > 0)
);

export const getAccessibleNavigationItems = (authUser = null) => (
  flatNavigation.filter((item) => hasPermission(authUser, item.requiredPermission))
);

export const getFirstAccessiblePath = (authUser = null) => (
  getAccessibleNavigationItems(authUser)[0]?.path || '/login'
);

export const findNavigationItem = (pathname = '/tickets', authUser = null) => {
  const accessibleNavigation = getAccessibleNavigationItems(authUser);

  return accessibleNavigation.find((item) => (
    pathname === item.path || pathname.startsWith(`${item.path}/`)
  )) || accessibleNavigation[0] || flatNavigation[0];
};
