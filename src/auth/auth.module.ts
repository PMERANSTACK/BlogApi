import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { async } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { RolesGuard } from './guards/role.guard';
import { JwtAuthGuard } from './guards/jwt-guard';
import { JwtStrategy } from './guards/jwt-strategy';
import { UserModule } from 'src/user/user.module';

@Module({
    imports:[
         forwardRef(() => UserModule),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async(configService: ConfigService) =>({
                secret: configService.get('JWT_SECRET'),
                signOptions: {expiresIn: '100s'}
            })
        })
    ],
    providers: [AuthService, RolesGuard, JwtAuthGuard, JwtStrategy],
    exports: [AuthService]
})
export class AuthModule {}
