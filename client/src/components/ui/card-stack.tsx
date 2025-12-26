import { cn } from "@/lib/utils";
import React from "react";

interface CardStackProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardStack({ className, children, ...props }: CardStackProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      {children}
    </div>
  );
}

export function Card({ className, children, ...props }: CardStackProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
