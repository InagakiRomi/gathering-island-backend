import { User } from 'src/users/entities/user.entity';
import { JwtPayload } from './jwt-payload.interface';

export function buildJwtPayload(user: User): JwtPayload {
  return {
    sub: user.id!,
    email: user.email,
    username: user.displayName,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
