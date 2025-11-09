export interface User {
  walletAddress: string
  createdAt: string
}

export function saveUser(walletAddress: string): User {
  const user: User = {
    walletAddress,
    createdAt: new Date().toISOString(),
  }
  localStorage.setItem('currentUser', JSON.stringify(user))
  return user
}

export function getCurrentUser(): User | null {
  const stored = localStorage.getItem('currentUser')
  if (!stored) return null
  return JSON.parse(stored)
}

export function logout() {
  localStorage.removeItem('currentUser')
}

export function isLoggedIn(): boolean {
  return getCurrentUser() !== null
}
