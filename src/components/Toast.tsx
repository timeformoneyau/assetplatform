interface Props { msg: string; }

export function Toast({ msg }: Props) {
  if (!msg) return null;
  return <div className="toast">{msg}</div>;
}
