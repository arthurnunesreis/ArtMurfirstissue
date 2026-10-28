import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="font-display flex items-center gap-2 text-2xl font-extrabold">
      <svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true">
        <path d="M14 2 24.4 8v12L14 26 3.6 20V8Z" className="fill-honey" />
        <path d="M14 9.5 18 11.8v4.4L14 18.5l-4-2.3v-4.4Z" className="fill-ink" />
      </svg>
      HiveConcerts
    </Link>
  );
}
