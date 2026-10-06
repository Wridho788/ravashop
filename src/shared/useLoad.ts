import {useFocusEffect} from '@react-navigation/native';
import {DependencyList, useCallback, useState} from 'react';
import {useShop} from '../app/ShopContext';
import {errorMessage} from '../domain/errors';
import {Repository} from '../data/repository';

export type LoadState<T> = {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  reload(): void;
};

/**
 * Loads data from the repository when the screen gains focus and after every committed
 * write (ShopContext.version), so the UI always reflects what SQLite holds.
 */
export function useLoad<T>(load: (repo: Repository) => Promise<T>, deps: DependencyList): LoadState<T> {
  const {repo, version} = useShop();
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      load(repo)
        .then(result => {
          if (active) {
            setData(result);
            setError(null);
          }
        })
        .catch(e => active && setError(errorMessage(e)))
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [repo, version, attempt, ...deps]),
  );

  const reload = useCallback(() => setAttempt(a => a + 1), []);
  return {data, loading, error, reload};
}
