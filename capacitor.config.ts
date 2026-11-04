import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.dogwalk.app',
  appName: 'DogWalk',
  webDir: 'out',
  server: { url: process.env.NEXT_PUBLIC_APP_URL, cleartext: true },
}

export default config
