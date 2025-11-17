import { SetMetadata } from '@nestjs/common';

// 定義 metadata key，標示是否是公開路由
export const IS_PUBLIC_KEY = 'isPublic';

/** 將路由標示為公開路由 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
