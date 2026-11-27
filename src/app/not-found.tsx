import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 text-center">
      <p className="label">404</p>
      <h1 className="mt-4 font-display text-6xl">This frame is missing</h1>
      <p className="mt-3 text-stone">The page you are looking for doesn&apos;t exist or has moved.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="btn-primary">Back to home</Link>
        <Link href="/gallery" className="btn-outline">View gallery</Link>
      </div>
    </main>
  );
}
