import { User } from 'src/users/entities/user.entity';
import { JwtPayload } from './jwt-payload.interface';
import dayjs from 'dayjs';

export function buildJwtPayload(user: User): JwtPayload {
  return {
    sub: user.id!,
    email: user.email,
    username: user.displayName,
    role: user.role,
    createdAt: dayjs(user.createdAt).format('YYYY-MM-DD HH:mm:ss'),
    updatedAt: dayjs(user.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
  };
}
