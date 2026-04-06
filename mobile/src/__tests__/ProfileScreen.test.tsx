import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { ProfileScreen } from '../screens/ProfileScreen';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const mockLogout = jest.fn();
const mockUseAuth = jest.fn();
jest.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockFetchApi = jest.fn();
jest.mock('../api/client', () => ({
  fetchApi: (...args: any[]) => mockFetchApi(...args),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeAuthUser(role = 'cook', username = 'testuser', email = 'test@example.com') {
  return {
    authState: { status: 'authenticated', user: { username, email, role } },
    logout: mockLogout,
  };
}

async function renderAndFlush() {
  const result = render(<ProfileScreen />);
  await act(async () => { await Promise.resolve(); });
  return result;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue(makeAuthUser());
    mockFetchApi.mockResolvedValue([]);
  });

  // ─── Rendering ──────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('shows the Profile title', async () => {
      const { getByText } = await renderAndFlush();
      expect(getByText('Profile')).toBeTruthy();
    });

    it('shows username and email from auth state', async () => {
      const { getByText } = await renderAndFlush();
      expect(getByText('testuser')).toBeTruthy();
      expect(getByText('test@example.com')).toBeTruthy();
    });

    it('shows the initials avatar', async () => {
      const { getByText } = await renderAndFlush();
      expect(getByText('TE')).toBeTruthy();
    });

    it('shows the role badge with correct label', async () => {
      const { getByText } = await renderAndFlush();
      expect(getByText('Cook')).toBeTruthy();
    });

    it('shows the EN | TR language toggle', async () => {
      const { getByText } = await renderAndFlush();
      expect(getByText('EN')).toBeTruthy();
      expect(getByText('TR')).toBeTruthy();
    });

    it('shows the Log out button', async () => {
      const { getByText } = await renderAndFlush();
      expect(getByText('Log out')).toBeTruthy();
    });
  });

  // ─── Stats ──────────────────────────────────────────────────────────────────

  describe('stats', () => {
    it('shows stat labels when the user has no recipes', async () => {
      const { getByText } = await renderAndFlush();
      expect(getByText('Total')).toBeTruthy();
      expect(getByText('Published')).toBeTruthy();
      expect(getByText('Drafts')).toBeTruthy();
    });

    it('shows correct total count for mixed recipes', async () => {
      mockFetchApi.mockResolvedValue([
        { id: '1', title: 'A', type: 'community', isPublished: true, averageRating: null, coverImageUrl: null },
        { id: '2', title: 'B', type: 'cultural', isPublished: true, averageRating: 4.2, coverImageUrl: null },
        { id: '3', title: 'C', type: 'community', isPublished: false, averageRating: null, coverImageUrl: null },
      ]);
      const { getAllByText } = await renderAndFlush();
      expect(getAllByText('3').length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── Recent recipes ──────────────────────────────────────────────────────────

  describe('recent recipes', () => {
    it('shows the empty state when the user has no recipes at all', async () => {
      mockFetchApi.mockResolvedValue([]);
      const { getByText } = await renderAndFlush();
      expect(getByText('No recipes yet. Start creating!')).toBeTruthy();
    });

    it('renders published recipe titles', async () => {
      mockFetchApi.mockResolvedValue([
        { id: '1', title: 'Baklava', type: 'cultural', isPublished: true, averageRating: 4.8, coverImageUrl: null },
      ]);
      const { getByText } = await renderAndFlush();
      expect(getByText('Baklava')).toBeTruthy();
    });

    it('navigates to RecipeDetail when a recipe card is pressed', async () => {
      mockFetchApi.mockResolvedValue([
        { id: 'abc-123', title: 'Menemen', type: 'community', isPublished: true, averageRating: null, coverImageUrl: null },
      ]);
      const { getByText } = await renderAndFlush();
      fireEvent.press(getByText('Menemen'));
      expect(mockNavigate).toHaveBeenCalledWith('RecipeDetail', { recipeId: 'abc-123' });
    });

    it('shows the Cultural badge for cultural recipes', async () => {
      mockFetchApi.mockResolvedValue([
        { id: '1', title: 'Ashura', type: 'cultural', isPublished: true, averageRating: null, coverImageUrl: null },
      ]);
      const { getByText } = await renderAndFlush();
      expect(getByText('Cultural')).toBeTruthy();
    });

    it('shows the Community badge for community recipes', async () => {
      mockFetchApi.mockResolvedValue([
        { id: '1', title: 'My Soup', type: 'community', isPublished: true, averageRating: null, coverImageUrl: null },
      ]);
      const { getByText } = await renderAndFlush();
      expect(getByText('Community')).toBeTruthy();
    });
  });

  // ─── Role badge labels ───────────────────────────────────────────────────────

  describe('role badge labels', () => {
    it.each([
      ['learner', 'Learner'],
      ['cook', 'Cook'],
      ['expert', 'Expert'],
    ])('shows "%s" label for role %s', async (role, label) => {
      mockUseAuth.mockReturnValue(makeAuthUser(role));
      const { getByText } = await renderAndFlush();
      expect(getByText(label)).toBeTruthy();
    });
  });

  // ─── Log out ─────────────────────────────────────────────────────────────────

  describe('log out', () => {
    it('calls logout when Log out button is pressed', async () => {
      const { getByText } = await renderAndFlush();
      fireEvent.press(getByText('Log out'));
      expect(mockLogout).toHaveBeenCalled();
    });
  });
});
