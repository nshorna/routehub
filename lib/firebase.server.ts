import admin from "firebase-admin";

let firebaseAdmin: admin.app.App;
let firebaseAuth: admin.auth.Auth;

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT is not set. Copy env.sample and paste your service account JSON as a single line."
    );
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT must be valid JSON");
  }
}

try {
  firebaseAdmin = admin.app();
  firebaseAuth = firebaseAdmin.auth();
} catch {
  const serviceAccount = loadServiceAccount();
  if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
    throw new Error("Service account JSON is missing project_id, private_key, or client_email");
  }
  firebaseAdmin = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  firebaseAuth = firebaseAdmin.auth();
}

export { firebaseAdmin };
export { firebaseAuth };
