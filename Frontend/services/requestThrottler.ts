// Global request throttling service to prevent excessive API calls
class RequestThrottler {
  private requestCounts = new Map<string, number>();
  private lastRequestTimes = new Map<string, number>();
  private readonly MAX_REQUESTS_PER_MINUTE = 30;
  private readonly MIN_REQUEST_INTERVAL = 2000; // 2 seconds minimum between requests

  canMakeRequest(endpoint: string): boolean {
    const now = Date.now();
    const lastRequestTime = this.lastRequestTimes.get(endpoint) || 0;
    const requestCount = this.requestCounts.get(endpoint) || 0;

    // Check if enough time has passed since last request
    if (now - lastRequestTime < this.MIN_REQUEST_INTERVAL) {
      return false;
    }

    // Check if we've exceeded the rate limit
    if (requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      return false;
    }

    return true;
  }

  recordRequest(endpoint: string): void {
    const now = Date.now();
    const requestCount = this.requestCounts.get(endpoint) || 0;
    
    this.requestCounts.set(endpoint, requestCount + 1);
    this.lastRequestTimes.set(endpoint, now);

    // Reset counter every minute
    setTimeout(() => {
      this.requestCounts.set(endpoint, Math.max(0, requestCount - 1));
    }, 60000);
  }

  getWaitTime(endpoint: string): number {
    const now = Date.now();
    const lastRequestTime = this.lastRequestTimes.get(endpoint) || 0;
    const timeSinceLastRequest = now - lastRequestTime;
    
    return Math.max(0, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest);
  }

  // Clear all throttling data (useful for testing or reset)
  clear(): void {
    this.requestCounts.clear();
    this.lastRequestTimes.clear();
  }
}

export const requestThrottler = new RequestThrottler();
