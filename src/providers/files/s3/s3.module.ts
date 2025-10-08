import * as AWS from '@aws-sdk/client-s3';
import { Module } from '@nestjs/common';

import { S3Lib } from './constants/do-spaces-service-lib.constant';
import { S3Service } from './s3.service';

@Module({
  providers: [
    S3Service,
    {
      provide: S3Lib,
      useFactory: async () => {
        // TODO: укажи только accessKeyId, secretAccessKey
        return new AWS.S3({
          endpoint: 'http://127.0.0.1:9000',
          region: 'ru-central1',
          credentials: {
            accessKeyId: 'УКАЖИ',
            secretAccessKey: 'УКАЖИ',
          },
        });
      },
    },
  ],
  exports: [S3Service, S3Lib],
})
export class S3Module {}
