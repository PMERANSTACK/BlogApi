import { Module } from '@nestjs/common';
import { UserService } from './user/service/user.service';
import { UserController } from './user/controller/user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user/models/user.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports:[
    TypeOrmModule.forFeature([UserEntity]),
    AuthModule
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService]
})
export class UserModule {}
