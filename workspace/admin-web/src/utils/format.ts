import dayjs from 'dayjs'

/** 格式化日期 */
export function formatDate(date: string | Date, format = 'YYYY-MM-DD'): string {
  if (!date) return '-'
  return dayjs(date).format(format)
}

/** 格式化日期时间 */
export function formatDateTime(date: string | Date, format = 'YYYY-MM-DD HH:mm'): string {
  if (!date) return '-'
  return dayjs(date).format(format)
}

/** 格式化手机号（脱敏） */
export function maskPhone(phone: string): string {
  if (!phone || phone.length !== 11) return phone || '-'
  return phone.slice(0, 3) + '****' + phone.slice(7)
}

/** 格式化时长（分钟转为可读文本） */
export function formatDuration(minutes: number): string {
  if (minutes == null || minutes < 0) return '-'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}分钟`
  if (mins === 0) return `${hours}小时`
  return `${hours}小时${mins}分钟`
}

/** 格式化剩余时间（秒转为 mm:ss） */
export function formatRemaining(seconds: number): string {
  if (seconds <= 0) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** 获取时分字符串 */
export function formatTime(date: string | Date): string {
  if (!date) return '-'
  return dayjs(date).format('HH:mm')
}

/** 获取星期文本 */
export function getWeekdayText(day: number): string {
  const map: Record<number, string> = {
    0: '周日', 1: '周一', 2: '周二', 3: '周三',
    4: '周四', 5: '周五', 6: '周六',
  }
  return map[day] || ''
}

/** 获取今天日期字符串 */
export function getToday(): string {
  return dayjs().format('YYYY-MM-DD')
}

/** 获取 N 天后日期字符串 */
export function getDateAfter(days: number): string {
  return dayjs().add(days, 'day').format('YYYY-MM-DD')
}
