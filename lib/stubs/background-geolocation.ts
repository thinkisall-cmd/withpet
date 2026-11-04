// 웹 빌드용 stub — 실제 동작은 Capacitor 네이티브 환경에서만 함
const BackgroundGeolocation = {
  addWatcher: async (_opts: unknown, _cb: unknown): Promise<string> => '',
  removeWatcher: async (_opts: { id: string }): Promise<void> => {},
}

export default BackgroundGeolocation
