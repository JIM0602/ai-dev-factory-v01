<template>
  <div class="skeleton-container" :class="{ 'is-table': type === 'table' }">
    <template v-if="type === 'table'">
      <div v-for="i in rows" :key="i" class="skeleton-row">
        <div v-for="j in cols" :key="j" class="skeleton-cell" :style="{ width: getColWidth(j) }">
          <div class="skeleton-bar"></div>
        </div>
      </div>
    </template>
    <template v-else>
      <div v-for="i in rows" :key="i" class="skeleton-card">
        <div class="skeleton-bar skeleton-title"></div>
        <div class="skeleton-bar skeleton-line"></div>
        <div class="skeleton-bar skeleton-line short"></div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: 'table' | 'card'
    rows?: number
    cols?: number
  }>(),
  {
    type: 'table',
    rows: 5,
    cols: 6,
  }
)

const colWidths = ['15%', '18%', '12%', '12%', '10%', '33%']

function getColWidth(index: number): string {
  return colWidths[(index - 1) % colWidths.length]
}
</script>

<style scoped>
.skeleton-container {
  padding: 0;
}

.skeleton-row {
  display: flex;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}

.skeleton-cell {
  display: flex;
  align-items: center;
}

.skeleton-card {
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  margin-bottom: 12px;
  background: var(--color-bg-card);
}

.skeleton-bar {
  height: 14px;
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    var(--color-bg-surface) 25%,
    var(--color-bg-hover) 50%,
    var(--color-bg-surface) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  width: 100%;
}

.skeleton-title {
  width: 40%;
  height: 16px;
  margin-bottom: 12px;
}

.skeleton-line {
  width: 100%;
  margin-bottom: 8px;
}

.skeleton-line.short {
  width: 60%;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
