import { SiteHeader } from "./site-header";

/** Header plus a centred column with the standard side gutter. */
export function PageShell({
  children,
  width = "max-w-3xl",
}: {
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <>
      <SiteHeader />
      <main className={`mx-auto ${width} px-[max(16px,env(safe-area-inset-left))] pt-6 pb-16`}>
        {children}
      </main>
    </>
  );
}
