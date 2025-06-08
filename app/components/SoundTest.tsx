'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { soundService } from '@/app/services/soundService';

export function SoundTest() {
  const [lastPlayed, setLastPlayed] = useState<string>('none');

  const testSound = (priority: 'info' | 'warning' | 'critical' | 'announcement') => {
    soundService.playSound(priority);
    setLastPlayed(priority);
  };

  return (
    <div className="p-4 border rounded-lg mb-4">
      <h3 className="text-lg font-medium mb-2">Sound Test Panel</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        Click buttons to test notification sounds. Last played: <span className="font-bold">{lastPlayed}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          onClick={() => testSound('info')}
          className="bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/50"
        >
          Test Info Sound
        </Button>
        <Button 
          variant="outline" 
          onClick={() => testSound('warning')}
          className="bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-800/50"
        >
          Test Warning Sound
        </Button>
        <Button 
          variant="outline" 
          onClick={() => testSound('critical')}
          className="bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/50"
        >
          Test Critical Sound
        </Button>
        <Button 
          variant="outline" 
          onClick={() => testSound('announcement')}
          className="bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-800/50"
        >
          Test Announcement Sound
        </Button>
      </div>
    </div>
  );
}
