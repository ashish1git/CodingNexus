const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

/**
 * Helper: ensure caller is superadmin
 */
async function assertSuperAdmin(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in"
    );
  }

  const uid = context.auth.uid;
  const adminDoc = await db.collection("admins").doc(uid).get();

  if (!adminDoc.exists || adminDoc.data().role !== "superadmin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only superadmin can perform this action"
    );
  }

  return uid;
}

/**
 * CREATE SUBADMIN
 */
exports.createSubAdmin = functions.https.onCall(async (data, context) => {
  await assertSuperAdmin(context);

  const { email, password, name, permissions } = data;

  if (!email || !password || !name) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields"
    );
  }

  // Create Auth user
  const userRecord = await admin.auth().createUser({
    email,
    password,
    displayName: name
  });

  const uid = userRecord.uid;

  // Create Firestore admin doc
  await db.collection("admins").doc(uid).set({
    uid,
    email,
    name,
    role: "subadmin",
    permissions,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true };
});

/**
 * UPDATE SUBADMIN PERMISSIONS
 */
exports.updateSubAdminPermissions = functions.https.onCall(
  async (data, context) => {
    await assertSuperAdmin(context);

    const { uid, name, permissions } = data;

    if (!uid) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "UID is required"
      );
    }

    await db.collection("admins").doc(uid).update({
      name,
      permissions,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
  }
);

/**
 * DELETE SUBADMIN
 */
exports.deleteSubAdmin = functions.https.onCall(async (data, context) => {
  await assertSuperAdmin(context);

  const { uid } = data;

  if (!uid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "UID is required"
    );
  }

  // Delete Firestore doc
  await db.collection("admins").doc(uid).delete();

  // Delete Auth user
  await admin.auth().deleteUser(uid);

  return { success: true };
});
