import { FC, ReactNode, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  content: ReactNode;
  children: ReactNode;
  className?: string;
}

const Tooltip: FC<Props> = ({ content, children, className }) => {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (show && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setCoords({ top: rect.top - 8, left: rect.left + rect.width / 2 });
    }
  }, [show]);

  return (
    <span
      ref={wrapperRef}
      className={`inline-block ${className ?? ''}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && coords && createPortal(
        <div
          role="tooltip"
          className="fixed z-50 whitespace-nowrap rounded bg-gray-800 text-white text-xs px-2 py-1 shadow"
          style={{ top: coords.top, left: coords.left, transform: 'translate(-50%, -100%)' }}
        >
          {content}
        </div>,
        document.body,
      )}
    </span>
  );
};

export default Tooltip; 