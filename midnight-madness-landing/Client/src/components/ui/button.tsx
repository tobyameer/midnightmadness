import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold tracking-wide ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_0_25px_rgba(210,58,31,0.35)] hover:bg-[hsl(var(--accent))] hover:shadow-[0_0_35px_rgba(255,76,36,0.4)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-[hsl(var(--destructive))]",
        outline:
          "border border-border bg-transparent text-foreground hover:border-[hsl(var(--accent))] hover:bg-[rgba(255,76,36,0.12)]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[rgba(255,76,36,0.08)]",
        ghost: "hover:bg-[rgba(255,76,36,0.12)] hover:text-[hsl(var(--accent))]",
        link: "text-[hsl(var(--accent))] underline-offset-4 hover:underline",
        premium:
          "bg-primary text-primary-foreground shadow-[0_0_35px_rgba(210,58,31,0.45)] hover:bg-[hsl(var(--accent))] hover:shadow-[0_0_45px_rgba(255,76,36,0.55)] font-semibold uppercase tracking-widest",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
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
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
