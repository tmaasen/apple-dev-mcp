/**
 * PerformanceMonitorService
 * 
 * Monitors and optimizes Crawlee-based content extraction performance
 * to ensure efficient resource usage and optimal extraction times.
 */

export interface PerformanceMetrics {
  extractionTime: number; // milliseconds
  memoryUsage: number; // bytes
  cpuUsage: number; // percentage
  networkRequests: number;
  cacheHitRate: number; // percentage
  throughput: number; // sections per minute
  errorRate: number; // percentage
}

export interface PerformanceThresholds {
  maxExtractionTime: number; // ms
  maxMemoryUsage: number; // bytes
  maxCpuUsage: number; // percentage
  minCacheHitRate: number; // percentage
  minThroughput: number; // sections per minute
  maxErrorRate: number; // percentage
}

export interface OptimizationRecommendation {
  category: 'memory' | 'cpu' | 'network' | 'cache' | 'concurrency';
  priority: 'high' | 'medium' | 'low';
  description: string;
  action: string;
  expectedImprovement: string;
}

export class PerformanceMonitorService {
  private metrics: PerformanceMetrics[] = [];
  private thresholds: PerformanceThresholds;
  private startTime: number = 0;
  private sectionCount: number = 0;
  private networkRequestCount: number = 0;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  private errors: number = 0;

  constructor(customThresholds?: Partial<PerformanceThresholds>) {
    this.thresholds = {
      maxExtractionTime: 10000, // 10 seconds per section
      maxMemoryUsage: 1024 * 1024 * 1024, // 1GB
      maxCpuUsage: 80, // 80%
      minCacheHitRate: 60, // 60%
      minThroughput: 10, // 10 sections per minute
      maxErrorRate: 5, // 5%
      ...customThresholds
    };

    console.log('[PerformanceMonitor] Initialized with performance monitoring');
  }

  /**
   * Start monitoring a content generation session
   */
  startSession(): void {
    this.startTime = Date.now();
    this.sectionCount = 0;
    this.networkRequestCount = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.errors = 0;
    
    console.log('[PerformanceMonitor] Performance monitoring session started');
  }

  /**
   * Record metrics for a single section extraction
   */
  recordExtraction(extractionTime: number, fromCache: boolean, hadError: boolean = false): void {
    this.sectionCount++;
    this.networkRequestCount += fromCache ? 0 : 1;
    
    if (fromCache) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }
    
    if (hadError) {
      this.errors++;
    }

    const memoryUsage = process.memoryUsage();
    const currentMetrics: PerformanceMetrics = {
      extractionTime,
      memoryUsage: memoryUsage.heapUsed,
      cpuUsage: process.cpuUsage ? this.calculateCpuUsage() : 0,
      networkRequests: this.networkRequestCount,
      cacheHitRate: this.calculateCacheHitRate(),
      throughput: this.calculateThroughput(),
      errorRate: this.calculateErrorRate()
    };

    this.metrics.push(currentMetrics);

    // Log performance warnings
    this.checkPerformanceThresholds(currentMetrics);
  }

  /**
   * End monitoring session and generate report
   */
  endSession(): string {
    const sessionDuration = Date.now() - this.startTime;
    const averageMetrics = this.calculateAverageMetrics();
    const recommendations = this.generateOptimizationRecommendations(averageMetrics);
    
    return this.generatePerformanceReport(sessionDuration, averageMetrics, recommendations);
  }

  /**
   * Get real-time performance status
   */
  getCurrentStatus(): PerformanceMetrics {
    if (this.metrics.length === 0) {
      return {
        extractionTime: 0,
        memoryUsage: process.memoryUsage().heapUsed,
        cpuUsage: 0,
        networkRequests: 0,
        cacheHitRate: 0,
        throughput: 0,
        errorRate: 0
      };
    }

    return this.metrics[this.metrics.length - 1];
  }

  /**
   * Generate optimization recommendations
   */
  generateOptimizationRecommendations(metrics: PerformanceMetrics): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Memory optimization
    if (metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
      recommendations.push({
        category: 'memory',
        priority: 'high',
        description: 'High memory usage detected',
        action: 'Reduce batch size and implement more aggressive content cleanup',
        expectedImprovement: '30-50% memory reduction'
      });
    }

    // CPU optimization
    if (metrics.cpuUsage > this.thresholds.maxCpuUsage) {
      recommendations.push({
        category: 'cpu',
        priority: 'high',
        description: 'High CPU usage detected',
        action: 'Reduce concurrency and add delays between operations',
        expectedImprovement: '20-40% CPU reduction'
      });
    }

    // Cache optimization
    if (metrics.cacheHitRate < this.thresholds.minCacheHitRate) {
      recommendations.push({
        category: 'cache',
        priority: 'medium',
        description: 'Low cache hit rate affecting performance',
        action: 'Increase cache TTL and implement smarter caching strategies',
        expectedImprovement: '2-3x throughput improvement'
      });
    }

    // Throughput optimization
    if (metrics.throughput < this.thresholds.minThroughput) {
      recommendations.push({
        category: 'concurrency',
        priority: 'medium',
        description: 'Low throughput detected',
        action: 'Optimize extraction selectors and increase concurrency if resources allow',
        expectedImprovement: '50-100% throughput increase'
      });
    }

    // Network optimization
    if (metrics.errorRate > this.thresholds.maxErrorRate) {
      recommendations.push({
        category: 'network',
        priority: 'high',
        description: 'High error rate affecting reliability',
        action: 'Implement better retry logic and error handling',
        expectedImprovement: 'Improved reliability and success rate'
      });
    }

    return recommendations;
  }

  // Private helper methods

  private calculateCpuUsage(): number {
    // Simple CPU usage calculation (approximate)
    const cpuUsage = process.cpuUsage();
    return (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to percentage approximation
  }

  private calculateCacheHitRate(): number {
    const totalRequests = this.cacheHits + this.cacheMisses;
    return totalRequests > 0 ? (this.cacheHits / totalRequests) * 100 : 0;
  }

  private calculateThroughput(): number {
    const elapsedMinutes = (Date.now() - this.startTime) / 60000;
    return elapsedMinutes > 0 ? this.sectionCount / elapsedMinutes : 0;
  }

  private calculateErrorRate(): number {
    return this.sectionCount > 0 ? (this.errors / this.sectionCount) * 100 : 0;
  }

  private calculateAverageMetrics(): PerformanceMetrics {
    if (this.metrics.length === 0) {
      return this.getCurrentStatus();
    }

    const sum = this.metrics.reduce((acc, metric) => ({
      extractionTime: acc.extractionTime + metric.extractionTime,
      memoryUsage: acc.memoryUsage + metric.memoryUsage,
      cpuUsage: acc.cpuUsage + metric.cpuUsage,
      networkRequests: acc.networkRequests + metric.networkRequests,
      cacheHitRate: acc.cacheHitRate + metric.cacheHitRate,
      throughput: acc.throughput + metric.throughput,
      errorRate: acc.errorRate + metric.errorRate
    }), {
      extractionTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      networkRequests: 0,
      cacheHitRate: 0,
      throughput: 0,
      errorRate: 0
    });

    const count = this.metrics.length;
    return {
      extractionTime: sum.extractionTime / count,
      memoryUsage: sum.memoryUsage / count,
      cpuUsage: sum.cpuUsage / count,
      networkRequests: sum.networkRequests / count,
      cacheHitRate: sum.cacheHitRate / count,
      throughput: sum.throughput / count,
      errorRate: sum.errorRate / count
    };
  }

  private checkPerformanceThresholds(metrics: PerformanceMetrics): void {
    if (metrics.extractionTime > this.thresholds.maxExtractionTime) {
      console.warn(`[PerformanceMonitor] Slow extraction detected: ${metrics.extractionTime}ms (threshold: ${this.thresholds.maxExtractionTime}ms)`);
    }

    if (metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
      console.warn(`[PerformanceMonitor] High memory usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
    }

    if (metrics.cacheHitRate < this.thresholds.minCacheHitRate) {
      console.warn(`[PerformanceMonitor] Low cache hit rate: ${metrics.cacheHitRate.toFixed(1)}%`);
    }
  }

  private generatePerformanceReport(
    sessionDuration: number,
    averageMetrics: PerformanceMetrics,
    recommendations: OptimizationRecommendation[]
  ): string {
    const sessionMinutes = sessionDuration / 60000;
    
    let report = `
⚡ Performance Monitoring Report
================================

📊 Session Summary:
   • Duration: ${sessionMinutes.toFixed(2)} minutes
   • Sections Processed: ${this.sectionCount}
   • Network Requests: ${this.networkRequestCount}
   • Cache Hits: ${this.cacheHits}
   • Cache Misses: ${this.cacheMisses}
   • Errors: ${this.errors}

📈 Average Performance Metrics:
   • Extraction Time: ${averageMetrics.extractionTime.toFixed(0)}ms per section
   • Memory Usage: ${(averageMetrics.memoryUsage / 1024 / 1024).toFixed(2)}MB
   • CPU Usage: ${averageMetrics.cpuUsage.toFixed(1)}%
   • Cache Hit Rate: ${averageMetrics.cacheHitRate.toFixed(1)}%
   • Throughput: ${averageMetrics.throughput.toFixed(1)} sections/minute
   • Error Rate: ${averageMetrics.errorRate.toFixed(1)}%

`;

    // Performance status
    const overallStatus = this.assessOverallPerformance(averageMetrics);
    report += `🎯 Overall Performance: ${overallStatus}\n\n`;

    // Recommendations
    if (recommendations.length > 0) {
      report += `💡 Optimization Recommendations:\n`;
      
      const highPriority = recommendations.filter(r => r.priority === 'high');
      const mediumPriority = recommendations.filter(r => r.priority === 'medium');
      const lowPriority = recommendations.filter(r => r.priority === 'low');

      if (highPriority.length > 0) {
        report += `\n🚨 High Priority:\n`;
        highPriority.forEach(rec => {
          report += `   • ${rec.description}\n`;
          report += `     Action: ${rec.action}\n`;
          report += `     Expected: ${rec.expectedImprovement}\n\n`;
        });
      }

      if (mediumPriority.length > 0) {
        report += `⚠️ Medium Priority:\n`;
        mediumPriority.forEach(rec => {
          report += `   • ${rec.description}\n`;
          report += `     Action: ${rec.action}\n`;
          report += `     Expected: ${rec.expectedImprovement}\n\n`;
        });
      }

      if (lowPriority.length > 0) {
        report += `ℹ️ Low Priority:\n`;
        lowPriority.forEach(rec => {
          report += `   • ${rec.description}\n`;
          report += `     Action: ${rec.action}\n`;
          report += `     Expected: ${rec.expectedImprovement}\n\n`;
        });
      }
    } else {
      report += `✅ No optimization recommendations - performance is within acceptable thresholds.\n\n`;
    }

    // Resource efficiency
    const resourceEfficiency = this.calculateResourceEfficiency(averageMetrics);
    report += `🔋 Resource Efficiency: ${resourceEfficiency}\n`;
    
    return report;
  }

  private assessOverallPerformance(metrics: PerformanceMetrics): string {
    let score = 100;
    
    if (metrics.extractionTime > this.thresholds.maxExtractionTime) score -= 20;
    if (metrics.memoryUsage > this.thresholds.maxMemoryUsage) score -= 25;
    if (metrics.cpuUsage > this.thresholds.maxCpuUsage) score -= 20;
    if (metrics.cacheHitRate < this.thresholds.minCacheHitRate) score -= 15;
    if (metrics.throughput < this.thresholds.minThroughput) score -= 10;
    if (metrics.errorRate > this.thresholds.maxErrorRate) score -= 10;

    if (score >= 90) return '🟢 Excellent';
    if (score >= 75) return '🟡 Good';
    if (score >= 60) return '🟠 Fair';
    return '🔴 Needs Improvement';
  }

  private calculateResourceEfficiency(metrics: PerformanceMetrics): string {
    // Simple efficiency calculation based on throughput vs resource usage
    const memoryEfficiency = metrics.throughput / (metrics.memoryUsage / 1024 / 1024);
    const cpuEfficiency = metrics.throughput / Math.max(metrics.cpuUsage, 1);
    
    const overallEfficiency = (memoryEfficiency + cpuEfficiency) / 2;
    
    if (overallEfficiency > 1.0) return '🟢 Highly Efficient';
    if (overallEfficiency > 0.5) return '🟡 Moderately Efficient';
    return '🔴 Low Efficiency';
  }
}