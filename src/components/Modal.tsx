import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  large?: boolean;
}

export function Modal({ open, onClose, children, large = false }: Props) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal${large ? ' modal-lg' : ''}`} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
