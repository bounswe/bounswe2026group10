import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../screens/LoginScreen';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

const mockLogin = jest.fn();
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const navigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
} as any;

const route = {} as any;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderScreen() {
  return render(<LoginScreen navigation={navigation} route={route} />);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin.mockResolvedValue(undefined);
  });

  // ─── Rendering ──────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('shows email and password inputs', () => {
      const { getByPlaceholderText } = renderScreen();
      expect(getByPlaceholderText('your@email.com')).toBeTruthy();
      expect(getByPlaceholderText('••••••••')).toBeTruthy();
    });

    it('shows the Sign In button', () => {
      const { getByText } = renderScreen();
      expect(getByText('Sign In')).toBeTruthy();
    });

    it('shows the Register link', () => {
      const { getByText } = renderScreen();
      expect(getByText('Register')).toBeTruthy();
    });

    it('shows Forgot Password? link', () => {
      const { getByText } = renderScreen();
      expect(getByText('Forgot Password?')).toBeTruthy();
    });

    it('shows Remember me toggle', () => {
      const { getByText } = renderScreen();
      expect(getByText('Remember me')).toBeTruthy();
    });

    it('does not show error banner initially', () => {
      const { queryByText } = renderScreen();
      expect(queryByText(/Invalid|invalid|error/i)).toBeNull();
    });
  });

  // ─── Validation ─────────────────────────────────────────────────────────────

  describe('validation', () => {
    it('shows error and does not call login when both fields are empty', async () => {
      const { getByText } = renderScreen();
      await act(async () => { fireEvent.press(getByText('Sign In')); });
      expect(mockLogin).not.toHaveBeenCalled();
      expect(getByText('Please enter your email and password.')).toBeTruthy();
    });

    it('shows error when email is missing', async () => {
      const { getByText, getByPlaceholderText } = renderScreen();
      fireEvent.changeText(getByPlaceholderText('••••••••'), 'password123');
      await act(async () => { fireEvent.press(getByText('Sign In')); });
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('shows error when password is missing', async () => {
      const { getByText, getByPlaceholderText } = renderScreen();
      fireEvent.changeText(getByPlaceholderText('your@email.com'), 'user@test.com');
      await act(async () => { fireEvent.press(getByText('Sign In')); });
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  // ─── Login submission ────────────────────────────────────────────────────────

  describe('login submission', () => {
    it('calls login() with trimmed email and password', async () => {
      const { getByText, getByPlaceholderText } = renderScreen();
      fireEvent.changeText(getByPlaceholderText('your@email.com'), '  user@test.com  ');
      fireEvent.changeText(getByPlaceholderText('••••••••'), 'secret123');
      await act(async () => { fireEvent.press(getByText('Sign In')); });
      expect(mockLogin).toHaveBeenCalledWith({ email: 'user@test.com', password: 'secret123' });
    });

    it('shows error banner when login() rejects', async () => {
      mockLogin.mockRejectedValue(new Error('Invalid email or password'));
      const { getByText, getByPlaceholderText } = renderScreen();
      fireEvent.changeText(getByPlaceholderText('your@email.com'), 'user@test.com');
      fireEvent.changeText(getByPlaceholderText('••••••••'), 'wrongpass');
      await act(async () => { fireEvent.press(getByText('Sign In')); });
      expect(getByText('Invalid email or password')).toBeTruthy();
    });

    it('shows a generic error message for unknown errors', async () => {
      mockLogin.mockRejectedValue('non-error-object');
      const { getByText, getByPlaceholderText } = renderScreen();
      fireEvent.changeText(getByPlaceholderText('your@email.com'), 'user@test.com');
      fireEvent.changeText(getByPlaceholderText('••••••••'), 'anypass');
      await act(async () => { fireEvent.press(getByText('Sign In')); });
      expect(getByText('Invalid email or password.')).toBeTruthy();
    });
  });

  // ─── Password visibility ─────────────────────────────────────────────────────

  describe('password visibility toggle', () => {
    it('password field is hidden by default', () => {
      const { getByPlaceholderText } = renderScreen();
      const passwordInput = getByPlaceholderText('••••••••');
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });

    it('pressing the eye icon reveals the password', () => {
      // icons[0] = back arrow, icons[1] = eye toggle
      const { getByPlaceholderText, UNSAFE_getAllByType } = renderScreen();
      const eyeIcon = UNSAFE_getAllByType('MaterialCommunityIcons' as any)[1];
      fireEvent.press(eyeIcon.parent!);
      const passwordInput = getByPlaceholderText('••••••••');
      expect(passwordInput.props.secureTextEntry).toBe(false);
    });

    it('pressing the eye icon again hides the password', () => {
      const { getByPlaceholderText, UNSAFE_getAllByType } = renderScreen();
      const eyeIcon = UNSAFE_getAllByType('MaterialCommunityIcons' as any)[1];
      fireEvent.press(eyeIcon.parent!); // reveal
      fireEvent.press(eyeIcon.parent!); // hide again
      expect(getByPlaceholderText('••••••••').props.secureTextEntry).toBe(true);
    });
  });

  // ─── Navigation ──────────────────────────────────────────────────────────────

  describe('navigation', () => {
    it('navigates to Register when the Register link is pressed', () => {
      const { getByText } = renderScreen();
      fireEvent.press(getByText('Register'));
      expect(mockNavigate).toHaveBeenCalledWith('Register');
    });

    it('calls goBack when the back arrow is pressed', () => {
      const { UNSAFE_getAllByType } = renderScreen();
      // icons[0] = back arrow (arrow-left), icons[1] = eye toggle
      const icons = UNSAFE_getAllByType('MaterialCommunityIcons' as any);
      fireEvent.press(icons[0].parent!);
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  // ─── Forgot password modal ────────────────────────────────────────────────────

  describe('forgot password', () => {
    it('shows the reset modal when Forgot Password? is pressed', async () => {
      const { getByText } = renderScreen();
      fireEvent.press(getByText('Forgot Password?'));
      await waitFor(() => {
        expect(getByText('Reset Password')).toBeTruthy();
        expect(getByText('Send Reset Link')).toBeTruthy();
      });
    });

    it('shows success message after Send Reset Link is pressed', async () => {
      const { getByText } = renderScreen();
      fireEvent.press(getByText('Forgot Password?'));
      await waitFor(() => getByText('Send Reset Link'));
      fireEvent.press(getByText('Send Reset Link'));
      await waitFor(() => {
        expect(getByText(/reset link has been sent/i)).toBeTruthy();
      });
    });
  });
});
