import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex max-w-full items-center justify-center gap-2 whitespace-nowrap text-ui font-medium tracking-[0.01em] transition-[background-color,color,border-color] duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-deep/35 aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        default: 'bg-ink text-white hover:bg-deep',
        sage: 'bg-sage-90 text-white hover:bg-sage-80',
        paper: 'bg-white text-ink hover:bg-mist',
        outline: 'border border-slate-40 bg-transparent text-ink hover:border-ink hover:bg-mist',
        'outline-light': 'border border-white/45 bg-transparent text-white hover:border-white hover:bg-white/12',
        ghost: 'text-ink hover:bg-mist-60',
        link: 'text-deep underline-offset-4 hover:text-deep-80 hover:underline',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-sage-80',
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
