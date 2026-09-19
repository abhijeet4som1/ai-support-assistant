import {
  type GetCurrentUser,
  type Login,
  type Logout,
  type RefreshToken,
} from '@app/api-server-sdk';

import { authed, must, type HandlerContext } from './context.js';
import { type AuthService } from '../auth/service.js';

export function authHandlers(auth: AuthService) {
  const LoginOp: Login<HandlerContext> = (input) =>
    auth.login(must(input.username, 'username'), must(input.password, 'password'));

  const RefreshTokenOp: RefreshToken<HandlerContext> = (input) =>
    auth.refresh(must(input.refreshToken, 'refreshToken'));

  const LogoutOp: Logout<HandlerContext> = async (input) => ({
    revoked: await auth.logout(must(input.refreshToken, 'refreshToken')),
  });

  const GetCurrentUserOp: GetCurrentUser<HandlerContext> = authed((_input, ctx) =>
    Promise.resolve({ user: ctx.user }),
  );

  return {
    Login: LoginOp,
    RefreshToken: RefreshTokenOp,
    Logout: LogoutOp,
    GetCurrentUser: GetCurrentUserOp,
  };
}
