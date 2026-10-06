import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {OrderStatus} from '../../domain/types';
import {colors, radius, space} from '../../shared/theme';

export function StatusChip({status, testID}: {status: OrderStatus; testID?: string}) {
  const cancelled = status === 'cancelled';
  return (
    <View style={[styles.chip, cancelled ? styles.cancelled : styles.confirmed]}>
      <Text testID={testID} style={[styles.text, {color: cancelled ? colors.danger : colors.success}]}>
        {cancelled ? 'Dibatalkan' : 'Dikonfirmasi'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: space.xs},
  confirmed: {backgroundColor: colors.successSoft},
  cancelled: {backgroundColor: colors.dangerSoft},
  text: {fontSize: 13, fontWeight: '700'},
});
