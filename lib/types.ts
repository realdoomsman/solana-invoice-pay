export interface SplitRecipient {
  address: string
  percentage: number
  name?: string
}

export interface Milestone {
  id: string
  description: string
  percentage: number
  status: 'pending' | 'released' | 'disputed'
  releasedAt?: string
}

export interface PaymentData {
  id: string
  amount: number
  token: string
  description: string
  status: 'pending' | 'paid' | 'completed' | 'disputed'
  createdAt: string
  paymentWallet: string
  merchantWallet: string
  privateKey?: string
  txSignature?: string
  
  // Payment type
  type: 'simple' | 'split' | 'escrow' | 'goal'
  
  // Split payments
  splitRecipients?: SplitRecipient[]
  
  // NFT Receipt
  mintNFT?: boolean
  nftMinted?: boolean
  nftAddress?: string
  
  // Escrow
  escrowEnabled?: boolean
  milestones?: Milestone[]
  
  // Goal/Crowdfunding
  isGoal?: boolean
  goalAmount?: number
  currentAmount?: number
  contributors?: number
}

export interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes: {
    trait_type: string
    value: string | number
  }[]
}
