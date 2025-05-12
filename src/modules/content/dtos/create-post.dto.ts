import { Injectable } from '@nestjs/common';
import { IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

@Injectable()
export class CreatePostDto {
    @MaxLength(255, { always: true, message: 'the max length of content title is $constraint1' })
    @IsNotEmpty({ groups: ['create'], message: 'the title of content should not be empty' })
    @IsOptional({ groups: ['update'] })
    title: string;

    @IsNotEmpty({ groups: ['create'], message: 'the body of content should not be empty' })
    @IsOptional({ groups: ['update'] })
    body: string;

    @MaxLength(500, { always: true, message: 'the max length of content summary is $constraint1' })
    @IsOptional({ always: true })
    summary?: string;
}
