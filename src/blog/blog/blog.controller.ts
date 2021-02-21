import { Body, Controller, Delete, Get, Param, Post , Put, Query, Request, Res, UploadedFile, UseGuards, UseInterceptors} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Observable, of } from 'rxjs';
import { JwtAuthGuard } from 'src/auth/guards/jwt-guard';
import { fileURLToPath } from 'url';
import { UserIsAuthorGuard } from '../guards/user-is-author.guard';
import { BlogEntry } from '../models/blog-entry.interface';
import { BlogService } from './blog.service';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { Image } from '../models/image.interface';
import { extname, join } from 'path';

export const BLOG_ENTRIES_URL = 'http://localhost:3000/api/blog-entries';

export const storage = {
    storage: diskStorage({
        destination: './uploads/blogs-entry-images',
        filename: (req, file, cb) => {
            //const filename: string = path.parse(file.originalname).name.replace(/\s+/g, '') + uuidv4();
            //const extension: string = path.parse(file.originalname).ext;

            const randomName = Array(32).fill(null).map(
                () => (Math.round(Math.random()*16)).toString(16)).join('')
            

          return  cb(null, `${randomName}${extname(file.originalname)}`)
        }

    })
} 

@Controller('blog-entries')
export class BlogController {

    constructor(private blogService: BlogService){}
   
    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() blogEntry: BlogEntry, @Request() req): Observable <BlogEntry>{
        const user = req.user;
        return this.blogService.create(user, blogEntry)
    }

    // @Get()
    // findBlogEntries(@Query('userId') userId: number): Observable<BlogEntry[]>{
    //     if(userId == null){
    //         return this.blogService.findAll();
    //     }else {
    //     return this.blogService.findByUser(userId);
    //     }
    // }

    @Get('')
    index(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10
    ){
         limit = limit > 100 ? 100 : limit;
         return this.blogService.paginateAll({
             limit: Number(limit),
             page: Number(page),
             route: BLOG_ENTRIES_URL
         })
    }

    @Get('/user/:user')
    indexByUser(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Param('user') userId: number
    ){
         limit = limit > 100 ? 100 : limit;
         return this.blogService.paginateByUser({
             limit: Number(limit),
             page: Number(page),
             route: BLOG_ENTRIES_URL
         }, Number(userId))
    }

    @Get(':id')
    findOne(@Param('id') id: number): Observable<BlogEntry>{
        return this.blogService.findOne(id);
    }

    @UseGuards(JwtAuthGuard, UserIsAuthorGuard)
    @Put(':id')
    updateOne(@Param('id') id: number, @Body() blogEntry: BlogEntry): Observable<BlogEntry> {
        return this.blogService.updateOne(Number(id), blogEntry)
    }
    
    @UseGuards(JwtAuthGuard, UserIsAuthorGuard)
    @Delete(':id')
    deleteOne(@Param('id') id: number): Observable<any> {
        return this.blogService.deleteOne(id)
    }

    @UseGuards(JwtAuthGuard)
    @Post('image/upload')
    @UseInterceptors(FileInterceptor('file', storage))
    uploadFile(@UploadedFile() file, @Request() req ): Observable<Image>{
        return of(file)
    }

    @Get('image/:imagename')
    findImage(@Param('imagename') imagename, @Res() res): Observable<Object> {
         return of(res.sendFile(join(process.cwd(), 'uploads/profileimages/' + imagename)));
    }
}
