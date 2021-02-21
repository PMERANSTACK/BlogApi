import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions, paginate, Pagination } from 'nestjs-typeorm-paginate';
import { from, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { User } from 'src/user/user/models/user.interface';
import { UserService } from 'src/user/user/service/user.service';
import { Repository } from 'typeorm';
import { BlogEntryEntity } from '../models/blog-entry.entity';
import { BlogEntry } from '../models/blog-entry.interface';
const slugify = require('slugify');

@Injectable()
export class BlogService {

    constructor(
        @InjectRepository(BlogEntryEntity) private readonly blogRepository: Repository<BlogEntryEntity>,
        private userService: UserService
    ){}

    create(user: User, blogEntry: BlogEntry): Observable<BlogEntry>{
        blogEntry.author = user;
      return this.generateSlug(blogEntry.title).pipe(
          switchMap((slug: string) => {
              blogEntry.slug = slug;
              return from(this.blogRepository.save(blogEntry))
          })
      )
    }

    findAll(): Observable<BlogEntry[]>{
        return from(this.blogRepository.find({
            relations: ['author']
        }))
    }

    paginateAll(options: IPaginationOptions): Observable<Pagination<BlogEntry>> {
       return from(paginate<BlogEntry>(this.blogRepository, options, {
           relations: ['author']
       })).pipe(
           map((blogEntries: Pagination<BlogEntry>) => blogEntries)
       )
    }

    paginateByUser(options: IPaginationOptions, userId: number): Observable<Pagination<BlogEntry>> {
        return from(paginate<BlogEntry>(this.blogRepository, options, {
            relations: ['author'],
            where: [
                {author: userId}
            ]
        })).pipe(
            map((blogEntries: Pagination<BlogEntry>) => blogEntries)
        )
    }

    findOne(id: number) : Observable<BlogEntry> {
        return from(this.blogRepository.findOne(
           {id}, {
               relations: ['author']
           }
        ))
    }

     findByUser(userId: number): Observable<BlogEntry []>{
         return from(this.blogRepository.find({
             where:{
                 author: userId
             },
             relations: ['author']
         })).pipe(
             map((blogEntries: BlogEntry[])=> blogEntries)
         )
     }

    updateOne(id: number, blogEntry: BlogEntry): Observable<BlogEntry>{
        return from(this.blogRepository.update(id, blogEntry)).pipe(
            switchMap(() => this.findOne(id))
        )
    }

    deleteOne(id: number): Observable<any>{
         return from(this.blogRepository.delete(id));
    }

    generateSlug(title: string): Observable<string>{
      return of(slugify(title));
    }


}
