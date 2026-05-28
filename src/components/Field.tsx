import type { ReactNode } from 'react';

interface Props {
  label: string;
  helper?: string;
  children: ReactNode;
  span?: 1 | 2;
}

export function Field({ label, helper, children, span = 1 }: Props) {
  return (
    <div className={`field${span === 2 ? ' span-2' : ''}`}>
      <label>{label}</label>
      {children}
      {helper && <div className="helper">{helper}</div>}
    </div>
  );
}
