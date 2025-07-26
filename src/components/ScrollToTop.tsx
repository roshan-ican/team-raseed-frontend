'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const ScrollToTop = () => {
  const pathname = usePathname();

  useEffect(() => {
    const scrollableDiv = document.getElementById('scrollable-container');
    if (scrollableDiv) {
      scrollableDiv.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;
