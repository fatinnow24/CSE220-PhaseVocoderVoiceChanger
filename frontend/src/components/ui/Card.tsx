import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'low' | 'high' | 'colored';
  color?: 'primary' | 'secondary' | 'surface';
  onClick?: () => void;
}

export default function Card({ children, className = '', variant = 'default', color = 'surface', onClick }: CardProps) {
  const baseClasses = 'rounded-3xl p-6 transition-all duration-300';
  let variantClasses = '';
  
  if (color === 'surface') {
    switch (variant) {
      case 'default': variantClasses = 'bg-surface-container-lowest shadow-card'; break;
      case 'low': variantClasses = 'bg-surface-container-low'; break;
      case 'high': variantClasses = 'bg-surface-container-high'; break;
      case 'colored': variantClasses = 'bg-surface-container shadow-card'; break;
    }
  } else if (color === 'primary') {
    variantClasses = 'bg-primary-container text-on-primary-container';
  } else if (color === 'secondary') {
    variantClasses = 'bg-secondary-container text-on-secondary-fixed';
  }

  const interactClasses = onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-active active:scale-95' : '';

  return (
    <div className={`${baseClasses} ${variantClasses} ${interactClasses} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
