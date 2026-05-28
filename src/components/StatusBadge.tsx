import type { RecordStatus } from '../types';
import { STATUS_LABEL } from '../types';

interface Props {
  status: RecordStatus;
  withLabel?: boolean;
}

export function StatusBadge({ status, withLabel = true }: Props) {
  return (
    <span className="status" data-st={status}>
      <span className="dot" />
      {withLabel && <span>{STATUS_LABEL[status]}</span>}
    </span>
  );
}
