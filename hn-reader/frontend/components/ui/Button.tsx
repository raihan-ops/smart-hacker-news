import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}

interface ButtonProps
  extends BaseProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> {}

interface ButtonLinkProps extends BaseProps {
  href: string;
  ariaLabel?: string;
}

function cn(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function getButtonClasses(variant: ButtonVariant, size: ButtonSize, fullWidth?: boolean, className?: string) {
  return cn(
    'ui-btn inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--brand)]',
    'disabled:cursor-not-allowed disabled:opacity-50',
    variant === 'primary' && 'bg-[var(--brand)] text-white hover:bg-[var(--brand-600)] shadow-sm',
    variant === 'secondary' && 'bg-[var(--surface-raised)] text-slate-900 hover:bg-[var(--surface-muted)]',
    variant === 'outline' && 'border border-[var(--border-strong)] bg-white text-slate-800 hover:bg-slate-50',
    variant === 'ghost' && 'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900',
    size === 'sm' && 'h-8 px-3 text-sm',
    size === 'md' && 'h-10 px-4 text-sm',
    size === 'lg' && 'h-12 px-5 text-base',
    fullWidth && 'w-full',
    className,
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={getButtonClasses(variant, size, fullWidth, className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  children,
  ariaLabel,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={getButtonClasses(variant, size, fullWidth, className)}
    >
      {children}
    </Link>
  );
}
