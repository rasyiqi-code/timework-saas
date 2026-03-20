'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { RefreshCw } from 'lucide-react';
import { syncSubscriptionAction } from '@/actions/subscription';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function RefreshButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const result = await syncSubscriptionAction();
      if (result.success) {
        toast.success(`Subscription status updated: ${result.status}`);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to sync subscription');
      }
    } catch {
        toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleRefresh} 
      disabled={loading}
      className="gap-2"
    >
      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Refreshing...' : 'Refresh Status'}
    </Button>
  );
}
