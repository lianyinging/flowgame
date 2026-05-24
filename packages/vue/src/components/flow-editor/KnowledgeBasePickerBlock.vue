<script setup lang="ts">
import { KNOWLEDGE_BASE_FIELD_LABEL } from '@flowgame/core'
</script>

<template>
  <div class="input-container tf-kb-input-container">
    <div class="input-header">
      参数名称
    </div>
    <div class="input-header">
      参数值
    </div>
    <div class="input-header" aria-hidden="true" />

    <div class="input-item">
      <span class="tf-param-name-label">{{ KNOWLEDGE_BASE_FIELD_LABEL }}</span>
    </div>
    <div class="input-item">
      <slot />
    </div>
    <div class="input-item tf-kb-input-container__more" aria-hidden="true" />
  </div>
</template>

<style scoped lang="scss">
@use '../../styles/kb-input-container.scss';
</style>
