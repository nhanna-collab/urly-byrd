import { useEffect, useState } from "react";

interface CountdownTimerProps {
  endDate: Date;
  size?: "sm" | "md" | "lg";
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export default function CountdownTimer({ endDate, size = "md" }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(
    calculateTimeRemaining(endDate)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(endDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  function calculateTimeRemaining(end: Date): TimeRemaining {
    const now = new Date().getTime();
    const endTime = end.getTime();
    const distance = endTime - now;

    if (distance < 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    return {
      days: Math.floor(distance / (1000 * 60 * 60 * 24)),
      hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((distance % (1000 * 60)) / 1000),
      isExpired: false,
    };
  }

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

  if (timeRemaining.isExpired) {
    return (
      <div className="text-muted-foreground font-semibold">
        Offer Expired
      </div>
    );
  }

  const isUrgent = timeRemaining.days === 0 && timeRemaining.hours < 1;

  return (
    <div
      className={`flex gap-2 md:gap-4 font-mono font-black ${sizeClasses[size]} ${
        isUrgent ? "animate-pulse text-destructive" : "text-foreground"
      }`}
      role="timer"
      aria-live="polite"
      data-testid="countdown-timer"
    >
      {timeRemaining.days > 0 && (
        <div className="flex flex-col items-center" data-testid="timer-days">
          <span>{String(timeRemaining.days).padStart(2, "0")}</span>
          <span className={`font-medium ${labelClasses[size]} text-muted-foreground`}>
            Days
          </span>
        </div>
      )}
      <div className="flex flex-col items-center" data-testid="timer-hours">
        <span>{String(timeRemaining.hours).padStart(2, "0")}</span>
        <span className={`font-medium ${labelClasses[size]} text-muted-foreground`}>
          Hours
        </span>
      </div>
      <span className="self-start">:</span>
      <div className="flex flex-col items-center" data-testid="timer-minutes">
        <span>{String(timeRemaining.minutes).padStart(2, "0")}</span>
        <span className={`font-medium ${labelClasses[size]} text-muted-foreground`}>
          Mins
        </span>
      </div>
      <span className="self-start">:</span>
      <div className="flex flex-col items-center" data-testid="timer-seconds">
        <span>{String(timeRemaining.seconds).padStart(2, "0")}</span>
        <span className={`font-medium ${labelClasses[size]} text-muted-foreground`}>
          Secs
        </span>
      </div>
    </div>
  );
}
