export function Footer() {
  return (
      <footer className="fixed bottom-0 w-full z-50 border-t border-white/20 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl">
        <div className="container flex h-12 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            © 2025{" "}
            <span className="font-semibold bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent">
              Drishti (दृष्टि)
            </span>{" "}
            - Vehicle Monitoring System
          </p>
        </div>
    </footer>
  )
}