import { Client } from "ssh2";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config(); // Ensure environment variables are loaded here

const baseSshConfig = {
  host: process.env.VM_HOST,
  port: 22, // Default SSH port
  username: process.env.VM_USER,
};

function getSshConfigWithKey() {
  let privateKeyContent;
  const vmKeyPath = process.env.VM_KEY_PATH;
  const vmPrivateKeyContent = process.env.VM_PRIVATE_KEY_CONTENT; // New env var for direct content

  if (vmPrivateKeyContent) {
    // Priority 1: Use direct content from VM_PRIVATE_KEY_CONTENT (for Vercel/production)
    console.log('DEBUG: Using SSH private key from VM_PRIVATE_KEY_CONTENT env var.');
    privateKeyContent = vmPrivateKeyContent;
  } else if (vmKeyPath) {
    // Priority 2: Read from file specified by VM_KEY_PATH (for local dev)
    try {
      const resolvedKeyPath = path.resolve(vmKeyPath);
      console.log('DEBUG: Attempting to read private key from file:', resolvedKeyPath);
      privateKeyContent = fs.readFileSync(resolvedKeyPath, 'utf8'); // Read as string
    } catch (readErr) {
      console.error(`ERROR: Failed to read SSH private key from ${vmKeyPath}:`, readErr.message);
      throw new Error(`SSH connection failed: Could not read private key file. ${readErr.message}`);
    }
  } else {
    console.error('ERROR: No SSH private key source defined (VM_KEY_PATH or VM_PRIVATE_KEY_CONTENT).');
    throw new Error('SSH connection failed: No private key configured.');
  }

  // Combine base config with the loaded private key
  const currentSshConfig = {
    ...baseSshConfig,
    privateKey: privateKeyContent,
  };

  // Basic validation for essential config
  if (!currentSshConfig.host || !currentSshConfig.username || !currentSshConfig.privateKey) {
      console.error('ERROR: Missing required SSH config parameters (host, username, or privateKey).');
      throw new Error('Missing required SSH config parameters.');
  }

  return currentSshConfig;
}

// 🔹 Create reusable function to connect and run a command
function runSshCommand(command) {
  return new Promise((resolve, reject) => {
    let currentSshConfig;
    try {
      currentSshConfig = getSshConfigWithKey();
    } catch (err) {
      return reject(err); // Propagate error from key loading
    }

    const conn = new Client();
    conn
      .on("ready", () => {
        conn.exec(command, (err, stream) => {
          if (err) {
            conn.end();
            return reject(err);
          }
          let data = "";
          stream
            .on("data", chunk => (data += chunk.toString()))
            .on("close", () => {
              conn.end();
              resolve(data);
            })
            .stderr.on("data", err => reject(new Error(err.toString())));
        });
      })
      .on("error", reject)
      .connect(currentSshConfig);
  });
}

// 🔹 Read entire file over SFTP
export function getFileContent(remotePath) {
  return new Promise((resolve, reject) => {
    let currentSshConfig;
    try {
      currentSshConfig = getSshConfigWithKey();
    } catch (err) {
      return reject(err);
    }

    const conn = new Client();
    conn
      .on("ready", () => {
        conn.sftp((err, sftp) => {
          if (err) {
            conn.end();
            return reject(err);
          }
          const stream = sftp.createReadStream(remotePath);
          let data = "";
          stream.on("data", chunk => (data += chunk));
          stream.on("end", () => {
            conn.end();
            resolve(data);
          });
          stream.on("error", err => {
              conn.end();
              reject(err);
          });
        });
      })
      .on("error", reject)
      .connect(currentSshConfig);
  });
}

// 🔹 Append to a file remotely
export function appendToFile(remotePath, content) {
  return runSshCommand(`echo '${content.replace(/'/g, `'\\''`)}' >> ${remotePath}`);
}

// 🔹 Tail last few lines of CSV (cleaned + consolidated)
export function getLastCsvLines(remotePath, lineCount = 50) {
  return runSshCommand(`tail -n ${lineCount} "${remotePath}"`);
}

// ✅ Optional: Alias if you still use this name elsewhere
export const getTailContent = getLastCsvLines;