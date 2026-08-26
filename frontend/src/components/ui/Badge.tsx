import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'neutral' | 'success' | 'warning';
}

export default function Badge({ children, variant = 'neutral' }: BadgeProps) {
  const variants = {
    primary: 'bg-primary-container text-on-primary-container',
    secondary: 'bg-secondary-container text-on-secondary-fixed',
    neutral: 'bg-surface-container-high text-on-surface-variant',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-label-caps font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}
