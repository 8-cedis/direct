/**
 * Staff Service - Admin staff management and roles
 */
import { getDbClient, collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, serverTimestamp } from "../lib/supabaseData";

const db = getDbClient();

export async function getStaffMembers() {
  try {
    const staffRef = collection(db, "staff");
    const snapshot = await getDocs(staffRef);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (err) {
    console.error("Failed to get staff members:", err);
    throw err;
  }
}

export async function getStaffByRole(role) {
  try {
    const staffRef = collection(db, "staff");
    const q = query(staffRef, where("role", "==", role));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (err) {
    console.error("Failed to get staff by role:", err);
    throw err;
  }
}

export async function addStaffMember(staffData) {
  try {
    const staffRef = collection(db, "staff");
    const docRef = await addDoc(staffRef, {
      ...staffData,
      status: "active",
      createdAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      ...staffData,
    };
  } catch (err) {
    console.error("Failed to add staff member:", err);
    throw err;
  }
}

export async function updateStaffMember(staffId, updates) {
  try {
    const staffRef = doc(db, "staff", staffId);
    await updateDoc(staffRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to update staff member:", err);
    throw err;
  }
}

export async function deleteStaffMember(staffId) {
  try {
    const staffRef = doc(db, "staff", staffId);
    await deleteDoc(staffRef);
  } catch (err) {
    console.error("Failed to delete staff member:", err);
    throw err;
  }
}

export async function updateStaffPermissions(staffId, permissions) {
  try {
    const staffRef = doc(db, "staff", staffId);
    await updateDoc(staffRef, {
      permissions,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to update staff permissions:", err);
    throw err;
  }
}

export async function getStaffMetrics(staff) {
  try {
    const roles = {};
    const statuses = {};

    staff.forEach((member) => {
      roles[member.role] = (roles[member.role] || 0) + 1;
      statuses[member.status] = (statuses[member.status] || 0) + 1;
    });

    return {
      totalStaff: staff.length,
      byRole: roles,
      byStatus: statuses,
      activeStaff: statuses["active"] || 0,
      inactiveStaff: statuses["inactive"] || 0,
    };
  } catch (err) {
    console.error("Failed to get staff metrics:", err);
    throw err;
  }
}

export async function trackStaffActivity(staffId, action, details = null) {
  try {
    const activityRef = collection(db, "staff_activity");
    await addDoc(activityRef, {
      staffId,
      action,
      details,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to track staff activity:", err);
    throw err;
  }
}

export const STAFF_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  OPERATOR: "operator",
  VIEWER: "viewer",
};

export const STAFF_PERMISSIONS = {
  // Orders
  "orders:view": "View orders",
  "orders:create": "Create orders",
  "orders:edit": "Edit orders",
  "orders:delete": "Delete orders",
  "orders:ship": "Ship orders",
  "orders:refund": "Refund orders",

  // Products
  "products:view": "View products",
  "products:create": "Create products",
  "products:edit": "Edit products",
  "products:delete": "Delete products",

  // Customers
  "customers:view": "View customers",
  "customers:edit": "Edit customers",

  // Finance
  "finance:view": "View finance",
  "finance:edit": "Edit finance",
  "finance:payout": "Process payouts",

  // Reports
  "reports:view": "View reports",

  // Staff Management
  "staff:manage": "Manage staff",

  // Settings
  "settings:manage": "Manage settings",
};

export const DEFAULT_ROLE_PERMISSIONS = {
  [STAFF_ROLES.ADMIN]: Object.keys(STAFF_PERMISSIONS),
  [STAFF_ROLES.MANAGER]: [
    "orders:view",
    "orders:edit",
    "orders:ship",
    "orders:refund",
    "products:view",
    "products:edit",
    "customers:view",
    "customers:edit",
    "finance:view",
    "reports:view",
  ],
  [STAFF_ROLES.OPERATOR]: [
    "orders:view",
    "orders:edit",
    "products:view",
    "customers:view",
  ],
  [STAFF_ROLES.VIEWER]: [
    "orders:view",
    "products:view",
    "customers:view",
    "reports:view",
  ],
};
