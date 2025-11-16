import { EscrowType } from '@/lib/escrow/types'
import MultiSigWalletBadge from './MultiSigWalletBadge'

interface EscrowPartyInfoProps {
  type: EscrowType
  buyerWallet: string
  sellerWallet: string
  buyerAmount?: number
  sellerAmount?: number
  swapAssetBuyer?: string
  swapAssetSeller?: string
  token: string
  currentUserWallet?: string
}

export default function EscrowPartyInfo({
  type,
  buyerWallet,
  sellerWallet,
  buyerAmount,
  sellerAmount,
  swapAssetBuyer,
  swapAssetSeller,
  token,
  currentUserWallet
}: EscrowPartyInfoProps) {
  const isBuyer = currentUserWallet === buyerWallet
  const isSeller = currentUserWallet === sellerWallet

  const getPartyLabel = (role: 'buyer' | 'seller') => {
    if (type === 'atomic_swap') {
      return role === 'buyer' ? 'Party A' : 'Party B'
    }
    return role === 'buyer' ? 'Buyer' : 'Seller'
  }

  const formatWallet = (wallet: string) => {
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Buyer/Party A */}
      <div className={`bg-slate-900 rounded-xl p-6 border ${isBuyer ? 'border-blue-600' : 'border-slate-800'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-slate-400 text-sm font-semibold">
            {getPartyLabel('buyer')}
          </div>
          {isBuyer && (
            <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-semibold">
              You
            </span>
          )}
        </div>
        
        <div className="font-mono text-sm text-white break-all mb-3">
          {buyerWallet}
        </div>
        
        {/* Multi-Sig Badge */}
        <div className="mb-3">
          <MultiSigWalletBadge 
            walletAddress={buyerWallet} 
            showDetails={true}
          />
        </div>
        
        {type === 'atomic_swap' && swapAssetBuyer && buyerAmount && (
          <div className="pt-3 border-t border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Sending</div>
            <div className="text-lg font-bold text-white">
              {buyerAmount} {swapAssetBuyer}
            </div>
          </div>
        )}
        
        {type === 'traditional' && buyerAmount && (
          <div className="pt-3 border-t border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Payment Amount</div>
            <div className="text-lg font-bold text-white">
              {buyerAmount} {token}
            </div>
          </div>
        )}
        
        {type === 'simple_buyer' && buyerAmount && (
          <div className="pt-3 border-t border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Total Budget</div>
            <div className="text-lg font-bold text-white">
              {buyerAmount} {token}
            </div>
          </div>
        )}
      </div>

      {/* Seller/Party B */}
      <div className={`bg-slate-900 rounded-xl p-6 border ${isSeller ? 'border-purple-600' : 'border-slate-800'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-slate-400 text-sm font-semibold">
            {getPartyLabel('seller')}
          </div>
          {isSeller && (
            <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full font-semibold">
              You
            </span>
          )}
        </div>
        
        <div className="font-mono text-sm text-white break-all mb-3">
          {sellerWallet}
        </div>
        
        {/* Multi-Sig Badge */}
        <div className="mb-3">
          <MultiSigWalletBadge 
            walletAddress={sellerWallet} 
            showDetails={true}
          />
        </div>
        
        {type === 'atomic_swap' && swapAssetSeller && sellerAmount && (
          <div className="pt-3 border-t border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Sending</div>
            <div className="text-lg font-bold text-white">
              {sellerAmount} {swapAssetSeller}
            </div>
          </div>
        )}
        
        {type === 'traditional' && sellerAmount && (
          <div className="pt-3 border-t border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Security Deposit</div>
            <div className="text-lg font-bold text-white">
              {sellerAmount} {token}
            </div>
          </div>
        )}
        
        {type === 'simple_buyer' && buyerAmount && (
          <div className="pt-3 border-t border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Will Receive</div>
            <div className="text-lg font-bold text-white">
              Up to {buyerAmount} {token}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
