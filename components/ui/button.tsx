import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background active:opacity-95 min-h-[44px] touch-manipulation sm:min-h-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow active:shadow-sm",
        secondary: "bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80",
        outline: "border border-input bg-background hover:bg-muted/50 hover:border-foreground/15",
        ghost: "hover:bg-muted/60 hover:text-foreground",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
      },
      size: {
        default: "h-10 px-4 py-2 sm:min-h-[40px]",
        sm: "h-9 rounded-lg px-3 sm:min-h-[36px]",
        lg: "h-11 rounded-lg px-8 sm:min-h-[44px]",
        icon: "h-10 w-10 min-w-[44px] sm:min-h-[40px] sm:min-w-[40px]"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
