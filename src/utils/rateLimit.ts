interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

class RateLimiter {
  private timestamps: number[] = [];
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async checkRateLimit(): Promise<boolean> {
    const now = Date.now();
    // Remove timestamps outside the window
    this.timestamps = this.timestamps.filter(
      (timestamp) => now - timestamp < this.config.windowMs
    );

    if (this.timestamps.length >= this.config.maxRequests) {
      return false;
    }

    this.timestamps.push(now);
    return true;
  }

  getTimeUntilReset(): number {
    if (this.timestamps.length === 0) return 0;
    const oldestTimestamp = Math.min(...this.timestamps);
    return Math.max(0, this.config.windowMs - (Date.now() - oldestTimestamp));
  }
}

export const apiRateLimiter = new RateLimiter({
  maxRequests: 5, // 5 requests
  windowMs: 60000, // per minute
});
