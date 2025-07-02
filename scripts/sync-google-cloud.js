const { GoogleCloudSync } = require("../lib/google-cloud-sync.js")

async function runSync() {
  console.log("🚀 Manual Google Cloud data sync started...")

  const sync = new GoogleCloudSync()
  await sync.syncData()

  console.log("✅ Manual sync completed")
  process.exit(0)
}

runSync().catch((error) => {
  console.error("❌ Manual sync failed:", error)
  process.exit(1)
})
