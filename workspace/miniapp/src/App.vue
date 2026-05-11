<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import { useUserStore } from '@/store/user';
import { USER_ROLE } from '@/utils/constants';
import type { UserRole } from '@/utils/constants';

const userStore = useUserStore();

onLaunch(async () => {
  console.log('App Launch');

  // 尝试恢复登录状态
  const hasSession = userStore.restoreSession();
  if (hasSession) {
    console.log('Session restored');
  } else {
    // 自动登录
    const success = await userStore.login();
    if (success) {
      console.log('Auto login success, role:', userStore.role);
      // 根据角色切换到对应 tabBar
      switchTabBarByRole(userStore.role);
    } else {
      // 登录失败，默认顾客端
      switchTabBarByRole(USER_ROLE.CUSTOMER);
    }
  }
});

onShow(() => {
  console.log('App Show');
});

onHide(() => {
  console.log('App Hide');
});

/**
 * 根据角色切换 TabBar
 */
function switchTabBarByRole(role: UserRole): void {
  if (role === USER_ROLE.MERCHANT) {
    // 切换到商家端 tab
    uni.setStorageSync('active_tabbar', 'merchant');
  } else {
    // 默认用户端 tab
    uni.setStorageSync('active_tabbar', 'customer');
  }
}
</script>

<style lang="scss">
@import '@/static/styles/global.scss';
@import '@/static/styles/variables.scss';
</style>
