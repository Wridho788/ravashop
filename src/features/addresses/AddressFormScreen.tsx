import React, {ComponentRef, useEffect, useRef, useState} from 'react';
import {KeyboardAvoidingView, ScrollView, StyleSheet, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RootScreenProps} from '../../app/navigation';
import {useShop} from '../../app/ShopContext';
import {errorMessage, FieldErrors, isShopError} from '../../domain/errors';
import {AddressInput} from '../../domain/types';
import {ADDRESS_MAX, RECIPIENT_MAX, validateAddress} from '../../domain/validation';
import {colors, space} from '../../shared/theme';
import {Banner, Button, Loading, TextField} from '../../shared/ui';

const EMPTY: AddressInput = {recipient: '', phone: '', addressText: ''};

export function AddressFormScreen({route, navigation}: RootScreenProps<'AddressForm'>) {
  const {addressId, selectForCheckout} = route.params;
  const {repo, refresh, showToast, setCheckoutAddressId} = useShop();
  const [form, setForm] = useState<AddressInput>(EMPTY);
  const [loaded, setLoaded] = useState(!addressId);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const phoneRef = useRef<ComponentRef<typeof TextInput>>(null);
  const addressRef = useRef<ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    if (!addressId) {
      return;
    }
    repo
      .getAddress(addressId)
      .then(address => {
        setForm({recipient: address.recipient, phone: address.phone, addressText: address.addressText});
        setLoaded(true);
      })
      .catch(e => {
        setError(errorMessage(e));
        setLoaded(true);
      });
  }, [repo, addressId]);

  const update = (key: keyof AddressInput) => (value: string) => {
    setForm(current => ({...current, [key]: value}));
    if (fieldErrors[key]) {
      setFieldErrors(current => ({...current, [key]: undefined}));
    }
  };

  const save = async () => {
    setError(null);
    const errors = validateAddress(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }
    setSaving(true);
    try {
      const saved = await repo.saveAddress(form, addressId);
      if (selectForCheckout) {
        setCheckoutAddressId(saved.id);
      }
      refresh();
      showToast(addressId ? 'Alamat diperbarui' : 'Alamat disimpan');
      navigation.goBack();
    } catch (e) {
      if (isShopError(e) && e.fieldErrors) {
        setFieldErrors(e.fieldErrors);
      }
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.safe} behavior="padding">
        <ScrollView
          testID="address.form"
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {error ? <Banner testID="address.form.error" tone="error" message={error} /> : null}
          <TextField
            testID="address.form.recipient"
            label="Nama penerima"
            placeholder="Contoh: Pengguna Demo"
            value={form.recipient}
            onChangeText={update('recipient')}
            error={fieldErrors.recipient}
            maxLength={RECIPIENT_MAX + 20}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => phoneRef.current?.focus()}
            submitBehavior="submit"
          />
          <TextField
            ref={phoneRef}
            testID="address.form.phone"
            label="Nomor kontak"
            placeholder="Contoh: 081234567890"
            value={form.phone}
            onChangeText={update('phone')}
            error={fieldErrors.phone}
            keyboardType="phone-pad"
            maxLength={24}
            returnKeyType="next"
            onSubmitEditing={() => addressRef.current?.focus()}
            submitBehavior="submit"
          />
          <TextField
            ref={addressRef}
            testID="address.form.addressText"
            label="Alamat lengkap"
            placeholder="Jalan, nomor rumah, kota"
            value={form.addressText}
            onChangeText={update('addressText')}
            error={fieldErrors.addressText}
            maxLength={ADDRESS_MAX + 20}
            multiline
          />
        </ScrollView>
        <View style={styles.footer}>
          <Button testID="address.form.save" title="Simpan alamat" loading={saving} onPress={save} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.background},
  content: {padding: space.lg, gap: space.lg},
  footer: {
    padding: space.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
