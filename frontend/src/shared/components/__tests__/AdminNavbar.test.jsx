import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminNavbar from '../AdminNavbar';

jest.mock('../../utils/api', () => ({
  apiPath: jest.fn((path) => path),
  authFetch: jest.fn((url, options) => global.fetch(url, options)),
  hostPath: jest.fn((path) => path),
  clearAuth: jest.fn(),
  getAuthHeaders: jest.fn(() => ({})),
  getStoredUser: jest.fn(),
}));

jest.mock('../../utils/cambridgeFeedback', () => ({
  hasResolvedSubmissionFeedback: jest.fn(() => false),
}));

jest.mock('../../utils/permissions', () => ({
  canManageCategory: jest.fn(() => true),
}));

const { getStoredUser } = require('../../utils/api');

describe('AdminNavbar auth sync', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn((url) => {
      if (String(url).includes('cambridge/submissions')) {
        return Promise.resolve({ ok: true, json: async () => ({ submissions: [] }) });
      }

      return Promise.resolve({ ok: true, json: async () => [] });
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('updates the visible account label when auth data changes', async () => {
    getStoredUser.mockReturnValue({ id: 7, role: 'teacher', canManageTests: true });

    render(
      <MemoryRouter initialEntries={['/admin/writing-submissions']}>
        <AdminNavbar />
      </MemoryRouter>
    );

    expect(await screen.findByText('Teacher')).toBeInTheDocument();
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();

    getStoredUser.mockReturnValue({
      id: 7,
      name: 'Thanh Le',
      role: 'admin',
      canManageTests: true,
    });

    await act(async () => {
      window.dispatchEvent(new CustomEvent('auth:changed'));
    });

    await waitFor(() => {
      expect(screen.getByText('Thanh Le')).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: 'Thanh Le' })).toHaveAttribute('href', '/profile');
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  test('shows Test activity in the desktop teacher navbar without exposing Admin', async () => {
    const originalWidth = window.innerWidth;
    window.innerWidth = 1280;
    getStoredUser.mockReturnValue({
      id: 15,
      name: 'Teacher',
      role: 'teacher',
      canManageTests: true,
    });

    const { unmount } = render(
      <MemoryRouter initialEntries={['/admin/display-settings']}>
        <AdminNavbar />
      </MemoryRouter>
    );

    try {
      const link = await screen.findByRole('link', { name: 'Test activity' });
      expect(link).toHaveAttribute('href', '/admin/display-settings');
      expect(link).toHaveAttribute('aria-current', 'page');
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    } finally {
      unmount();
      window.innerWidth = originalWidth;
    }
  });

  test('shows Prepare navigation even when the active exam-level list does not include it', async () => {
    getStoredUser.mockReturnValue({
      id: 8,
      name: 'Teacher',
      role: 'teacher',
      canManageTests: true,
    });

    render(
      <MemoryRouter initialEntries={['/prepare/submissions']}>
        <AdminNavbar />
      </MemoryRouter>
    );

    const prepareButton = await screen.findByRole('button', { name: 'Prepare' });
    expect(prepareButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(prepareButton);

    expect(prepareButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('dialog', { name: 'Prepare menu' })).toBeInTheDocument();
    expect(screen.getByText('Prepare submissions')).toBeInTheDocument();
  });

  test('switches the desktop General drawer between Create and Submissions', async () => {
    const originalWidth = window.innerWidth;
    window.innerWidth = 1280;
    getStoredUser.mockReturnValue({
      id: 12,
      name: 'Teacher',
      role: 'teacher',
      canManageTests: true,
    });

    const { unmount } = render(
      <MemoryRouter initialEntries={['/admin/general-submissions']}>
        <AdminNavbar />
      </MemoryRouter>
    );

    try {
      fireEvent.click(await screen.findByTitle('General'));
      const drawer = await screen.findByRole('dialog', { name: 'General menu' });

      fireEvent.click(within(drawer).getByRole('button', { name: 'Create' }));
      expect(
        within(drawer).getByRole('link', { name: /Reading & Writing/ })
      ).toHaveAttribute('href', '/admin/create-general-reading');
      expect(
        within(drawer).getByRole('link', { name: 'Listening' })
      ).toHaveAttribute('href', '/admin/create-general-listening');

      fireEvent.click(within(drawer).getByRole('button', { name: 'Submissions' }));
      expect(
        within(drawer).getByRole('link', { name: 'View submissions' })
      ).toHaveAttribute('href', '/admin/general-submissions');
    } finally {
      unmount();
      window.innerWidth = originalWidth;
    }
  });

  test('shows General submissions when switching tabs in the mobile drawer', async () => {
    const originalWidth = window.innerWidth;
    window.innerWidth = 900;
    getStoredUser.mockReturnValue({
      id: 13,
      name: 'Teacher',
      role: 'teacher',
      canManageTests: true,
    });

    const { unmount } = render(
      <MemoryRouter initialEntries={['/admin/progress-reports']}>
        <AdminNavbar />
      </MemoryRouter>
    );

    try {
      fireEvent.click(await screen.findByRole('button', { name: 'Open menu' }));
      const drawer = await screen.findByRole('dialog');
      fireEvent.click(within(drawer).getByRole('button', { name: 'General' }));
      fireEvent.click(within(drawer).getByRole('button', { name: 'Submissions' }));

      expect(
        within(drawer).getByRole('link', { name: 'View submissions' })
      ).toHaveAttribute('href', '/admin/general-submissions');
    } finally {
      unmount();
      window.innerWidth = originalWidth;
    }
  });

  test('uses the vertical navigation drawer at tablet widths and shows teacher sections', async () => {
    const originalWidth = window.innerWidth;
    window.innerWidth = 900;
    getStoredUser.mockReturnValue({
      id: 10,
      name: 'Teacher',
      role: 'teacher',
      canManageTests: true,
    });

    const { unmount } = render(
      <MemoryRouter initialEntries={['/admin/progress-reports']}>
        <AdminNavbar />
      </MemoryRouter>
    );

    try {
      fireEvent.click(await screen.findByRole('button', { name: 'Open menu' }));
      const drawer = await screen.findByRole('dialog');

      for (const section of ['Review', 'IX', 'Gateway', 'Prepare', 'Orange', 'General', 'Overview']) {
        expect(within(drawer).getByRole('button', { name: section })).toBeInTheDocument();
      }

      expect(
        within(drawer).getByRole('link', { name: /Test activity/ })
      ).toHaveAttribute('href', '/admin/display-settings');
      expect(within(drawer).queryByRole('button', { name: 'Admin' })).not.toBeInTheDocument();
      const progressReportsToggle = within(drawer).getByRole('button', {
        name: /Progress Reports/,
      });
      expect(progressReportsToggle).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(progressReportsToggle);
      expect(progressReportsToggle).toHaveAttribute('aria-expanded', 'true');
      expect(within(drawer).getByRole('link', { name: 'Star Edu' })).toHaveAttribute(
        'href',
        '/admin/progress-reports?report=general'
      );
      expect(within(drawer).getByRole('link', { name: 'IELTS' })).toHaveAttribute(
        'href',
        '/admin/progress-reports?report=ielts'
      );
    } finally {
      unmount();
      window.innerWidth = originalWidth;
    }
  });

  test('shows the Star Edu and IELTS choices in the desktop Progress Reports dropdown', async () => {
    const originalWidth = window.innerWidth;
    window.innerWidth = 1280;
    getStoredUser.mockReturnValue({
      id: 14,
      name: 'Teacher',
      role: 'teacher',
      canManageTests: true,
    });

    const { unmount } = render(
      <MemoryRouter initialEntries={['/admin/progress-reports?report=ielts']}>
        <AdminNavbar />
      </MemoryRouter>
    );

    try {
      const progressReportsToggle = await screen.findByRole('button', {
        name: 'Progress Reports',
      });
      fireEvent.click(progressReportsToggle);

      expect(screen.getByRole('link', { name: 'Star Edu' })).toHaveAttribute(
        'href',
        '/admin/progress-reports?report=general'
      );
      expect(screen.getByRole('link', { name: 'IELTS' })).toHaveAttribute(
        'href',
        '/admin/progress-reports?report=ielts'
      );
      expect(screen.getByRole('link', { name: 'IELTS' })).toHaveAttribute(
        'aria-current',
        'page'
      );
    } finally {
      unmount();
      window.innerWidth = originalWidth;
    }
  });

  test('hides the Prepare quick link from Overview but keeps the main Prepare section', async () => {
    const originalWidth = window.innerWidth;
    window.innerWidth = 900;
    getStoredUser.mockReturnValue({
      id: 11,
      name: 'Teacher',
      role: 'teacher',
      canManageTests: true,
    });
    global.fetch = jest.fn((url) => {
      if (String(url).includes('exam-levels')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { code: 'prepare', name: 'Prepare' },
            { code: 'gateway', name: 'Gateway' },
          ],
        });
      }

      if (String(url).includes('cambridge/submissions')) {
        return Promise.resolve({ ok: true, json: async () => ({ submissions: [] }) });
      }

      return Promise.resolve({ ok: true, json: async () => [] });
    });

    const { unmount } = render(
      <MemoryRouter initialEntries={['/admin/progress-reports']}>
        <AdminNavbar />
      </MemoryRouter>
    );

    try {
      fireEvent.click(await screen.findByRole('button', { name: 'Open menu' }));
      const drawer = await screen.findByRole('dialog');
      expect(within(drawer).getByRole('button', { name: 'Prepare' })).toBeInTheDocument();
      expect(
        await within(drawer).findByRole('link', {
          name: /Open Gateway tests and submissions/,
        })
      ).toHaveAttribute('href', '/exam-levels/gateway');
      expect(
        within(drawer).queryByRole('link', {
          name: /Open Prepare tests and submissions/,
        })
      ).not.toBeInTheDocument();
    } finally {
      unmount();
      window.innerWidth = originalWidth;
    }
  });

  test('shows pending notifications only for tests created by the current teacher', async () => {
    getStoredUser.mockReturnValue({
      id: 9,
      name: 'Thanh Le',
      role: 'teacher',
      canManageTests: true,
    });

    global.fetch = jest.fn((url) => {
      if (String(url).includes('writing/list')) {
        return Promise.resolve({
          ok: true,
          json: async () => ([
            {
              id: 11,
              userName: 'Student Writing Match',
              userPhone: '0901',
              createdAt: '2026-05-21T10:00:00.000Z',
              WritingTest: { teacherName: 'Thanh Le', testType: 'writing' },
            },
            {
              id: 12,
              userName: 'Student Writing Other',
              userPhone: '0902',
              createdAt: '2026-05-21T09:00:00.000Z',
              WritingTest: { teacherName: 'Other Teacher', testType: 'writing' },
            },
          ]),
        });
      }

      if (String(url).includes('reading-submissions/admin/list')) {
        return Promise.resolve({
          ok: true,
          json: async () => ([
            {
              id: 21,
              userName: 'Student Reading Match',
              userPhone: '0903',
              createdAt: '2026-05-21T08:00:00.000Z',
              teacherName: 'Thanh Le',
            },
            {
              id: 22,
              userName: 'Student Reading Other',
              userPhone: '0904',
              createdAt: '2026-05-21T07:00:00.000Z',
              teacherName: 'Other Teacher',
            },
          ]),
        });
      }

      if (String(url).includes('listening-submissions/admin/list')) {
        return Promise.resolve({
          ok: true,
          json: async () => ([
            {
              id: 31,
              userName: 'Student Listening Match',
              userPhone: '0905',
              createdAt: '2026-05-21T06:00:00.000Z',
              teacherName: 'Thanh Le',
            },
          ]),
        });
      }

      if (String(url).includes('cambridge/submissions')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            submissions: [
              {
                id: 41,
                studentName: 'Student Orange Match',
                studentPhone: '0906',
                createdAt: '2026-05-21T05:00:00.000Z',
                teacherName: 'Thanh Le',
              },
              {
                id: 42,
                studentName: 'Student Orange Other',
                studentPhone: '0907',
                createdAt: '2026-05-21T04:00:00.000Z',
                teacherName: 'Other Teacher',
              },
            ],
          }),
        });
      }

      return Promise.resolve({ ok: true, json: async () => [] });
    });

    render(
      <MemoryRouter initialEntries={['/admin/reading-submissions']}>
        <AdminNavbar />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('4', { selector: '.adminNavbar__badge' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Pending submissions'));

    expect(await screen.findByText('Student Writing Match')).toBeInTheDocument();
    expect(screen.getByText('Student Reading Match')).toBeInTheDocument();
    expect(screen.getByText('Student Listening Match')).toBeInTheDocument();
    expect(screen.getByText('Student Orange Match')).toBeInTheDocument();
    expect(screen.queryByText('Student Writing Other')).not.toBeInTheDocument();
    expect(screen.queryByText('Student Reading Other')).not.toBeInTheDocument();
    expect(screen.queryByText('Student Orange Other')).not.toBeInTheDocument();
  });
});