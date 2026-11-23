import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex max-w-full cursor-pointer items-center justify-center gap-2 rounded-[7px] whitespace-nowrap text-ui font-medium tracking-[0.01em] transition-[background-color,color,border-color,box-shadow,transform] duration-250 ease-[var(--ease-brand)] active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-deep/35 aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        default:
          'border border-btn-primary bg-btn-primary text-white shadow-xs hover:border-btn-primary-hover hover:bg-btn-primary-hover hover:shadow-sm active:border-btn-primary-active active:bg-btn-primary-active',
        sage: 'border border-white/15 bg-btn-accent text-white shadow-xs hover:border-white/25 hover:bg-btn-accent-hover hover:shadow-sm active:bg-btn-accent-active',
        paper:
          'border border-white bg-paper text-ink shadow-sm hover:border-haze-40 hover:bg-haze-20 hover:text-ink active:bg-mist',
        haze: 'border border-haze/55 bg-haze/18 text-white backdrop-blur-[2px] hover:border-white hover:bg-paper hover:text-ink active:bg-mist',
        outline:
          'border border-ink/25 bg-paper text-ink shadow-2xs hover:border-btn-primary hover:bg-btn-primary hover:text-white active:bg-btn-primary-active',
        'outline-light':
          'border border-white/45 bg-white/10 text-white backdrop-blur-[2px] hover:border-white hover:bg-paper hover:text-ink active:bg-mist',
        ghost:
          'border border-transparent bg-transparent text-ink-80 hover:border-slate-20 hover:bg-mist hover:text-ink',
        link: 'text-deep underline-offset-4 hover:text-btn-primary hover:underline',
        destructive:
          'border border-destructive bg-destructive text-destructive-foreground shadow-2xs hover:border-sage-80 hover:bg-sage-80',
      },
      size: {
        default: 'h-10 px-5 py-2 has-[>svg]:px-4',
        sm: 'h-8 px-3.5 text-small has-[>svg]:px-3',
        lg: 'h-12 px-7 text-ui has-[>svg]:px-6',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
