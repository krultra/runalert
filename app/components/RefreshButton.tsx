'use client';

import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type RefreshButtonProps = {
  className?: string;
};

export function RefreshButton({ className }: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    
    // Option 1: Hard refresh the page
    window.location.reload();
    
    // Option 2: Soft refresh with Next.js router (uncomment if preferred)
    // router.refresh();
    // setTimeout(() => setIsRefreshing(false), 1000);
  };
  
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleRefresh}
      className={`flex items-center gap-1 ${className || ''}`}
      disabled={isRefreshing}
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      <span>Refresh</span>
    </Button>
  );
}
