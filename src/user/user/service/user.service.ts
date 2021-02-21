import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AuthService } from 'src/auth/auth/auth.service';
import { Like, Repository } from 'typeorm';
import { UserEntity } from '../models/user.entity';
import { User, UserRole } from '../models/user.interface';
import { paginate, Pagination, IPaginationOptions } from 'nestjs-typeorm-paginate';

@Injectable()
export class UserService {
   constructor(
       @InjectRepository(UserEntity) private readonly userRepository : Repository<UserEntity>,
       private authService: AuthService
   ){}

   create(user: User): Observable<User> {
       return this.authService.hashPassword(user.password).pipe(
           switchMap((passwordHash : string) => {
               const newUser = new UserEntity();
               newUser.name = user.name;
               newUser.email = user.email;
               newUser.username = user.username;
               newUser.password = passwordHash;
               newUser.role = UserRole.USER;
              // newUser.profileImage = user.profileImage;

               return from(this.userRepository.save(newUser)).pipe(
                   map((user : User) => {
                       const {password , ...result} = user;
                       return result;
                   }),
                   catchError(e => throwError(e))
               )
           })
       )
   }

   findAll(): Observable<User[]>{
       return from(this.userRepository.find()).pipe(
           map((users) => {
               users.forEach(function(v) {
                   delete v.password
               });
               return users;
           })
       );
   }

   paginate(options: IPaginationOptions): Observable<Pagination<User>> {
      return from(paginate<User>(this.userRepository, options)).pipe(
          map((usersPageable: Pagination<User>) => {
              usersPageable.items.forEach(function(v) {
                  delete v.password
              });
              return usersPageable;
          })
      )
   }

   paginateFilterByUsername(options: IPaginationOptions, user: User): Observable<Pagination<User>>{
      return from(this.userRepository.findAndCount({
          skip: Number(options.page) * Number(options.limit) || 0,
          take: Number(options.limit) || 10,
          order: {id: "ASC"},
          select: ['id', 'name', 'username', 'email', 'role'],
          relations: ['blogEntries'],
          where: [
              {
                  username: Like(`%${user.username}%`)
              }
          ]
      })).pipe(
          map(([users,totalUsers]) => {
              const usersPageable :Pagination<User> = {
                  items: users,
                  links: {
                      first: options.route + `?limit=${options.limit}`,
                      previous: options.route + ``,
                      next: options.route + `?limit=${options.limit}&page=${Number(options.page) + 1}`,
                      last: options.route + `?limit=${options.limit}&page=${Math.ceil(totalUsers / Number(options.limit))}`
                  },
                  meta: {
                      currentPage: Number(options.page),
                      itemCount: users.length,
                      itemsPerPage: Number(options.limit),
                      totalItems: totalUsers,
                      totalPages: Math.ceil(totalUsers / Number(options.limit))
                  }
              };
              return usersPageable;
          })
      )
   }

   findOne(id:number): Observable<User>{
       return from(this.userRepository.findOne({id}, {relations: ['blogEntries']})).pipe(
           map((user: User) => {
               const {password, ...result} = user;
               return result;
           })
       );
   }

   deleteone(id:number): Observable<any>{
       return from(this.userRepository.delete(id));
   }
   
   updateone(id:number, user:User): Observable<any>{
       delete user.email;
       delete user.password;
       delete user.role;
       return from(this.userRepository.update(id, user)).pipe(
           switchMap(() => this.findOne(id))
       );
   }

   login(user: User): Observable<string>{
    return this.validateUser(user.email, user.password).pipe(
        switchMap((user : User) => {
            if(user){
                return this.authService.generateJWT(user).pipe(map((jwt: string) => jwt))
            } else {
                return `Invalid Credentials`;
            }
        })
    )
   }

   validateUser(email: string, password: string): Observable<User>{
    return this.findByMail(email).pipe(
        switchMap((user: User) => 
         this.authService.comparePasswords(password, user.password).pipe(
             map((match: boolean) => {
                 if(match){
                     const { password, ...result} = user;
                     return result;
                 } else {
                     throw Error;
                 }
             })
         )
        )
    );
   }

   findByMail(email: string): Observable<User>{
       return from(this.userRepository.findOne({email}));
   }

   updateRoleOfUser(id: number, user: User): Observable<any>{
        return from(this.userRepository.update(id, user))

   }
}
