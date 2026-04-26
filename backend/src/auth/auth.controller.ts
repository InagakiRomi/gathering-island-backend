import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { User } from 'src/users/entities/user.entity';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { AuthLoginDto } from './dto/auth-login.dto';
import type { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtConfigHelper } from './strategies/jwt-config.helper';
import { GetUser } from './decorator/get-user.decorator';
import { REFRESH_TOKEN_COOKIE } from 'src/constants/cookie';
import { JwtPayload } from './strategies/jwt-payload.interface';

/** 帳號 Controller */
@ApiBearerAuth('access-token')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private readonly jwtHelper: JwtConfigHelper,
  ) {}

  /**
   * 註冊帳號
   *
   * @param {AuthCredentialsDto} authCredentialsDto 註冊帳號的 DTO
   * @returns {Promise<JwtPayload>} 回傳填入的註冊帳號資料
   */
  @Post('/register')
  @Public()
  @ApiOperation({
    summary: '註冊帳號',
    description:
      '接收使用者註冊資料（包含 email、密碼、顯示名稱），經由雜湊密碼後建立新帳號，並回傳建立成功的使用者資訊',
  })
  @ApiBody({
    type: AuthCredentialsDto,
    examples: {
      only: {
        value: {
          email: 'hana123@test.com',
          password: '123',
          displayName: 'Hana',
        },
      },
    },
  })
  register(
    @Body() authCredentialsDto: AuthCredentialsDto,
  ): Promise<JwtPayload> {
    return this.authService.register(authCredentialsDto);
  }

  /**
   * 登入帳號
   *
   * @param {AuthCredentialsDto} authCredentialsDto 登入帳號的 DTO
   * @param {Response} res HTTP 回應物件，用於設定 refresh token 的 cookie
   * @returns {Promise<{ payload; accessToken: string; refreshToken: string }>} 回傳帳號的資料和 Token
   */
  @Post('/login')
  @Public()
  @ApiOperation({
    summary: '登入帳號',
    description: '接收使用者登入的資料，並回傳帳號的資訊和 Token',
  })
  @ApiBody({
    type: AuthCredentialsDto,
    examples: {
      user: {
        value: {
          email: 'lisa@test.com',
          password: '123',
        },
      },
      admin: {
        value: {
          email: 'super@test.com',
          password: '123',
        },
      },
    },
  })
  async login(
    @Body() authLoginDto: AuthLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ payload; accessToken: string }> {
    // 驗證使用者登入資料並取得 Token
    const loginResult = await this.authService.login(authLoginDto);

    // 將 refresh token 存到 cookie 中
    this.setRefreshTokenCookie(res, loginResult.refreshToken);

    return loginResult;
  }

  /**
   * 用 refresh token 換新 access token
   *
   * @param {Request} req HTTP 請求物件，包含簽名的 cookies
   * @param {Response} res HTTP 回應物件，用於設定新的 refresh token 到 cookie
   * @param {User} user 取得目前登入的使用者
   * @returns {Promise<{ accessToken: string; refreshToken: string }>} 回傳帳號的 Token
   */
  @Post('/refresh')
  @ApiOperation({
    summary: '換新 access token',
    description:
      '讓使用者在 access token 過期後，不用重新登入，就能繼續存取保護的 API',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @GetUser() user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { accessToken, refreshToken } = await this.authService.refresh(
      req,
      user,
    );

    // 設定新的 refresh token 到 cookie
    this.setRefreshTokenCookie(res, refreshToken);

    return { accessToken, refreshToken };
  }

  /**
   * 登出使用者
   *
   * @param {Response} res HTTP 回應物件，用於設定新的 refresh token 到 cookie
   * @param {User} user 取得目前登入的使用者
   */
  @Post('/logout')
  @ApiOperation({
    summary: '登出使用者',
    description: '清除 refresh token 與 cookie，結束使用者登入狀態',
  })
  logout(
    @Res({ passthrough: true }) res: Response,
    @GetUser() user: User,
  ): Promise<void> {
    // 移除 cookie 中的 refresh token
    res.clearCookie(REFRESH_TOKEN_COOKIE, {
      httpOnly: true, // 只允許後端存取
      sameSite: 'lax', // 限制第三方網站的請求夾帶 cookie 的方式
      secure: this.configService.get('NODE_ENV') === 'production', //如果在 production 環境，這個 Cookie 只會透過 HTTPS 傳送
    });

    return this.authService.logout(user);
  }

  /**
   * 模擬啟動後端伺服器
   *
   * @returns {{ message: string }} 回傳啟動成功提示文字
   */
  @Post('/start-server')
  @Public()
  @ApiOperation({
    summary: '啟動後端伺服器',
    description: '提供前端按鈕觸發的簡單 API，回傳伺服器啟動成功提示',
  })
  startServer(): { message: string } {
    return { message: '後端伺服器啟動成功' };
  }

  /**
   * 將 Refresh Token 設定到使用者的 Cookie 中。
   *
   * @param {Response} res HTTP 回應物件，用於設定新的 refresh token 到 cookie
   * @param {string} token 要存放在 Cookie 中的 Refresh Token。
   */
  private setRefreshTokenCookie(res: Response, token: string): void {
    res.cookie(REFRESH_TOKEN_COOKIE, token, {
      httpOnly: true, // 只允許後端存取
      secure: this.configService.get('NODE_ENV') === 'production', //如果在 production 環境，這個 Cookie 只會透過 HTTPS 傳送
      signed: true, // 防止篡改
      path: '/', // Cookie 的作用範圍
      maxAge: this.jwtHelper.getRefreshTokenExpiresIn(),
    });
  }
}
