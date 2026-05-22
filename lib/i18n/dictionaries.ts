/**
 * Translation dictionaries — single source of truth for app strings.
 *
 * Add a new key here, then both en and vi must implement it (type-checked).
 * Use flat dot-notation keys grouped by surface: "login.*", "signup.*", "home.*".
 *
 * Add a new locale by:
 *   1. Adding it to LOCALES below.
 *   2. Adding an entry under `dictionaries` with the same keys as `en`.
 *   3. Adding a country/language guess in server.ts → getLocale Accept-Language fallback.
 */

export const LOCALES = ["en", "vi"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

const en = {
  // Auth shared
  "auth.email": "Email",
  "auth.email_placeholder": "name@example.com",
  "auth.password": "Password",
  "auth.password_placeholder_signup": "At least 8 characters",
  "auth.password_placeholder_signin": "Enter your password",
  "auth.edit": "Edit",
  "auth.error_required": "Email and password are required.",
  "auth.error_short_password": "Password must be at least 8 characters.",

  // Login
  "login.title": "Management",
  "login.subtitle": "Sign in to your ad-manager account",
  "login.continue": "Continue",
  "login.submit": "Sign in",
  "login.submit_pending": "Signing in…",
  "login.no_account": "Don’t have an account?",
  "login.create_one": "Create one",

  // Signup
  "signup.title": "Create account",
  "signup.subtitle": "Start managing your ad campaigns",
  "signup.submit": "Create account",
  "signup.submit_pending": "Creating account…",
  "signup.confirmation_sent":
    "Account created. Check your email for a confirmation link, then sign in.",
  "signup.have_account": "Already have an account?",
  "signup.sign_in": "Sign in",

  // Home
  "home.title": "Todos",
  "home.empty":
    "No todos yet. Insert one via Supabase Dashboard to see it here.",
  "home.sign_out": "Sign out",

  // Locale switcher
  "locale.english": "English",
  "locale.vietnamese": "Tiếng Việt",
} as const;

const vi: Record<keyof typeof en, string> = {
  // Auth shared
  "auth.email": "Email",
  "auth.email_placeholder": "ten@vidu.com",
  "auth.password": "Mật khẩu",
  "auth.password_placeholder_signup": "Ít nhất 8 ký tự",
  "auth.password_placeholder_signin": "Nhập mật khẩu",
  "auth.edit": "Sửa",
  "auth.error_required":
    "Cần nhập email và mật khẩu.",
  "auth.error_short_password":
    "Mật khẩu phải có ít nhất 8 ký tự.",

  // Login
  "login.title": "Quản lý",
  "login.subtitle":
    "Đăng nhập vào tài khoản ad-manager của bạn",
  "login.continue": "Tiếp tục",
  "login.submit": "Đăng nhập",
  "login.submit_pending":
    "Đang đăng nhập…",
  "login.no_account": "Chưa có tài khoản?",
  "login.create_one": "Tạo tài khoản",

  // Signup
  "signup.title": "Tạo tài khoản",
  "signup.subtitle":
    "Bắt đầu quản lý chiến dịch quảng cáo",
  "signup.submit": "Tạo tài khoản",
  "signup.submit_pending":
    "Đang tạo tài khoản…",
  "signup.confirmation_sent":
    "Đã tạo tài khoản. Kiểm tra email để xác nhận, sau đó đăng nhập.",
  "signup.have_account": "Đã có tài khoản?",
  "signup.sign_in": "Đăng nhập",

  // Home
  "home.title": "Việc cần làm",
  "home.empty":
    "Chưa có việc nào. Thêm qua Supabase Dashboard để hiển thị ở đây.",
  "home.sign_out": "Đăng xuất",

  // Locale switcher
  "locale.english": "English",
  "locale.vietnamese": "Tiếng Việt",
};

export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;

export const dictionaries: Record<Locale, Messages> = { en, vi };
