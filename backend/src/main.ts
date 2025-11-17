import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SuccessResponseInterceptor } from './common/interceptors/success-response.interceptor';

async function bootstrap() {
  const logger = new Logger();
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser(process.env.JWT_COOKIE_SECRET));

  // 註冊全域例外過濾器
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new SuccessResponseInterceptor());

  // 開啟 CORS 讓前端連接
  app.enableCors({
    origin: 'http://localhost:8080', // 允許的來源
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

  // 設定Swagger
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
  const documentFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, documentFactory);

  app.use(cookieParser('my-secret-key'));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application listening on port ${port}`);
  logger.log(`前往Swagger： http://localhost:${port}/api`);
}
bootstrap();
