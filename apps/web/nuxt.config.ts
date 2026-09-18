export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@pinia/colada-nuxt',
    '@nuxtjs/i18n',
    '@vite-pwa/nuxt',
  ],

  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  i18n: {
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    locales: [
      { code: 'en', name: 'English', language: 'en-US', dir: 'ltr', file: 'en.json' },
      { code: 'ar', name: 'العربية', language: 'ar-SY', dir: 'rtl', file: 'ar.json' },
    ],
    lazy: true,
    langDir: 'locales',
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'App',
      short_name: 'App',
      display: 'standalone',
      start_url: '/',
      theme_color: '#ffffff',
      background_color: '#ffffff',
    },
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001',
    },
  },

  compatibilityDate: '2026-09-18',
})
