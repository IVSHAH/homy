import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { EmailTransportService } from '../../common/interfaces/email-transport.interface';

@Injectable()
export class NodemailerService extends EmailTransportService {
  private transporter: Transporter;
  private readonly logger = new Logger(NodemailerService.name);

  constructor() {
    super();

    // Проверяем наличие credentials
    if (!process.env.MAIL_USER || !process.env.MAIL_PASSWORD) {
      this.logger.warn('MAIL_USER or MAIL_PASSWORD not set - emails will not be sent');
    }

    const port = parseInt(process.env.MAIL_PORT || '587');

    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: port,
      secure: port === 465, // true для 465, false для других портов
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false, // Для тестирования
      },
    });
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: `"Homy" <${process.env.MAIL_USER}>`,
        to,
        subject,
        html,
      });

      this.logger.log(`Email sent successfully to ${to}`);
      this.logger.log(`Message ID: ${info.messageId}`);
    } catch (error) {
      this.logger.error('Failed to send email via Nodemailer');
      this.logger.error(error);
      throw error;
    }
  }
}
