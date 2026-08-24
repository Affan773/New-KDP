import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { GoogleAuditLogService } from './googleAuditLogService';

// Initialize Firebase App singleton safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure Google Auth Provider with Google Docs and Google Drive file scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/documents');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.setCustomParameters({
  prompt: 'select_account',
});

// Cache the OAuth access token exclusively in memory (never localStorage per security rules)
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;
let isSigningIn = false;
let authListeners: Array<(user: User | null, token: string | null) => void> = [];

/**
 * Service to manage Google OAuth authentication state and access tokens
 */
export class GoogleAuthService {
  /**
   * Register a listener for auth changes
   */
  public static addAuthListener(listener: (user: User | null, token: string | null) => void): () => void {
    authListeners.push(listener);
    // Trigger immediately with current state
    listener(cachedUser, cachedAccessToken);
    return () => {
      authListeners = authListeners.filter(l => l !== listener);
    };
  }

  private static notifyListeners(user: User | null, token: string | null) {
    authListeners.forEach(listener => {
      try {
        listener(user, token);
      } catch (err) {
        console.error('Error in auth listener:', err);
      }
    });
  }

  /**
   * Initializes Firebase Auth state listener.
   */
  public static initAuth(
    onSuccess?: (user: User, token: string) => void,
    onFailure?: () => void
  ): () => void {
    return onAuthStateChanged(auth, async (user: User | null) => {
      cachedUser = user;
      if (user) {
        if (cachedAccessToken) {
          this.notifyListeners(user, cachedAccessToken);
          if (onSuccess) onSuccess(user, cachedAccessToken);
        } else if (!isSigningIn) {
          // Token needs fresh interactive acquisition or popup
          this.notifyListeners(user, null);
          if (onFailure) onFailure();
        }
      } else {
        cachedAccessToken = null;
        this.notifyListeners(null, null);
        if (onFailure) onFailure();
      }
    });
  }

  /**
   * Interactive Sign-In with Google using official popup flow
   */
  public static async signInWithGoogle(): Promise<{ user: User; accessToken: string } | null> {
    try {
      isSigningIn = true;
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (!credential?.accessToken) {
        throw new Error('Failed to obtain access token from Google authentication credential.');
      }

      cachedAccessToken = credential.accessToken;
      cachedUser = result.user;

      GoogleAuditLogService.log({
        operation: 'Google Account Connected',
        result: 'success',
        authenticatedUserEmail: result.user.email || undefined,
        details: `Successfully connected Google account ${result.user.email}`,
      });

      this.notifyListeners(cachedUser, cachedAccessToken);
      return { user: result.user, accessToken: cachedAccessToken };
    } catch (error: any) {
      console.error('Google Sign-in failed:', error);
      GoogleAuditLogService.log({
        operation: 'Google Account Connected',
        result: 'failed',
        details: error?.message || 'Google account sign-in was cancelled or failed.',
      });
      throw error;
    } finally {
      isSigningIn = false;
    }
  }

  /**
   * Disconnects Google account and flushes in-memory credentials
   */
  public static async signOutGoogle(): Promise<void> {
    const userEmail = cachedUser?.email;
    try {
      await signOut(auth);
      cachedAccessToken = null;
      cachedUser = null;

      GoogleAuditLogService.log({
        operation: 'Google Account Disconnected',
        result: 'success',
        authenticatedUserEmail: userEmail || undefined,
        details: `Disconnected Google account ${userEmail || ''}`,
      });

      this.notifyListeners(null, null);
    } catch (error: any) {
      console.error('Google Sign-out error:', error);
      cachedAccessToken = null;
      cachedUser = null;
      this.notifyListeners(null, null);
      throw error;
    }
  }

  /**
   * Retrieves active in-memory access token
   */
  public static async getAccessToken(): Promise<string | null> {
    return cachedAccessToken;
  }

  /**
   * Checks if user is authenticated with a valid access token in memory
   */
  public static isConnected(): boolean {
    return Boolean(cachedUser && cachedAccessToken);
  }

  /**
   * Gets current connected user
   */
  public static getCurrentUser(): User | null {
    return cachedUser;
  }

  /**
   * Gets connected user email
   */
  public static getConnectedEmail(): string | null {
    return cachedUser?.email || null;
  }
}
