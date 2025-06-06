import { Info, Bell, AlertTriangle, AlertOctagon } from 'lucide-react';
import React from 'react';

export type MessageType = 'info' | 'normal' | 'high' | 'critical';

interface MessageTypeIconProps {
  type: MessageType;
  size?: number;
  className?: string;
  ariaLabel?: string;
  color?: string;
}

export const messageTypeMeta = {
  info: {
    icon: Info,
    color: '#3B82F6', // blue-500
    label: 'Information',
  },
  normal: {
    icon: Bell,
    color: '#2563EB', // blue-600
    label: 'General',
  },
  high: {
    icon: AlertTriangle,
    color: '#F59E0B', // amber-500
    label: 'High Priority',
  },
  critical: {
    icon: AlertOctagon,
    color: '#EF4444', // red-500
    label: 'Critical',
  },
};

export default function MessageTypeIcon({ type, size = 20, className = '', ariaLabel, color }: MessageTypeIconProps) {
  const meta = messageTypeMeta[type] || messageTypeMeta.normal;
  const Icon = meta.icon;
  return (
    <Icon
      size={size}
      className={className}
      style={{ color: color || meta.color }}
      aria-label={ariaLabel || meta.label}
      aria-hidden={!ariaLabel}
      focusable={false}
    />
  );
}
