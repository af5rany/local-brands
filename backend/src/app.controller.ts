import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  HttpCode,
} from '@nestjs/common';
import { Response } from 'express';
import * as crypto from 'crypto';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('privacy-policy')
  privacyPolicy(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Privacy Policy — Local Brands</title>
<style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6}</style>
</head>
<body>
<h1>Privacy Policy</h1>
<p>Last updated: May 2026</p>
<p>Local Brands ("we", "us") operates a mobile e-commerce platform. This policy explains how we collect and use your data.</p>
<h2>Data We Collect</h2>
<ul>
  <li>Name and email address (via registration or social login)</li>
  <li>Profile picture (from social providers)</li>
  <li>Order and cart data</li>
  <li>Device identifiers for push notifications</li>
</ul>
<h2>How We Use Your Data</h2>
<p>We use your data to operate the platform, process orders, and send relevant notifications. We do not sell your data.</p>
<h2>Social Login</h2>
<p>When you sign in with Google or Facebook, we receive your name, email, and profile picture. We do not receive your social media password.</p>
<h2>Data Deletion</h2>
<p>To request deletion of your data, visit <a href="/data-deletion">/data-deletion</a> or email <a href="mailto:af5rany@icloud.com">af5rany@icloud.com</a>.</p>
<h2>Contact</h2>
<p>Email: <a href="mailto:af5rany@icloud.com">af5rany@icloud.com</a></p>
</body>
</html>`);
  }

  @Get('data-deletion')
  dataDeletionInstructions(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Data Deletion — Local Brands</title>
<style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6}</style>
</head>
<body>
<h1>Data Deletion Request</h1>
<p>To request deletion of your personal data from Local Brands:</p>
<ol>
  <li>Email <a href="mailto:af5rany@icloud.com">af5rany@icloud.com</a> with subject <strong>"Data Deletion Request"</strong></li>
  <li>Include the email address associated with your account</li>
  <li>We will process your request within 30 days and confirm via email</li>
</ol>
<p>For Facebook-connected accounts, you may also remove the app from your <a href="https://www.facebook.com/settings?tab=applications" target="_blank">Facebook App Settings</a> and submit a deletion request there.</p>
</body>
</html>`);
  }

  @Post('facebook/data-deletion')
  @HttpCode(200)
  facebookDataDeletion(@Body() body: { signed_request?: string }) {
    const appSecret = process.env.FACEBOOK_APP_SECRET || '';
    const signedRequest = body?.signed_request;

    if (signedRequest && appSecret) {
      const [encodedSig, payload] = signedRequest.split('.');
      const expectedSig = crypto
        .createHmac('sha256', appSecret)
        .update(payload)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      if (encodedSig !== expectedSig) {
        return { url: '', confirmation_code: 'invalid_request' };
      }
    }

    const confirmationCode = crypto.randomBytes(8).toString('hex');
    return {
      url: `${process.env.EXPO_PUBLIC_API_URL || 'https://local-brands-production-0df0.up.railway.app'}/data-deletion`,
      confirmation_code: confirmationCode,
    };
  }
}
