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
  "auth.continue_with_google": "Continue with Google",
  "auth.or": "or",

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

  // DB Tool
  "dbtool.title": "DB Tool",
  "dbtool.env": "Env",
  "dbtool.back_home": "Home",
  "dbtool.error_unauthenticated": "You must be signed in.",
  "dbtool.error_no_connection":
    "No connection configured. Open Env and set DB_HOST / DB_USER / DB_NAME.",
  "dbtool.error_empty_statement": "Enter a SQL statement to run.",
  "dbtool.error_snippet_required": "Tab, title and body are required.",
  "dbtool.sql_placeholder": "SELECT * FROM users LIMIT 10;",
  "dbtool.run": "Run",
  "dbtool.running": "Running…",
  "dbtool.no_results": "Run a statement to see results here.",
  "dbtool.rows_affected": "rows affected",
  "dbtool.duration_ms": "ms",
  "dbtool.settings_title": "Environment",
  "dbtool.save": "Save",
  "dbtool.saving": "Saving…",
  "dbtool.test": "Test connection",
  "dbtool.testing": "Testing…",
  "dbtool.test_ok": "Connected",
  "dbtool.new_snippet": "New snippet",
  "dbtool.edit": "Edit",
  "dbtool.delete": "Delete",
  "dbtool.cancel": "Cancel",
  "dbtool.tab": "Tab",
  "dbtool.snippet_title": "Title",
  "dbtool.snippet_body": "SQL body",
  "dbtool.no_snippets": "No snippets yet.",
  "dbtool.confirm_delete": "Delete this snippet?",

  // Dashboard
  "dashboard.title": "Tools",
  "dashboard.subtitle": "Internal tools for the team. Pick one to get started.",
  "dashboard.open": "Open",
  "dashboard.dbtool_name": "DB Tool",
  "dashboard.dbtool_desc": "Run SQL against your database with shared snippets.",
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
  "auth.continue_with_google": "Tiếp tục với Google",
  "auth.or": "hoặc",

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

  // DB Tool
  "dbtool.title": "Công cụ DB",
  "dbtool.env": "Env",
  "dbtool.back_home": "Trang chủ",
  "dbtool.error_unauthenticated": "Bạn cần đăng nhập.",
  "dbtool.error_no_connection":
    "Chưa cấu hình kết nối. Mở Env và đặt DB_HOST / DB_USER / DB_NAME.",
  "dbtool.error_empty_statement": "Nhập câu lệnh SQL để chạy.",
  "dbtool.error_snippet_required": "Cần nhập tab, tiêu đề và nội dung.",
  "dbtool.sql_placeholder": "SELECT * FROM users LIMIT 10;",
  "dbtool.run": "Chạy",
  "dbtool.running": "Đang chạy…",
  "dbtool.no_results": "Chạy câu lệnh để xem kết quả ở đây.",
  "dbtool.rows_affected": "dòng bị ảnh hưởng",
  "dbtool.duration_ms": "ms",
  "dbtool.settings_title": "Môi trường",
  "dbtool.save": "Lưu",
  "dbtool.saving": "Đang lưu…",
  "dbtool.test": "Kiểm tra kết nối",
  "dbtool.testing": "Đang kiểm tra…",
  "dbtool.test_ok": "Đã kết nối",
  "dbtool.new_snippet": "Snippet mới",
  "dbtool.edit": "Sửa",
  "dbtool.delete": "Xoá",
  "dbtool.cancel": "Huỷ",
  "dbtool.tab": "Tab",
  "dbtool.snippet_title": "Tiêu đề",
  "dbtool.snippet_body": "Nội dung SQL",
  "dbtool.no_snippets": "Chưa có snippet nào.",
  "dbtool.confirm_delete": "Xoá snippet này?",

  // Dashboard
  "dashboard.title": "Công cụ",
  "dashboard.subtitle": "Bộ công cụ nội bộ cho team. Chọn một công cụ để bắt đầu.",
  "dashboard.open": "Mở",
  "dashboard.dbtool_name": "Công cụ DB",
  "dashboard.dbtool_desc": "Chạy SQL lên database với snippet dùng chung.",
};

export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;

export const dictionaries: Record<Locale, Messages> = { en, vi };
