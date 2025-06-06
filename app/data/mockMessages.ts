import { Message } from '@/app/components/messages/MessageFeed';

// Generate mock messages with different priorities and timestamps
const now = new Date();
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

export const mockMessages: Message[] = [
  {
    id: '1',
    title: 'Race Start Delayed',
    content: 'The race start has been delayed by 30 minutes due to weather conditions. Please stay in the starting area for updates.',
    timestamp: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
    priority: 'critical',
    isRead: false,
    category: 'race-update'
  },
  {
    id: '2',
    title: 'Water Station Update',
    content: 'Water station at kilometer 15 is now operational. Additional electrolyte drinks have been added.',
    timestamp: oneHourAgo,
    priority: 'normal',
    isRead: false,
    category: 'course-update'
  },
  {
    id: '3',
    title: 'Parking Information',
    content: 'Limited parking available at the main venue. Consider using public transportation or carpooling.',
    timestamp: threeHoursAgo,
    priority: 'low',
    isRead: true,
    category: 'logistics'
  },
  {
    id: '4',
    title: 'Course Modification',
    content: 'Due to construction, the course has been slightly modified between kilometers 8 and 9. Follow the new signage.',
    timestamp: new Date(yesterday.setHours(14, 30)),
    priority: 'high',
    isRead: true,
    category: 'course-update'
  },
  {
    id: '5',
    title: 'Welcome to RunAlert!',
    content: 'Thank you for using RunAlert for your race updates. You will receive important notifications here during the event.',
    timestamp: twoDaysAgo,
    priority: 'low',
    isRead: true,
    category: 'system'
  },
  {
    id: '6',
    title: 'Emergency Evacuation Plan',
    content: 'In case of emergency, follow the instructions of race officials and proceed to the nearest assembly point marked on your race bib.',
    timestamp: new Date(now.getTime() - 10 * 60 * 1000), // 10 minutes ago
    priority: 'critical',
    isRead: false,
    category: 'safety'
  },
  {
    id: '7',
    title: 'Post-Race Party',
    content: 'Join us at the finish line area for live music, food trucks, and awards ceremony starting at 2 PM.',
    timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
    priority: 'low',
    isRead: false,
    category: 'social'
  }
];

export const mockCategories = [
  { id: 'all', name: 'All Messages', count: mockMessages.length },
  { 
    id: 'race-update', 
    name: 'Race Updates', 
    count: mockMessages.filter(m => m.category === 'race-update').length 
  },
  { 
    id: 'course-update', 
    name: 'Course Updates', 
    count: mockMessages.filter(m => m.category === 'course-update').length 
  },
  { 
    id: 'safety', 
    name: 'Safety Alerts', 
    count: mockMessages.filter(m => m.category === 'safety').length 
  },
  { 
    id: 'logistics', 
    name: 'Logistics', 
    count: mockMessages.filter(m => m.category === 'logistics').length 
  },
  { 
    id: 'social', 
    name: 'Social Events', 
    count: mockMessages.filter(m => m.category === 'social').length 
  },
];
