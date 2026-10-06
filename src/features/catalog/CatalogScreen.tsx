import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {CompositeScreenProps} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useState} from 'react';
import {FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RootStackParamList, TabParamList} from '../../app/navigation';
import {formatRupiah} from '../../domain/money';
import {Product, ProductSort} from '../../domain/types';
import {colors, radius, space, TOUCH, type} from '../../shared/theme';
import {Button, Chip, EmptyState, Icon, IconButton, LoadError, Loading, ProductImage} from '../../shared/ui';
import {useLoad} from '../../shared/useLoad';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

const SORTS: {id: ProductSort; label: string}[] = [
  {id: 'recommended', label: 'Rekomendasi'},
  {id: 'price-asc', label: 'Harga termurah'},
  {id: 'price-desc', label: 'Harga termahal'},
];

export function CatalogScreen({navigation}: Props) {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [sort, setSort] = useState<ProductSort>('recommended');
  const categories = useLoad(repo => repo.listCategories(), []);
  const products = useLoad(repo => repo.listProducts({search, categoryId, sort}), [search, categoryId, sort]);

  const clearFilters = () => {
    setSearch('');
    setCategoryId(null);
  };

  const header = (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <View>
          <Text style={styles.brand}>RavaShop</Text>
          <Text style={type.hero}>Temukan barang favoritmu</Text>
        </View>
      </View>
      <View style={styles.searchBox}>
        <Icon name="magnify" color={colors.muted} />
        <TextInput
          testID="catalog.search"
          accessibilityLabel="Cari produk"
          placeholder="Cari produk"
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          style={styles.searchInput}
        />
        {search ? (
          <IconButton
            testID="catalog.search.clear"
            icon="close-circle"
            color={colors.muted}
            accessibilityLabel="Hapus pencarian"
            onPress={() => setSearch('')}
          />
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip
          testID="catalog.category.all"
          label="Semua"
          selected={categoryId === null}
          onPress={() => setCategoryId(null)}
        />
        {(categories.data ?? []).map(category => (
          <Chip
            key={category.id}
            testID={`catalog.category.${category.id}`}
            label={category.name}
            selected={categoryId === category.id}
            onPress={() => setCategoryId(category.id)}
          />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {SORTS.map(option => (
          <Chip
            key={option.id}
            testID={`catalog.sort.${option.id}`}
            label={option.label}
            selected={sort === option.id}
            onPress={() => setSort(option.id)}
          />
        ))}
      </ScrollView>
    </View>
  );

  if (products.error && !products.data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <LoadError message={products.error} onRetry={products.reload} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        testID="catalog.list"
        data={products.data ?? []}
        keyExtractor={item => item.id}
        numColumns={2}
        keyboardShouldPersistTaps="handled"
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.content}
        ListHeaderComponent={header}
        ListEmptyComponent={
          products.loading && !products.data ? (
            <Loading label="Memuat katalog…" />
          ) : (
            <EmptyState
              testID="catalog.empty"
              icon="magnify-close"
              title="Produk tidak ditemukan"
              message="Coba kata kunci atau kategori lain."
              action={<Button testID="catalog.empty.reset" title="Hapus pencarian" onPress={clearFilters} />}
            />
          )
        }
        renderItem={({item}) => (
          <ProductCard
            product={item}
            onPress={() => navigation.navigate('ProductDetail', {productId: item.id})}
          />
        )}
      />
    </SafeAreaView>
  );
}

function ProductCard({product, onPress}: {product: Product; onPress(): void}) {
  const soldOut = product.stock === 0;
  return (
    <Pressable
      testID={`product.${product.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${formatRupiah(product.priceRupiah)}${
        soldOut ? ', stok habis' : ''
      }`}
      onPress={onPress}
      style={({pressed}) => [styles.card, pressed && styles.pressed]}
    >
      <View>
        <ProductImage assetKey={product.assetKey} rounded={radius.md} />
        {soldOut ? (
          <View style={styles.soldOut}>
            <Text style={styles.soldOutText}>Stok habis</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.category}>{product.categoryName}</Text>
      <Text style={styles.name} numberOfLines={2}>
        {product.name}
      </Text>
      <Text style={type.price}>{formatRupiah(product.priceRupiah)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.background},
  content: {padding: space.lg, gap: space.md, flexGrow: 1},
  header: {gap: space.md, marginBottom: space.sm},
  brandRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  brand: {fontSize: 14, fontWeight: '800', color: colors.accent, letterSpacing: 1},
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: TOUCH + 4,
    paddingLeft: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {flex: 1, fontSize: 16, color: colors.ink, minHeight: TOUCH},
  chips: {gap: space.sm, paddingRight: space.lg},
  column: {gap: space.md},
  card: {
    flex: 1,
    maxWidth: '50%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.sm,
    gap: space.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {opacity: 0.8},
  soldOut: {
    position: 'absolute',
    left: space.sm,
    top: space.sm,
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
  soldOutText: {color: colors.white, fontSize: 12, fontWeight: '700'},
  category: {...type.caption, marginTop: space.xs},
  name: {fontSize: 15, fontWeight: '600', color: colors.ink, minHeight: 40},
});
