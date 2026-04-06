const { getDefaultConfig } = require('expo/metro-config');
const { createProxyMiddleware } = require('http-proxy-middleware');

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg'],
};

// Proxy /api/* → real API server when running in the browser.
// This avoids CORS issues without needing a separate proxy process.
const API_TARGET =
  process.env.EXPO_PUBLIC_API_BASE_URL
    ? new URL(process.env.EXPO_PUBLIC_API_BASE_URL).origin
    : 'https://test-admin.happi.com.my';

const apiProxy = createProxyMiddleware({
  target: API_TARGET,
  changeOrigin: true,
  secure: true,
  timeout: 30000,
  on: {
    proxyReq: (proxyReq, req) => {
      console.log(`[Metro Proxy] ${req.method} ${req.url} → ${API_TARGET}${req.url}`);
    },
    error: (err, req, res) => {
      console.error('[Metro Proxy Error]', err.message);
      res.status(502).json({ error: 'Proxy error', message: err.message });
    },
  },
});

config.server = {
  enhanceMiddleware: (metroMiddleware) => {
    return (req, res, next) => {
      if (req.url.startsWith('/api/')) {
        apiProxy(req, res, next);
      } else {
        metroMiddleware(req, res, next);
      }
    };
  },
};

module.exports = config;
