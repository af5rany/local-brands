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

  async sendOrderConfirmationEmail(
    email: string,
    orderNumber: string,
    totalAmount: number,
    totalItems: number,
  ) {
    const mailOptions = {
      from: '"Local Brands" <noreply@localbrands.com>',
      to: email,
      subject: `Order Confirmed — ${orderNumber}`,
      html: `
        <h3>Thank you for your order!</h3>
        <p>Your order <strong>${orderNumber}</strong> has been placed successfully.</p>
        <p><strong>Items:</strong> ${totalItems}</p>
        <p><strong>Total:</strong> $${totalAmount.toFixed(2)}</p>
        <p>We'll notify you when your order ships.</p>
        <br/>
        <p style="color:#888;">— The Local Brands Team</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      // Non-blocking: don't throw, just log
    }
  }

  async sendOrderStatusUpdateEmail(
    email: string,
    orderNumber: string,
    newStatus: string,
  ) {
    const mailOptions = {
      from: '"Local Brands" <noreply@localbrands.com>',
      to: email,
      subject: `Order ${orderNumber} — ${newStatus}`,
      html: `
        <h3>Order Status Update</h3>
        <p>Your order <strong>${orderNumber}</strong> has been updated to: <strong>${newStatus}</strong>.</p>
        <p>Log in to your account to view order details.</p>
        <br/>
        <p style="color:#888;">— The Local Brands Team</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending status update email:', error);
    }
  }

  async sendWelcomeEmail(email: string, name: string) {
    const mailOptions = {
      from: '"Local Brands" <noreply@localbrands.com>',
      to: email,
      subject: 'Welcome to Local Brands',
      html: `
        <h3>Welcome, ${name}!</h3>
        <p>Thank you for joining Local Brands. Start exploring unique products from local brands near you.</p>
        <br/>
        <p style="color:#888;">— The Local Brands Team</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  }
}
