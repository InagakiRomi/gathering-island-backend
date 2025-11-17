# `@Public()` 自訂方法裝飾器

## 功能簡介

將指定的路由標記為「**公開路由**」，使其不受全域身份驗證守衛（如 JWT AuthGuard）的保護。

適用於開放給訪客或未登入使用者存取的 API，例如登入、註冊、忘記密碼等功能。

## 使用方式

```ts
@Public()
@Get('login')
login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto);
}
```

以上範例中，/login 路由會被標記為「公開」，不會被套用全域的身份驗證機制。

## 程式邏輯說明

```ts
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

| 參數／變數      | 說明                                                                    |
| --------------- | ----------------------------------------------------------------------- |
| `IS_PUBLIC_KEY` | 用來儲存 metadata 的鍵值，用來識別路由是否為公開                        |
| `SetMetadata()` | NestJS 提供的函式，用來為裝飾器設定自定義的 metadata                    |
| `Public()`      | 回傳一個裝飾器，會在方法上加入 `isPublic: true` 的 metadata，供守衛辨識 |

這個裝飾器常搭配全域守衛中的 canActivate() 方法做判斷：

```ts
canActivate(context: ExecutionContext): boolean {
  const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
  ]);
  if (isPublic) {
      return true; // 若為公開路由，直接通過驗證
  }

  // 其他驗證邏輯
}
```

透過 Reflector，我們可以在守衛中判斷目前的 route handler 是否被標記為 @Public()，進而決定是否跳過驗證流程。

---

# `@Roles()` 自訂方法裝飾器

## 功能簡介

將指定的路由標記為「角色限制路由」，使路由只能由特定角色的使用者存取。

## 使用方式

```ts
@Roles('admin', 'editor')
@Put('article/:id')
updateArticle(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
  return this.articleService.update(id, dto);
}
```

以上範例中，/article/:id 路由只允許具有 admin 或 editor 角色的使用者存取。

## 程式邏輯說明

```ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

| 參數／變數      | 說明                                                   |
| --------------- | ------------------------------------------------------ |
| `ROLES_KEY`     | 用來儲存 metadata 的鍵值，用於識別此路由所需的角色清單 |
| `SetMetadata()` | NestJS 提供的函式，用來為裝飾器設定自定義的 metadata   |
| `Roles()`       | 建立一個裝飾器，把角色清單存到 metadata 裡，給守衛使用 |

這個裝飾器常搭配 `RolesGuard`（角色守衛）使用：

```ts
canActivate(context: ExecutionContext): boolean {
  const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
    context.getHandler(),
    context.getClass(),
  ]);

  if (!requiredRoles) {
    return true; // 如果沒指定角色，表示不限制角色，直接通過
  }

  const { user } = context.switchToHttp().getRequest();
  return requiredRoles.some((role) => user.roles?.includes(role));
}
```

透過 Reflector，我們可以在守衛中取出指定的角色清單，並與目前登入使用者的角色進行比對，只有符合條件的使用者才能繼續執行該路由處理程序。
