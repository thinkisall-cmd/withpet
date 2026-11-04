const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Capacitor 네이티브 플러그인은 웹 빌드에서 stub으로 대체
    // 실제 플러그인은 Capacitor 브리지가 런타임에 제공
    config.resolve.alias['@capacitor-community/background-geolocation'] =
      path.resolve('./lib/stubs/background-geolocation.ts')
    return config
  },
}

module.exports = nextConfig
