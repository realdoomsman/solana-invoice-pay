import { Keypair } from '@solana/web3.js'

export interface PaymentWalletData {
  publicKey: string
  privateKey: string // Base64 encoded - store securely in production!
}

export function generatePaymentWallet(): PaymentWalletData {
  const keypair = Keypair.generate()
  
  return {
    publicKey: keypair.publicKey.toString(),
    privateKey: Buffer.from(keypair.secretKey).toString('base64'),
  }
}

export function getKeypairFromPrivateKey(privateKey: string): Keypair {
  const secretKey = Uint8Array.from(Buffer.from(privateKey, 'base64'))
  return Keypair.fromSecretKey(secretKey)
}
