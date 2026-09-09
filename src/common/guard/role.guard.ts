
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../generated/prisma/enums';
import { ROLES_KEY } from '../decorator/role.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user: any = request.user;
        console.log(`Required roles: ${requiredRoles.join(', ')} , user: ${JSON.stringify(user)}`);
        if (!user) {
            console.log('No user found on request — denying access');
            return false;
        }
        console.log(`User roles: ${JSON.stringify(user.role)}`);
        return requiredRoles.some((role) => user.role?.includes(role));
    }
}
