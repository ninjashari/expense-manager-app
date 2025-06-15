/**
 * Currency Conversion Module
 * 
 * This module handles currency exchange rate fetching and conversion with
 * advanced caching, error handling, retry logic, and fallback mechanisms.
 * It provides reliable currency conversion for multi-currency expense tracking.
 */

import { LRUCache } from 'lru-cache';

// Enhanced cache configuration with longer TTL and larger capacity
const cache = new LRUCache<string, number>({
  max: 500, // Increased cache size for better performance
  ttl: 1000 * 60 * 60 * 12, // 12 hours TTL (reduced from 24h for more accurate rates)
});

// Fallback exchange rates for common currency pairs (updated periodically)
const FALLBACK_RATES: Record<string, number> = {
  'USD-EUR': 0.85,
  'EUR-USD': 1.18,
  'USD-GBP': 0.73,
  'GBP-USD': 1.37,
  'USD-JPY': 110.0,
  'JPY-USD': 0.009,
  'USD-INR': 74.5,
  'INR-USD': 0.013,
  'EUR-GBP': 0.86,
  'GBP-EUR': 1.16,
  // Add more common pairs as needed
};

/**
 * Fetches exchange rate with retry logic and exponential backoff
 * @param base - Base currency code
 * @param target - Target currency code
 * @param retryCount - Current retry attempt (internal use)
 * @returns Promise<number> - Exchange rate or fallback rate
 */
export async function getExchangeRate(
  base: string, 
  target: string, 
  retryCount: number = 0
): Promise<number> {
  // Return 1 for same currency conversion
  if (base === target) {
    return 1;
  }

  const cacheKey = `${base}-${target}`;
  
  // Check cache first
  const cachedRate = cache.get(cacheKey);
  if (cachedRate !== undefined) {
    return cachedRate;
  }

  const apiKey = process.env.EXCHANGERATE_API_KEY;
  
  // If no API key, use fallback rates or return 1
  if (!apiKey) {
    console.warn("ExchangeRate-API key not found. Using fallback rates.");
    const fallbackRate = FALLBACK_RATES[cacheKey] || FALLBACK_RATES[`${target}-${base}`];
    if (fallbackRate) {
      // If we have reverse rate, calculate the inverse
      const rate = FALLBACK_RATES[cacheKey] || (1 / fallbackRate);
      cache.set(cacheKey, rate);
      return rate;
    }
    return 1; // Ultimate fallback
  }

  const url = `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${base}/${target}`;
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second base delay

  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ExpenseManager/1.0',
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data || typeof data.conversion_rate !== 'number') {
      throw new Error('Invalid response format from exchange rate API');
    }

    const rate = data.conversion_rate;

    // Validate rate is reasonable (between 0.0001 and 10000)
    if (rate <= 0 || rate > 10000 || rate < 0.0001) {
      throw new Error(`Unreasonable exchange rate received: ${rate}`);
    }

    // Cache the successful result
    cache.set(cacheKey, rate);
    
    // Also cache the reverse rate for efficiency
    cache.set(`${target}-${base}`, 1 / rate);
    
    return rate;

  } catch (error) {
    console.error(`Error fetching exchange rate (${base} -> ${target}):`, error);

    // Implement retry logic with exponential backoff
    if (retryCount < maxRetries) {
      const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
      console.log(`Retrying exchange rate fetch in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return getExchangeRate(base, target, retryCount + 1);
    }

    // After all retries failed, try fallback rates
    const fallbackRate = FALLBACK_RATES[cacheKey];
    if (fallbackRate) {
      console.warn(`Using fallback rate for ${base} -> ${target}: ${fallbackRate}`);
      cache.set(cacheKey, fallbackRate);
      return fallbackRate;
    }

    // Try reverse fallback rate
    const reverseFallbackRate = FALLBACK_RATES[`${target}-${base}`];
    if (reverseFallbackRate) {
      const rate = 1 / reverseFallbackRate;
      console.warn(`Using reverse fallback rate for ${base} -> ${target}: ${rate}`);
      cache.set(cacheKey, rate);
      return rate;
    }

    // Ultimate fallback - return 1 and log the issue
    console.error(`No exchange rate available for ${base} -> ${target}, using rate of 1`);
    return 1;
  }
}

/**
 * Converts an amount from one currency to another
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code
 * @returns Promise<number> - Converted amount
 */
export async function convertCurrency(
  amount: number, 
  fromCurrency: string, 
  toCurrency: string
): Promise<number> {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Invalid amount for currency conversion');
  }

  const rate = await getExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
}

/**
 * Gets multiple exchange rates in a single batch (more efficient)
 * @param baseCurrency - Base currency for all conversions
 * @param targetCurrencies - Array of target currencies
 * @returns Promise<Record<string, number>> - Object with currency codes as keys and rates as values
 */
export async function getBatchExchangeRates(
  baseCurrency: string, 
  targetCurrencies: string[]
): Promise<Record<string, number>> {
  const rates: Record<string, number> = {};
  
  // Process all rate requests concurrently
  const ratePromises = targetCurrencies.map(async (targetCurrency) => {
    const rate = await getExchangeRate(baseCurrency, targetCurrency);
    return { currency: targetCurrency, rate };
  });

  const results = await Promise.allSettled(ratePromises);
  
  results.forEach((result, index) => {
    const targetCurrency = targetCurrencies[index];
    if (result.status === 'fulfilled') {
      rates[targetCurrency] = result.value.rate;
    } else {
      console.error(`Failed to get rate for ${baseCurrency} -> ${targetCurrency}:`, result.reason);
      rates[targetCurrency] = 1; // Fallback rate
    }
  });

  return rates;
}

/**
 * Clears the exchange rate cache (useful for testing or forced refresh)
 */
export function clearExchangeRateCache(): void {
  cache.clear();
  console.log('Exchange rate cache cleared');
}

/**
 * Gets cache statistics for monitoring
 * @returns Object with cache statistics
 */
export function getCacheStats() {
  return {
    size: cache.size,
    max: cache.max,
    ttl: cache.ttl,
    calculatedSize: cache.calculatedSize,
  };
}

/**
 * Preloads common exchange rates for better performance
 * @param baseCurrency - Base currency to preload rates for
 * @param commonCurrencies - Array of commonly used currencies
 */
export async function preloadExchangeRates(
  baseCurrency: string, 
  commonCurrencies: string[] = ['USD', 'EUR', 'GBP', 'JPY', 'INR']
): Promise<void> {
  console.log(`Preloading exchange rates for ${baseCurrency}...`);
  
  try {
    await getBatchExchangeRates(baseCurrency, commonCurrencies);
    console.log(`Successfully preloaded ${commonCurrencies.length} exchange rates`);
  } catch (error) {
    console.error('Failed to preload exchange rates:', error);
  }
} 