/**
 * Utility to interact with Crediblemark API for subscription checks.
 */

export interface SubscriptionStatus {
  active: boolean;
  productName?: string;
  price?: number;
  currency?: string;
  interval?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

export async function checkSubscription(email: string): Promise<SubscriptionStatus> {
  const apiKey = process.env.CREDIBLEMARK_API_KEY;
  const productSlug = process.env.CREDIBLEMARK_PRODUCT_SLUG || 'timewok-visual-timeline-project-management';
  const apiUrl = process.env.CREDIBLEMARK_API_URL || 'https://crediblemark.com/api/v1';

  if (!apiKey) {
    console.error('CREDIBLEMARK_API_KEY is not set');
    return { active: false, error: 'API key not configured' };
  }

  try {
    const res = await fetch(`${apiUrl}/subscription/check?email=${email}&productSlug=${productSlug}`, {
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!res.ok) {
      console.error(`Crediblemark API error: ${res.status} ${res.statusText}`);
      return { active: false, error: `API error: ${res.status}` };
    }

    const data = await res.json();
    return {
      active: data.active === true,
      productName: data.productName,
      price: data.price,
      currency: data.currency,
      interval: data.interval,
      expiresAt: data.expiresAt,
      metadata: data.metadata,
    };
  } catch (error) {
    console.error('Failed to check subscription with Crediblemark:', error);
    return { active: false, error: 'Network error' };
  }
}
