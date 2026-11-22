jest.mock('../models/User', () => ({
  count: jest.fn(),
  findAll: jest.fn(),
}));
jest.mock('../models/RefreshToken', () => ({}));
jest.mock('../models/WritingTests', () => ({}));
jest.mock('../models/ReadingTest', () => ({}));
jest.mock('../models/ListeningTest', () => ({}));
jest.mock('../models/Submission', () => ({
  count: jest.fn(),
  findAll: jest.fn(),
}));
jest.mock('../models/ReadingSubmission', () => ({
  count: jest.fn(),
  findAll: jest.fn(),
}));
jest.mock('../models/ListeningSubmission', () => ({
  count: jest.fn(),
  findAll: jest.fn(),
}));
jest.mock('../models/CambridgeListening', () => ({}));
jest.mock('../models/CambridgeReading', () => ({}));
jest.mock('../models/CambridgeSubmission', () => ({
  count: jest.fn(),
  findAll: jest.fn(),
}));
jest.mock('../models/GatewayListening', () => ({}));
jest.mock('../models/GatewayReading', () => ({}));
jest.mock('../models/GatewaySubmission', () => ({
  count: jest.fn(),
  findAll: jest.fn(),
}));
jest.mock('../models/GeneralListening', () => ({}));
jest.mock('../models/GeneralReading', () => ({}));
jest.mock('../models/GeneralSubmission', () => ({
  count: jest.fn(),
  findAll: jest.fn(),
}));
jest.mock('../models/ExamLevel', () => ({
  findOne: jest.fn(),
}));
jest.mock('../models/ExamLevelSubmission', () => ({
  count: jest.fn(),
  findAll: jest.fn(),
}));
jest.mock('../models/AnalyticsEvent', () => ({
  findAll: jest.fn(),
}));
jest.mock('../middlewares/auth', () => ({
  requireAuth: (_req, _res, next) => next(),
  requireRole: () => (_req, _res, next) => next(),
}));
jest.mock('../logger', () => ({ logError: jest.fn() }));

const User = require('../models/User');
const Submission = require('../models/Submission');
const ReadingSubmission = require('../models/ReadingSubmission');
const ListeningSubmission = require('../models/ListeningSubmission');
const CambridgeSubmission = require('../models/CambridgeSubmission');
const GatewaySubmission = require('../models/GatewaySubmission');
const GeneralSubmission = require('../models/GeneralSubmission');
const ExamLevel = require('../models/ExamLevel');
const ExamLevelSubmission = require('../models/ExamLevelSubmission');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const router = require('../routes/admin');

const getRouteHandler = (path, method) => {
  const layer = router.stack.find(
    (entry) => entry.route?.path === path && entry.route.methods?.[method]
  );

  if (!layer) {
    throw new Error(`Could not find ${method.toUpperCase()} ${path} route.`);
  }

  return layer.route.stack[layer.route.stack.length - 1].handle;
};

const usageOverviewHandler = getRouteHandler('/usage-overview', 'get');

describe('GET /admin/usage-overview', () => {
  const countModels = [
    Submission,
    ReadingSubmission,
    ListeningSubmission,
    CambridgeSubmission,
    GatewaySubmission,
    GeneralSubmission,
    ExamLevelSubmission,
  ];
  const submissionModels = [
    Submission,
    ReadingSubmission,
    ListeningSubmission,
    CambridgeSubmission,
    GatewaySubmission,
    GeneralSubmission,
    ExamLevelSubmission,
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    User.count.mockResolvedValue(0);
    ExamLevel.findOne.mockResolvedValue({ id: 42 });
    AnalyticsEvent.findAll.mockResolvedValue([]);
    countModels.forEach((Model) => Model.count.mockResolvedValue(0));
    submissionModels.forEach((Model) => Model.findAll.mockResolvedValue([]));
  });

  test('returns daily and month-to-date activity, including Gateway and Prepare', async () => {
    const now = new Date();
    Submission.findAll
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 5,
          userId: 31,
          isDraft: false,
          createdAt: now,
          submittedAt: now,
          updatedAt: now,
        },
      ]);
    GatewaySubmission.findAll
      .mockResolvedValueOnce([{ id: 6, userId: 32 }])
      .mockResolvedValueOnce([]);
    ExamLevelSubmission.findAll
      .mockResolvedValueOnce([{ id: 7, userId: 33 }])
      .mockResolvedValueOnce([
        {
          id: 8,
          userId: 34,
          finished: 1,
          status: 'submitted',
          createdAt: now,
          submittedAt: now,
          updatedAt: now,
        },
      ]);

    Submission.count.mockResolvedValueOnce(1).mockResolvedValueOnce(10);
    ReadingSubmission.count.mockResolvedValueOnce(2).mockResolvedValueOnce(20);
    ListeningSubmission.count.mockResolvedValueOnce(3).mockResolvedValueOnce(30);
    CambridgeSubmission.count.mockResolvedValueOnce(4).mockResolvedValueOnce(40);
    GatewaySubmission.count.mockResolvedValueOnce(5).mockResolvedValueOnce(50);
    GeneralSubmission.count.mockResolvedValueOnce(6).mockResolvedValueOnce(60);
    ExamLevelSubmission.count.mockResolvedValueOnce(7).mockResolvedValueOnce(70);

    const response = {
      json: jest.fn(),
      status: jest.fn(function status() {
        return this;
      }),
    };

    await usageOverviewHandler({}, response);

    expect(response.status).not.toHaveBeenCalled();
    const payload = response.json.mock.calls[0][0];
    expect(payload.live.sessionsByType).toMatchObject({
      gateway: 1,
      prepare: 1,
    });
    expect(payload.live.activeUsersInTests).toBe(2);
    expect(payload.live.activeTestSessions).toBe(2);
    expect(payload.today).toMatchObject({
      usersInTests: 2,
      submitters: 2,
      submissions: 28,
    });
    expect(payload.today.usersByType).toMatchObject({ writing: 1 });
    expect(payload.today.usersByType.prepare).toBe(1);
    expect(payload.today.submissionsByType).toMatchObject({
      gateway: 5,
      prepare: 7,
    });
    expect(payload.month).toMatchObject({
      date: expect.stringMatching(/^\d{4}-\d{2}$/),
      usersInTests: 2,
      submitters: 2,
      submissions: 280,
    });
    expect(payload.month.usersByType).toMatchObject({ writing: 1 });
    expect(payload.month.usersByType.prepare).toBe(1);
    expect(payload.month.submissionsByType).toMatchObject({
      gateway: 50,
      prepare: 70,
    });
  });
});
