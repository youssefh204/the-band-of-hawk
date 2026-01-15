export default function Unauthorized() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-red-700 via-pink-600 to-orange-500 text-white">
      <h1 className="text-5xl font-extrabold mb-4">🚫 Access Denied</h1>
      <p className="text-lg mb-8">You don’t have permission to view this page.</p>
      <a
        href="/"
        className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition"
      >
        Go Home
      </a>
    </div>
  );
}
