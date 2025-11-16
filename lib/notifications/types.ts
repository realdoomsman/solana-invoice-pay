// Notification types and interfaces

export type NotificationType = 
  | 'deposit'
  | 'work_submission'
  | 'approval'
  | 'dispute'
  | 'timeout'
  | 'release'
  | 'refund'

export type NotificationFrequency = 'immediate' | 'hourly' | 'daily'

export interface NotificationPreferences {
  id?: string
  userWallet: string
  
  // In-app notifications
  inAppEnabled: boolean
  inAppDeposits: boolean
  inAppWorkSubmissions: boolean
  inAppApprovals: boolean
  inAppDisputes: boolean
  inAppTimeouts: boolean
  inAppReleases: boolean
  inAppRefunds: boolean
  
  // Browser notifications
  browserEnabled: boolean
  browserDeposits: boolean
  browserWorkSubmissions: boolean
  browserApprovals: boolean
  browserDisputes: boolean
  browserTimeouts: boolean
  browserReleases: boolean
  browserRefunds: boolean
  
  // Email notifications
  emailEnabled: boolean
  emailAddress?: string
  emailDeposits: boolean
  emailWorkSubmissions: boolean
  emailApprovals: boolean
  emailDisputes: boolean
  emailTimeouts: boolean
  emailReleases: boolean
  emailRefunds: boolean
  
  // Frequency settings
  notificationFrequency: NotificationFrequency
  quietHoursEnabled: boolean
  quietHoursStart?: string
  quietHoursEnd?: string
  
  createdAt?: string
  updatedAt?: string
}

export interface Notification {
  id: string
  userWallet: string
  escrowId?: string
  notificationType: NotificationType
  title: string
  message: string
  link?: string
  metadata?: Record<string, any>
  
  inAppDelivered: boolean
  browserDelivered: boolean
  emailDelivered: boolean
  
  readAt?: string
  createdAt: string
  deliveredAt?: string
}

export interface NotificationPreferencesUpdate {
  inAppEnabled?: boolean
  inAppDeposits?: boolean
  inAppWorkSubmissions?: boolean
  inAppApprovals?: boolean
  inAppDisputes?: boolean
  inAppTimeouts?: boolean
  inAppReleases?: boolean
  inAppRefunds?: boolean
  
  browserEnabled?: boolean
  browserDeposits?: boolean
  browserWorkSubmissions?: boolean
  browserApprovals?: boolean
  browserDisputes?: boolean
  browserTimeouts?: boolean
  browserReleases?: boolean
  browserRefunds?: boolean
  
  emailEnabled?: boolean
  emailAddress?: string
  emailDeposits?: boolean
  emailWorkSubmissions?: boolean
  emailApprovals?: boolean
  emailDisputes?: boolean
  emailTimeouts?: boolean
  emailReleases?: boolean
  emailRefunds?: boolean
  
  notificationFrequency?: NotificationFrequency
  quietHoursEnabled?: boolean
  quietHoursStart?: string
  quietHoursEnd?: string
}

// Default preferences for new users
export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<NotificationPreferences, 'userWallet'> = {
  inAppEnabled: true,
  inAppDeposits: true,
  inAppWorkSubmissions: true,
  inAppApprovals: true,
  inAppDisputes: true,
  inAppTimeouts: true,
  inAppReleases: true,
  inAppRefunds: true,
  
  browserEnabled: false,
  browserDeposits: true,
  browserWorkSubmissions: true,
  browserApprovals: true,
  browserDisputes: true,
  browserTimeouts: true,
  browserReleases: true,
  browserRefunds: true,
  
  emailEnabled: false,
  emailDeposits: false,
  emailWorkSubmissions: false,
  emailApprovals: false,
  emailDisputes: true,
  emailTimeouts: true,
  emailReleases: true,
  emailRefunds: true,
  
  notificationFrequency: 'immediate',
  quietHoursEnabled: false,
}
