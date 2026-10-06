import React, {useState} from 'react';
import {Alert, FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RootScreenProps} from '../../app/navigation';
import {useShop} from '../../app/ShopContext';
import {errorMessage} from '../../domain/errors';
import {Address} from '../../domain/types';
import {colors, radius, space, type} from '../../shared/theme';
import {Banner, Button, EmptyState, Icon, LoadError, Loading} from '../../shared/ui';
import {useLoad} from '../../shared/useLoad';

export function AddressListScreen({route, navigation}: RootScreenProps<'Addresses'>) {
  const selecting = route.params.mode === 'select';
  const {repo, refresh, showToast, checkoutAddressId, setCheckoutAddressId} = useShop();
  const state = useLoad(r => r.listAddresses(), []);
  const [error, setError] = useState<string | null>(null);

  const confirmDelete = (address: Address) =>
    Alert.alert('Hapus alamat?', `${address.recipient}\n${address.addressText}`, [
      {text: 'Batal', style: 'cancel'},
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          setError(null);
          try {
            await repo.deleteAddress(address.id);
            if (checkoutAddressId === address.id) {
              setCheckoutAddressId(null);
            }
            refresh();
            showToast('Alamat dihapus');
          } catch (e) {
            setError(errorMessage(e));
          }
        },
      },
    ]);

  if (!state.data) {
    return state.error ? <LoadError message={state.error} onRetry={state.reload} /> : <Loading />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        testID="addresses.list"
        data={state.data}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          error ? <Banner testID="addresses.error" tone="error" message={error} /> : undefined
        }
        ListEmptyComponent={
          <EmptyState
            testID="addresses.empty"
            icon="map-marker-outline"
            title="Belum ada alamat"
            message="Tambahkan alamat untuk checkout simulasi. Data hanya disimpan di perangkat ini."
          />
        }
        renderItem={({item, index}) => {
          const selected = selecting && item.id === checkoutAddressId;
          const body = (
            <>
              <View style={styles.cardHead}>
                {selecting ? (
                  <Icon
                    name={selected ? 'radiobox-marked' : 'radiobox-blank'}
                    color={selected ? colors.accent : colors.muted}
                  />
                ) : (
                  <Icon name="map-marker-outline" color={colors.accent} />
                )}
                <Text style={styles.recipient}>{item.recipient}</Text>
              </View>
              <Text style={type.caption}>{item.phone}</Text>
              <Text style={type.body}>{item.addressText}</Text>
            </>
          );
          return (
            <View testID={`address.item.${index}`} style={[styles.card, selected && styles.cardSelected]}>
              {selecting ? (
                <Pressable
                  testID={`address.item.${index}.select`}
                  accessibilityRole="radio"
                  accessibilityState={{checked: selected}}
                  accessibilityLabel={`Kirim ke ${item.recipient}, ${item.addressText}`}
                  onPress={() => {
                    setCheckoutAddressId(item.id);
                    navigation.goBack();
                  }}
                  style={styles.selectArea}
                >
                  {body}
                </Pressable>
              ) : (
                body
              )}
              <View style={styles.actions}>
                <Button
                  testID={`address.item.${index}.edit`}
                  title="Ubah"
                  variant="secondary"
                  icon="pencil-outline"
                  accessibilityLabel={`Ubah alamat ${item.recipient}`}
                  style={styles.action}
                  onPress={() => navigation.navigate('AddressForm', {addressId: item.id})}
                />
                <Button
                  testID={`address.item.${index}.delete`}
                  title="Hapus"
                  variant="danger"
                  icon="trash-can-outline"
                  accessibilityLabel={`Hapus alamat ${item.recipient}`}
                  style={styles.action}
                  onPress={() => confirmDelete(item)}
                />
              </View>
            </View>
          );
        }}
      />
      <View style={styles.footer}>
        <Button
          testID="addresses.add"
          title="Tambah alamat"
          icon="plus"
          onPress={() => navigation.navigate('AddressForm', {selectForCheckout: selecting})}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.background},
  content: {padding: space.lg, gap: space.md, flexGrow: 1},
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.xs,
  },
  cardSelected: {borderColor: colors.accent, borderWidth: 2},
  selectArea: {gap: space.xs},
  cardHead: {flexDirection: 'row', alignItems: 'center', gap: space.sm},
  recipient: {...type.subtitle, flex: 1},
  actions: {flexDirection: 'row', gap: space.sm, marginTop: space.sm},
  action: {flex: 1, minHeight: 48},
  footer: {
    padding: space.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
