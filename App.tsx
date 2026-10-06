import React, {useCallback, useEffect, useState} from 'react';
import {StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {AppNavigation} from './src/app/navigation';
import {ShopProvider, useShop} from './src/app/ShopContext';
import {createNativeDriver} from './src/data/nativeDriver';
import {createRepository, Repository} from './src/data/repository';
import {errorMessage} from './src/domain/errors';
import {faultSource} from './src/e2e/faults';
import {colors, radius, space, type} from './src/shared/theme';
import {Banner, Button, Icon, Loading} from './src/shared/ui';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <Boot />
    </SafeAreaProvider>
  );
}

function Boot() {
  const [repo, setRepo] = useState<Repository | null>(null);
  const [error, setError] = useState<string | null>(null);

  const open = useCallback(async () => {
    setError(null);
    try {
      const repository = createRepository(createNativeDriver(), {faults: faultSource});
      await repository.init();
      setRepo(repository);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    open();
  }, [open]);

  if (error) {
    return (
      <SafeAreaView style={styles.recovery} testID="recovery.screen">
        <View style={styles.recoveryIcon}>
          <Icon name="database-alert-outline" size={40} color={colors.danger} />
        </View>
        <Text style={[type.title, styles.center]}>RavaShop belum dapat dibuka</Text>
        <Banner tone="error" message={error} />
        <Text style={[type.caption, styles.center]}>Data di perangkat tidak dihapus.</Text>
        <Button testID="recovery.retry" title="Coba lagi" onPress={open} />
      </SafeAreaView>
    );
  }
  if (!repo) {
    return (
      <SafeAreaView style={styles.flex}>
        <Loading label="Menyiapkan RavaShop…" />
      </SafeAreaView>
    );
  }
  return (
    <ShopProvider repo={repo}>
      <AppNavigation />
      <Toast />
    </ShopProvider>
  );
}

function Toast() {
  const {toast} = useShop();
  if (!toast) {
    return null;
  }
  return (
    <SafeAreaView edges={['bottom']} style={styles.toastWrap} pointerEvents="none">
      <View testID="toast" style={styles.toast} accessibilityLiveRegion="polite">
        <Text style={styles.toastText}>{toast}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: colors.background},
  center: {textAlign: 'center'},
  recovery: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: space.xl,
    gap: space.lg,
  },
  recoveryIcon: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastWrap: {position: 'absolute', left: 0, right: 0, bottom: 72, alignItems: 'center'},
  toast: {
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    maxWidth: '90%',
  },
  toastText: {color: colors.white, fontSize: 14, fontWeight: '600', textAlign: 'center'},
});

export default App;
