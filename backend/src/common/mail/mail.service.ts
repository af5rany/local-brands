import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;

    constructor(private configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('MAIL_HOST') || 'smtp.mailtrap.io',
            port: this.configService.get<number>('MAIL_PORT') || 2525,
            auth: {
                user: this.configService.get<string>('MAIL_USER'),
                pass: this.configService.get<string>('MAIL_PASS'),
            },
        });
    }

    async sendPasswordResetEmail(email: string, token: string) {
        const resetUrl = `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:19006'}/auth/reset-password?token=${token}`;

        const mailOptions = {
            from: '"Local Brands" <noreply@localbrands.com>',
            to: email,
            subject: 'Password Reset Request',
            html: `
        <h3>Password Reset Request</h3>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Failed to send password reset email');
        }
    }
}
