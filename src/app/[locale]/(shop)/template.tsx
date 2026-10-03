/** Re-mounts on every navigation, giving each screen a short fade-in. */
export default function ShopTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-page">{children}</div>;
}
