import Joi from 'joi';

/** 驗證環境變數的格式正確性 */
export const configValidationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  STAGE: Joi.string().required(),
  DB_NAME: Joi.string().optional(), // SQLite 檔案路徑，可選（預設為 data/gathering.db）
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRES: Joi.string().required(),
  JWT_REFRESH_EXPIRES: Joi.string().required(),
  JWT_COOKIE_SECRET: Joi.string().required(),
});
