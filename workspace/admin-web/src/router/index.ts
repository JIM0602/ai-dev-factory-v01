import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/login/LoginPage.vue'),
    meta: { requiresAuth: false, title: '商家登录' },
  },
  {
    path: '/',
    component: () => import('@/components/layout/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard',
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/pages/dashboard/DashboardPage.vue'),
        meta: { title: '工作台' },
      },
      {
        path: 'reservations',
        name: 'Reservations',
        component: () => import('@/pages/reservations/ReservationPage.vue'),
        meta: { title: '预约管理' },
      },
      {
        path: 'store/settings',
        name: 'StoreSettings',
        component: () => import('@/pages/store/StoreSettingsPage.vue'),
        meta: { title: '门店设置' },
      },
      {
        path: 'store/rules',
        name: 'ReservationRules',
        component: () => import('@/pages/store/ReservationRulesPage.vue'),
        meta: { title: '预约规则' },
      },
      {
        path: 'store/capacity',
        name: 'Capacity',
        component: () => import('@/pages/store/CapacityPage.vue'),
        meta: { title: '容量设置' },
      },
      {
        path: 'members',
        name: 'Members',
        component: () => import('@/pages/members/MemberPage.vue'),
        meta: { title: '会员管理' },
      },
      {
        path: 'coupons',
        name: 'Coupons',
        component: () => import('@/pages/coupons/CouponPage.vue'),
        meta: { title: '团购券记录' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

/** 路由守卫：未登录跳转登录页 */
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('admin_token')

  // 检查是否需要认证（父路由或当前路由的 meta）
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth !== false)

  if (requiresAuth) {
    if (!token) {
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
  }

  // 已登录访问登录页则跳转到工作台
  if (to.name === 'Login' && token) {
    next({ name: 'Dashboard' })
    return
  }

  // 设置页面标题
  document.title = `${to.meta.title || '拼豆店管理后台'} - 拼豆店管理后台`

  next()
})

export default router
