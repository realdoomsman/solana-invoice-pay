'use client'

import { useMemo } from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Payment {
  id: string
  amount: number
  token: string
  status: string
  createdAt: string
  type?: string
}

interface AnalyticsProps {
  payments: Payment[]
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']

export default function PaymentAnalytics({ payments }: AnalyticsProps) {
  const analytics = useMemo(() => {
    // Daily volume
    const dailyData = payments.reduce((acc, p) => {
      const date = new Date(p.createdAt).toLocaleDateString()
      if (!acc[date]) acc[date] = { date, amount: 0, count: 0 }
      acc[date].amount += p.amount
      acc[date].count += 1
      return acc
    }, {} as Record<string, any>)

    // Payment types
    const typeData = payments.reduce((acc, p) => {
      const type = p.type || 'simple'
      if (!acc[type]) acc[type] = { name: type, value: 0 }
      acc[type].value += 1
      return acc
    }, {} as Record<string, any>)

    // Status breakdown
    const statusData = payments.reduce((acc, p) => {
      if (!acc[p.status]) acc[p.status] = { name: p.status, value: 0 }
      acc[p.status].value += 1
      return acc
    }, {} as Record<string, any>)

    return {
      daily: Object.values(dailyData).slice(-7),
      types: Object.values(typeData),
      status: Object.values(statusData),
    }
  }, [payments])

  if (payments.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        No payment data yet. Start accepting payments to see analytics!
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Daily Volume Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Daily Payment Volume (Last 7 Days)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics.daily}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="amount" stroke="#3b82f6" name="Amount (SOL)" />
            <Line type="monotone" dataKey="count" stroke="#8b5cf6" name="Count" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Payment Types */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Payment Types
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={analytics.types}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.types.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Payment Status
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics.status}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
