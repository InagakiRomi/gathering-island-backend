import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as fs from 'node:fs';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SuccessResponseInterceptor } from './common/interceptors/success-response.interceptor';

/** 解析 CORS 來源白名單 */
function resolveCorsOrigins(): string[] {
  return (
    process.env.CORS_ORIGINS ??
    'http://localhost:5172,https://inagakiromi.github.io'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/** 註冊中介軟體（Middleware） */
function setupMiddleware(app: Awaited<ReturnType<typeof NestFactory.create>>) {
  app.use(cookieParser(process.env.JWT_COOKIE_SECRET));
}

/** 設定全域功能（Filter、Interceptor、CORS、ValidationPipe） */
function setupGlobalFeatures(
  app: Awaited<ReturnType<typeof NestFactory.create>>,
) {
  // 註冊全域例外過濾器
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new SuccessResponseInterceptor());

  // 開啟 CORS 讓前端連接
  app.enableCors({
    origin: resolveCorsOrigins(), // 允許的來源白名單
    credentials: true, // 允許帶 cookie/headers 等認證資訊
  });

  // 設定全域的驗證管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自動移除 DTO 中未定義的屬性
      forbidNonWhitelisted: true, //如果請求中有多餘的欄位，就直接丟出錯誤
      transform: true, //自動轉換請求參數到 DTO 定義的類型
    }),
  );
}

/** 設定 Swagger 文件與輸出 swagger.json */
function setupSwagger(app: Awaited<ReturnType<typeof NestFactory.create>>) {
  const config = new DocumentBuilder()
    .setTitle('Gathering List')
    .setDescription('The Gathering List API description')
    .setVersion('1.0')
    .addTag('Auth', '關於帳號的操作')
    .addTag('Users', '關於帳號資料的操作')
    .addTag('Gatherings', '關於聚會的操作')
    .addTag('Tags', '關於標籤的操作')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  fs.writeFileSync('swagger.json', JSON.stringify(document, null, 2));
}

/** 啟動應用程式 */
async function bootstrap() {
  const logger = new Logger();
  const app = await NestFactory.create(AppModule);
  setupMiddleware(app);
  setupGlobalFeatures(app);
  setupSwagger(app);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application listening on port ${port}`);
  logger.log(`前往Swagger： http://localhost:${port}/api`);
}
void bootstrap();
