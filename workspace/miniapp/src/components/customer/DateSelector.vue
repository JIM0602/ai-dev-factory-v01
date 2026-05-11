<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { getUpcomingDates, formatDateDisplay, isToday, isPastDate, isRestDay, getDayOfWeek } from '@/utils/date';
import { WEEKDAY_LABELS } from '@/utils/constants';

interface Props {
  modelValue: string;
  advanceDays?: number;
  restDays?: number[];
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  advanceDays: 7,
  restDays: () => [],
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
}>();

const selectedDate = ref(props.modelValue);

watch(() => props.modelValue, (val) => {
  selectedDate.value = val;
});

const dates = computed(() => {
  return getUpcomingDates(props.advanceDays).map(date => ({
    date,
    label: isToday(date) ? '今天' : `${new Date(date).getDate()}日`,
    weekday: WEEKDAY_LABELS[getDayOfWeek(date)],
    isToday: isToday(date),
    isPast: isPastDate(date),
    isRest: isRestDay(date, props.restDays),
    disabled: isPastDate(date) || isRestDay(date, props.restDays),
    display: formatDateDisplay(date),
  }));
});

function selectDate(item: { date: string; disabled: boolean }): void {
  if (item.disabled) return;
  selectedDate.value = item.date;
  emit('update:modelValue', item.date);
  emit('change', item.date);
}
</script>

<template>
  <view class="date-selector">
    <scroll-view scroll-x class="date-scroll" :show-scrollbar="false" enable-flex>
      <view
        v-for="item in dates"
        :key="item.date"
        class="date-item"
        :class="{
          'date-item--selected': selectedDate === item.date,
          'date-item--disabled': item.disabled,
          'date-item--today': item.isToday,
        }"
        @tap="selectDate(item)"
      >
        <text class="date-weekday">{{ item.weekday }}</text>
        <text class="date-day">{{ item.label }}</text>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped>
.date-selector {
  position: relative;
}

.date-scroll {
  white-space: nowrap;
  display: flex;
  padding: var(--space-sm) 0;
}

.date-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100rpx;
  height: 80rpx;
  margin-right: 12rpx;
  border-radius: var(--radius-card-sm);
  background: var(--color-bg-card);
  flex-shrink: 0;
  transition: all 200ms;
}

.date-item--selected {
  background: var(--color-primary-bg);
}

.date-item--selected .date-weekday,
.date-item--selected .date-day {
  color: var(--color-primary);
  font-weight: 600;
}

.date-item--disabled {
  opacity: 0.35;
}

.date-weekday {
  font-size: 22rpx;
  color: var(--color-text-secondary);
  margin-bottom: 2rpx;
}

.date-day {
  font-size: 28rpx;
  color: var(--color-text-primary);
  font-weight: 500;
}
</style>
