import { Module } from '@nestjs/common';
import { NodemailerService } from './nodemailer.service';
import { EmailTransportService } from '../common/interfaces/email-transport.interface';

@Module({
  providers: [
    {
      provide: EmailTransportService,
      useClass: NodemailerService,
    },
  ],
  exports: [EmailTransportService],
})
export class MailModule {}
