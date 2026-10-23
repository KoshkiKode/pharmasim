import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, useTheme, Card } from 'react-native-paper';
import { unlockPro } from '@pharmasim/engine';

interface PaywallModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess: () => void;
}

export function PaywallModal({ visible, onDismiss, onSuccess }: PaywallModalProps) {
  const theme = useTheme();
  const [licenseKey, setLicenseKey] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');

  const handleUnlock = () => {
    setErrorMsg('');
    const result = unlockPro(licenseKey);
    if (result.success) {
      setLicenseKey('');
      onSuccess();
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.containerStyle}>
        <Card style={styles.card}>
          <Card.Title 
            title="Analysis Limit Reached" 
            subtitle="Upgrade to Pharmasim Pro for unlimited analyses"
            titleStyle={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 20 }}
          />
          <Card.Content>
            <Text style={styles.description}>
              You have reached your limit of free analyses. Enter a Pro license key to continue performing simulations without limits.
            </Text>

            <TextInput
              label="License Key (e.g. PHARMASIM-PRO-2026)"
              value={licenseKey}
              onChangeText={setLicenseKey}
              mode="outlined"
              style={styles.input}
              autoCapitalize="characters"
              error={!!errorMsg}
            />

            {!!errorMsg && (
              <Text style={{ color: theme.colors.error, marginBottom: 8 }}>{errorMsg}</Text>
            )}

            <Button 
              mode="contained" 
              onPress={handleUnlock}
              disabled={!licenseKey.trim()}
              style={styles.unlockBtn}
            >
              Unlock Pro Access
            </Button>

            <Button 
              mode="text" 
              onPress={onDismiss}
              style={styles.closeBtn}
            >
              Cancel
            </Button>
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  containerStyle: {
    padding: 20,
  },
  card: {
    padding: 8,
  },
  description: {
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    marginBottom: 12,
  },
  unlockBtn: {
    marginTop: 8,
    paddingVertical: 4,
  },
  closeBtn: {
    marginTop: 8,
  },
});
