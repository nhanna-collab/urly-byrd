import { useEffect } from "react";
import { useLocation } from "wouter";

export default function ScrollToTop() {
  const [location] = useLocation();

  // Disable browser's automatic scroll restoration
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Scroll to top on every route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Also scroll to top on initial mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return null;
}
