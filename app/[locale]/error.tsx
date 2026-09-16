"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-2xl font-bold">Something went wrong</h2>
      <p className="text-zinc-500">Please try again.</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-purple-600 text-white rounded-xl"
      >
        Try again
      </button>
    </div>
  );
}
