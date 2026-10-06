import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {CompositeScreenProps} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useState} from 'react';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {RootStackParamList, TabParamList} from '../../app/navigation';
import {useShop} from '../../app/ShopContext';
import {errorMessage} from '../../domain/errors';
import {formatRupiah} from '../../domain/money';
import {colors, radius, space, type} from '../../shared/theme';
import {Banner, Button, EmptyState, IconButton, LoadError, Loading, ProductImage} from '../../shared/ui';
import {useLoad} from '../../shared/useLoad';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Wishlist'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function WishlistScreen({navigation}: Props) {
  const {repo, refresh, showToast} = useShop();
  const state = useLoad(r => r.listWishlist(), []);
  const [error, setError] = useState<string | null>(null);

  const remove = async (productId: string) => {
    setError(null);
    try {
      await repo.removeFromWishlist(productId);
      refresh();
      showToast('Dihapus dari wishlist');
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  if (!state.data) {
    return state.error ? <LoadError message={state.error} onRetry={state.reload} /> : <Loading />;
  }

  return (
    <FlatList
      testID="wishlist.list"
      data={state.data}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={error ? <Banner tone="error" message={error} /> : undefined}
      ListEmptyComponent={
        <EmptyState
          testID="wishlist.empty"
          icon="heart-outline"
          title="Wishlist masih kosong"
          message="Simpan produk favoritmu dari halaman detail produk."
          action={<Button title="Jelajahi produk" onPress={() => navigation.navigate('Home')} />}
        />
      }
      renderItem={({item}) => (
        <View testID={`wishlist.item.${item.id}`} style={styles.row}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Buka ${item.name}`}
            style={styles.rowMain}
            onPress={() => navigation.navigate('ProductDetail', {productId: item.id})}
          >
            <ProductImage assetKey={item.assetKey} size={72} rounded={radius.md} />
            <View style={styles.rowText}>
              <Text style={styles.name} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={type.price}>{formatRupiah(item.priceRupiah)}</Text>
              <Text style={[type.caption, item.stock === 0 && styles.out]}>
                {item.stock === 0 ? 'Stok habis' : `Stok ${item.stock}`}
              </Text>
            </View>
          </Pressable>
          <IconButton
            testID={`wishlist.item.${item.id}.remove`}
            icon="heart"
            color={colors.accent}
            accessibilityLabel={`Hapus ${item.name} dari wishlist`}
            onPress={() => remove(item.id)}
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {padding: space.lg, gap: space.md, flexGrow: 1},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.sm,
  },
  rowMain: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md},
  rowText: {flex: 1, gap: 2},
  name: {fontSize: 15, fontWeight: '600', color: colors.ink},
  out: {color: colors.danger},
});
