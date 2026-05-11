/**
 * 表单校验工具
 */

/** 手机号正则（中国大陆） */
const PHONE_REGEX = /^1[3-9]\d{9}$/;

/** 验证手机号 */
export function validatePhone(phone: string): { valid: boolean; message: string } {
  if (!phone || !phone.trim()) {
    return { valid: false, message: '请输入手机号' };
  }
  if (!PHONE_REGEX.test(phone.trim())) {
    return { valid: false, message: '请输入正确的11位手机号' };
  }
  return { valid: true, message: '' };
}

/** 验证姓名 */
export function validateName(name: string): { valid: boolean; message: string } {
  if (!name || !name.trim()) {
    return { valid: false, message: '请输入姓名' };
  }
  const trimmed = name.trim();
  if (trimmed.length < 1) {
    return { valid: false, message: '姓名不能为空' };
  }
  if (trimmed.length > 20) {
    return { valid: false, message: '姓名不能超过20个字' };
  }
  return { valid: true, message: '' };
}

/** 验证人数 */
export function validateGuestCount(count: number): { valid: boolean; message: string } {
  if (!Number.isInteger(count) || count < 1) {
    return { valid: false, message: '人数至少为1' };
  }
  if (count > 10) {
    return { valid: false, message: '人数不能超过10' };
  }
  return { valid: true, message: '' };
}

/** 验证备注 */
export function validateRemark(remark: string): { valid: boolean; message: string } {
  if (remark && remark.length > 100) {
    return { valid: false, message: '备注不能超过100字' };
  }
  return { valid: true, message: '' };
}

/** 验证券码 */
export function validateCouponCode(code: string): { valid: boolean; message: string } {
  if (!code || !code.trim()) {
    return { valid: false, message: '请输入券码' };
  }
  if (code.trim().length < 2) {
    return { valid: false, message: '券码格式不正确' };
  }
  return { valid: true, message: '' };
}

/** 验证桌位号 */
export function validateTableNumber(num: number): { valid: boolean; message: string } {
  if (num !== undefined && num !== null) {
    if (!Number.isInteger(num) || num < 1) {
      return { valid: false, message: '桌位号必须为正整数' };
    }
  }
  return { valid: true, message: '' };
}
