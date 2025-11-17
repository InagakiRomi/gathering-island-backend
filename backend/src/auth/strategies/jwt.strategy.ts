import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './jwt-payload.interface';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/users/entities/user.entity';
import { EntityManager } from '@mikro-orm/mysql';
import { ErrorCode } from 'src/common/enums/error-code.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly entityManager: EntityManager,
    private configService: ConfigService,
  ) {
    super({
      // 從設定檔拿出 JWT 的「秘密密鑰」
      secretOrKey: configService.get('JWT_ACCESS_SECRET')!,

      // 從 HTTP 請求的 Authorization Header中拿出 JWT
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // 檢查物件是否已過期，若已過期就視為無效
      ignoreExpiration: false,
    });
  }

  /** 驗證邏輯，當 JWT 驗證成功後會自動呼叫此方法 */
  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.entityManager.findOne(User, { id: payload.sub });
    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCode.UNAUTHORIZED,
      });
    }
    return user;
  }
}
