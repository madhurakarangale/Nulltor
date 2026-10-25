import { useState, useEffect, useRef } from 'react';

interface UseStreamingTypewriterOptions {
  speedMs?: number;
  batchSize?: number;
  enabled?: boolean;
}

/**
 * useStreamingTypewriter - Progressively streams text with human/agent cadence
 * Provides smooth terminal-like typing effects for assistant messages and code generation.
 */
export function useStreamingTypewriter(
  fullText: string,
  options: UseStreamingTypewriterOptions = {}
) {
  const { speedMs = 12, batchSize = 3, enabled = true } = options;
  const [displayedText, setDisplayedText] = useState(enabled ? '' : fullText);
  const [isComplete, setIsComplete] = useState(!enabled);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setDisplayedText(fullText);
      setIsComplete(true);
      return;
    }

    // If text was reset or is new
    if (fullText.length === 0) {
      setDisplayedText('');
      indexRef.current = 0;
      setIsComplete(true);
      return;
    }

    setIsComplete(false);

    const step = () => {
      if (indexRef.current >= fullText.length) {
        setDisplayedText(fullText);
        setIsComplete(true);
        return;
      }

      // Variable batch size for natural cadence (punctuation pause, faster whitespace/code)
      const currentChar = fullText[indexRef.current] || '';
      let currentBatch = batchSize;
      let delay = speedMs;

      if (currentChar === '\n') {
        delay = speedMs * 2;
      } else if (['.', ';', '{', '}'].includes(currentChar)) {
        delay = speedMs * 1.5;
      } else if (fullText.length - indexRef.current > 400) {
        // Fast-forward catch up if text is massive so user isn't kept waiting forever
        currentBatch = Math.max(batchSize, Math.floor((fullText.length - indexRef.current) / 10));
      }

      indexRef.current = Math.min(indexRef.current + currentBatch, fullText.length);
      setDisplayedText(fullText.slice(0, indexRef.current));

      timerRef.current = setTimeout(step, delay);
    };

    step();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [fullText, enabled, speedMs, batchSize]);

  return { displayedText, isComplete };
}
