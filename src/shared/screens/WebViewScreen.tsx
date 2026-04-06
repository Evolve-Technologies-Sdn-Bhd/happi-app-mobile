import React, { useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../app/navigation/types';
import { Header } from '../components';
import { Colors } from '../constants/colors';

type RouteProps = RouteProp<RootStackParamList, 'WebView'>;

function getViewUrl(url: string): string {
  if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i.test(url)) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  }
  return url;
}

const WebViewScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const { url, title } = route.params;
  const [key, setKey] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);

  const retry = useCallback(() => {
    setLoadFailed(false);
    setKey((k) => k + 1);
  }, []);

  return (
    <View style={styles.container}>
      <Header title={title || ''} showBack />
      <View style={styles.webviewWrapper}>
        {loadFailed ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load document.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={retry} activeOpacity={0.8}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            key={key}
            source={{ uri: getViewUrl(url) }}
            style={styles.webview}
            startInLoadingState
            injectedJavaScript={`
              document.documentElement.style.backgroundColor = '#FFFFFF';
              document.body.style.backgroundColor = '#FFFFFF';
              var style = document.createElement('style');
              style.innerHTML = 'body, html, #drive-viewer, .ndfHFb-c4YZDc { background: #fff !important; }';
              document.head.appendChild(style);
            `}
            onError={() => setLoadFailed(true)}
            onHttpError={(e) => { if (e.nativeEvent.statusCode >= 400) setLoadFailed(true); }}
            renderLoading={() => (
              <ActivityIndicator
                size="large"
                color={Colors.primary}
                style={styles.loader}
              />
            )}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  webviewWrapper: { flex: 1, paddingTop: 12, backgroundColor: '#FFFFFF' },
  webview: { flex: 1, backgroundColor: '#FFFFFF' },
  loader: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: { fontSize: 14, color: '#808080' },
  retryBtn: {
    paddingHorizontal: 24, paddingVertical: 10,
    backgroundColor: '#FDB813', borderRadius: 20,
  },
  retryText: { fontSize: 14, color: '#FFFFFF', fontWeight: '700' },
});

export default WebViewScreen;
