import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'change-me-to-a-random-secret-string',
  expiresInCustomer: parseInt(process.env.JWT_EXPIRES_IN_CUSTOMER || '604800', 10),
  expiresInMerchant: parseInt(process.env.JWT_EXPIRES_IN_MERCHANT || '86400', 10),
}));

export const jwtConfig = () => ({
  secret: process.env.JWT_SECRET || 'change-me-to-a-random-secret-string',
  expiresInCustomer: parseInt(process.env.JWT_EXPIRES_IN_CUSTOMER || '604800', 10),
  expiresInMerchant: parseInt(process.env.JWT_EXPIRES_IN_MERCHANT || '86400', 10),
});
