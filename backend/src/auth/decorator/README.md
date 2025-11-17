# `@GetUser()` 自訂參數裝飾器

## 功能簡介

自動從目前的 HTTP Request 中，抓取已驗證的使用者資料，並注入到 Controller 方法參數中。

可直接取得已登入使用者資訊，而不需要手動存取 Request 物件。

## 使用方式

```ts
@Get('profile')
getProfile(@GetUser() user: User) {
    return user;
}
```

以上範例中，user 會自動從目前的 HTTP Request 中提取 req.user ，不需要手動存取 Request

## 程式邏輯說明

```ts
export const GetUser = createParamDecorator(
  (_data, ctx: ExecutionContext): User => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
```

| 參數                    | 說明                                                         |
| :---------------------- | :----------------------------------------------------------- |
| `_data`                 | 當使用 `@GetUser('xxx')` 時可傳入資料，這裡沒用故以 `_` 命名 |
| `ctx: ExecutionContext` | 包含此次請求的所有上下文資訊（路由、身分驗證、請求來源等）   |
| `req`                   | 把 ctx 切換成「HTTP 模式」，並取得 Express 的 Request 物件   |
| `return req.user`       | 回傳使用者資料                                               |
