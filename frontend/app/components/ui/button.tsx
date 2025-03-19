import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-[#151515] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#151515] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-[#151515] dark:focus-visible:ring-gray-300",
  {
    variants: {
      variant: {
        default: "bg-[#232323] text-gray-50 hover:bg-[#2c2c2c]/90",
        destructive:
          "bg-red-500 text-gray-50 hover:bg-red-500/90",
        outline:
          "border border-[#151515] bg-transparent hover:bg-[#232323] hover:text-gray-50",
        secondary:
          "bg-gray-800 text-gray-50 hover:bg-gray-800/80",
        ghost: "hover:bg-gray-800 hover:text-gray-50",
        link: "text-gray-50 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8 w-full",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants } 