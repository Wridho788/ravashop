import React, {useState} from 'react';
import {Alert, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RootScreenProps} from '../../app/navigation';
import {useShop} from '../../app/ShopContext';
import {errorMessage} from '../../domain/errors';
import {formatRupiah} from '../../domain/money';
import {formatDateTime, formatOrderNumber} from '../../shared/format';
import {colors, radius, space, type} from '../../shared/theme';
import {
  Banner,
  Button,
  Card,
  Icon,
  LoadError,
  Loading,
  ProductImage,
  Row,
  SimulationLabel,
} from '../../shared/ui';
import {useLoad} from '../../shared/useLoad';
import {StatusChip} from './StatusChip';

export function OrderDetailScreen({route}: RootScreenProps<'OrderDetail'>) {
  const {orderId, justPlaced} = route.params;
  const {repo, refresh, showToast} = useShop();
  const state = useLoad(r => r.getOrder(orderId), [orderId]);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!state.data) {
    return state.error ? <LoadError message={state.error} onRetry={state.reload} /> : <Loading />;
  }
  const order = state.data;

  const cancel = () =>
    Alert.alert('Batalkan pesanan?', 'Stok barang akan dikembalikan. Pesanan tetap tersimpan di riwayat.', [
      {text: 'Tidak', style: 'cancel'},
      {
        text: 'Batalkan pesanan',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          setError(null);
          try {
            await repo.cancelOrder(order.id);
            refresh();
            showToast('Pesanan dibatalkan');
          } catch (e) {
            setError(errorMessage(e));
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView testID="order.detail" contentContainerStyle={styles.content}>
        {justPlaced && order.status === 'confirmed' ? (
          <Banner testID="order.placed" tone="success" message="Pesanan simulasi berhasil dibuat." />
        ) : null}
        <SimulationLabel testID="order.simulation" />
        <Card>
          <View style={styles.head}>
            <Text testID="order.number" style={type.title}>
              {formatOrderNumber(order.number)}
            </Text>
            <StatusChip status={order.status} testID="order.status" />
          </View>
          <Text style={type.caption}>{`Dibuat ${formatDateTime(order.createdAt)}`}</Text>
          {order.cancelledAt ? (
            <Text testID="order.cancelled-at" style={type.caption}>
              {`Dibatalkan ${formatDateTime(order.cancelledAt)}`}
            </Text>
          ) : null}
        </Card>
        <Card testID="order.address">
          <View style={styles.cardHead}>
            <Icon name="map-marker-outline" color={colors.accent} />
            <Text style={type.subtitle}>Alamat pengiriman</Text>
          </View>
          <Text style={styles.recipient}>{order.addressSnapshot.recipient}</Text>
          <Text style={type.caption}>{order.addressSnapshot.phone}</Text>
          <Text style={type.body}>{order.addressSnapshot.addressText}</Text>
        </Card>
        <Card>
          <Text style={type.subtitle}>{`Barang (${order.itemCount})`}</Text>
          {order.items.map(item => (
            <View key={item.productId} testID={`order.item.${item.productId}`} style={styles.item}>
              <ProductImage assetKey={item.assetKey} size={52} rounded={radius.sm} />
              <View style={styles.flex}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.nameSnapshot}
                </Text>
                <Text style={type.caption}>{`${item.quantity} × ${formatRupiah(item.unitPriceRupiah)}`}</Text>
              </View>
              <Text style={styles.itemTotal}>{formatRupiah(item.lineTotalRupiah)}</Text>
            </View>
          ))}
        </Card>
        <Card>
          <Row label="Subtotal" value={formatRupiah(order.subtotalRupiah)} testID="order.subtotal" />
          <Row label="Ongkir (simulasi)" value={formatRupiah(order.shippingRupiah)} testID="order.shipping" />
          <View style={styles.divider} />
          <Row label="Total" value={formatRupiah(order.totalRupiah)} strong testID="order.total" />
        </Card>
        {/* Kept in the scroll content, not a fixed footer: a fast double tap on the checkout
            confirm button must not land on a destructive action of the next screen. */}
        {order.status === 'confirmed' ? (
          <Button
            testID="order.cancel"
            title="Batalkan pesanan"
            variant="danger"
            loading={cancelling}
            onPress={cancel}
          />
        ) : null}
        {error ? <Banner testID="order.error" tone="error" message={error} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.background},
  content: {padding: space.lg, gap: space.md},
  flex: {flex: 1},
  head: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm},
  cardHead: {flexDirection: 'row', alignItems: 'center', gap: space.sm},
  recipient: {fontSize: 15, fontWeight: '700', color: colors.ink},
  item: {flexDirection: 'row', alignItems: 'center', gap: space.md},
  itemName: {fontSize: 14, fontWeight: '600', color: colors.ink},
  itemTotal: {fontSize: 14, fontWeight: '700', color: colors.ink},
  divider: {height: 1, backgroundColor: colors.border, marginVertical: space.xs},
});
