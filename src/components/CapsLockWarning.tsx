import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface CapsLockWarningProps {
  show: boolean;
}

export const CapsLockWarning: React.FC<CapsLockWarningProps> = ({ show }) => {
  if (!show) return null;

  return (
    <div className="caps-warning">
      <AlertTriangle size={16} />
      <span>Caps Lock is ON</span>
    </div>
  );
};
