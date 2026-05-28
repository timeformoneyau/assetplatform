import { useNavigate } from 'react-router-dom';
import { Icon } from './Icon';

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface Props {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: Props) {
  const navigate = useNavigate();
  return (
    <div className="row" style={{ gap: 8, fontSize: 13, color: 'var(--ink-soft)', marginBottom: 18 }}>
      {items.map((item, i) => (
        <span key={i} className="row" style={{ gap: 8 }}>
          {i > 0 && <Icon name="chevron_right" size={12} />}
          {item.to ? (
            <button
              onClick={() => navigate(item.to!)}
              style={{
                background: 'transparent', border: 0, padding: 0,
                color: 'var(--ink-soft)', fontSize: 13, cursor: 'pointer',
              }}
            >{item.label}</button>
          ) : (
            <span style={{ color: 'var(--ink)' }}>{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}
