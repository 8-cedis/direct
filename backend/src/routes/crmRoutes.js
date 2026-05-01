const express = require("express");
const {
  getCustomers,
  getCustomerInteractions,
  createInteraction,
  createComplaint,
  getComplaints,
  updateComplaintResponse,
  createNotificationTrigger,
  getNotificationTriggers,
} = require("../controllers/crmController");

const router = express.Router();

router.get("/crm/customers", getCustomers);
router.get("/crm/customers/:userId/interactions", getCustomerInteractions);
router.post("/crm/customers/:userId/interactions", createInteraction);

router.post("/crm/complaints", createComplaint);
router.get("/crm/complaints", getComplaints);
router.put("/crm/complaints/:id/respond", updateComplaintResponse);

router.post("/crm/notifications/trigger", createNotificationTrigger);
router.get("/crm/notifications", getNotificationTriggers);

module.exports = router;
