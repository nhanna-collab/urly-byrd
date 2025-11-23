interface CountdownQtyProps {
  maxClicksAllowed: number;
  currentClicks: number;
  size?: "sm" | "md" | "lg";
}

export default function CountdownQty({ maxClicksAllowed, currentClicks, size = "md" }: CountdownQtyProps) {
  // Ensure values are valid numbers
  const maxClicks = typeof maxClicksAllowed === 'number' && !isNaN(maxClicksAllowed) ? Math.max(0, maxClicksAllowed) : 0;
  const clicks = typeof currentClicks === 'number' && !isNaN(currentClicks) ? Math.max(0, currentClicks) : 0;
  
  const remaining = maxClicks - clicks;
  const isSoldOut = remaining <= 0 || maxClicks === 0;
  const isLowStock = maxClicks > 0 && remaining <= Math.ceil(maxClicks * 0.1); // 10% or less remaining

  const sizeClasses = {
    sm: "text-lg",
    md: "text-3xl md:text-4xl",
    lg: "text-4xl md:text-5xl",
  };

  const labelClasses = {
    sm: "text-xs",
    md: "text-xs",
    lg: "text-sm",
  };

  if (isSoldOut) {
    return (
      <div className="text-muted-foreground font-semibold">
        SOLD OUT
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center gap-1 font-mono font-black ${sizeClasses[size]} ${
        isLowStock ? "animate-pulse text-destructive" : "text-foreground"
      }`}
      role="status"
      aria-live="polite"
      data-testid="countdown-qty"
    >
      <div className="flex items-baseline gap-2">
        <span className="text-primary" data-testid="qty-remaining">{remaining}</span>
        <span className={`${labelClasses[size]} font-medium text-muted-foreground`}>left of</span>
        <span className="text-muted-foreground" data-testid="qty-total">{maxClicks}</span>
      </div>
      <span className={`${labelClasses[size]} font-medium text-muted-foreground uppercase tracking-wide`}>
        {isLowStock ? "Almost Gone!" : "Available"}
      </span>
    </div>
  );
}
