import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { User } from "src/user/user/models/user.interface";
import { UserService } from "src/user/user/service/user.service";
import { BlogService } from "../blog/blog.service";
import { BlogEntry } from "../models/blog-entry.interface";

@Injectable()
export class UserIsAuthorGuard implements CanActivate{
    constructor(private userService: UserService,
                private blogService: BlogService){}

    canActivate(context: ExecutionContext): Observable<boolean>{
        const request = context.switchToHttp().getRequest();
        const params = request.params;
        const blogEntryId: number = Number(params.id);
        const user: User = request.user;
        
        return this.userService.findOne(user.id).pipe(
            switchMap((user: User) => this.blogService.findOne(blogEntryId).pipe(
                map((blogEntry: BlogEntry) => {
                    let hasPermission = false;

                    if(user.id === blogEntry.author.id){
                        hasPermission = true;
                    }

                    return user && hasPermission;
                })
            ))
        )

    }

}