import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Updates from 'expo-updates';

import { clearAppStorage } from '../utils/appStorage';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  errorMessage?: string;
};

export default class AppErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    errorMessage: '',
  };

  static getDerivedStateFromError(): State {
    return { hasError: true, errorMessage: '' };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AppErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      errorMessage: error?.message ? String(error.message) : 'Error desconocido de React.',
    });
  }

  private handleReload = async () => {
    try {
      await Updates.reloadAsync();
    } catch (error) {
      console.warn('Failed to reload after error boundary fallback:', error);
    }
  };

  private handleResetStorage = async () => {
    await clearAppStorage();
    await this.handleReload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={styles.screen}>
        <View style={styles.card}>
          <Text style={styles.title}>La app tuvo un problema</Text>
          <Text style={styles.text}>
            Puedes recargar o limpiar los datos guardados del dispositivo si el problema vino del almacenamiento local.
          </Text>
          {this.state.errorMessage ? (
            <Text style={styles.error}>{this.state.errorMessage}</Text>
          ) : null}

          <View style={styles.actions}>
            <Pressable style={styles.primaryButton} onPress={() => { void this.handleReload(); }}>
              <Text style={styles.primaryButtonText}>Recargar app</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => { void this.handleResetStorage(); }}>
              <Text style={styles.secondaryButtonText}>Limpiar almacenamiento y recargar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  text: {
    fontSize: 14,
    lineHeight: 21,
    color: '#475569',
  },
  error: {
    color: '#b91c1c',
    fontSize: 12,
    lineHeight: 18,
    backgroundColor: '#fff1f2',
    borderRadius: 10,
    padding: 10,
  },
  actions: {
    marginTop: 8,
    gap: 10,
  },
  primaryButton: {
    borderRadius: 18,
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff1f2',
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#be123c',
    fontWeight: '700',
  },
});
