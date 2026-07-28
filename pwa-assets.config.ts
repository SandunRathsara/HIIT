import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: {
    preset: '2023',
  },
  preset: {
    ...minimal2023Preset,
    // iOS splash/home-screen icon has no transparency — match the app background
    apple: {
      sizes: [180],
      padding: 0,
      resizeOptions: { background: '#0d1b2a', fit: 'contain' },
    },
  },
  images: ['public/favicon.svg'],
})
