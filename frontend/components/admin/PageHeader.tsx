import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  className?: string;
  children?: ReactNode; // Action buttons
}

export function PageHeader({ 
  title, 
  description, 
  icon: Icon,
  className, 
  children 
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 md:py-8", className)}>
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          {Icon && <Icon className="h-8 w-8 text-primary/80" />}
          {title}
        </h1>
        {description && (
          <p className="text-base text-muted-foreground max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}
