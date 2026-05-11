import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { wechatLogin } from '@/api/auth';
import { request } from '@/api/request';
import type { UserRole } from '@/utils/constants';
import { USER_ROLE } from '@/utils/constants';

export const useUserStore = defineStore('user', () => {
  const token = ref<string>('');
  const openid = ref<string>('');
  const nickname = ref<string>('');
  const role = ref<UserRole>(USER_ROLE.CUSTOMER);
  const isLoggedIn = ref(false);
  const loading = ref(false);

  const isMerchant = computed(() => role.value === USER_ROLE.MERCHANT);
  const isCustomer = computed(() => role.value === USER_ROLE.CUSTOMER);

  /** 微信登录 */
  async function login(): Promise<boolean> {
    loading.value = true;
    try {
      const [loginErr, loginRes] = await uni.login();
      if (loginErr || !loginRes?.code) {
        console.error('wx.login failed:', loginErr);
        return false;
      }

      const res = await wechatLogin(loginRes.code);
      if (res.code === 0 && res.data) {
        token.value = res.data.token;
        openid.value = res.data.openid;
        nickname.value = res.data.nickname;
        role.value = res.data.role as UserRole;
        isLoggedIn.value = true;
        request.setToken(res.data.token, res.data.expires_in);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Login error:', e);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /** 切换角色（商家端和用户端切换） */
  function switchRole(newRole: UserRole): void {
    role.value = newRole;
  }

  /** 登出 */
  function logout(): void {
    token.value = '';
    openid.value = '';
    nickname.value = '';
    role.value = USER_ROLE.CUSTOMER;
    isLoggedIn.value = false;
    request.clearToken();
  }

  /** 从本地存储恢复登录状态 */
  function restoreSession(): boolean {
    const savedToken = request.getToken();
    if (savedToken) {
      token.value = savedToken;
      isLoggedIn.value = true;
      return true;
    }
    return false;
  }

  return {
    token,
    openid,
    nickname,
    role,
    isLoggedIn,
    loading,
    isMerchant,
    isCustomer,
    login,
    switchRole,
    logout,
    restoreSession,
  };
});
