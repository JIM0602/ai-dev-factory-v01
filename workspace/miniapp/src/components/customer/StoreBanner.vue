<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  photos: string[];
  height?: number;
}

withDefaults(defineProps<Props>(), {
  photos: () => [],
  height: 400,
});

const current = ref(0);

function onSwiperChange(e: { detail: { current: number } }): void {
  current.value = e.detail.current;
}
</script>

<template>
  <view class="store-banner" :style="{ height: `${height}rpx` }">
    <swiper
      v-if="photos.length > 0"
      class="banner-swiper"
      :autoplay="true"
      :circular="true"
      :interval="4000"
      :duration="500"
      @change="onSwiperChange"
    >
      <swiper-item v-for="(photo, index) in photos" :key="index">
        <image class="banner-image" :src="photo" mode="aspectFill" />
      </swiper-item>
    </swiper>
    <!-- 无图片时显示占位 -->
    <view v-else class="banner-placeholder">
      <text class="banner-placeholder-icon">&#x1F3E0;</text>
      <text class="banner-placeholder-text">门店照片</text>
    </view>

    <!-- 指示器 -->
    <view v-if="photos.length > 1" class="banner-indicators">
      <view
        v-for="(_, idx) in photos"
        :key="idx"
        class="banner-dot"
        :class="{ 'banner-dot--active': idx === current }"
      />
    </view>
  </view>
</template>

<style scoped>
.store-banner {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.banner-swiper {
  width: 100%;
  height: 100%;
}

.banner-image {
  width: 100%;
  height: 100%;
}

.banner-placeholder {
  width: 100%;
  height: 100%;
  background: var(--color-bg-surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
}

.banner-placeholder-icon {
  font-size: 80rpx;
}

.banner-placeholder-text {
  font-size: 24rpx;
  color: var(--color-text-placeholder);
}

.banner-indicators {
  position: absolute;
  bottom: var(--space-md);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12rpx;
}

.banner-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transition: background 200ms;
}

.banner-dot--active {
  background: #FFFFFF;
}
</style>
