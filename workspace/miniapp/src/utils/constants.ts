/**
 * 拼豆店预约计时小程序 - 常量定义
 * 状态枚举、颜色映射、选项列表
 */

// ============================================
// 预约状态
// ============================================
export const RESERVATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export type ReservationStatus = (typeof RESERVATION_STATUS)[keyof typeof RESERVATION_STATUS];

// 预约状态中文映射
export const RESERVATION_STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  rejected: '已拒绝',
  cancelled: '已取消',
  in_progress: '计时中',
  completed: '已完成',
};

// 预约状态形状标识（双编码：颜色 + 形状，考虑色盲用户）
export const RESERVATION_STATUS_SHAPE: Record<ReservationStatus, string> = {
  pending: '◇',
  confirmed: '●',
  rejected: '⊘',
  cancelled: '○',
  in_progress: '◉',
  completed: '■',
};

// 预约状态颜色（背景色 + 文字色）
export const RESERVATION_STATUS_COLORS: Record<ReservationStatus, { bg: string; text: string; bar: string }> = {
  pending: { bg: '#FEF0EB', text: '#E07A5F', bar: '#E07A5F' },
  confirmed: { bg: '#EDF5F0', text: '#81B29A', bar: '#81B29A' },
  rejected: { bg: '#FDEDE9', text: '#E76F51', bar: '#E76F51' },
  cancelled: { bg: '#F5F3F1', text: '#B5A99E', bar: '#B5A99E' },
  in_progress: { bg: '#FEF0EB', text: '#E07A5F', bar: '#E07A5F' },
  completed: { bg: '#EBF3F5', text: '#7B9EA8', bar: '#7B9EA8' },
};

// ============================================
// 计时状态
// ============================================
export const TIMER_STATUS = {
  NORMAL: 'normal',
  URGENT: 'urgent',
  CRITICAL: 'critical',
} as const;

export type TimerStatus = (typeof TIMER_STATUS)[keyof typeof TIMER_STATUS];

// 紧急阈值（秒）
export const TIMER_URGENT_THRESHOLD = 15 * 60; // 15分钟
export const TIMER_CRITICAL_THRESHOLD = 5 * 60; // 5分钟

// ============================================
// 预约来源
// ============================================
export const RESERVATION_SOURCE = {
  CUSTOMER: 'customer',
  MERCHANT: 'merchant',
} as const;

export type ReservationSource = (typeof RESERVATION_SOURCE)[keyof typeof RESERVATION_SOURCE];

export const RESERVATION_SOURCE_LABEL: Record<ReservationSource, string> = {
  customer: '小程序',
  merchant: '商家代约',
};

// ============================================
// 团购券来源
// ============================================
export const COUPON_SOURCE = {
  MEITUAN: 'meituan',
  DOUYIN: 'douyin',
  OTHER: 'other',
} as const;

export type CouponSource = (typeof COUPON_SOURCE)[keyof typeof COUPON_SOURCE];

export const COUPON_SOURCE_LABEL: Record<CouponSource, string> = {
  meituan: '美团',
  douyin: '抖音',
  other: '其他',
};

// ============================================
// 用户角色
// ============================================
export const USER_ROLE = {
  CUSTOMER: 'customer',
  MERCHANT: 'merchant',
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

// ============================================
// TabBar 配置
// ============================================
export const CUSTOMER_TABS = [
  { pagePath: 'pages/customer/store/index', text: '首页', icon: 'home' },
  { pagePath: 'pages/customer/reservation/my-list', text: '我的预约', icon: 'calendar' },
];

export const MERCHANT_TABS = [
  { pagePath: 'pages/merchant/dashboard/index', text: '工作台', icon: 'dashboard' },
  { pagePath: 'pages/merchant/reservation/list', text: '预约', icon: 'calendar' },
  { pagePath: 'pages/merchant/timer/dashboard', text: '计时', icon: 'timer' },
  { pagePath: 'pages/merchant/member/search', text: '会员', icon: 'member' },
];

// ============================================
// 加时选项
// ============================================
export const EXTENSION_OPTIONS = [
  { label: '+30 分钟', value: 30 },
  { label: '+1 小时', value: 60 },
  { label: '+2 小时', value: 120 },
  { label: '自定义', value: -1 },
];

// ============================================
// 用户端状态筛选标签
// ============================================
export const CUSTOMER_STATUS_TABS = [
  { label: '全部', value: '' },
  { label: '待确认', value: 'pending' },
  { label: '已确认', value: 'confirmed' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
];

// 商家端状态筛选标签
export const MERCHANT_STATUS_TABS = [
  { label: '全部', value: '' },
  { label: '待确认', value: 'pending' },
  { label: '已确认', value: 'confirmed' },
  { label: '计时中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
];

// ============================================
// 星期映射
// ============================================
export const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

// ============================================
// 时段时长选项
// ============================================
export const SLOT_DURATION_OPTIONS = [
  { label: '30 分钟', value: 30 },
  { label: '60 分钟', value: 60 },
  { label: '90 分钟', value: 90 },
  { label: '120 分钟', value: 120 },
];
