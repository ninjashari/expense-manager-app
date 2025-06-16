/**
 * Performance Monitoring Utility
 * 
 * Comprehensive performance monitoring and optimization utilities for
 * tracking application metrics, identifying bottlenecks, and improving
 * user experience across the expense management application.
 */

import React from 'react';

// Performance metric types
export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface PageLoadMetrics {
  navigationStart: number;
  domContentLoaded: number;
  loadComplete: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  firstInputDelay?: number;
}

export interface APIMetrics extends Record<string, unknown> {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
  size?: number;
}

export interface ComponentMetrics extends Record<string, unknown> {
  componentName: string;
  renderTime: number;
  propsSize: number;
  timestamp: number;
}

// Web API type definitions
interface LargestContentfulPaint extends PerformanceEntry {
  element?: Element;
  url?: string;
}

interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

/**
 * Performance Monitor Class
 * 
 * Central performance monitoring system that tracks various metrics
 * and provides insights for optimization opportunities.
 */
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private isEnabled: boolean = true;

  constructor() {
    this.initializeObservers();
  }

  /**
   * Initialize performance observers for Web Vitals and other metrics
   */
  private initializeObservers(): void {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    this.observeMetric('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1] as LargestContentfulPaint;
      this.recordMetric('LCP', lastEntry.startTime, {
        element: lastEntry.element?.tagName,
        url: lastEntry.url,
      });
    });

    // First Input Delay (FID)
    this.observeMetric('first-input', (entries) => {
      entries.forEach((entry) => {
        const fidEntry = entry as PerformanceEventTiming;
        this.recordMetric('FID', fidEntry.processingStart - fidEntry.startTime, {
          eventType: fidEntry.name,
          target: (fidEntry.target as Element)?.tagName,
        });
      });
    });

    // Cumulative Layout Shift (CLS)
    this.observeMetric('layout-shift', (entries) => {
      let clsValue = 0;
      entries.forEach((entry) => {
        const clsEntry = entry as LayoutShift;
        if (!clsEntry.hadRecentInput) {
          clsValue += clsEntry.value;
        }
      });
      if (clsValue > 0) {
        this.recordMetric('CLS', clsValue);
      }
    });

    // Navigation timing
    this.observeNavigationTiming();
  }

  /**
   * Observe specific performance metrics
   */
  private observeMetric(type: string, callback: (entries: PerformanceEntry[]) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ type, buffered: true });
      this.observers.set(type, observer);
    } catch (error) {
      console.warn(`Failed to observe ${type}:`, error);
    }
  }

  /**
   * Observe navigation timing metrics
   */
  private observeNavigationTiming(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        this.recordMetric('Navigation Start', navigation.fetchStart);
        this.recordMetric('DOM Content Loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
        this.recordMetric('Load Complete', navigation.loadEventEnd - navigation.fetchStart);
        this.recordMetric('DNS Lookup', navigation.domainLookupEnd - navigation.domainLookupStart);
        this.recordMetric('TCP Connection', navigation.connectEnd - navigation.connectStart);
        this.recordMetric('Server Response', navigation.responseEnd - navigation.requestStart);
        this.recordMetric('DOM Processing', navigation.domComplete - navigation.responseEnd);
      }
    });
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, metadata?: Record<string, unknown>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Log critical performance issues
    this.checkPerformanceThresholds(metric);
  }

  /**
   * Check performance thresholds and log warnings
   */
  private checkPerformanceThresholds(metric: PerformanceMetric): void {
    const thresholds = {
      'LCP': 2500, // 2.5 seconds
      'FID': 100,  // 100 milliseconds
      'CLS': 0.1,  // 0.1 cumulative score
      'API Response': 1000, // 1 second
      'Component Render': 16, // 16ms (60fps)
    };

    const threshold = thresholds[metric.name as keyof typeof thresholds];
    if (threshold && metric.value > threshold) {
      console.warn(`Performance threshold exceeded for ${metric.name}:`, {
        value: metric.value,
        threshold,
        metadata: metric.metadata,
      });
    }
  }

  /**
   * Track API call performance
   */
  trackAPICall(endpoint: string, method: string, startTime: number, status: number, size?: number): void {
    const duration = performance.now() - startTime;
    
    this.recordMetric('API Response', duration, {
      endpoint,
      method,
      status,
      size,
    });

    // Track API-specific metrics
    const apiMetric: APIMetrics = {
      endpoint,
      method,
      duration,
      status,
      timestamp: Date.now(),
      size,
    };

    this.recordMetric(`API ${method} ${endpoint}`, duration, apiMetric);
  }

  /**
   * Track component render performance
   */
  trackComponentRender(componentName: string, renderTime: number, propsSize: number = 0): void {
    this.recordMetric('Component Render', renderTime, {
      componentName,
      propsSize,
    });

    const componentMetric: ComponentMetrics = {
      componentName,
      renderTime,
      propsSize,
      timestamp: Date.now(),
    };

    this.recordMetric(`Component ${componentName}`, renderTime, componentMetric);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    totalMetrics: number;
    averagePageLoad: number;
    averageAPIResponse: number;
    slowestAPIs: APIMetrics[];
    slowestComponents: ComponentMetrics[];
    webVitals: {
      lcp?: number;
      fid?: number;
      cls?: number;
    };
  } {
    const apiMetrics = this.metrics.filter(m => m.name === 'API Response');
    const componentMetrics = this.metrics.filter(m => m.name === 'Component Render');
    const pageLoadMetrics = this.metrics.filter(m => m.name === 'Load Complete');

    const averagePageLoad = pageLoadMetrics.length > 0
      ? pageLoadMetrics.reduce((sum, m) => sum + m.value, 0) / pageLoadMetrics.length
      : 0;

    const averageAPIResponse = apiMetrics.length > 0
      ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length
      : 0;

    const slowestAPIs = apiMetrics
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map(m => m.metadata as APIMetrics)
      .filter(Boolean);

    const slowestComponents = componentMetrics
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map(m => m.metadata as ComponentMetrics)
      .filter(Boolean);

    const lcpMetric = this.metrics.find(m => m.name === 'LCP');
    const fidMetric = this.metrics.find(m => m.name === 'FID');
    const clsMetric = this.metrics.find(m => m.name === 'CLS');

    return {
      totalMetrics: this.metrics.length,
      averagePageLoad,
      averageAPIResponse,
      slowestAPIs,
      slowestComponents,
      webVitals: {
        lcp: lcpMetric?.value,
        fid: fidMetric?.value,
        cls: clsMetric?.value,
      },
    };
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Enable/disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Cleanup observers
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Performance measurement decorator for functions
 */
export function measurePerformance(name: string) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const startTime = performance.now();
      try {
        const result = await originalMethod.apply(this, args);
        const endTime = performance.now();
        performanceMonitor.recordMetric(name, endTime - startTime);
        return result;
      } catch (error) {
        const endTime = performance.now();
        performanceMonitor.recordMetric(`${name} (Error)`, endTime - startTime);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * React hook for component performance tracking
 */
export function usePerformanceTracking(componentName: string) {
  const startTime = performance.now();

  React.useEffect(() => {
    const endTime = performance.now();
    performanceMonitor.trackComponentRender(componentName, endTime - startTime);
  });

  return {
    trackRender: (renderStartTime: number) => {
      const renderEndTime = performance.now();
      performanceMonitor.trackComponentRender(componentName, renderEndTime - renderStartTime);
    },
  };
}

/**
 * API call wrapper with performance tracking
 */
export async function trackedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const startTime = performance.now();
  const method = options.method || 'GET';

  try {
    const response = await fetch(url, options);
    const contentLength = response.headers.get('content-length');
    const size = contentLength ? parseInt(contentLength, 10) : undefined;

    performanceMonitor.trackAPICall(url, method, startTime, response.status, size);
    
    return response;
  } catch (error) {
    performanceMonitor.trackAPICall(url, method, startTime, 0);
    throw error;
  }
}

/**
 * Memory usage monitoring
 */
export function getMemoryUsage(): {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
} {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as PerformanceWithMemory).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }
  return {};
}

/**
 * Bundle size analysis helper
 */
export function analyzeBundleSize(): void {
  if (typeof window === 'undefined') return;

  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));

  console.group('Bundle Size Analysis');
  
  scripts.forEach((script) => {
    const scriptElement = script as HTMLScriptElement;
    if (scriptElement.src) {
      console.log(`Script: ${scriptElement.src}`);
    }
  });

  stylesheets.forEach((link) => {
    const linkElement = link as HTMLLinkElement;
    if (linkElement.href) {
      console.log(`Stylesheet: ${linkElement.href}`);
    }
  });

  console.groupEnd();
}

// Type for performance with memory
interface PerformanceWithMemory extends Performance {
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
} 