import { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

export default function Button({ 
  variant = 'primary', 
  size = 'md', 
  icon, 
  iconPosition = 'left', 
  loading, 
  fullWidth, 
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary text-on-primary hover:bg-[#3d554f]',
    secondary: 'bg-secondary-container text-on-secondary-fixed hover:bg-secondary-fixed',
    ghost: 'bg-transparent text-primary hover:bg-primary-fixed/20',
    destructive: 'bg-error text-white hover:bg-red-800'
  };
  
  const sizes = {
    sm: 'text-body-sm px-4 py-2 rounded-xl gap-2',
    md: 'text-body-lg px-6 py-3 rounded-full gap-2',
    lg: 'text-title-md px-8 py-4 rounded-full gap-3'
  };

  return (
    <button 
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
      ) : icon && iconPosition === 'left' ? (
        <span className="material-symbols-outlined">{icon}</span>
      ) : null}
      
      {children}
      
      {!loading && icon && iconPosition === 'right' && (
        <span className="material-symbols-outlined">{icon}</span>
      )}
    </button>
  );
}
