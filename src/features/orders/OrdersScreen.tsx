import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {CompositeScreenProps} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import React from 'react';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {RootStackParamList, TabParamList} from '../../app/navigation';
import {formatRupiah} from '../../domain/money';
import {formatDateTime, formatOrderNumber} from '../../shared/format';
import {colors, radius, space, type} from '../../shared/theme';
import {EmptyState, Icon, LoadError, Loading} from '../../shared/ui';
import {useLoad} from '../../shared/useLoad';
import {StatusChip} from './StatusChip';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Orders'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function OrdersScreen({navigation}: Props) {
  const state = useLoad(r => r.listOrders(), []);
  if (!state.data) {
    return state.error ? <LoadError message={state.error} onRetry={state.reload} /> : <Loading />;
  }
  return (
    <FlatList
      testID="orders.list"
      data={state.data}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.content}
      ListEmptyComponent={
        <EmptyState
          testID="orders.empty"
          icon="receipt-text-outline"
          title="Belum ada pesanan"
          message="Pesanan simulasi yang kamu buat akan tampil di sini."
        />
      }
      renderItem={({item}) => (
        <Pressable
          testID={`orders.item.${item.number}`}
          accessibilityRole="button"
          accessibilityLabel={`Pesanan ${formatOrderNumber(item.number)}, ${
            item.status === 'cancelled' ? 'dibatalkan' : 'dikonfirmasi'
          }, total ${formatRupiah(item.totalRupiah)}`}
          onPress={() => navigation.navigate('OrderDetail', {orderId: item.id})}
          style={({pressed}) => [styles.card, pressed && styles.pressed]}
        >
          <View style={styles.head}>
            <Text style={type.subtitle}>{formatOrderNumber(item.number)}</Text>
            <StatusChip status={item.status} />
          </View>
          <Text style={type.caption}>{`${formatDateTime(item.createdAt)} · ${item.itemCount} barang`}</Text>
          <View style={styles.head}>
            <Text style={type.price}>{formatRupiah(item.totalRupiah)}</Text>
            <Icon name="chevron-right" color={colors.muted} />
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {padding: space.lg, gap: space.md, flexGrow: 1},
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.xs,
  },
  pressed: {opacity: 0.8},
  head: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm},
});
