import React, {useState} from 'react';
import {Text} from 'react-native';
import {FaultTarget} from '../data/repository';
import {type} from '../shared/theme';
import {Button, Card} from '../shared/ui';
import {armFault, isFaultArmed} from './faults.e2e';

/** E2E build only: arms one-shot storage faults in the real SQLite repository. */
export function E2EPanel() {
  const [, setTick] = useState(0);
  const arm = (target: FaultTarget) => {
    armFault(target);
    setTick(t => t + 1);
  };
  return (
    <Card testID="e2e.panel">
      <Text style={type.subtitle}>Uji E2E</Text>
      <Text style={type.caption}>Kegagalan berikut hanya berlaku satu kali pada penyimpanan berikutnya.</Text>
      <Button
        testID="e2e.fault.checkout"
        variant="secondary"
        title={isFaultArmed('checkout') ? 'Checkout berikutnya akan gagal' : 'Gagalkan checkout berikutnya'}
        onPress={() => arm('checkout')}
      />
      <Button
        testID="e2e.fault.write"
        variant="secondary"
        title={isFaultArmed('write') ? 'Simpan berikutnya akan gagal' : 'Gagalkan simpan berikutnya'}
        onPress={() => arm('write')}
      />
    </Card>
  );
}
