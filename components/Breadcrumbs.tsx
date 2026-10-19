import Link from 'next/link';

interface BreadcrumbsProps {
  items: Array<{ label: string; href: string; current: boolean }>;
  separator?: string;
}

export function Breadcrumbs({ items, separator = '>' }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb navigation" className="flex items-center space-x-2 text-sm text-slate-500">
      {items.map((item, index) => (
        <span key={index}>
          {index > 0 && separator}
          {item.current ? (
            <span className="font-medium text-navy-900">
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className="hover:text-brand-600 transition underline"
            >
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}