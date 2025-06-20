// Bu dosyayı oluşturun ve aşağıdaki içeriği yapıştırın.

import { useState, useRef, useEffect, useCallback } from 'react';

export const usePopover = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setIsVisible(false), []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isVisible && popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVisible, close]);

  const toggle = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top - 10,
        left: rect.left + rect.width / 2,
      });
    }
    setIsVisible(prev => !prev);
  };

  return { isVisible, toggle, close, triggerRef, popoverRef, coords };
};