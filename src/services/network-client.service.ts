/**
 * Network Client Service
 * Single Responsibility: Handle HTTP requests with rate limiting
 */

import { INetworkClient } from '../interfaces/content-interfaces.js';

export class NetworkClientService implements INetworkClient {
  private requestCount = 0;
  private lastRequestTime = 0;
  private readonly maxRequestsPerMinute = 30;
  private readonly requestWindow = 60000; // 1 minute

  async fetch(url: string): Promise<string> {
    // Rate limiting
    await this.waitForRateLimit();
    
    this.requestCount++;
    this.lastRequestTime = Date.now();

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      console.error(`Network request failed for ${url}:`, error);
      throw error;
    }
  }

  isRateLimited(): boolean {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // Reset counter if window has passed
    if (timeSinceLastRequest > this.requestWindow) {
      this.requestCount = 0;
    }
    
    return this.requestCount >= this.maxRequestsPerMinute;
  }

  async waitForRateLimit(): Promise<void> {
    if (this.isRateLimited()) {
      const waitTime = this.requestWindow - (Date.now() - this.lastRequestTime);
      if (waitTime > 0) {
        console.log(`⏳ Rate limiting: waiting ${Math.ceil(waitTime / 1000)}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
}