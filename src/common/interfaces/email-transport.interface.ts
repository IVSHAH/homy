export abstract class EmailTransportService {
  abstract sendMail(to: string, subject: string, html: string): Promise<void>;
}
