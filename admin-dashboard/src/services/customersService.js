/**
 * Customers Service - database operations for customer management
 */
import { customersRepository } from "../lib/supabaseData";

export async function fetchCustomers(pageSize = 50, lastDoc = null) {
  try {
    return await customersRepository.getList(pageSize, lastDoc);
  } catch (err) {
    console.error("Failed to fetch customers:", err);
    throw err;
  }
}

export async function searchCustomers(searchTerm) {
  try {
    return await customersRepository.search(searchTerm);
  } catch (err) {
    console.error("Failed to search customers:", err);
    throw err;
  }
}

export async function getCustomerById(customerId) {
  try {
    return await customersRepository.getById(customerId);
  } catch (err) {
    console.error("Failed to fetch customer:", err);
    throw err;
  }
}

export async function updateCustomer(customerId, updates) {
  try {
    await customersRepository.update(customerId, updates);
  } catch (err) {
    console.error("Failed to update customer:", err);
    throw err;
  }
}

export async function getCustomerSummary(customers) {
  try {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter((c) => c.status !== "inactive").length;
    const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    const avgCustomerValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    return {
      totalCustomers,
      activeCustomers,
      totalRevenue,
      avgCustomerValue,
    };
  } catch (err) {
    console.error("Failed to get customer summary:", err);
    throw err;
  }
}

export async function identifyAtRiskCustomers(customers) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return customers.filter((c) => {
      const lastOrder = c.lastOrderAt ? new Date(c.lastOrderAt) : null;
      return !lastOrder || lastOrder < thirtyDaysAgo;
    });
  } catch (err) {
    console.error("Failed to identify at-risk customers:", err);
    throw err;
  }
}

export async function identifyVIPCustomers(customers) {
  try {
    const avgSpent = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0) / Math.max(customers.length, 1);

    return customers.filter((c) => (c.totalSpent || 0) > avgSpent * 2);
  } catch (err) {
    console.error("Failed to identify VIP customers:", err);
    throw err;
  }
}
