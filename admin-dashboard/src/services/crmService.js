/**
 * CRM Service - Customer relationship management
 */
import { customersRepository, ordersRepository, collection, addDoc, getDocs, query, where, limit, serverTimestamp, doc, updateDoc, getDbClient } from "../lib/supabaseData";

const db = getDbClient();

export async function getCustomerTimeline(customerId) {
  try {
    const customer = await customersRepository.getById(customerId);
    if (!customer) throw new Error("Customer not found");

    const { orders } = await ordersRepository.getList({}, 1000);
    const customerOrders = orders.filter(
      (o) => o.customerName === customer.name || o.customerPhone === customer.phone
    );

    return {
      customer,
      orders: customerOrders,
      interactionCount: customerOrders.length,
      lastInteraction: customerOrders[0]?.updatedAt,
    };
  } catch (err) {
    console.error("Failed to get customer timeline:", err);
    throw err;
  }
}

export async function logCustomerInteraction(customerId, interactionData) {
  try {
    const interactionsRef = collection(db, "customer_interactions");
    await addDoc(interactionsRef, {
      customerId,
      type: interactionData.type, // "call", "email", "sms", "note"
      notes: interactionData.notes,
      timestamp: serverTimestamp(),
      staff: interactionData.staff,
    });
  } catch (err) {
    console.error("Failed to log customer interaction:", err);
    throw err;
  }
}

export async function getComplaints(filters = {}) {
  try {
    const complaintsRef = collection(db, "complaints");
    const conditions = [];

    if (filters.status) {
      conditions.push(where("status", "==", filters.status));
    }
    if (filters.priority) {
      conditions.push(where("priority", "==", filters.priority));
    }

    const q = query(complaintsRef, ...conditions, limit(500));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (err) {
    console.error("Failed to get complaints:", err);
    throw err;
  }
}

export async function updateComplaint(complaintId, updates) {
  try {
    const complaintsRef = collection(db, "complaints");
    const docRef = doc(db, "complaints", complaintId);

    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to update complaint:", err);
    throw err;
  }
}

export async function getSegmentedCustomers(customers) {
  try {
    // RFM Segmentation (Recency, Frequency, Monetary)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const segments = {
      vip: [],
      loyal: [],
      atrisk: [],
      inactive: [],
      new: [],
    };

    customers.forEach((customer) => {
      const lastOrder = customer.lastOrderAt ? new Date(customer.lastOrderAt) : null;
      const spent = customer.totalSpent || 0;

      if (!lastOrder) {
        segments.new.push(customer);
      } else if (lastOrder < ninetyDaysAgo) {
        segments.inactive.push(customer);
      } else if (spent > 1000 && lastOrder > thirtyDaysAgo) {
        segments.vip.push(customer);
      } else if (customer.totalOrders > 5 && lastOrder > thirtyDaysAgo) {
        segments.loyal.push(customer);
      } else if (lastOrder < thirtyDaysAgo && spent > 0) {
        segments.atrisk.push(customer);
      }
    });

    return segments;
  } catch (err) {
    console.error("Failed to segment customers:", err);
    throw err;
  }
}

export async function getCRMAnalytics(customers, orders) {
  try {
    const totalCustomers = customers.length;
    const totalOrders = orders.length;
    const avgOrdersPerCustomer = totalCustomers > 0 ? totalOrders / totalCustomers : 0;
    const avgOrderValue = totalOrders > 0
      ? orders.reduce((sum, o) => sum + o.totalPrice, 0) / totalOrders
      : 0;

    // Satisfaction based on order completion rate
    const completedOrders = orders.filter((o) => o.status === "delivered").length;
    const satisfactionScore = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    return {
      totalCustomers,
      totalOrders,
      avgOrdersPerCustomer,
      avgOrderValue,
      satisfactionScore,
    };
  } catch (err) {
    console.error("Failed to get CRM analytics:", err);
    throw err;
  }
}
