export type Product = {
  id: number;
  name: string;
  description?: string;
  image?: string;
  price: number;
  stock?: number;
  approval_status?: "pending" | "approved" | "rejected";
  approval_note?: string;
  is_featured?: boolean;
  promotion_text?: string;
  discount_percent?: number;
};

export type CartItem = {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  image?: string;
};

export type User = {
  id: number;
  name: string;
  email: string;
  role?: string;
  status?: string;
  suspended?: boolean;
};

export type Order = {
  id: number;
  user_id?: number | null;
  customer_name?: string;
  phone?: string;
  address?: string;
  total_price: number;
  status: string;
  fulfillment_status?: "Confirmed" | "Packed" | "In Transit" | "Delivered";
  dispute_status?: "none" | "open" | "in_review" | "resolved" | "rejected";
  dispute_note?: string;
  created_at: string;
};

export type AdminOverview = {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  activeListings: number;
};

export type AdminReport = {
  period: "daily" | "weekly" | "monthly";
  orders: number;
  revenue: number;
  averageOrderValue: number;
};

export type CrmCustomer = {
  id: number;
  name: string;
  email: string;
  status: string;
  segmentation_tag: "New" | "Returning" | "High-Value";
  total_orders: number;
  total_order_value: number;
  interaction_count: number;
  last_interaction_at?: string | null;
  created_at: string;
};

export type CrmInteraction = {
  id: number;
  user_id: number;
  interaction_type: "call" | "email" | "sms" | "meeting" | "support_ticket";
  notes: string;
  interaction_date: string;
  created_at: string;
};

export type Complaint = {
  id: number;
  user_id: number;
  user_name?: string;
  user_email?: string;
  subject: string;
  complaint_text: string;
  status: "open" | "in_review" | "resolved" | "rejected";
  admin_response?: string;
  created_at: string;
  updated_at: string;
};

export type NotificationTrigger = {
  id: number;
  trigger_type: "order_update" | "abandoned_cart";
  channel: "email" | "sms";
  target_user_id: number | null;
  payload: Record<string, unknown>;
  status: string;
  created_at: string;
};
