const { deleteById, filterCollection, findById, findOne, getNextSequence, listCollection, updateById, upsertById } = require("../database/localStore");

const getCustomerSegmentationTag = (ordersCount, totalValue) => {
  if (totalValue >= 500 || ordersCount >= 5) return "High-Value";
  if (ordersCount >= 2) return "Returning";
  return "New";
};

const listCustomers = async () => {
  const users = listCollection("users");
  const orders = listCollection("orders");
  const interactions = listCollection("customer_interactions");

  return users.map((user) => {
    const userOrders = orders.filter((order) => Number(order.user_id) === Number(user.id));
    const customerInteractions = interactions.filter(
      (item) => Number(item.user_id) === Number(user.id)
    );
    const totalOrderValue = userOrders.reduce(
      (sum, order) => sum + Number(order.total_price || 0),
      0
    );

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status || "active",
      segmentation_tag: getCustomerSegmentationTag(userOrders.length, totalOrderValue),
      total_orders: userOrders.length,
      total_order_value: Number(totalOrderValue.toFixed(2)),
      interaction_count: customerInteractions.length,
      last_interaction_at:
        customerInteractions.sort(
          (a, b) => new Date(b.interaction_date).getTime() - new Date(a.interaction_date).getTime()
        )[0]?.interaction_date || null,
      created_at: user.created_at,
    };
  });
};

const getInteractionsByCustomer = async (userId) => {
  return filterCollection(
    "customer_interactions",
    (item) => Number(item.user_id) === Number(userId),
    (left, right) => new Date(right.interaction_date).getTime() - new Date(left.interaction_date).getTime()
  );
};

const addInteraction = async ({ userId, interactionType, notes, interactionDate }) => {
  const id = await getNextSequence("customer_interactions");
  const payload = {
    id,
    user_id: Number(userId),
    interaction_type: interactionType,
    notes,
    interaction_date: interactionDate || new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  upsertById("customer_interactions", payload);
  return payload;
};

const addComplaint = async ({ userId, subject, complaintText }) => {
  const id = await getNextSequence("complaints");
  const payload = {
    id,
    user_id: Number(userId),
    subject,
    complaint_text: complaintText,
    status: "open",
    admin_response: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  upsertById("complaints", payload);
  return payload;
};

const listComplaints = async () => {
  const complaints = listCollection("complaints");
  const users = listCollection("users");

  return complaints.map((complaint) => ({
    ...complaint,
    user_name: users.find((user) => Number(user.id) === Number(complaint.user_id))?.name || "Unknown",
    user_email: users.find((user) => Number(user.id) === Number(complaint.user_id))?.email || "Unknown",
  }));
};

const respondToComplaint = async ({ complaintId, status, adminResponse }) => {
  const updated = updateById("complaints", complaintId, {
    status,
    admin_response: adminResponse,
    updated_at: new Date().toISOString(),
  });
  return Boolean(updated);
};

const addNotificationTrigger = async ({ triggerType, channel, targetUserId, payload }) => {
  const id = await getNextSequence("notification_triggers");
  const trigger = {
    id,
    trigger_type: triggerType,
    channel,
    target_user_id: targetUserId ? Number(targetUserId) : null,
    payload: payload || {},
    status: "queued",
    created_at: new Date().toISOString(),
  };

  upsertById("notification_triggers", trigger);
  return trigger;
};

const listNotificationTriggers = async () => {
  return listCollection("notification_triggers");
};

module.exports = {
  listCustomers,
  getInteractionsByCustomer,
  addInteraction,
  addComplaint,
  listComplaints,
  respondToComplaint,
  addNotificationTrigger,
  listNotificationTriggers,
};
