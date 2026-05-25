import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * عند كل تغيير في المسار (أو رفرشة الصفحة) يُعيد التمرير لأعلى فوراً.
 */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
