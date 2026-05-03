const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5

const attempts = new Map<string, { count: number; resetAt: number }>()

export const RATELIMIT = {
  async check(ip: string): Promise<boolean> {
    const now = Date.now()
    const record = attempts.get(ip)
    
    if (!record || now > record.resetAt) {
      attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
      return true
    }
    
    if (record.count >= MAX_ATTEMPTS) {
      return false
    }
    
    record.count++
    return true
  },
  
  async getRemainingAttempts(ip: string): Promise<number> {
    const record = attempts.get(ip)
    if (!record || Date.now() > record.resetAt) return MAX_ATTEMPTS
    return Math.max(0, MAX_ATTEMPTS - record.count)
  }
}
