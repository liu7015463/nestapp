import { Injectable } from '@nestjs/common';
import { PartialType } from '@nestjs/swagger';

import { IsDefined, IsNumber } from 'class-validator';

import { CreatePostDto } from './create-post.dto';

@Injectable()
export class UpdatePostDto extends PartialType(CreatePostDto) {
    @IsNumber(undefined, { groups: ['update'], message: 'The format of the post ID is incorrect.' })
    @IsDefined({ groups: ['update'], message: 'The post ID must be specified' })
    id: number;
}
