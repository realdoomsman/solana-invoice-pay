import { EscrowType } from '@/lib/escrow/types'

interface EscrowAmountDisplayProps {
  type: EscrowType
  buyerAmount: number
  sellerAmount?: number
  token: string
  swapAssetBuyer?: string
  swapAssetSeller?: string
  currentUserWallet?: string
  buyerWallet: string
  sellerWallet: string
}

export default function EscrowAmountDisplay({
  type,
  buyerAmount,
  sellerAmount,
  token,
  swapAssetBuyer,
  swapAssetSeller,
  currentUserWallet,
  buyerWallet,
  sellerWallet
}: EscrowAmountDisplayProps) {
  const isBuyer = currentUserWallet === buyerWallet
  const isSeller = currentUserWallet === sellerWallet

  if (type === 'atomic_swap') {
    return (
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
        <div className="text-slate-400 text-sm mb-3">Swap Details</div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className={`p-4 rounded-lg ${isBuyer ? 'bg-blue-900/20 border border-blue-800' : 'bg-slate-800'}`}>
            <div className="text-xs text-slate-500 mb-1">Party A Sends</div>
            <div className="text-2xl font-bold text-white">
              {buyerAmount} {swapAssetBuyer || token}
            </div>
            {isBuyer && (
              <div className="text-xs text-blue-400 mt-2">Your asset</div>
            )}
          </div>
          <div className={`p-4 rounded-lg ${isSeller ? 'bg-purple-900/20 border border-purple-800' : 'bg-slate-800'}`}>
            <div className="text-xs text-slate-500 mb-1">Party B Sends</div>
            <div className="text-2xl font-bold text-white">
              {sellerAmount} {swapAssetSeller || token}
            </div>
            {isSeller && (
              <div className="text-xs text-purple-400 mt-2">Your asset</div>
            )}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-800 text-center">
          <div className="text-sm text-slate-400">
            Assets will be exchanged atomically when both parties deposit
          </div>
        </div>
      </div>
    )
  }

  if (type === 'traditional') {
    const totalLocked = buyerAmount + (sellerAmount || 0)
    return (
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
        <div className="text-slate-400 text-sm mb-3">Escrow Amounts</div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className={`p-4 rounded-lg ${isBuyer ? 'bg-blue-900/20 border border-blue-800' : 'bg-slate-800'}`}>
            <div className="text-xs text-slate-500 mb-1">Buyer Payment</div>
            <div className="text-xl font-bold text-white">
              {buyerAmount} {token}
            </div>
            {isBuyer && (
              <div className="text-xs text-blue-400 mt-2">Your payment</div>
            )}
          </div>
          <div className={`p-4 rounded-lg ${isSeller ? 'bg-purple-900/20 border border-purple-800' : 'bg-slate-800'}`}>
            <div className="text-xs text-slate-500 mb-1">Seller Security</div>
            <div className="text-xl font-bold text-white">
              {sellerAmount || 0} {token}
            </div>
            {isSeller && (
              <div className="text-xs text-purple-400 mt-2">Your deposit</div>
            )}
          </div>
          <div className="p-4 rounded-lg bg-slate-800">
            <div className="text-xs text-slate-500 mb-1">Total Locked</div>
            <div className="text-xl font-bold text-green-400">
              {totalLocked} {token}
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-800 text-center">
          <div className="text-sm text-slate-400">
             Both parties must deposit before escrow becomes active
          </div>
        </div>
      </div>
    )
  }

  if (type === 'simple_buyer') {
    return (
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
        <div className="text-slate-400 text-sm mb-3">Project Budget</div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-white mb-2">
              {buyerAmount} {token}
            </div>
            <div className="text-sm text-slate-400">
              {isBuyer && 'Your budget'}
              {isSeller && 'Total available'}
              {!isBuyer && !isSeller && 'Total budget'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 mb-1">Payment Method</div>
            <div className="text-sm text-slate-300">Milestone-based</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-800 text-center">
          <div className="text-sm text-slate-400">
             Funds released as milestones are completed and approved
          </div>
        </div>
      </div>
    )
  }

  return null
}
