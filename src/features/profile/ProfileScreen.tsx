import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {CompositeScreenProps} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useState} from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {RootStackParamList, TabParamList} from '../../app/navigation';
import {useShop} from '../../app/ShopContext';
import {errorMessage} from '../../domain/errors';
import {E2EPanel} from '../../e2e/E2EPanel';
import {colors, radius, space, TOUCH, type} from '../../shared/theme';
import {Banner, Button, Card, Icon, IconName} from '../../shared/ui';
import {useLoad} from '../../shared/useLoad';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function ProfileScreen({navigation}: Props) {
  const {repo, refresh, showToast, setCheckoutAddressId} = useShop();
  const seed = useLoad(r => r.getSeedVersion(), []);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmReset = () =>
    Alert.alert(
      'Reset data demo?',
      'Wishlist, keranjang, alamat, dan pesanan akan dihapus. Produk dan stok kembali ke data awal.',
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            setError(null);
            try {
              await repo.resetDemo();
              setCheckoutAddressId(null);
              refresh();
              showToast('Data demo dipulihkan');
            } catch (e) {
              setError(errorMessage(e));
            } finally {
              setResetting(false);
            }
          },
        },
      ],
    );

  return (
    <ScrollView testID="profile.screen" contentContainerStyle={styles.content}>
      <Card style={styles.profile}>
        <View style={styles.avatar}>
          <Icon name="account" size={32} color={colors.accent} />
        </View>
        <View style={styles.flex}>
          <Text style={type.subtitle}>Pembeli Demo</Text>
          <Text style={type.caption}>Profil demo lokal — tanpa akun atau login.</Text>
        </View>
      </Card>
      <Card style={styles.menu}>
        <MenuItem
          testID="profile.addresses"
          icon="map-marker-outline"
          label="Alamat saya"
          onPress={() => navigation.navigate('Addresses', {mode: 'manage'})}
        />
        <MenuItem
          testID="profile.orders"
          icon="receipt-text-outline"
          label="Riwayat pesanan"
          onPress={() => navigation.navigate('Orders')}
        />
      </Card>
      <Card>
        <Text style={type.subtitle}>Data demo</Text>
        <Text style={type.caption}>
          Semua data tersimpan di perangkat ini. Checkout hanya simulasi; tidak ada pembayaran atau pengiriman
          nyata.
        </Text>
        <Text testID="profile.seed" style={type.caption}>{`Versi data: ${seed.data ?? '-'}`}</Text>
        {error ? <Banner testID="settings.reset.error" tone="error" message={error} /> : null}
        <Button
          testID="settings.reset"
          title="Reset data demo"
          variant="danger"
          icon="restore"
          loading={resetting}
          onPress={confirmReset}
        />
      </Card>
      <E2EPanel />
    </ScrollView>
  );
}

function MenuItem({
  testID,
  icon,
  label,
  onPress,
}: {
  testID: string;
  icon: IconName;
  label: string;
  onPress(): void;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({pressed}) => [styles.menuItem, pressed && styles.pressed]}
    >
      <Icon name={icon} color={colors.accent} />
      <Text style={[type.body, styles.flex]}>{label}</Text>
      <Icon name="chevron-right" color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {padding: space.lg, gap: space.md},
  flex: {flex: 1},
  profile: {flexDirection: 'row', alignItems: 'center', gap: space.md},
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menu: {paddingVertical: space.xs, gap: 0},
  menuItem: {
    minHeight: TOUCH + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderRadius: radius.sm,
  },
  pressed: {opacity: 0.7},
});
