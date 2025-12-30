import * as admin from 'firebase-admin';

import { serviceAccount } from './config';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

export { admin };

export const auth = admin.auth();
export const db = admin.firestore();
