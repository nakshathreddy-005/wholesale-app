export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'wholesale_super_secret_key_2024',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
