import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || process.env.AUTH_SECRET
  if (!key) {
    throw new Error("ENCRYPTION_KEY or AUTH_SECRET must be set for encryption")
  }
  return crypto.createHash("sha256").update(key).digest()
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv)
  let ciphertext = cipher.update(plaintext, "utf8", "hex")
  ciphertext += cipher.final("hex")
  const tag = cipher.getAuthTag().toString("hex")
  return `${iv.toString("hex")}:${tag}:${ciphertext}`
}

export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(":")
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format")
  }
  const [ivHex, tagHex, encrypted] = parts
  const iv = Buffer.from(ivHex, "hex")
  const tag = Buffer.from(tagHex, "hex")
  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv)
  decipher.setAuthTag(tag)
  let plaintext = decipher.update(encrypted, "hex", "utf8")
  plaintext += decipher.final("utf8")
  return plaintext
}

export function isEncrypted(value: string): boolean {
  return /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/.test(value)
}
