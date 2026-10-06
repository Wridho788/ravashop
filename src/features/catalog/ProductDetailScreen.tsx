import React, {useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RootScreenProps} from '../../app/navigation';
import {useShop} from '../../app/ShopContext';
import {errorMessage} from '../../domain/errors';
import {colors, space, type} from '../../shared/theme';
import {Banner, Button, IconButton, LoadError, Loading, Price, ProductImage} from '../../shared/ui';
import {useLoad} from '../../shared/useLoad';

export function ProductDetailScreen({route, navigation}: RootScreenProps<'ProductDetail'>) {
  const {productId} = route.params;
  const {repo, refresh, showToast} = useShop();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const state = useLoad(
    async r => {
      const [product, wishlist, cart] = await Promise.all([
        r.getProduct(productId),
        r.wishlistIds(),
        r.getCart(),
      ]);
      const inCart = cart.find(line => line.product.id === productId)?.quantity ?? 0;
      return {product, wishlisted: wishlist.has(productId), inCart};
    },
    [productId],
  );

  if (!state.data) {
    return state.error ? <LoadError message={state.error} onRetry={state.reload} /> : <Loading />;
  }
  const {product, wishlisted, inCart} = state.data;
  const soldOut = product.stock === 0;
  const atLimit = !soldOut && inCart >= product.stock;

  const run = async (task: () => Promise<void>, success: string) => {
    setBusy(true);
    setError(null);
    try {
      await task();
      refresh();
      showToast(success);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const toggleWishlist = () =>
    run(
      () => (wishlisted ? repo.removeFromWishlist(product.id) : repo.addToWishlist(product.id)),
      wishlisted ? 'Dihapus dari wishlist' : 'Disimpan ke wishlist',
    );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView testID="detail.screen" contentContainerStyle={styles.content}>
        <ProductImage assetKey={product.assetKey} />
        <View style={styles.titleRow}>
          <View style={styles.titleText}>
            <Text style={type.caption}>{product.categoryName}</Text>
            <Text testID="detail.name" style={type.title}>
              {product.name}
            </Text>
          </View>
          <IconButton
            testID="detail.wishlist"
            icon={wishlisted ? 'heart' : 'heart-outline'}
            color={wishlisted ? colors.accent : colors.ink}
            filled
            selected={wishlisted}
            disabled={busy}
            accessibilityLabel={wishlisted ? 'Hapus dari wishlist' : 'Simpan ke wishlist'}
            onPress={toggleWishlist}
          />
        </View>
        <Price testID="detail.price" value={product.priceRupiah} style={styles.price} />
        <Text testID="detail.stock" style={[styles.stock, soldOut && styles.stockOut]}>
          {soldOut ? 'Stok habis' : `Stok ${product.stock}`}
        </Text>
        <Text style={[type.body, styles.description]}>{product.description}</Text>
      </ScrollView>
      <View style={styles.footer}>
        {error ? <Banner testID="detail.error" tone="error" message={error} /> : null}
        <Button
          testID="detail.add-to-cart"
          title={soldOut ? 'Stok habis' : atLimit ? 'Jumlah maksimal di keranjang' : 'Tambah ke keranjang'}
          icon={soldOut ? undefined : 'cart-plus'}
          disabled={soldOut || atLimit}
          loading={busy}
          onPress={() => run(() => repo.addToCart(product.id), 'Ditambahkan ke keranjang')}
        />
        {inCart > 0 ? (
          <View style={styles.cartRow}>
            <Text testID="detail.in-cart" style={styles.inCart}>
              {`Di keranjang: ${inCart}`}
            </Text>
            <Button
              testID="detail.go-to-cart"
              title="Lihat keranjang"
              variant="ghost"
              onPress={() => navigation.navigate('Tabs', {screen: 'Cart'})}
            />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.background},
  content: {padding: space.lg, gap: space.md},
  titleRow: {flexDirection: 'row', alignItems: 'flex-start', gap: space.md},
  titleText: {flex: 1, gap: 2},
  price: {fontSize: 22},
  stock: {fontSize: 14, fontWeight: '700', color: colors.success},
  stockOut: {color: colors.danger},
  description: {lineHeight: 22, color: colors.muted},
  cartRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap'},
  inCart: {fontSize: 14, fontWeight: '700', color: colors.ink},
  footer: {
    padding: space.lg,
    gap: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
