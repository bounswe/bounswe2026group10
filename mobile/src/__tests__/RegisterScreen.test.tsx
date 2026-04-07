import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { RegisterScreen } from '../screens/RegisterScreen';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

// Stub FormDropdown: pressing it selects the first option, keyed by testID
jest.mock('../components/shared/FormDropdown', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return {
    FormDropdown: ({ label, onSelect, options, placeholder }: any) => (
      <TouchableOpacity
        testID={`dropdown-${label}`}
        onPress={() => options[0] && onSelect(options[0].value)}
      >
        <Text>{placeholder}</Text>
      </TouchableOpacity>
    ),
  };
});

const mockRegister = jest.fn();
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ register: mockRegister }),
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const navigation = { navigate: mockNavigate, goBack: mockGoBack } as any;
const route = {} as any;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function renderScreen() {
  const screen = render(<RegisterScreen navigation={navigation} route={route} />);
  await act(async () => {});
  return screen;
}

function fillTextFields(screen: ReturnType<typeof render>) {
  const { getByPlaceholderText } = screen;
  fireEvent.changeText(getByPlaceholderText('First name'), 'Jane');
  fireEvent.changeText(getByPlaceholderText('Last name'), 'Doe');
  fireEvent.changeText(getByPlaceholderText('your_username'), 'janedoe');
  fireEvent.changeText(getByPlaceholderText('your@email.com'), 'jane@test.com');
  fireEvent.changeText(getByPlaceholderText('••••••••'), 'password123');
  fireEvent.changeText(getByPlaceholderText('Re-enter password'), 'password123');
}

async function fillAndSubmit(screen: Awaited<ReturnType<typeof renderScreen>>, role: string = 'Learner') {
  const { getByText, getByTestId, getByPlaceholderText } = screen;
  fillTextFields(screen);
  fireEvent.press(getByText(role));
  fireEvent.changeText(getByPlaceholderText('e.g., Turkey'), 'Turkey');
  fireEvent.press(getByTestId('dropdown-Language'));
  await act(async () => { fireEvent.press(getByText('Create Account')); });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRegister.mockResolvedValue(undefined);
  });

  // ─── Rendering ──────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('shows all text input fields', async () => {
      const { getByPlaceholderText } = await renderScreen();
      expect(getByPlaceholderText('First name')).toBeTruthy();
      expect(getByPlaceholderText('Last name')).toBeTruthy();
      expect(getByPlaceholderText('your_username')).toBeTruthy();
      expect(getByPlaceholderText('your@email.com')).toBeTruthy();
      expect(getByPlaceholderText('••••••••')).toBeTruthy();
      expect(getByPlaceholderText('Re-enter password')).toBeTruthy();
    });

    it('shows all three role cards', async () => {
      const { getByText } = await renderScreen();
      expect(getByText('Learner')).toBeTruthy();
      expect(getByText('Cook')).toBeTruthy();
      expect(getByText('Expert')).toBeTruthy();
    });

    it('shows the Create Account button', async () => {
      const { getByText } = await renderScreen();
      expect(getByText('Create Account')).toBeTruthy();
    });

    it('shows the Sign In link', async () => {
      const { getByText } = await renderScreen();
      expect(getByText('Sign In')).toBeTruthy();
    });
  });

  // ─── Validation ─────────────────────────────────────────────────────────────

  describe('validation', () => {
    it('shows required errors and does not submit on empty form', async () => {
      const { getByText, getAllByText } = await renderScreen();
      await act(async () => { fireEvent.press(getByText('Create Account')); });
      expect(mockRegister).not.toHaveBeenCalled();
      expect(getAllByText('Required').length).toBeGreaterThan(0);
    });

    it('shows email validation error for invalid email', async () => {
      const screen = await renderScreen();
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'not-an-email');
      await act(async () => { fireEvent.press(screen.getByText('Create Account')); });
      expect(screen.getByText('Valid email required')).toBeTruthy();
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('shows error when password is too short', async () => {
      const screen = await renderScreen();
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'user@test.com');
      fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'short');
      await act(async () => { fireEvent.press(screen.getByText('Create Account')); });
      expect(screen.getByText('At least 8 characters')).toBeTruthy();
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('shows error when passwords do not match', async () => {
      const screen = await renderScreen();
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'user@test.com');
      fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'password123');
      fireEvent.changeText(screen.getByPlaceholderText('Re-enter password'), 'different456');
      await act(async () => { fireEvent.press(screen.getByText('Create Account')); });
      expect(screen.getByText('Passwords do not match')).toBeTruthy();
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('shows role error when no role is selected', async () => {
      const screen = await renderScreen();
      fillTextFields(screen);
      // deliberately skip role selection
      fireEvent.changeText(screen.getByPlaceholderText('e.g., Turkey'), 'Turkey');
      fireEvent.press(screen.getByTestId('dropdown-Language'));
      await act(async () => { fireEvent.press(screen.getByText('Create Account')); });
      expect(screen.getByText('Please choose a role')).toBeTruthy();
      expect(mockRegister).not.toHaveBeenCalled();
    });
  });

  // ─── Role selection ──────────────────────────────────────────────────────────

  describe('role selection', () => {
    it('allows selecting Learner', async () => {
      const screen = await renderScreen();
      fireEvent.press(screen.getByText('Learner'));
      fillTextFields(screen);
      fireEvent.changeText(screen.getByPlaceholderText('e.g., Turkey'), 'Turkey');
      fireEvent.press(screen.getByTestId('dropdown-Language'));
      await act(async () => { fireEvent.press(screen.getByText('Create Account')); });
      expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({ role: 'learner' }));
    });

    it('allows selecting Cook', async () => {
      const screen = await renderScreen();
      fireEvent.press(screen.getByText('Cook'));
      fillTextFields(screen);
      fireEvent.changeText(screen.getByPlaceholderText('e.g., Turkey'), 'Turkey');
      fireEvent.press(screen.getByTestId('dropdown-Language'));
      await act(async () => { fireEvent.press(screen.getByText('Create Account')); });
      expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({ role: 'cook' }));
    });

    it('allows selecting Expert', async () => {
      const screen = await renderScreen();
      fireEvent.press(screen.getByText('Expert'));
      fillTextFields(screen);
      fireEvent.changeText(screen.getByPlaceholderText('e.g., Turkey'), 'Turkey');
      fireEvent.press(screen.getByTestId('dropdown-Language'));
      await act(async () => { fireEvent.press(screen.getByText('Create Account')); });
      expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({ role: 'expert' }));
    });

    it('switches role selection when tapping a different role', async () => {
      const screen = await renderScreen();
      fireEvent.press(screen.getByText('Learner'));
      fireEvent.press(screen.getByText('Cook')); // switch to Cook
      fillTextFields(screen);
      fireEvent.changeText(screen.getByPlaceholderText('e.g., Turkey'), 'Turkey');
      fireEvent.press(screen.getByTestId('dropdown-Language'));
      await act(async () => { fireEvent.press(screen.getByText('Create Account')); });
      expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({ role: 'cook' }));
    });
  });

  // ─── Registration submission ─────────────────────────────────────────────────

  describe('registration submission', () => {
    it('calls register() with all correct params', async () => {
      const screen = await renderScreen();
      await fillAndSubmit(screen);
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Jane',
          lastName: 'Doe',
          username: 'janedoe',
          email: 'jane@test.com',
          password: 'password123',
          role: 'learner',
          region: 'Turkey',  // sent as region to backend
          preferredLanguage: 'tr',
        })
      );
    });

    it('trims whitespace from text fields before submitting', async () => {
      const screen = await renderScreen();
      fireEvent.changeText(screen.getByPlaceholderText('First name'), '  Jane  ');
      fireEvent.changeText(screen.getByPlaceholderText('Last name'), '  Doe  ');
      fireEvent.changeText(screen.getByPlaceholderText('your_username'), '  janedoe  ');
      fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), '  jane@test.com  ');
      fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'password123');
      fireEvent.changeText(screen.getByPlaceholderText('Re-enter password'), 'password123');
      fireEvent.press(screen.getByText('Learner'));
      fireEvent.changeText(screen.getByPlaceholderText('e.g., Turkey'), 'Turkey');
      fireEvent.press(screen.getByTestId('dropdown-Language'));
      await act(async () => { fireEvent.press(screen.getByText('Create Account')); });
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com' })
      );
    });

    it('shows error banner with server message when register() rejects', async () => {
      mockRegister.mockRejectedValue(new Error('Email already in use'));
      const screen = await renderScreen();
      await fillAndSubmit(screen);
      await waitFor(() => {
        expect(screen.getByText('Email already in use')).toBeTruthy();
      });
    });

    it('shows generic error for non-Error rejections', async () => {
      mockRegister.mockRejectedValue('unknown');
      const screen = await renderScreen();
      await fillAndSubmit(screen);
      await waitFor(() => {
        expect(screen.getByText('Registration failed. Please try again.')).toBeTruthy();
      });
    });

    it('shows a loading spinner while submission is in progress', async () => {
      let resolve!: () => void;
      mockRegister.mockReturnValue(new Promise<void>((r) => { resolve = r; }));
      const screen = await renderScreen();
      fillTextFields(screen);
      fireEvent.press(screen.getByText('Learner'));
      fireEvent.changeText(screen.getByPlaceholderText('e.g., Turkey'), 'Turkey');
      fireEvent.press(screen.getByTestId('dropdown-Language'));
      fireEvent.press(screen.getByText('Create Account'));
      await act(async () => {});
      // Button text is replaced by ActivityIndicator during loading
      expect(screen.queryByText('Create Account')).toBeNull();
      expect(screen.UNSAFE_getByType(require('react-native').ActivityIndicator)).toBeTruthy();
      resolve();
      await act(async () => {});
    });
  });

  // ─── Navigation ──────────────────────────────────────────────────────────────

  describe('navigation', () => {
    it('navigates to Login when the Sign In link is pressed', async () => {
      const { getByText } = await renderScreen();
      fireEvent.press(getByText('Sign In'));
      expect(mockNavigate).toHaveBeenCalledWith('Login');
    });

    it('calls goBack when the back arrow is pressed', async () => {
      const { UNSAFE_getAllByType } = await renderScreen();
      const icons = UNSAFE_getAllByType('MaterialCommunityIcons' as any);
      fireEvent.press(icons[0].parent!);
      expect(mockGoBack).toHaveBeenCalled();
    });
  });
});
