export default function TestPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">✅ DEPLOYMENT TEST</h1>
        <p className="text-xl text-gray-400 mb-8">ACPPAV Dashboard Cloud</p>
        <div className="text-sm text-gray-500">
          Build time: {new Date().toISOString()}
        </div>
        <div className="mt-8">
          <a href="/acppav" className="bg-purple-600 px-6 py-3 rounded font-medium hover:bg-purple-500">
            → Go to ACPPAV Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}