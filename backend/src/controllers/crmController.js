const {
  listCustomers,
  getInteractionsByCustomer,
  addInteraction,
  addComplaint,
  listComplaints,
  respondToComplaint,
  addNotificationTrigger,
  listNotificationTriggers,
} = require("../models/crmModel");

const interactionTypes = ["call", "email", "sms", "meeting", "support_ticket"];
const complaintStatuses = ["open", "in_review", "resolved", "rejected"];
const triggerTypes = ["order_update", "abandoned_cart"];
const channels = ["email", "sms"];

const getCustomers = async (_req, res) => {
  try {
    const customers = await listCustomers();
    return res.json(customers);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch customers", error: error.message });
  }
};

const getCustomerInteractions = async (req, res) => {
  try {
    const userId = req.params.userId;
    const interactions = await getInteractionsByCustomer(userId);
    return res.json(interactions);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch interactions", error: error.message });
  }
};

const createInteraction = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { interactionType, notes, interactionDate } = req.body;
    if (!interactionTypes.includes(interactionType)) {
      return res.status(400).json({ message: "Invalid interaction type", allowed: interactionTypes });
    }
    if (!notes) {
      return res.status(400).json({ message: "notes is required" });
    }

    const interaction = await addInteraction({ userId, interactionType, notes, interactionDate });
    return res.status(201).json({ message: "Interaction logged", interaction });
  } catch (error) {
    return res.status(500).json({ message: "Failed to log interaction", error: error.message });
  }
};

const createComplaint = async (req, res) => {
  try {
    const { userId, subject, complaintText } = req.body;
    if (!userId || !subject || !complaintText) {
      return res.status(400).json({ message: "userId, subject, and complaintText are required" });
    }

    const complaint = await addComplaint({ userId, subject, complaintText });
    return res.status(201).json({ message: "Complaint submitted", complaint });
  } catch (error) {
    return res.status(500).json({ message: "Failed to submit complaint", error: error.message });
  }
};

const getComplaints = async (_req, res) => {
  try {
    const complaints = await listComplaints();
    return res.json(complaints);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch complaints", error: error.message });
  }
};

const updateComplaintResponse = async (req, res) => {
  try {
    const complaintId = req.params.id;
    const { status, adminResponse } = req.body;
    if (!complaintStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid complaint status", allowed: complaintStatuses });
    }

    const updated = await respondToComplaint({ complaintId, status, adminResponse: adminResponse || "" });
    if (!updated) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    return res.json({ message: "Complaint updated" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to respond to complaint", error: error.message });
  }
};

const createNotificationTrigger = async (req, res) => {
  try {
    const { triggerType, channel, targetUserId, payload } = req.body;
    if (!triggerTypes.includes(triggerType)) {
      return res.status(400).json({ message: "Invalid triggerType", allowed: triggerTypes });
    }
    if (!channels.includes(channel)) {
      return res.status(400).json({ message: "Invalid channel", allowed: channels });
    }

    const trigger = await addNotificationTrigger({
      triggerType,
      channel,
      targetUserId,
      payload,
    });

    return res.status(201).json({ message: "Notification trigger queued", trigger });
  } catch (error) {
    return res.status(500).json({ message: "Failed to queue trigger", error: error.message });
  }
};

const getNotificationTriggers = async (_req, res) => {
  try {
    const triggers = await listNotificationTriggers();
    return res.json(triggers);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch notification triggers", error: error.message });
  }
};

module.exports = {
  getCustomers,
  getCustomerInteractions,
  createInteraction,
  createComplaint,
  getComplaints,
  updateComplaintResponse,
  createNotificationTrigger,
  getNotificationTriggers,
};
