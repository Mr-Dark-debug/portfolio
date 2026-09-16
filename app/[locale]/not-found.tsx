import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-3xl font-bold">404 — Lost at sea</h2>
      <p className="text-zinc-500">This page drifted away.</p>
      <Link href="/en" className="px-4 py-2 bg-purple-600 text-white rounded-xl">
        Back home
      </Link>
    </div>
  );
}
