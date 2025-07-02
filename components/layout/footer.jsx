export function Footer() {
  return (
    <footer className="bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 text-white py-6 px-6 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <div>
              <p className="font-semibold">© 2025 Drishti Technologies</p>
              <p className="text-sm text-gray-300">Driver Safety & Monitoring System</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-300">
            <span>🛡️ Secure</span>
            <span>⚡ Real-time</span>
            <span>🎯 Accurate</span>
            <span>🌟 Trusted</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
