/**
 * Farmers Service - Farmer management and earnings tracking
 */
import { farmersRepository, ordersRepository } from "../lib/supabaseData";

export async function fetchFarmers(pageSize = 50, lastDoc = null) {
  try {
    return await farmersRepository.getList(pageSize, lastDoc);
  } catch (err) {
    console.error("Failed to fetch farmers:", err);
    throw err;
  }
}

export async function getFarmerById(farmerId) {
  try {
    return await farmersRepository.getById(farmerId);
  } catch (err) {
    console.error("Failed to fetch farmer:", err);
    throw err;
  }
}

export async function updateFarmer(farmerId, updates) {
  try {
    await farmersRepository.update(farmerId, updates);
  } catch (err) {
    console.error("Failed to update farmer:", err);
    throw err;
  }
}

export async function createFarmer(farmer) {
  try {
    return await farmersRepository.create(farmer);
  } catch (err) {
    console.error("Failed to create farmer:", err);
    throw err;
  }
}

export async function calculateFarmerEarnings(farmerId) {
  try {
    const farmer = await farmersRepository.getById(farmerId);
    if (!farmer) throw new Error("Farmer not found");

    const { orders } = await ordersRepository.getList({}, 1000);

    // Find all orders containing products from this farmer
    const farmerOrders = orders.filter((o) =>
      o.items?.some((item) => item.farmerId === farmerId)
    );

    const totalRevenue = farmerOrders.reduce((sum, order) => {
      const farmerItems = order.items?.filter((item) => item.farmerId === farmerId) || [];
      return sum + farmerItems.reduce((s, item) => s + item.subtotal, 0);
    }, 0);

    const commissionRate = farmer.commissionRate || 0.15; // Default 15%
    const earnings = totalRevenue * (1 - commissionRate);

    return {
      totalRevenue,
      platformCommission: totalRevenue * commissionRate,
      earnings,
      totalOrders: farmerOrders.length,
      lastPayoutDate: farmer.lastPayoutDate || null,
      pendingEarnings: earnings - (farmer.totalPaid || 0),
    };
  } catch (err) {
    console.error("Failed to calculate farmer earnings:", err);
    throw err;
  }
}

export async function getFarmerMetrics(farmers) {
  try {
    const totalFarmers = farmers.length;
    const activeFarmers = farmers.filter((f) => f.status === "active").length;
    const totalProducts = farmers.reduce((sum, f) => sum + (f.totalProducts || 0), 0);
    const totalEarnings = farmers.reduce((sum, f) => sum + (f.totalEarnings || 0), 0);
    const avgEarningsPerFarmer = totalFarmers > 0 ? totalEarnings / totalFarmers : 0;

    return {
      totalFarmers,
      activeFarmers,
      inactiveFarmers: totalFarmers - activeFarmers,
      totalProducts,
      totalEarnings,
      avgEarningsPerFarmer,
    };
  } catch (err) {
    console.error("Failed to get farmer metrics:", err);
    throw err;
  }
}

export async function getTopFarmers(farmers, limit = 10) {
  try {
    return farmers
      .sort((a, b) => (b.totalEarnings || 0) - (a.totalEarnings || 0))
      .slice(0, limit);
  } catch (err) {
    console.error("Failed to get top farmers:", err);
    throw err;
  }
}

export async function getFarmerByProductCategory(farmers, category) {
  try {
    return farmers.filter(
      (f) =>
        f.categories?.includes(category) ||
        f.products?.some((p) => p.category === category)
    );
  } catch (err) {
    console.error("Failed to get farmers by category:", err);
    throw err;
  }
}
