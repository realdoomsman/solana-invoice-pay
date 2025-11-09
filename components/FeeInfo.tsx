export default function FeeInfo() {
  const feePercentage = process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE || '0'
  
  if (parseFloat(feePercentage) === 0) {
    return null
  }

  return (
    <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
      <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
        Platform fee: {feePercentage}% • Instant settlement • Secure on Solana
      </p>
    </div>
  )
}
