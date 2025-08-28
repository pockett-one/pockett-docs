// User data interface
export interface UserData {
  firstName: string
  lastName: string
  email: string
  organization: string
  initials: string
}

// LocalStorage keys
const USER_DATA_KEY = 'pockett_user_data'
const AUTH_SESSION_KEY = 'pockett_auth_session'

// Save user data to localStorage
export const saveUserData = (userData: Omit<UserData, 'initials'>): void => {
  try {
    // Set default organization if not provided
    const organizationName = userData.organization || `${userData.firstName}'s Organization`
    
    const userWithInitials: UserData = {
      ...userData,
      organization: organizationName,
      initials: generateInitials(userData.firstName, userData.lastName)
    }
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userWithInitials))
  } catch (error) {
    console.error('Failed to save user data:', error)
  }
}

// Get user data from localStorage
export const getUserData = (): UserData | null => {
  try {
    const data = localStorage.getItem(USER_DATA_KEY)
    if (!data) return null
    return JSON.parse(data) as UserData
  } catch (error) {
    console.error('Failed to get user data:', error)
    return null
  }
}

// Authentication session management (separate from user profile data)
export const setAuthSession = (isAuthenticated: boolean): void => {
  try {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ isAuthenticated, timestamp: Date.now() }))
  } catch (error) {
    console.error('Failed to set auth session:', error)
  }
}

export const getAuthSession = (): boolean => {
  try {
    const data = localStorage.getItem(AUTH_SESSION_KEY)
    if (!data) return false
    const session = JSON.parse(data)
    return session.isAuthenticated
  } catch (error) {
    console.error('Failed to get auth session:', error)
    return false
  }
}

export const clearAuthSession = (): void => {
  try {
    localStorage.removeItem(AUTH_SESSION_KEY)
    // Note: We deliberately keep user data for returning users
  } catch (error) {
    console.error('Failed to clear auth session:', error)
  }
}

// Legacy function - now only clears auth session, keeps user data
export const clearUserData = (): void => {
  clearAuthSession()
}

// Generate initials from first and last name
export const generateInitials = (firstName: string, lastName: string): string => {
  const first = firstName.trim().charAt(0).toUpperCase()
  const last = lastName.trim().charAt(0).toUpperCase()
  return `${first}${last}`
}

// Default user data for cases where none exists
export const getDefaultUserData = (): UserData => ({
  firstName: "Demo",
  lastName: "User",
  email: "demo@example.com",
  organization: "Demo's Organization",
  initials: "DU"
})