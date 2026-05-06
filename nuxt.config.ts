// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    session: {
      password: process.env.NUXT_SESSION_PASSWORD || ''
    }
  },

  colorMode: {
    preference: 'light',
    fallback: 'light',
    classSuffix: ''
  },

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    'nuxt-auth-utils'
  ],

  devtools: {
    enabled: true
  },

  nitro: {
    preset: 'aws-amplify'
  },

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
