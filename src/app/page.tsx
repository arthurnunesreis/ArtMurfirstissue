import { ENABLED_FORMATS, FORMAT_LABELS } from "@/config/formats";

/** Placeholder home page until Phase 1 task 10 (Discovery) replaces it. */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-6 px-[max(16px,env(safe-area-inset-left))] py-16">
      <h1 className="font-display text-6xl leading-[0.9] font-black uppercase sm:text-8xl">
        Bring the show to your city
      </h1>
      <p className="text-muted max-w-prose text-lg">
        Propose the live shows you want, back them, and help make them happen. The app is under
        construction.
      </p>
      <ul className="flex flex-wrap gap-2" aria-label="Kinds of show">
        {ENABLED_FORMATS.map((format) => (
          <li key={format} className="border-line bg-surface rounded-full border px-3 py-1 text-sm">
            {FORMAT_LABELS[format]}
          </li>
        ))}
      </ul>
    </main>
  );
}
