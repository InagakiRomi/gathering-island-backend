export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  stage: process.env.STAGE || 'dev',
  appTimezone: process.env.APP_TIMEZONE || 'UTC',

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'gathering',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
    cookieSecret: process.env.JWT_COOKIE_SECRET,
  },
});
