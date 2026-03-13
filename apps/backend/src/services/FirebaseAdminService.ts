import * as admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

let initialized = false;

// Allow tests to inject a custom verifyIdToken implementation
let _testVerifyOverride: ((token: string) => Promise<DecodedIdToken | null>) | null = null;

function getApp(): admin.app.App {
  if (!initialized) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount;
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } else if (projectId) {
      // Use application default credentials (e.g., in GCP environments)
      admin.initializeApp({ projectId });
    } else if (process.env.NODE_ENV === 'test') {
      // In tests, use a mock project id; token verification is handled by override
      admin.initializeApp({ projectId: 'test-project' });
    } else {
      throw new Error(
        'Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID.'
      );
    }
    initialized = true;
  }
  return admin.app();
}

export class FirebaseAdminService {
  static async verifyIdToken(idToken: string): Promise<DecodedIdToken | null> {
    if (_testVerifyOverride) {
      return _testVerifyOverride(idToken);
    }
    try {
      const app = getApp();
      return await app.auth().verifyIdToken(idToken);
    } catch {
      return null;
    }
  }

  /** Set a custom verifyIdToken implementation (for testing only). */
  static _setTestVerifyOverride(
    fn: ((token: string) => Promise<DecodedIdToken | null>) | null
  ): void {
    _testVerifyOverride = fn;
  }

  /** Reset internal state for testing purposes only. */
  static _resetForTesting(): void {
    _testVerifyOverride = null;
    if (initialized) {
      try {
        admin.app().delete();
      } catch {
        // ignore
      }
      initialized = false;
    }
  }
}
