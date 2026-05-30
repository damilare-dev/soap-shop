import { AlertProps } from '../types';

export default function Alert({ message, type = "blue", onDismiss }: AlertProps) {
  return (
    <div className={`alert alert-${type}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span>{message}</span>
      {onDismiss && <button className="btn btn-sm" style={{ background: "transparent", border: "none", padding: "4px 8px", fontSize: "18px", color: "inherit" }} onClick={onDismiss}>✕</button>}
    </div>
  );
}
