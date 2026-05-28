import type { ReactNode } from 'react';

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export function PageHeader({ eyebrow, title, subtitle, right }: Props) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'flex-end', gap: 24, marginBottom: 28, flexWrap: 'wrap',
    }}>
      <div style={{ maxWidth: 640 }}>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 className="h-page" style={{ marginTop: eyebrow ? 8 : 0 }}>{title}</h1>
        {subtitle && (
          <p className="muted" style={{ marginTop: 10, fontSize: 15, lineHeight: 1.5, maxWidth: 540 }}>
            {subtitle}
          </p>
        )}
      </div>
      {right && <div className="row" style={{ gap: 8 }}>{right}</div>}
    </div>
  );
}
