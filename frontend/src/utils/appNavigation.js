import {
  BellRing,
  BookOpenText,
  Boxes,
  ClipboardCheck,
  Network,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Ticket
} from 'lucide-react';

export const navigationGroups = [
  {
    label: 'Operación',
    items: [
      { key: 'tickets', path: '/tickets', label: 'Tickets', icon: Ticket },
      { key: 'inventory', path: '/inventory', label: 'Inventario', icon: Boxes },
      { key: 'assignments', path: '/assignments', label: 'Resguardos', icon: ClipboardCheck },
      { key: 'access', path: '/access', label: 'Accesos', icon: ShieldCheck },
      { key: 'telephony', path: '/telephony', label: 'Telefonía', icon: Smartphone },
      { key: 'services', path: '/services', label: 'Servicios', icon: ReceiptText },
      { key: 'infrastructure', path: '/infrastructure', label: 'Infraestructura', icon: Network }
    ]
  },
  {
    label: 'Apoyo',
    items: [
      { key: 'notifications', path: '/notifications', label: 'Notificaciones', icon: BellRing },
      { key: 'knowledge-base', path: '/knowledge-base', label: 'Base de conocimiento', icon: BookOpenText }
    ]
  }
];

export const flatNavigation = navigationGroups.flatMap((group) => (
  group.items.map((item) => ({
    ...item,
    groupLabel: group.label
  }))
));

export const findNavigationItem = (pathname = '/tickets') => (
  flatNavigation.find((item) => (
    pathname === item.path || pathname.startsWith(`${item.path}/`)
  )) || flatNavigation[0]
);
