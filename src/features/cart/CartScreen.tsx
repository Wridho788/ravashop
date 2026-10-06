import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {CompositeScreenProps} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useState} from 'react';
import {Alert, FlatList, StyleSheet, Text, View} from 'react-native';
import {RootStackParamList, TabParamList} from '../../app/navigation';
import {useShop} from '../../app/ShopContext';
import {errorMessage} from '../../domain/errors';
import {formatRupiah} from '../../domain/money';
import {subtotalOf} from '../../domain/totals';
import {CartLine} from '../../domain/types';
import {colors, radius, space, type} from '../../shared/theme';
import {Banner, Button, EmptyState, IconButton, LoadError, Loading, ProductImage, Row} from '../../shared/ui';
import {useLoad} from '../../shared/useLoad';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Cart'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function CartScreen({navigation}: Props) {
  const {repo, refresh, showToast} = useShop();
  const state = useLoad(r => r.getCart(), []);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (productId: string, task: () => Promise<void>, success?: string) => {
    setBusy(productId);
    setError(null);
    try {
      await task();
      refresh();
      if (success) {
        showToast(success);
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const confirmRemove = (line: CartLine) =>
    Alert.alert('Hapus dari keranjang?', line.product.name, [
      {text: 'Batal', style: 'cancel'},
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () =>
          run(line.product.id, () => repo.removeFromCart(line.product.id), 'Dihapus dari keranjang'),
      },
    ]);

  if (!state.data) {
    return state.error ? <LoadError message={state.error} onRetry={state.reload} /> : <Loading />;
  }
  const lines = state.data;
  const subtotal = subtotalOf(
    lines.map(l => ({unitPriceRupiah: l.product.priceRupiah, quantity: l.quantity})),
  );
  const overStock = lines.some(l => l.quantity > l.product.stock);

  return (
    <View style={styles.flex}>
      <FlatList
        testID="cart.list"
        data={lines}
        keyExtractor={line => line.product.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={error ? <Banner testID="cart.error" tone="error" message={error} /> : undefined}
        ListEmptyComponent={
          <EmptyState
            testID="cart.empty"
            icon="shopping-outline"
            title="Keranjang masih kosong"
            message="Tambahkan produk dari katalog untuk mulai belanja."
            action={<Button title="Mulai belanja" onPress={() => navigation.navigate('Home')} />}
          />
        }
        renderItem={({item: line}) => {
          const id = line.product.id;
          const disabled = busy !== null;
          const atMax = line.quantity >= line.product.stock;
          return (
            <View testID={`cart.item.${id}`} style={styles.row}>
              <ProductImage assetKey={line.product.assetKey} size={76} rounded={radius.md} />
              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <Text style={styles.name} numberOfLines={2}>
                    {line.product.name}
                  </Text>
                  <IconButton
                    testID={`cart.item.${id}.remove`}
                    icon="trash-can-outline"
                    color={colors.danger}
                    disabled={disabled}
                    accessibilityLabel={`Hapus ${line.product.name} dari keranjang`}
                    onPress={() => confirmRemove(line)}
                  />
                </View>
                <Text style={type.price}>{formatRupiah(line.product.priceRupiah)}</Text>
                <View style={styles.stepperRow}>
                  <View style={styles.stepper}>
                    <IconButton
                      testID={`cart.item.${id}.decrease`}
                      icon="minus"
                      disabled={disabled || line.quantity <= 1}
                      accessibilityLabel={`Kurangi jumlah ${line.product.name}`}
                      onPress={() => run(id, () => repo.setCartQuantity(id, line.quantity - 1))}
                    />
                    <Text
                      testID={`cart.item.${id}.quantity`}
                      accessibilityLabel={`Jumlah ${line.quantity}`}
                      style={styles.quantity}
                    >
                      {line.quantity}
                    </Text>
                    <IconButton
                      testID={`cart.item.${id}.increase`}
                      icon="plus"
                      disabled={disabled || atMax}
                      accessibilityLabel={`Tambah jumlah ${line.product.name}`}
                      onPress={() => run(id, () => repo.setCartQuantity(id, line.quantity + 1))}
                    />
                  </View>
                  {atMax ? (
                    <Text testID={`cart.item.${id}.max`} style={[type.caption, styles.max]}>
                      {line.quantity > line.product.stock
                        ? `Stok tinggal ${line.product.stock}`
                        : `Maks. ${line.product.stock}`}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          );
        }}
      />
      {lines.length > 0 ? (
        <View style={styles.footer}>
          <Row label="Subtotal" value={formatRupiah(subtotal)} strong testID="cart.subtotal" />
          <Text style={type.caption}>Ongkir dihitung saat checkout.</Text>
          <Button
            testID="cart.checkout"
            title="Lanjut ke checkout"
            disabled={overStock || busy !== null}
            onPress={() => navigation.navigate('Checkout')}
          />
        </View>
      ) : (
        <View style={styles.footer}>
          <Button testID="cart.checkout" title="Lanjut ke checkout" disabled onPress={() => undefined} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  content: {padding: space.lg, gap: space.md, flexGrow: 1},
  row: {
    flexDirection: 'row',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.sm,
  },
  rowBody: {flex: 1, gap: 2},
  rowTop: {flexDirection: 'row', alignItems: 'flex-start'},
  name: {flex: 1, fontSize: 15, fontWeight: '600', color: colors.ink, paddingTop: space.xs},
  stepperRow: {flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.sm},
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  quantity: {minWidth: 32, textAlign: 'center', fontSize: 16, fontWeight: '800', color: colors.ink},
  max: {color: colors.accentDark},
  footer: {
    padding: space.lg,
    gap: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
