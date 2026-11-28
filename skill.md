# SKILL: thanhle – Nền tảng học & thi tiếng Anh (star-siec / ix)

> Đọc file này ĐẦU TIÊN mỗi phiên mới, rồi làm theo câu lệnh tiếp theo của anh. Khi thêm tính năng lớn, API, bảng DB hay đổi quy trình deploy → cập nhật file này.
> Trả lời anh bằng tiếng Việt, ngắn gọn. Anh xưng "anh", gọi AI là "em".

## 1. Mục tiêu
Web full-stack dạy & thi tiếng Anh cho học sinh Việt Nam. Giáo viên tạo đề; học sinh làm bài, chấm tự động + phản hồi AI. Tập trung đề Cambridge (KET, PET, Movers…), Reading/Listening/Writing, Placement test, Exam Levels. Production: https://ix.star-siec.edu.vn (cPanel). Repo: github.com/leonthanh/thanhle.

## 2. Tech stack
- Frontend: React 18, Vite, React Router v6, TailwindCSS + Bootstrap 5, CKEditor 5 / React-Quill, Axios. Test: Jest + RTL, Playwright (e2e).
- Backend: Node.js, Express 5, Sequelize 6 + MySQL (mysql2), JWT access+refresh, bcryptjs, Zod, Multer, Nodemailer, OpenAI/Gemini, Pino, Helmet, express-rate-limit.

## 3. Cấu trúc thư mục
```
thanhle/
├── backend/        server.js, db.js, models/, routes/, modules/, middlewares/, utils/, scripts/ (migrate/backfill), tests/, uploads/
├── frontend/       src/{app,components,config,domains,features,shared}, e2e/, vite.config.mjs
├── .github/workflows/deploy.yml   (CI/CD → cPanel qua FTPS)
├── docs/, tests/, scripts/
├── README.md (deploy + secrets), SETUP.md (cài đặt), GIT_WORKFLOW.md, tongquan.md (tổng quan)
```
- backend/modules: cambridge, examLevels, gateway, general, listening, placement, reading, writing.
- middlewares: auth.js, testPermissions.js, validate.js, asyncHandler.js, errorHandler.js.

## 4. Lệnh chạy
Backend (`cd backend`): `npm install`, `npm run dev` (nodemon), `npm start`, `npm test` (jest). Cần `backend/.env` (xem `.env.example`: DB_*, JWT_*, FRONTEND_URL, EMAIL_*, OPENAI_API_KEY, GEMINI_API_KEY, ZALO_*).
Frontend (`cd frontend`): `npm install`, `npm start` (vite), `npm run build` (ra `dist/`), `npm test`, `npm run test:e2e`, `npm run lint`.
Migration/backfill (backend): `npm run migrate:add-listening-autosave-fields`, `migrate:general-model-separation[:apply]`, `backfill:writing-isdraft-null[:apply]` (luôn chạy dry-run trước).

## 5. Danh sách API (prefix trong server.js)
| Prefix | File route | Nội dung |
|---|---|---|
| /api/auth | auth.js | đăng ký/đăng nhập, refresh token |
| /api (writing) | writingTest.js, writing-submission.js | đề & bài nộp Writing |
| /api (listening) | listeningTests.js, listening-submission.js | đề & bài nộp Listening (autosave) |
| /api (reading) | readingTest.js, reading-submission.js | đề & bài nộp Reading (vd `/api/reading-tests`) |
| /api/cambridge | modules/cambridge | đề Cambridge (KET, PET…) |
| /api/gateway | modules/gateway | đề Gateway |
| /api/general | modules/general | đề General |
| /api/exam-levels | examLevels.js | cấp độ đề |
| /api/placement | placement.js | placement test |
| /api/admin | admin.js | quản lý user & bài làm |
| /api/analytics | analytics.js | sự kiện thống kê |
| /api/settings | settings.js | cấu hình app |
| /api/ai | ai.js | tính năng AI (rate limit riêng) |
| /api/upload | upload.js | upload file (static `/uploads`) |
> TODO: bổ sung chi tiết endpoint/method/quyền khi đụng tới từng module.

## 6. Schema DB (Sequelize models, MySQL – backend/models/)
- Người dùng: User, RefreshToken.
- Đề: ReadingTest, ListeningTest, WritingTests, KETReading, CambridgeReading/Listening, GatewayReading/Listening, GeneralReading/Listening, ExamLevel, ExamLevelTest.
- Bài nộp: ReadingSubmission, ListeningSubmission, Submission, CambridgeSubmission, GatewaySubmission, GeneralSubmission, ExamLevelSubmission.
- Placement: PlacementPackage, PlacementPackageItem, PlacementAttempt, PlacementAttemptItem.
- Khác: AppSetting, AnalyticsEvent. Quan hệ khai báo ở `models/index.js`.
> TODO: thêm cột/quan hệ chi tiết khi cần.

## 7. Git workflow (xem GIT_WORKFLOW.md)
- Làm trên feature branch (vd `feature/thanh`), tạo PR → `main` bằng **Squash and merge** (trigger deploy).
- Sau khi squash merge, PHẢI đồng bộ branch trước khi code tiếp: `git fetch origin` → `git checkout feature/thanh` → `git merge main` (hoặc rebase) để tránh conflict.
- `git status` trước khi commit/push. Không commit `.env`, secrets.

## 8. Checklist deploy (xem README.md)
1. Squash & merge PR vào `main` (hoặc push main / chạy tay workflow_dispatch).
2. Tab Actions → chờ workflow `Deploy to cPanel` xanh (build FE trong CI, mirror FE → `/ix.star-siec.edu.vn/frontend/build/`, BE → `/ix.star-siec.edu.vn/backend/` với `--delete`, giữ `uploads`, không đẩy `node_modules`).
3. Nếu `backend/package.json` đổi → cập nhật dependencies trên server (cPanel Terminal/SSH).
4. cPanel → Setup Node.js App → **Restart**.
5. Smoke check: https://ix.star-siec.edu.vn và https://ix.star-siec.edu.vn/api/reading-tests.
- Secrets GitHub: FTP_USERNAME/PASSWORD, DB_HOST/NAME/USER/PASS, JWT_ACCESS/REFRESH_SECRET, FRONTEND_URL, REACT_APP_API_URL, EMAIL_USER/PASS/TO, VITE_ZALO_APP_ID, ZALO_APP_ID/SECRET, OPENAI_API_KEY, GEMINI_API_KEY.

## 9. Quy ước làm việc
- Đọc code liên quan trước khi sửa; thay đổi nhỏ, đúng phạm vi; không sửa lỗi không liên quan.
- Backend: route mỏng + asyncHandler, validate bằng Zod (`validate.js`), phân quyền qua `auth.js`/`testPermissions.js`, log bằng Pino.
- Thay đổi DB → viết script trong `backend/scripts/` có chế độ dry-run/apply.
- Sau khi sửa: chạy test/lint liên quan; build FE nếu đụng frontend.
- Không đưa secrets vào code hay file này.

## 10. Trạng thái & việc tiếp theo
- Đã có: Reading/Listening/Writing, Cambridge/Gateway/General, Placement, Exam Levels, Admin, Analytics, AI, Zalo login, CI/CD cPanel.
- Đang làm / TODO: (anh cập nhật ở đây; em ghi lại sau mỗi phiên làm việc)
  - [ ] …

## 11. Nhật ký phiên
- 2026-11-28: Tạo skill.md ban đầu.
