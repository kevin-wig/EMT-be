export const EMAIL_VERIFY_URL = (process.env.WEB_APP_HOST || 'http://localhost:3000') + `/auth/verify`;

// TODO: need to be confirmed for change password page - this is fake url
export const RESET_PASSWORD_URL = (process.env.WEB_APP_HOST || 'http://localhost:3000') + `/auth/reset-password`;
