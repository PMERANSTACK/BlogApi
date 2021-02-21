import { Body, Controller, Get, Post , Param, Delete, Put, UseGuards, Query, 
    UseInterceptors, UploadedFile, Request, Res} from '@nestjs/common';
import { UserService } from '../service/user.service';
import { User, UserRole } from '../models/user.interface';
import { Observable, of } from 'rxjs';
import { catchError , map, switchMap} from 'rxjs/operators';
import { hasRoles } from 'src/auth/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Pagination } from 'nestjs-typeorm-paginate';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname, join } from 'path';
import { UserIsUserGuard } from 'src/auth/guards/UserisUser.guard';


export const storage = {
    storage: diskStorage({
        destination: './uploads/profileimages',
        filename: (req, file, cb) => {
            //const filename: string = path.parse(file.originalname).name.replace(/\s+/g, '') + uuidv4();
            //const extension: string = path.parse(file.originalname).ext;

            const randomName = Array(32).fill(null).map(
                () => (Math.round(Math.random()*16)).toString(16)).join('')
            

          return  cb(null, `${randomName}${extname(file.originalname)}`)
        }

    })
} 

@Controller('user')
export class UserController {
    constructor(private userService: UserService ){}
    
    @Post()
    create(@Body()user: User): Observable<User | Object>{
        return this.userService.create(user).pipe(
            map((user: User) => user),
            catchError(err => of({
                error: err.message
            }))
        );
    }

    @Post('login')
    login(@Body() user: User): Observable<Object>{
        return this.userService.login(user).pipe(
            map((jwt: string) => {
               return {access_token: jwt};
            })
        )
    }
     
    @Get(':id')
    findOne(@Param() params): Observable<User>{
        return this.userService.findOne(params.id);
    }
    
    // @hasRoles(UserRole.ADMIN)
    // @UseGuards(JwtAuthGuard,RolesGuard)
    @Get()
    index( @Query('page') page:number = 1, 
           @Query('limit') limit:number = 10,
           @Query('username') username:string): Observable<Pagination<User>> {
        limit = limit > 100 ? 100: limit;

        if(username === null || username === undefined) {
            return this.userService.paginate({page: Number(page), limit: Number(limit), route : 'http://localhost:3000/api/user'});
    
        }else{
            return this.userService.paginateFilterByUsername({
                page: Number(page), limit: Number(limit),
                route : 'http://localhost:3000/api/user'
            }, {username})
        }
        }
    
    @hasRoles(UserRole.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Delete(':id')
    deleteOne(@Param('id')id: string): Observable<User>{
        return this.userService.deleteone(Number(id));
    }
    
    @UseGuards(JwtAuthGuard, UserIsUserGuard)
    @Put(':id')
    updateOne(@Param('id') id: string, @Body() user: User): Observable<any>{
        return this.userService.updateone(Number(id), user);

    }

    @hasRoles(UserRole.ADMIN)
    @UseGuards(JwtAuthGuard,RolesGuard)
    @Put(':id/role')
    updateRoleOfUser(@Param('id') id: String, @Body() user: User): Observable<User>{
        return this.userService.updateRoleOfUser(Number(id),user);
        
    }
    
    @UseGuards(JwtAuthGuard)
    @Post('upload')
    @UseInterceptors(FileInterceptor('file', storage))
    uploadFile(@UploadedFile() file, @Request() req): Observable<Object>{
      const user: User  = req.user;
      return this.userService.updateone(user.id, {profileImage: file.filename}).pipe(
          map((user:User) => ({
              profileImage: user.profileImage
          }))
      )
      // return of({imagePath: file.filename});
    }

    @Get('profile-image/:imagename')
    findProfileImage(@Param('imagename') imagename, @Res() res): Observable<Object> {
     return of(res.sendFile(join(process.cwd(),'uploads/profileimages/'+imagename)));
    }
}
