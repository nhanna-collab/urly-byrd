import TopNavigation from "@/components/TopNavigation";
import Navbar from "@/components/Navbar";
import FeedbackBox from "@/components/FeedbackBox";
import { useAuth } from "@/hooks/useAuth";
import { useLayoutEffect, useRef } from "react";

interface AppHeaderProps {
  hideFeedback?: boolean;
}

export default function AppHeader({ hideFeedback = false }: AppHeaderProps) {
  const { user } = useAuth();
  const headerRef = useRef<HTMLDivElement>(null);

  // Measure header height and publish it as a CSS variable for sticky elements below
  useLayoutEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        document.documentElement.style.setProperty('--app-header-height', `${height}px`);
      }
    };

    // Initial measurement
    updateHeaderHeight();

    // Watch for size changes (e.g., when FeedbackBox appears/disappears or responsive changes)
    const resizeObserver = new ResizeObserver(updateHeaderHeight);
    if (headerRef.current) {
      resizeObserver.observe(headerRef.current);
    }

    // Cleanup - remove the CSS variable when component unmounts
    return () => {
      resizeObserver.disconnect();
      document.documentElement.style.removeProperty('--app-header-height');
    };
  }, [user, hideFeedback]); // Re-measure when user/feedback state changes

  return (
    <>
      <div ref={headerRef} className="sticky top-0 z-50 bg-background border-b border-border">
        <TopNavigation />
        <Navbar />
      </div>
      {user && !hideFeedback && <FeedbackBox />}
    </>
  );
}
