export function Toast({ message, className = "toast" }: { message: string; className?: string }) {
  if (!message) return null;
  return <div className={className}>{message}</div>;
}
