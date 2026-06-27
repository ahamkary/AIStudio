import React, { useState, useEffect, useRef } from "react";

interface TypingTextProps {
  text: string;
  speed?: number; // base ms per character
  onComplete?: () => void;
}

export default function TypingText({ text, speed = 8, onComplete }: TypingTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const indexRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayedText("");

    const typeChar = () => {
      const idx = indexRef.current;
      if (idx < text.length) {
        const nextChar = text.charAt(idx);
        setDisplayedText((prev) => prev + nextChar);
        indexRef.current++;

        // Calculate next delay based on punctuation for realistic breathing room
        let delay = speed;
        if (nextChar === "." || nextChar === "?" || nextChar === "!") {
          // Check if next char is also a punctuation (like ...) to avoid multiple long pauses
          const upcoming = text.charAt(idx + 1);
          if (upcoming !== "." && upcoming !== "?" && upcoming !== "!") {
            delay = speed * 15; // Realistic thought pause
          }
        } else if (nextChar === "," || nextChar === ";" || nextChar === ":") {
          delay = speed * 7; // Minor breath pause
        }

        timerRef.current = setTimeout(typeChar, delay);
      } else {
        if (onComplete) {
          onComplete();
        }
      }
    };

    timerRef.current = setTimeout(typeChar, speed);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [text, speed, onComplete]);

  return (
    <span className="relative">
      {displayedText}
      <span className="inline-block w-1 h-3.5 ml-0.5 bg-current opacity-60 animate-pulse align-middle" />
    </span>
  );
}
