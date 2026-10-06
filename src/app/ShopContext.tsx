import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {Repository} from '../data/repository';

type ShopContextValue = {
  repo: Repository;
  /** Increments after every committed write so screens reload from SQLite. */
  version: number;
  refresh(): void;
  cartCount: number;
  checkoutAddressId: string | null;
  setCheckoutAddressId(id: string | null): void;
  toast: string | null;
  showToast(message: string): void;
};

const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({repo, children}: {repo: Repository; children: ReactNode}) {
  const [version, setVersion] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [checkoutAddressId, setCheckoutAddressId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(() => setVersion(v => v + 1), []);

  useEffect(() => {
    let active = true;
    repo
      .cartCount()
      .then(count => active && setCartCount(count))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [repo, version]);

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    },
    [],
  );

  const value = useMemo(
    () => ({repo, version, refresh, cartCount, checkoutAddressId, setCheckoutAddressId, toast, showToast}),
    [repo, version, refresh, cartCount, checkoutAddressId, toast, showToast],
  );
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopContextValue {
  const value = useContext(ShopContext);
  if (!value) {
    throw new Error('useShop must be used inside ShopProvider');
  }
  return value;
}
