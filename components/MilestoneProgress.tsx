'use client'

interface Milestone {
  id: string
  description: string
  percentage: number
  amount: number
  status: string
  milestone_order: number
}

interface MilestoneProgressProps {
  milestones: Milestone[]
  token: string
}

export default function MilestoneProgress({ milestones, token }: MilestoneProgressProps) {
  // Calculate progress statistics
  const totalMilestones = milestones.length
  const completedMilestones = milestones.filter(m => m.status === 'released').length
  const pendingMilestones = milestones.filter(m => m.status === 'pending').length
  const submittedMilestones = milestones.filter(m => m.status === 'work_submitted').length
  const disputedMilestones = milestones.filter(m => m.status === 'disputed').length

  const completedPercentage = milestones
    .filter(m => m.status === 'released')
    .reduce((sum, m) => sum + m.percentage, 0)

  const releasedAmount = milestones
    .filter(m => m.status === 'released')
    .reduce((sum, m) => sum + m.amount, 0)

  const totalAmount = milestones.reduce((sum, m) => sum + m.amount, 0)
  const remainingAmount = totalAmount - releasedAmount

  return (
    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
      <h3 className="text-lg font-bold text-white mb-4">Milestone Progress</h3>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-400">Overall Completion</span>
          <span className="text-sm font-semibold text-white">{completedPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
            style={{ width: `${completedPercentage}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">Completed</div>
          <div className="text-white text-xl font-bold">{completedMilestones}/{totalMilestones}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">Pending</div>
          <div className="text-yellow-400 text-xl font-bold">{pendingMilestones}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">In Review</div>
          <div className="text-blue-400 text-xl font-bold">{submittedMilestones}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="text-slate-400 text-xs mb-1">Disputed</div>
          <div className="text-red-400 text-xl font-bold">{disputedMilestones}</div>
        </div>
      </div>

      {/* Amount Summary */}
      <div className="border-t border-slate-800 pt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-400">Released</span>
          <span className="text-sm font-semibold text-green-400">
            {releasedAmount.toFixed(4)} {token}
          </span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-400">Remaining</span>
          <span className="text-sm font-semibold text-slate-300">
            {remainingAmount.toFixed(4)} {token}
          </span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-slate-800">
          <span className="text-sm font-semibold text-white">Total</span>
          <span className="text-sm font-bold text-white">
            {totalAmount.toFixed(4)} {token}
          </span>
        </div>
      </div>

      {/* Status Message */}
      {completedMilestones === totalMilestones ? (
        <div className="mt-4 p-3 bg-green-900/20 border border-green-800 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-lg"></span>
            <span className="text-sm text-green-400 font-medium">
              All milestones completed!
            </span>
          </div>
        </div>
      ) : submittedMilestones > 0 ? (
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 text-lg"></span>
            <span className="text-sm text-blue-400">
              {submittedMilestones} milestone{submittedMilestones > 1 ? 's' : ''} awaiting review
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-4 p-3 bg-slate-800 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-lg">...</span>
            <span className="text-sm text-slate-400">
              {pendingMilestones} milestone{pendingMilestones > 1 ? 's' : ''} in progress
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
