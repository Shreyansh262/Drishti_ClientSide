import { Client } from "ssh2"
import fs from "fs"
import path from "path"
import dotenv from "dotenv"

dotenv.config()

const sshConfig = {
  host: process.env.VM_HOST,
  port: 22,
  username: process.env.VM_USER,
  privateKey: fs.readFileSync(path.resolve(process.env.VM_KEY_PATH)),
}

// 🔹 Create reusable function to connect and run a command
function runSshCommand(command) {
  return new Promise((resolve, reject) => {
    const conn = new Client()
    conn
      .on("ready", () => {
        conn.exec(command, (err, stream) => {
          if (err) return reject(err)
          let data = ""
          stream
            .on("data", chunk => data += chunk.toString())
            .on("close", () => {
              conn.end()
              resolve(data)
            })
            .stderr.on("data", err => reject(new Error(err.toString())))
        })
      })
      .on("error", reject)
      .connect(sshConfig)
  })
}

// 🔹 Read entire file over SFTP
export function getFileContent(remotePath) {
  return new Promise((resolve, reject) => {
    const conn = new Client()
    conn
      .on("ready", () => {
        conn.sftp((err, sftp) => {
          if (err) return reject(err)
          const stream = sftp.createReadStream(remotePath)
          let data = ""
          stream.on("data", chunk => data += chunk)
          stream.on("end", () => {
            conn.end()
            resolve(data)
          })
          stream.on("error", reject)
        })
      })
      .on("error", reject)
      .connect(sshConfig)
  })
}

// 🔹 Append to a file remotely
export function appendToFile(remotePath, content) {
  return runSshCommand(`echo '${content.replace(/'/g, `'\\''`)}' >> ${remotePath}`)
}

// 🔹 Tail last few lines of CSV (cleaned + consolidated)
export function getLastCsvLines(remotePath, lineCount = 50) {
  return runSshCommand(`tail -n ${lineCount} "${remotePath}"`)
}

// ✅ Optional: Alias if you still use this name elsewhere
export const getTailContent = getLastCsvLines
