import { SetMetadata, CustomDecorator } from '@nestjs/common';

export const Public = (): CustomDecorator<'isPublic'> => SetMetadata('isPublic', true);
