/**
 * 日期工具函数
 */
import dayjs from 'dayjs';

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date: string | Date | number): string {
  return dayjs(date).format('YYYY-MM-DD');
}

/**
 * 格式化日期展示给用户
 * 如: "5月11日 周六"
 */
export function formatDateDisplay(date: string | Date): string {
  const d = dayjs(date);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${d.month() + 1}月${d.date()}日 ${weekdays[d.day()]}`;
}

/**
 * 格式化时间戳为用户友好格式
 * 如: "2026-05-11 14:00"
 */
export function formatDateTime(datetime: string | Date): string {
  return dayjs(datetime).format('YYYY-MM-DD HH:mm');
}

/**
 * 格式化时间 HH:mm
 */
export function formatTime(date: string | Date): string {
  return dayjs(date).format('HH:mm');
}

/**
 * 格式化倒计时 (秒 -> mm:ss)
 */
export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * 格式化时长（分钟 -> 可读文字）
 * 如: 92 -> "1小时32分钟"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}小时`;
  return `${h}小时${m}分钟`;
}

/**
 * 生成未来 N 天的日期列表
 */
export function getUpcomingDates(days: number, startFrom: string | Date = new Date()): string[] {
  const dates: string[] = [];
  const start = dayjs(startFrom).startOf('day');
  for (let i = 0; i < days; i++) {
    dates.push(start.add(i, 'day').format('YYYY-MM-DD'));
  }
  return dates;
}

/**
 * 判断日期是否为今天
 */
export function isToday(date: string): boolean {
  return dayjs(date).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
}

/**
 * 判断日期是否在过去
 */
export function isPastDate(date: string): boolean {
  return dayjs(date).startOf('day').isBefore(dayjs().startOf('day'));
}

/**
 * 获取今天的日期字符串
 */
export function getToday(): string {
  return dayjs().format('YYYY-MM-DD');
}

/**
 * 判断时段是否已过去
 */
export function isSlotPast(date: string, startTime: string): boolean {
  const slotStart = dayjs(`${date} ${startTime}`);
  return slotStart.isBefore(dayjs());
}

/**
 * 获取周几 (0-6, 0=周日)
 */
export function getDayOfWeek(date: string): number {
  return dayjs(date).day();
}

/**
 * 判断是否是休息日
 */
export function isRestDay(date: string, restDays: number[]): boolean {
  const dow = getDayOfWeek(date);
  return restDays.includes(dow);
}
