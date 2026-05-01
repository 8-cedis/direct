export const tickets = Array.from({ length: 15 }, (_, index) => ({
  id: `TKT-${900 + index}`,
  customerName: ["Ama Mensah", "Kojo Boateng", "Efua Agyeman", "Yaw Osei", "Akosua Appiah"][index % 5],
  orderNumber: `FD-${4200 + index}`,
  issueType: ["Late Delivery", "Missing Item", "Quality Issue", "Payment Problem", "Wrong Address"][index % 5],
  priority: ["High", "Medium", "Low"][index % 3],
  assignedTo: ["Ama Mensah", "Kojo Yeboah", "Efua Sarkodie"][index % 3],
  status: ["Open", "In Progress", "Resolved", "Closed"][index % 4],
  createdDate: new Date(2026, 3, 1 + index).toISOString(),
  lastUpdated: new Date(2026, 3, 1 + index, 12, 15).toISOString(),
  description: "Customer reported a service issue and requested follow up.",
  conversation: [
    { from: "customer", message: "Please help with my order.", at: new Date(2026, 3, 1 + index, 9).toISOString() },
    { from: "staff", message: "We are reviewing this now.", at: new Date(2026, 3, 1 + index, 10).toISOString() },
  ],
}));
