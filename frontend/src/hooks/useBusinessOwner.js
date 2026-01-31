import { useEffect, useState } from 'react';
import { useMainContext } from '../context';

export const useBusinessOwner = () => {
  const { businessId, shopInfo } = useMainContext();
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOwnerStatus = () => {
      if (!businessId) {
        setIsOwner(false);
        setLoading(false);
        return;
      }

      const storedIsOwner = localStorage.getItem('isBusinessOwner') === 'true';
      setIsOwner(storedIsOwner);
      setLoading(false);
    };

    checkOwnerStatus();
  }, [businessId, shopInfo]);

  return { isOwner, loading };
};