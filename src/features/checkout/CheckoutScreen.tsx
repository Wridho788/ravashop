import React, {useEffect, useRef, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RootScreenProps} from '../../app/navigation';
import {useShop} from '../../app/ShopContext';
import {errorMessage} from '../../domain/errors';
import {formatRupiah} from '../../domain/money';
import {computeTotals} from '../../domain/totals';
import {colors, radius, space, type} from '../../shared/theme';
import {
  Banner,
  Button,
  Card,
  EmptyState,
  Icon,
  LoadError,
  Loading,
  ProductImage,
  Row,
  SimulationLabel,
} from '../../shared/ui';
import {useLoad} from '../../shared/useLoad';

const newOperationId = () => `op-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export function CheckoutScreen({navigation}: RootScreenProps<'Checkout'>) {
  const {repo, refresh, checkoutAddressId, setCheckoutAddressId} = useShop();
  // One operation ID per checkout attempt; retries after a failure reuse it (docs/TRD.md).
  const operationId = useRef(newOperationId());
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const state = useLoad(async r => {
    const [cart, addresses] = await Promise.all([r.getCart(), r.listAddresses()]);
    return {cart, addresses};
  }, []);

  const addresses = state.data?.addresses;
  const address = addresses?.find(a => a.id === checkoutAddressId) ?? null;

  // Auto-select the most recently saved address; drop a selection that no longer exists.
  useEffect(() => {
    if (addresses && !address) {
      setCheckoutAddressId(addresses[0]?.id ?? null);
    }
  }, [addresses, address, setCheckoutAddressId]);

  if (!state.data) {
    return state.error ? <LoadError message={state.error} onRetry={state.reload} /> : <Loading />;
  }
  const {cart} = state.data;
  if (cart.length === 0 && !submitting) {
    return (
      <EmptyState
        testID="checkout.empty"
        icon="shopping-outline"
        title="Keranjang kosong"
        message="Tidak ada barang untuk di-checkout."
        action={<Button title="Kembali" onPress={() => navigation.goBack()} />}
      />
    );
  }
  const totals = computeTotals(
    cart.map(l => ({unitPriceRupiah: l.product.priceRupiah, quantity: l.quantity})),
  );

  const confirm = async () => {
    if (submittingRef.current) {
      return;
    }
    if (!address) {
      setError('Pilih alamat pengiriman terlebih dahulu.');
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const order = await repo.checkout(operationId.current, address.id);
      refresh();
      navigation.replace('OrderDetail', {orderId: order.id, justPlaced: true});
    } catch (e) {
      setError(errorMessage(e));
      refresh();
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView testID="checkout.screen" contentContainerStyle={styles.content}>
        <SimulationLabel testID="checkout.simulation" />
        <Card testID="checkout.address">
          <View style={styles.cardHead}>
            <Icon name="map-marker-outline" color={colors.accent} />
            <Text style={[type.subtitle, styles.flex]}>Alamat pengiriman</Text>
          </View>
          {address ? (
            <View testID="checkout.address.selected" style={styles.addressBody}>
              <Text style={styles.recipient}>{address.recipient}</Text>
              <Text style={type.caption}>{address.phone}</Text>
              <Text style={type.body}>{address.addressText}</Text>
            </View>
          ) : (
            <Text testID="checkout.address.none" style={type.caption}>
              Belum ada alamat dipilih.
            </Text>
          )}
          <Button
            testID="checkout.change-address"
            title={address ? 'Ganti alamat' : 'Pilih atau tambah alamat'}
            variant="secondary"
            disabled={submitting}
            onPress={() => navigation.navigate('Addresses', {mode: 'select'})}
          />
        </Card>
        <Card>
          <Text style={type.subtitle}>{`Barang (${cart.reduce((n, l) => n + l.quantity, 0)})`}</Text>
          {cart.map(line => (
            <View key={line.product.id} testID={`checkout.item.${line.product.id}`} style={styles.item}>
              <ProductImage assetKey={line.product.assetKey} size={52} rounded={radius.sm} />
              <View style={styles.flex}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {line.product.name}
                </Text>
                <Text style={type.caption}>{`${line.quantity} × ${formatRupiah(
                  line.product.priceRupiah,
                )}`}</Text>
              </View>
              <Text style={styles.itemTotal}>{formatRupiah(line.product.priceRupiah * line.quantity)}</Text>
            </View>
          ))}
        </Card>
        <Card>
          <Row label="Subtotal" value={formatRupiah(totals.subtotalRupiah)} testID="checkout.subtotal" />
          <Row
            label="Ongkir (simulasi)"
            value={formatRupiah(totals.shippingRupiah)}
            testID="checkout.shipping"
          />
          <View style={styles.divider} />
          <Row label="Total" value={formatRupiah(totals.totalRupiah)} strong testID="checkout.total" />
        </Card>
      </ScrollView>
      <View style={styles.footer}>
        {error ? <Banner testID="checkout.error" tone="error" message={error} /> : null}
        <Button
          testID="checkout.confirm"
          title={error ? 'Coba lagi buat pesanan simulasi' : 'Buat pesanan simulasi'}
          accessibilityLabel="Buat pesanan simulasi"
          loading={submitting}
          onPress={confirm}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.background},
  content: {padding: space.lg, gap: space.md},
  flex: {flex: 1},
  cardHead: {flexDirection: 'row', alignItems: 'center', gap: space.sm},
  addressBody: {gap: 2},
  recipient: {fontSize: 15, fontWeight: '700', color: colors.ink},
  item: {flexDirection: 'row', alignItems: 'center', gap: space.md},
  itemName: {fontSize: 14, fontWeight: '600', color: colors.ink},
  itemTotal: {fontSize: 14, fontWeight: '700', color: colors.ink},
  divider: {height: 1, backgroundColor: colors.border, marginVertical: space.xs},
  footer: {
    padding: space.lg,
    gap: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
