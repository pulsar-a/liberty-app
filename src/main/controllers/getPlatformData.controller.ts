export const getPlatformDataController = () => async () => {
  return {
    platform: process.platform,
    arch: process.arch,
  }
}
