import { useState, useEffect } from "react";
import { Zap, ArrowUp } from "lucide-react";

const phrases = [
  "The Next Level of Flash Marketing",
  "If you are selling a discount...",
  "you're not marketing.",
  "Our proprietary technology prevents over-discounting.",
  "ABEOS", // Special marker for ABEOS sequence
  "Ad content/volume tailored to each customer individually.",
  "Urly Byrd, a consumer brand brings you viral sales.",
  "Cobrand and cross-market with complimentary retailers.",
  "The end of legacy SMS methodology, because...",
  "The Metrics Have Changed."
];

export default function ScrollingTicker() {

  const [currentIndex, setCurrentIndex] = useState(0);
  const [key, setKey] = useState(0);

  useEffect(() => {
    // Set duration based on phrase index and animation
    let duration = 8000; // Default for phrases 6-10
    
    if (currentIndex === 0) {
      duration = 6000; // Phrase 1: "The Next Level of Flash Marketing"
    } else if (currentIndex === 1) {
      duration = 5000; // Phrase 2: "If you are selling a discount..."
    } else if (currentIndex === 2) {
      duration = 8000; // Phrase 3: "you're not marketing."
    } else if (currentIndex === 3) {
      duration = 8000; // Phrase 4: "Our proprietary technology..."
    } else if (phrases[currentIndex] === "ABEOS") {
      duration = 9000; // Phrase 5 (ABEOS)
    }

    console.log(`🔵 TICKER: Showing phrase ${currentIndex + 1}/${phrases.length}: "${phrases[currentIndex]}" for ${duration}ms`);

    const timeout = setTimeout(() => {
      console.log(`✅ TICKER: Moving from phrase ${currentIndex + 1} to ${((currentIndex + 1) % phrases.length) + 1}`);
      setCurrentIndex((prev) => (prev + 1) % phrases.length);
      setKey((prev) => prev + 1);
    }, duration);

    return () => {
      console.log(`🛑 TICKER: Cleanup for phrase ${currentIndex + 1}`);
      clearTimeout(timeout);
    };
  }, [currentIndex]);

  const getAnimationClass = () => {
    if (currentIndex === 0) {
      return "animate-zoom-in-slow-then-shrink"; // Phrase 1
    } else if (currentIndex === 1) {
      return "animate-pop-in-then-shrink"; // Phrase 2
    } else if (currentIndex === 2) {
      return "animate-zoom-in-freeze-fade"; // Phrase 3
    } else if (currentIndex === 3) {
      return "animate-typewriter-pause-shrink"; // Phrase 4
    } else if (phrases[currentIndex] === "ABEOS") {
      return "animate-typewriter-pause-3s-shrink"; // Phrase 5 (ABEOS)
    } else {
      return "animate-shrink"; // Phrases 6-10
    }
  };
  
  const animationClass = getAnimationClass();

  const renderContent = () => {
    if (phrases[currentIndex] === "ABEOS") {
      return (
        <span className="text-foreground font-display font-bold text-lg md:text-2xl text-center block px-4">
          Our Secret...<span className="font-black">Adaptive Behavioral Engagement Offer System (ABEOS)</span>
        </span>
      );
    }
    
    return (
      <span className="text-foreground font-display font-bold text-lg md:text-2xl text-center block px-4 relative">
        {currentIndex === 0 && (
          <ArrowUp className="w-8 h-8 text-foreground absolute -top-10 left-1/2 -translate-x-1/2" strokeWidth={3} />
        )}
        <span className="inline-flex items-center gap-3">
          {phrases[currentIndex]}
          {currentIndex === 0 && (
            <Zap className="w-8 h-8 text-foreground animate-lightning-flash" fill="currentColor" />
          )}
        </span>
      </span>
    );
  };

  return (
    <div className="bg-white overflow-hidden pt-4 pb-12 border-b-2 border-border flex items-center justify-center" data-testid="ticker-container">
      <div key={key} className={animationClass}>
        {renderContent()}
      </div>
    </div>
  );
}
