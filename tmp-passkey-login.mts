import 'dotenv/config';
import { AuthApi } from './src/core/utils/auth.util.ts';
console.error('passkey set?', Boolean(process.env.LOGIN_TESTER_PASSKEY));
const r = await AuthApi.login();
console.error('login ok', Boolean(r.accessToken), r.expiresIn ?? '');
