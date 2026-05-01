/**
 * Services Index - Centralized exports for all admin services
 * 
 * This file provides a single import point for all admin dashboard services
 */

// Core business logic services
export {
  getOrdersAnalytics,
  fetchOrders,
  updateOrderStatus,
  refundOrder,
  cancelOrder,
} from "./ordersService";

export {
  fetchProducts,
  getProductById,
  updateProductStock,
  updateProduct,
  createProduct,
  getInventorySummary,
  applyBulkPriceUpdate,
} from "./productsService";

export {
  fetchCustomers,
  searchCustomers,
  getCustomerById,
  updateCustomer,
  getCustomerSummary,
  identifyAtRiskCustomers,
  identifyVIPCustomers,
} from "./customersService";

export {
  fetchFarmers,
  getFarmerById,
  updateFarmer,
  calculateFarmerEarnings,
  getFarmerMetrics,
  getTopFarmers,
  getFarmerByProductCategory,
} from "./farmersService";

export {
  getFinanceAnalytics,
  getFarmerPayouts,
  updateFarmerPayout,
  processBulkPayouts,
  getRefundAnalytics,
} from "./financeService";

export {
  getCustomerTimeline,
  logCustomerInteraction,
  getComplaints,
  updateComplaint,
  getSegmentedCustomers,
  getCRMAnalytics,
} from "./crmService";

export {
  getDashboardAnalytics,
  getHealthMetrics,
  getActivityFeed,
} from "./analyticsService";

export {
  generateSalesReport,
  generateInventoryReport,
  generateFarmerReport,
  generateOperationalMetrics,
} from "./reportsService";

export {
  getDeliverySlots,
  createDeliverySlot,
  updateDeliverySlot,
  assignDriverToSlot,
  getDriverDeliveries,
  updateDeliveryStatus,
  getDriverPerformance,
  getDeliveryAnalytics,
} from "./deliveryService";

export {
  getStaffMembers,
  getStaffByRole,
  addStaffMember,
  updateStaffMember,
  deleteStaffMember,
  updateStaffPermissions,
  getStaffMetrics,
  trackStaffActivity,
  STAFF_ROLES,
  STAFF_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
} from "./staffService";

export {
  getSupportTickets,
  getTicketById,
  createSupportTicket,
  updateTicketStatus,
  assignTicket,
  addTicketReply,
  getTicketReplies,
  getSupportMetrics,
} from "./supportService";

export {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  launchCampaign,
  pauseCampaign,
  endCampaign,
  deleteCampaign,
  getCampaignPerformance,
  recordCampaignInteraction,
  CAMPAIGN_TYPES,
  CAMPAIGN_STATUSES,
} from "./campaignsService";

/**
 * Usage Examples:
 * 
 * // Import specific functions
 * import { fetchOrders, getOrdersAnalytics } from '@/services';
 * 
 * // Or import entire service
 * import * as ordersService from '@/services/ordersService';
 * 
 * // In component
 * const orders = await fetchOrders({ status: "pending" });
 * const analytics = await getOrdersAnalytics("30d");
 */
