export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center px-4 bg-[hsl(210_40%_96.5%)]">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
