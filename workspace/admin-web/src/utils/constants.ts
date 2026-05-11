/** 预约状态枚举 */
export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

/** 预约来源 */
export enum ReservationSource {
  CUSTOMER = 'customer',
  MERCHANT = 'merchant',
}

/** 团购券来源 */
export enum CouponSource {
  MEITUAN = 'meituan',
  DOUYIN = 'douyin',
  OTHER = 'other',
}

/** 计时状态 */
export enum TimerStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

/** 状态标签配置 */
export const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; shape: string }> = {
  [ReservationStatus.PENDING]: {
    label: '待确认',
    color: 'var(--color-status-pending)',
    bgColor: 'var(--color-status-pending-bg)',
    shape: '◇',
  },
  [ReservationStatus.CONFIRMED]: {
    label: '已确认',
    color: 'var(--color-status-confirmed)',
    bgColor: 'var(--color-status-confirmed-bg)',
    shape: '●',
  },
  [ReservationStatus.REJECTED]: {
    label: '已拒绝',
    color: 'var(--color-status-rejected)',
    bgColor: 'var(--color-status-rejected-bg)',
    shape: '⊛',
  },
  [ReservationStatus.CANCELLED]: {
    label: '已取消',
    color: 'var(--color-status-cancelled)',
    bgColor: 'var(--color-status-cancelled-bg)',
    shape: '○',
  },
  [ReservationStatus.IN_PROGRESS]: {
    label: '计时中',
    color: 'var(--color-status-in-progress)',
    bgColor: 'var(--color-status-in-progress-bg)',
    shape: '◉',
  },
  [ReservationStatus.COMPLETED]: {
    label: '已完成',
    color: 'var(--color-status-completed)',
    bgColor: 'var(--color-status-completed-bg)',
    shape: '■',
  },
}

/** 状态选项列表（用于筛选下拉） */
export const STATUS_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: `${STATUS_CONFIG.pending.shape} 待确认`, value: ReservationStatus.PENDING },
  { label: `${STATUS_CONFIG.confirmed.shape} 已确认`, value: ReservationStatus.CONFIRMED },
  { label: `${STATUS_CONFIG.rejected.shape} 已拒绝`, value: ReservationStatus.REJECTED },
  { label: `${STATUS_CONFIG.cancelled.shape} 已取消`, value: ReservationStatus.CANCELLED },
  { label: `${STATUS_CONFIG.in_progress.shape} 计时中`, value: ReservationStatus.IN_PROGRESS },
  { label: `${STATUS_CONFIG.completed.shape} 已完成`, value: ReservationStatus.COMPLETED },
]

/** 团购券来源选项 */
export const COUPON_SOURCE_OPTIONS = [
  { label: '全部', value: 'all' },
  { label: '美团', value: CouponSource.MEITUAN },
  { label: '抖音', value: CouponSource.DOUYIN },
  { label: '其他', value: CouponSource.OTHER },
]

/** 时段时长选项 */
export const SLOT_DURATION_OPTIONS = [
  { label: '30 分钟', value: 30 },
  { label: '60 分钟', value: 60 },
  { label: '90 分钟', value: 90 },
  { label: '120 分钟', value: 120 },
]

/** 星期选项 */
export const WEEKDAY_OPTIONS = [
  { label: '周日', value: 0 },
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
]

/** 分页默认配置 */
export const PAGINATION_DEFAULTS = {
  page: 1,
  pageSize: 20,
  pageSizes: [10, 20, 50],
}

/** 上传限制 */
export const UPLOAD_LIMITS = {
  maxPhotos: 9,
  minPhotos: 1,
  maxFileSize: 2 * 1024 * 1024, // 2MB
  acceptTypes: ['image/jpeg', 'image/png', 'image/webp'],
}

/** 表单校验规则 */
export const VALIDATION_RULES = {
  phone: /^1[3-9]\d{9}$/,
  nameMaxLength: 30,
  addressMaxLength: 200,
  descriptionMaxLength: 200,
  remarkMaxLength: 100,
  addressGuideMaxLength: 100,
  maxGuestCount: 10,
  minGuestCount: 1,
}
