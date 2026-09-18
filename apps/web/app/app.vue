<script setup lang="ts">
const { locale, localeProperties } = useI18n()

useHead(() => ({
  htmlAttrs: {
    lang: localeProperties.value.language ?? locale.value,
    dir: localeProperties.value.dir ?? 'ltr',
  },
}))
</script>

<template>
  <UApp>
    <NuxtPwaManifest />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
