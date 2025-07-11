import React from 'react';
import { cn } from '../../lib/utils';

interface BubbleButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'selected';
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BubbleButton: React.FC<BubbleButtonProps> = ({
  children,
  onClick,
  variant = 'outline',
  disabled = false,
  className,
  size = 'md',
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100";
  
  const variantStyles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500",
    outline: "border-2 border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-600 focus:ring-blue-500",
    selected: "bg-blue-100 border-2 border-blue-500 text-blue-700 hover:bg-blue-200 focus:ring-blue-500",
  };
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </button>
  );
}; 