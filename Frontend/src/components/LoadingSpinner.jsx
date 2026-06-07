import { Loader2 } from 'lucide-react';

/**
 * LoadingSpinner — Animated spinner with size variants.
 * @param {'sm'|'md'|'lg'|'xl'} size
 */
const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
    xl: 'w-16 h-16',
  };

  return (
    <Loader2
      className={`animate-spin text-primary-500 ${sizeClasses[size]} ${className}`}
    />
  );
};

export default LoadingSpinner;
