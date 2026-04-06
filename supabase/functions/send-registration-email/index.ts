const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const FROM_EMAIL = 'AM:365 <noreply@extra2share.net>'

const templates = {
  registration: (data: { firstName: string; verificationCode: string; applicationId: string; verifyUrl?: string }) => ({
    subject: 'Verify your AM:365 registration',
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Inter',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
  <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:32px 40px;text-align:center;">
    <table cellpadding="0" cellspacing="0" align="center"><tr>
      <td style="background:#22C55E;width:44px;height:44px;border-radius:12px;text-align:center;vertical-align:middle;color:#fff;font-weight:bold;font-size:18px;">AM</td>
      <td style="padding-left:12px;color:#fff;font-size:24px;font-weight:bold;">AM:365</td>
    </tr></table>
    <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">Workforce Platform</p>
  </td></tr>
  <tr><td style="padding:40px;">
    <h1 style="color:#0f172a;font-size:24px;margin:0 0 8px;">Welcome, ${data.firstName}! 👋</h1>
    <p style="color:#64748b;font-size:16px;line-height:1.6;margin:0 0 24px;">Thank you for registering as a delivery partner with AM:365. Please verify your email address using the code below:</p>
    <div style="background:#f0fdf4;border:2px solid #22C55E;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
      <p style="color:#64748b;font-size:14px;margin:0 0 8px;">Your verification code</p>
      <p style="color:#22C55E;font-size:36px;font-weight:bold;letter-spacing:8px;margin:0;">${data.verificationCode}</p>
     <p style="color:#64748b;font-size:12px;margin:8px 0 0;">This code expires in 30 minutes</p>
    </div>
    ${data.verifyUrl ? `<table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" style="padding:0 0 24px;">
      <a href="${data.verifyUrl}" style="display:inline-block;background:#22C55E;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:16px;">Verify Email →</a>
    </td></tr></table>` : ''}
    <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px;">Once verified, our team will review your application. You'll receive updates at each step of the process.</p>
    <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:0 0 24px;">
      <p style="color:#0f172a;font-size:14px;font-weight:600;margin:0 0 12px;">What happens next?</p>
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr><td style="padding:6px 0;color:#64748b;font-size:13px;">✅ Email verification</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;font-size:13px;">📋 Application review by our team</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;font-size:13px;">📝 Contract & sign-off</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;font-size:13px;">🎉 Welcome to the AM:365 family!</td></tr>
      </table>
    </div>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">© 2024 AM365 Group AB · Stockholm, Sweden</p>
    <p style="color:#94a3b8;font-size:11px;margin:4px 0 0;">If you didn't register for AM:365, please ignore this email.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  }),

  welcome: (data: { firstName: string }) => ({
    subject: 'Welcome to the AM:365 Family! 🎉',
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Inter',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
  <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:40px;text-align:center;">
    <table cellpadding="0" cellspacing="0" align="center"><tr>
      <td style="background:#22C55E;width:44px;height:44px;border-radius:12px;text-align:center;vertical-align:middle;color:#fff;font-weight:bold;font-size:18px;">AM</td>
      <td style="padding-left:12px;color:#fff;font-size:24px;font-weight:bold;">AM:365</td>
    </tr></table>
    <h1 style="color:#fff;font-size:28px;margin:20px 0 8px;">Welcome to the Family! 🎉</h1>
    <p style="color:rgba(255,255,255,0.7);font-size:16px;margin:0;">Your onboarding is complete</p>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#0f172a;font-size:18px;font-weight:600;margin:0 0 16px;">Hi ${data.firstName},</p>
    <p style="color:#64748b;font-size:16px;line-height:1.6;margin:0 0 24px;">Congratulations! Your partner account is now fully active. You're officially part of the AM:365 workforce family. Here's what you can do now:</p>
    <div style="margin:0 0 24px;">
      <div style="background:#f0fdf4;border-radius:12px;padding:16px;margin:0 0 12px;display:flex;align-items:start;">
        <span style="font-size:20px;margin-right:12px;">📊</span>
        <div><p style="color:#0f172a;font-weight:600;margin:0;font-size:14px;">Dashboard</p><p style="color:#64748b;font-size:13px;margin:4px 0 0;">Track your earnings, hours, and deliveries in real-time</p></div>
      </div>
      <div style="background:#eff6ff;border-radius:12px;padding:16px;margin:0 0 12px;">
        <span style="font-size:20px;margin-right:12px;">📅</span>
        <p style="color:#0f172a;font-weight:600;margin:0;font-size:14px;display:inline;">Schedule</p><p style="color:#64748b;font-size:13px;margin:4px 0 0;">View and manage your upcoming shifts</p>
      </div>
      <div style="background:#fefce8;border-radius:12px;padding:16px;">
        <span style="font-size:20px;margin-right:12px;">💰</span>
        <p style="color:#0f172a;font-weight:600;margin:0;font-size:14px;display:inline;">Payroll</p><p style="color:#64748b;font-size:13px;margin:4px 0 0;">Automatic payroll with tax handling and pension</p>
      </div>
    </div>
    <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
      <a href="https://extra2share.net/login" style="display:inline-block;background:#22C55E;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:16px;">Login to Your Dashboard →</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">© 2024 AM365 Group AB · Stockholm, Sweden</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  }),

  verificationDone: (data: { firstName: string }) => ({
    subject: 'Your AM:365 identity has been verified ✅',
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Inter',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
  <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:32px 40px;text-align:center;">
    <table cellpadding="0" cellspacing="0" align="center"><tr>
      <td style="background:#22C55E;width:44px;height:44px;border-radius:12px;text-align:center;vertical-align:middle;color:#fff;font-weight:bold;font-size:18px;">AM</td>
      <td style="padding-left:12px;color:#fff;font-size:24px;font-weight:bold;">AM:365</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:40px;text-align:center;">
    <div style="background:#f0fdf4;width:80px;height:80px;border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;">
      <span style="font-size:40px;">✅</span>
    </div>
    <h1 style="color:#0f172a;font-size:24px;margin:0 0 12px;">Identity Verified!</h1>
    <p style="color:#64748b;font-size:16px;line-height:1.6;margin:0 0 24px;">Hi ${data.firstName}, your identity documents have been reviewed and approved by our verification team. The next step is your employment contract.</p>
    <p style="color:#64748b;font-size:14px;margin:0;">You'll receive your contract for review and signing shortly.</p>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">© 2024 AM365 Group AB · Stockholm, Sweden</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  }),

  contractSigning: (data: { firstName: string; signingLink: string }) => ({
    subject: 'Your AM:365 Employment Contract is Ready 📝',
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Inter',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
  <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:32px 40px;text-align:center;">
    <table cellpadding="0" cellspacing="0" align="center"><tr>
      <td style="background:#22C55E;width:44px;height:44px;border-radius:12px;text-align:center;vertical-align:middle;color:#fff;font-weight:bold;font-size:18px;">AM</td>
      <td style="padding-left:12px;color:#fff;font-size:24px;font-weight:bold;">AM:365</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:40px;">
    <h1 style="color:#0f172a;font-size:24px;margin:0 0 12px;">Your Contract is Ready, ${data.firstName} 📝</h1>
    <p style="color:#64748b;font-size:16px;line-height:1.6;margin:0 0 24px;">Your employment contract with AM:365 has been prepared. Please review the terms carefully and sign to complete your onboarding.</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:0 0 24px;">
      <p style="color:#0f172a;font-size:14px;font-weight:600;margin:0 0 12px;">Contract Details</p>
      <p style="color:#64748b;font-size:13px;margin:4px 0;">• Employer of Record Agreement</p>
      <p style="color:#64748b;font-size:13px;margin:4px 0;">• Employment terms & conditions</p>
      <p style="color:#64748b;font-size:13px;margin:4px 0;">• Compensation structure</p>
      <p style="color:#64748b;font-size:13px;margin:4px 0;">• Insurance & pension benefits</p>
    </div>
    <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
      <a href="${data.signingLink}" style="display:inline-block;background:#22C55E;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:16px;">Review & Sign Contract →</a>
    </td></tr></table>
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:16px 0 0;">This link expires in 7 days</p>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">© 2024 AM365 Group AB · Stockholm, Sweden</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  }),

  contractSigned: (data: { firstName: string }) => ({
    subject: 'Contract Signed Successfully! ✅',
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Inter',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
  <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:32px 40px;text-align:center;">
    <table cellpadding="0" cellspacing="0" align="center"><tr>
      <td style="background:#22C55E;width:44px;height:44px;border-radius:12px;text-align:center;vertical-align:middle;color:#fff;font-weight:bold;font-size:18px;">AM</td>
      <td style="padding-left:12px;color:#fff;font-size:24px;font-weight:bold;">AM:365</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:40px;text-align:center;">
    <span style="font-size:48px;">🎊</span>
    <h1 style="color:#0f172a;font-size:24px;margin:16px 0 12px;">Contract Signed!</h1>
    <p style="color:#64748b;font-size:16px;line-height:1.6;margin:0 0 24px;">Great news, ${data.firstName}! Your employment contract has been signed successfully. Your onboarding is now complete and your partner account will be activated shortly.</p>
    <p style="color:#64748b;font-size:14px;margin:0;">You'll receive a welcome email once your account is fully activated.</p>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">© 2024 AM365 Group AB · Stockholm, Sweden</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  }),

  documentReminder: (data: { firstName: string; documentType: string }) => ({
    subject: `Reminder: Please submit your ${data.documentType} 📋`,
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Inter',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
  <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:32px 40px;text-align:center;">
    <table cellpadding="0" cellspacing="0" align="center"><tr>
      <td style="background:#22C55E;width:44px;height:44px;border-radius:12px;text-align:center;vertical-align:middle;color:#fff;font-weight:bold;font-size:18px;">AM</td>
      <td style="padding-left:12px;color:#fff;font-size:24px;font-weight:bold;">AM:365</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:40px;">
    <h1 style="color:#0f172a;font-size:22px;margin:0 0 12px;">Document Reminder 📋</h1>
    <p style="color:#64748b;font-size:16px;line-height:1.6;margin:0 0 24px;">Hi ${data.firstName}, we still need your <strong>${data.documentType}</strong> to continue processing your application. Please upload it at your earliest convenience.</p>
    <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
      <a href="https://extra2share.net/partner/documents" style="display:inline-block;background:#22C55E;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:16px;">Upload Document →</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">© 2024 AM365 Group AB · Stockholm, Sweden</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  }),

  scheduleNotification: (data: { firstName: string; date: string; time: string; area: string }) => ({
    subject: `New Schedule: ${data.date} 📅`,
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Inter',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
  <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:32px 40px;text-align:center;">
    <table cellpadding="0" cellspacing="0" align="center"><tr>
      <td style="background:#22C55E;width:44px;height:44px;border-radius:12px;text-align:center;vertical-align:middle;color:#fff;font-weight:bold;font-size:18px;">AM</td>
      <td style="padding-left:12px;color:#fff;font-size:24px;font-weight:bold;">AM:365</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:40px;">
    <h1 style="color:#0f172a;font-size:22px;margin:0 0 12px;">New Schedule Assignment 📅</h1>
    <p style="color:#64748b;font-size:16px;line-height:1.6;margin:0 0 24px;">Hi ${data.firstName}, you have a new shift scheduled:</p>
    <div style="background:#f0fdf4;border:2px solid #22C55E;border-radius:12px;padding:24px;margin:0 0 24px;">
      <p style="color:#0f172a;font-size:16px;font-weight:600;margin:0 0 12px;">📅 ${data.date}</p>
      <p style="color:#64748b;font-size:14px;margin:4px 0;">⏰ ${data.time}</p>
      <p style="color:#64748b;font-size:14px;margin:4px 0;">📍 ${data.area}</p>
    </div>
    <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
      <a href="https://extra2share.net/partner/schedule" style="display:inline-block;background:#22C55E;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:16px;">View Schedule →</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">© 2024 AM365 Group AB · Stockholm, Sweden</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  }),

  idExpiration: (data: { firstName: string; expiryDate: string; documentType: string }) => ({
    subject: `⚠️ Your ${data.documentType} expires on ${data.expiryDate}`,
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Inter',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
  <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:32px 40px;text-align:center;">
    <table cellpadding="0" cellspacing="0" align="center"><tr>
      <td style="background:#22C55E;width:44px;height:44px;border-radius:12px;text-align:center;vertical-align:middle;color:#fff;font-weight:bold;font-size:18px;">AM</td>
      <td style="padding-left:12px;color:#fff;font-size:24px;font-weight:bold;">AM:365</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:40px;">
    <div style="background:#fef3c7;border:2px solid #f59e0b;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;">
      <span style="font-size:32px;">⚠️</span>
      <h1 style="color:#92400e;font-size:20px;margin:12px 0 0;">ID Document Expiring Soon</h1>
    </div>
    <p style="color:#64748b;font-size:16px;line-height:1.6;margin:0 0 24px;">Hi ${data.firstName}, your <strong>${data.documentType}</strong> is set to expire on <strong>${data.expiryDate}</strong>. Please upload an updated document to maintain your active status.</p>
    <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
      <a href="https://extra2share.net/partner/documents" style="display:inline-block;background:#f59e0b;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:16px;">Update Document →</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">© 2024 AM365 Group AB · Stockholm, Sweden</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  }),

  notification: (data: { firstName: string; title: string; message: string }) => ({
    subject: data.title,
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Inter',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
  <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:32px 40px;text-align:center;">
    <table cellpadding="0" cellspacing="0" align="center"><tr>
      <td style="background:#22C55E;width:44px;height:44px;border-radius:12px;text-align:center;vertical-align:middle;color:#fff;font-weight:bold;font-size:18px;">AM</td>
      <td style="padding-left:12px;color:#fff;font-size:24px;font-weight:bold;">AM:365</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:40px;">
    <h1 style="color:#0f172a;font-size:22px;margin:0 0 12px;">${data.title}</h1>
    <p style="color:#64748b;font-size:16px;line-height:1.6;margin:0 0 24px;">Hi ${data.firstName}, ${data.message}</p>
    <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
      <a href="https://extra2share.net/partner/notifications" style="display:inline-block;background:#22C55E;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:16px;">View in Dashboard →</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">© 2024 AM365 Group AB · Stockholm, Sweden</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  }),

  reminder: (data: { firstName: string; reminderText: string }) => ({
    subject: `Reminder: ${data.reminderText}`,
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Inter',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
  <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:32px 40px;text-align:center;">
    <table cellpadding="0" cellspacing="0" align="center"><tr>
      <td style="background:#22C55E;width:44px;height:44px;border-radius:12px;text-align:center;vertical-align:middle;color:#fff;font-weight:bold;font-size:18px;">AM</td>
      <td style="padding-left:12px;color:#fff;font-size:24px;font-weight:bold;">AM:365</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:40px;">
    <h1 style="color:#0f172a;font-size:22px;margin:0 0 12px;">⏰ Friendly Reminder</h1>
    <p style="color:#64748b;font-size:16px;line-height:1.6;margin:0 0 24px;">Hi ${data.firstName}, ${data.reminderText}</p>
    <table cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
      <a href="https://extra2share.net/partner/dashboard" style="display:inline-block;background:#22C55E;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:16px;">Go to Dashboard →</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">© 2024 AM365 Group AB · Stockholm, Sweden</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  }),
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, template, data } = await req.json()

    if (!to || !template) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, template' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const templateFn = templates[template as keyof typeof templates]
    if (!templateFn) {
      return new Response(
        JSON.stringify({ error: `Unknown template: ${template}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const emailContent = templateFn(data)

    // Send via Resend (connected to Supabase SMTP)
    if (RESEND_API_KEY) {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [to],
          subject: emailContent.subject,
          html: emailContent.html,
        }),
      })

      const resendData = await resendRes.json()
      
      if (!resendRes.ok) {
        console.error('Resend error:', resendData)
        return new Response(
          JSON.stringify({ error: 'Failed to send email', details: resendData }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, messageId: resendData.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fallback: log the email
    console.log('Email would be sent:', { to, subject: emailContent.subject })
    return new Response(
      JSON.stringify({ success: true, note: 'Email logged (no RESEND_API_KEY configured)' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Email function error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
