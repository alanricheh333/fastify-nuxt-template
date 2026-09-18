<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <UContainer class="py-10">
    <div class="space-y-4">
      <UBadge color="primary" variant="soft">
        {{ t('starter.badge') }}
      </UBadge>

      <div class="space-y-2">
        <h1 class="text-3xl font-semibold tracking-tight">
          {{ t('starter.title') }}
        </h1>
        <p class="text-muted max-w-2xl">
          {{ t('starter.description') }}
        </p>
      </div>
    </div>
  </UContainer>
</template>
