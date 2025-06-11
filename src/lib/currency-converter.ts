import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, number>({
  max: 100,
  ttl: 1000 * 60 * 60 * 24, // 24 hours
});

export async function getExchangeRate(base: string, target: string): Promise<number> {
  if (base === target) {
    return 1;
  }

  const cacheKey = `${base}-${target}`;
  const cachedRate = cache.get(cacheKey);
  if (cachedRate !== undefined) {
    return cachedRate;
  }

  const apiKey = process.env.EXCHANGERATE_API_KEY;
  if (!apiKey) {
    // In a real app, you might want to have a fallback or a more robust error handling
    console.warn("ExchangeRate-API key not found. Using fallback rate of 1.");
    return 1;
  }

  const url = `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${base}/${target}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate');
    }
    const data = await response.json();
    const rate = data.conversion_rate;

    if (rate) {
      cache.set(cacheKey, rate);
    }
    
    return rate || 1;
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    return 1; // Fallback rate
  }
} 