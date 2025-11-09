import CryptoJS from 'crypto-js'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production'

export function encryptPrivateKey(privateKey: string): string {
  return CryptoJS.AES.encrypt(privateKey, ENCRYPTION_KEY).toString()
}

export function decryptPrivateKey(encryptedKey: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedKey, ENCRYPTION_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}
