import React, { useEffect, useState } from 'react';

export const Delayed: React.FC<{ wait?: number; children: React.ReactNode }> = ({ wait = 200, children }) => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), wait);
    return () => clearTimeout(t);
  }, [wait]);
  return show ? <>{children}</> : null;
};

