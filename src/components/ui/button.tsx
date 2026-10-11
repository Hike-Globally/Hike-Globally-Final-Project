import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex max-w-full items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-[background-color,color,box-shadow,transform] duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:ring-destructive/40 active:translate-y-px",
  {
    variants: {
      variant: {
        default: 'bg-deep text-primary-foreground hover:bg-deep-90 shadow-sm',
        sage: 'bg-sage text-ink hover:bg-sage/85',
        outline: 'border border-ink/15 bg-transparent text-ink hover:bg-mist-60',
        'outline-light': 'border border-white/30 bg-transparent text-white hover:bg-white/10',
        ghost: 'text-ink hover:bg-mist-60',
        link: 'text-deep underline-offset-4 hover:underline',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        default: 'h-10 px-5 py-2 has-[>svg]:px-4',
        sm: 'h-8 px-3.5 text-[0.8125rem] has-[>svg]:px-3',
        lg: 'h-12 px-7 text-base has-[>svg]:px-6',
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
