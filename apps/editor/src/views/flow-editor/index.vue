<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { FlowEditor } from '@flowgame/vue'
const route = useRoute()

const readonly = computed(() => route.query.mode === 'view')
const redisKey = computed(() =>
  typeof route.query.redisKey === 'string' ? route.query.redisKey.trim() : ''
)
const flowName = computed(() =>
  typeof route.query.name === 'string' ? route.query.name.trim() : ''
)
</script>

<template>
  <FlowEditor
    :readonly="readonly"
    :redis-key="redisKey"
    :flow-name="flowName"
  />
</template>
