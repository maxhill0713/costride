import { useState, useEffect } from 'react';

export const useModalAnimation = (isOpen, onClose) => {
  const [isVisible, setIsVisible] = useState(isOpen);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsExiting(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
      if (onClose) onClose();
    }, 250);
  };

  return {
    isVisible,
    isExiting,
    handleClose
  };
};