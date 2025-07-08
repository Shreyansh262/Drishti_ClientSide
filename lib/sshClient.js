import { Client } from "ssh2";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
if (typeof process !== 'undefined' && process.env) {
  dotenv.config();
}

// --- Global SSH Client and SFTP instances for reuse ---
let sshClientInstance = null;
let sftpClientInstance = null;
let connectionPromise = null; // To manage concurrent connection attempts

const baseSshConfig = {
  host: process.env.VM_HOST,
  port: 22, // Default SSH port
  username: process.env.VM_USER,
};

/**
 * Establishes and manages a single, reusable SSH connection.
 * Returns the connected SSH Client instance.
 */
async function connectSsh() {
  // Check if running in serverless environment
  if (typeof process === 'undefined' || !process.env.VM_HOST) {
    throw new Error('SSH configuration not available in current environment');
  }

  if (sshClientInstance && sshClientInstance._sock && sshClientInstance._sock.readyState === 'open') {
    console.log('DEBUG: Reusing existing SSH connection.');
    return sshClientInstance;
  }

  if (connectionPromise) {
    console.log('DEBUG: Waiting for existing connection promise to resolve.');
    return connectionPromise;
  }

  connectionPromise = new Promise((resolve, reject) => {
    let config;
    try {
      config = getSshConfigWithKey();
    } catch (err) {
      connectionPromise = null;
      return reject(err);
    }

    console.log('DEBUG: Establishing new SSH connection...');
    const conn = new Client();

    // Set timeout for connection
    const timeout = setTimeout(() => {
      conn.end();
      connectionPromise = null;
      reject(new Error('SSH connection timeout'));
    }, 15000); // 15 second timeout

    conn.on('ready', () => {
      clearTimeout(timeout);
      console.log('DEBUG: SSH Client ready. Getting SFTP subsystem...');
      conn.sftp((err, sftp) => {
        if (err) {
          console.error('SFTP error:', err);
          conn.end();
          connectionPromise = null;
          return reject(err);
        }
        sftpClientInstance = sftp;
        sshClientInstance = conn;
        connectionPromise = null;
        resolve(conn);
      });
    }).on('error', (err) => {
      clearTimeout(timeout);
      console.error('SSH connection error:', err);
      sshClientInstance = null;
      sftpClientInstance = null;
      connectionPromise = null;
      reject(err);
    }).on('end', () => {
      clearTimeout(timeout);
      console.log('DEBUG: SSH connection ended.');
      sshClientInstance = null;
      sftpClientInstance = null;
      connectionPromise = null;
    }).on('close', () => {
      clearTimeout(timeout);
      console.log('DEBUG: SSH connection closed.');
      sshClientInstance = null;
      sftpClientInstance = null;
      connectionPromise = null;
    }).connect({ ...config, retries: 2, retry_delay: 5000 });
  });

  return connectionPromise;
}

/**
 * Helper to get SSH config, prioritizing VM_PRIVATE_KEY_CONTENT.
 */
function getSshConfigWithKey() {
  let privateKeyContent;
  const vmKeyPath = process.env.VM_KEY_PATH;
  const vmPrivateKeyContent = process.env.VM_PRIVATE_KEY_CONTENT;

  if (vmPrivateKeyContent) {
    console.log('DEBUG: Using SSH private key from VM_PRIVATE_KEY_CONTENT env var.');
    privateKeyContent = vmPrivateKeyContent;
  } else if (vmKeyPath) {
    try {
      const resolvedKeyPath = path.resolve(vmKeyPath);
      console.log('DEBUG: Attempting to read private key from file:', resolvedKeyPath);
      privateKeyContent = fs.readFileSync(resolvedKeyPath, 'utf8');
    } catch (readErr) {
      console.error(`ERROR: Failed to read SSH private key from ${vmKeyPath}:`, readErr.message);
      throw new Error(`SSH key file read error: ${readErr.message}`);
    }
  } else {
    throw new Error("Neither VM_KEY_PATH nor VM_PRIVATE_KEY_CONTENT environment variable is set.");
  }

  if (!baseSshConfig.host || !baseSshConfig.username) {
    throw new Error("VM_HOST and VM_USER environment variables must be set.");
  }

  return {
    ...baseSshConfig,
    privateKey: privateKeyContent,
    readyTimeout: 20000
  };
}

/**
 * Runs a command over SSH using the persistent connection.
 */
export function runSshCommand(command) {
  return new Promise(async (resolve, reject) => {
    try {
      const conn = await connectSsh();
      conn.exec(command, (err, stream) => {
        if (err) {
          console.error(`SSH command execution setup error for "${command}":`, err);
          return reject(err);
        }

        let output = "";
        let stderrOutput = "";
        let exitCode = null;

        stream.on("data", (data) => {
          output += data.toString();
        }).on("stderr", (data) => {
          stderrOutput += data.toString();
          console.error(`SSH stderr for "${command}": ${data.toString()}`);
        }).on("close", (code, signal) => {
          exitCode = code;
          if (exitCode !== 0 || stderrOutput) {
            const errorMsg = `Command "${command}" failed. Exit Code: ${exitCode || 'N/A'}. Stderr: ${stderrOutput || 'None'}`;
            console.error(`SSH command execution error: ${errorMsg}`);
            return reject(new Error(errorMsg));
          }
          resolve(output);
        });
      });
    } catch (connErr) {
      console.error("Failed to connect for SSH command:", connErr);
      reject(connErr);
    }
  });
}

/**
 * Reads the last 'numLines' from a remote file over SFTP.
 */
export function getTailContent(remotePath, numLines) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!sftpClientInstance) {
        await connectSsh();
        if (!sftpClientInstance) {
          throw new Error("SFTP client not initialized after connection attempt.");
        }
      }

      const fileSize = await new Promise((res, rej) => {
        sftpClientInstance.stat(remotePath, (err, stats) => {
          if (err) return rej(err);
          res(stats.size);
        });
      });

      const readSize = Math.min(fileSize, 50 * 1024);
      const buffer = Buffer.alloc(readSize);
      const fd = await new Promise((res, rej) => {
        sftpClientInstance.open(remotePath, 'r', (err, handle) => {
          if (err) return rej(err);
          res(handle);
        });
      });

      const readBytes = await new Promise((res, rej) => {
        sftpClientInstance.read(fd, buffer, 0, readSize, fileSize - readSize, (err, bytesRead, buf) => {
          if (err) return rej(err);
          res(bytesRead);
        });
      });

      await new Promise((res, rej) => {
        sftpClientInstance.close(fd, (err) => {
          if (err) return rej(err);
          res();
        });
      });

      const content = buffer.toString('utf8', 0, readBytes);
      const lines = content.split('\n');
      resolve(lines.slice(-numLines).join('\n'));

    } catch (err) {
      console.error(`SFTP getTailContent error for ${remotePath}:`, err);
      reject(err);
    }
  });
}

/**
 * Reads the entire content of a remote file over SFTP.
 */
export function getFileContent(remotePath) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!sftpClientInstance) {
        await connectSsh();
        if (!sftpClientInstance) {
          throw new Error("SFTP client not initialized after connection attempt.");
        }
      }

      let data = "";
      const stream = sftpClientInstance.createReadStream(remotePath);

      stream.on("data", (chunk) => {
        data += chunk.toString();
      });

      stream.on("end", () => {
        resolve(data);
      });

      stream.on("error", (err) => {
        console.error(`SFTP getFileContent error for ${remotePath}:`, err);
        reject(err);
      });
    } catch (err) {
      console.error("SFTP client initialization error for getFileContent:", err);
      reject(err);
    }
  });
}

/**
 * Appends content to a remote file over SSH command.
 */
export function appendToFile(remotePath, content) {
  return runSshCommand(`echo '${content.replace(/'/g, `'\\''`)}' >> ${remotePath}`);
}

/**
 * Explicitly disconnect.
 */
export function disconnectSsh() {
  if (sshClientInstance) {
    console.log('DEBUG: Explicitly ending SSH connection.');
    sshClientInstance.end();
    sshClientInstance = null;
    sftpClientInstance = null;
    connectionPromise = null;
  }
}

export const getLastCsvLines = getTailContent;