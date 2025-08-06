import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react';

interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

export function Notification({ type, title, message, onClose, autoClose = true, duration = 5000 }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useState(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  });

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error': return <X className="h-5 w-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default: return <Loader2 className="h-5 w-5 text-blue-600" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800';
      case 'error': return 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800';
      default: return 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800';
    }
  };

  return (
    <Card className={`${getBgColor()} animate-slide-up`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {getIcon()}
          <div className="flex-1">
            <h4 className="font-medium text-foreground">{title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{message}</p>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsVisible(false);
                onClose();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

interface ProgressIndicatorProps {
  current: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
}

export function ProgressIndicator({ current, total, label, showPercentage = true }: ProgressIndicatorProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{label}</span>
          {showPercentage && (
            <span className="text-sm text-muted-foreground">{percentage}%</span>
          )}
        </div>
      )}
      <Progress value={percentage} className="h-2" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{current} de {total}</span>
      </div>
    </div>
  );
}

interface ValidationFeedbackProps {
  field: string;
  value: any;
  rules: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
  };
}

export function ValidationFeedback({ field, value, rules }: ValidationFeedbackProps) {
  const [errors, setErrors] = useState<string[]>([]);

  useState(() => {
    const newErrors: string[] = [];

    if (rules.required && (!value || value.toString().trim() === '')) {
      newErrors.push(`${field} é obrigatório`);
    }

    if (value && rules.minLength && value.toString().length < rules.minLength) {
      newErrors.push(`${field} deve ter pelo menos ${rules.minLength} caracteres`);
    }

    if (value && rules.maxLength && value.toString().length > rules.maxLength) {
      newErrors.push(`${field} deve ter no máximo ${rules.maxLength} caracteres`);
    }

    if (value && rules.pattern && !rules.pattern.test(value.toString())) {
      newErrors.push(`${field} está em formato inválido`);
    }

    if (value && rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        newErrors.push(customError);
      }
    }

    setErrors(newErrors);
  });

  if (errors.length === 0) return null;

  return (
    <div className="mt-1 space-y-1">
      {errors.map((error, index) => (
        <p key={index} className="text-xs text-red-600 flex items-center space-x-1">
          <AlertTriangle className="h-3 w-3" />
          <span>{error}</span>
        </p>
      ))}
    </div>
  );
}

export function useNotifications() {
  const { toast } = useToast();

  const showSuccess = (title: string, message: string) => {
    toast({
      title,
      description: message,
      duration: 3000
    });
  };

  const showError = (title: string, message: string) => {
    toast({
      title,
      description: message,
      variant: 'destructive',
      duration: 5000
    });
  };

  const showWarning = (title: string, message: string) => {
    toast({
      title,
      description: message,
      duration: 4000
    });
  };

  const showInfo = (title: string, message: string) => {
    toast({
      title,
      description: message,
      duration: 3000
    });
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}