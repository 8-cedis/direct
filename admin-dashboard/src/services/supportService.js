/**
 * Support Service - Support tickets and issue tracking
 */
import { getDbClient, collection, addDoc, getDocs, query, where, orderBy, limit, updateDoc, doc, serverTimestamp } from "../lib/supabaseData";

const db = getDbClient();

export async function getSupportTickets(filters = {}) {
  try {
    const ticketsRef = collection(db, "support_tickets");
    const conditions = [];

    if (filters.status) {
      conditions.push(where("status", "==", filters.status));
    }
    if (filters.priority) {
      conditions.push(where("priority", "==", filters.priority));
    }

    const q = query(
      ticketsRef,
      ...conditions,
      orderBy("createdAt", "desc"),
      limit(100)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (err) {
    console.error("Failed to get support tickets:", err);
    throw err;
  }
}

export async function getTicketById(ticketId) {
  try {
    const ticketsRef = collection(db, "support_tickets");
    const q = query(ticketsRef, where("id", "==", ticketId), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) throw new Error("Ticket not found");

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (err) {
    console.error("Failed to get ticket:", err);
    throw err;
  }
}

export async function createSupportTicket(ticketData) {
  try {
    const ticketsRef = collection(db, "support_tickets");
    const docRef = await addDoc(ticketsRef, {
      ...ticketData,
      status: "open",
      priority: ticketData.priority || "medium",
      createdAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      ...ticketData,
    };
  } catch (err) {
    console.error("Failed to create support ticket:", err);
    throw err;
  }
}

export async function updateTicketStatus(ticketId, status, notes = null) {
  try {
    const ticketRef = doc(db, "support_tickets", ticketId);
    await updateDoc(ticketRef, {
      status,
      notes: notes || null,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to update ticket status:", err);
    throw err;
  }
}

export async function assignTicket(ticketId, staffId, staffName) {
  try {
    const ticketRef = doc(db, "support_tickets", ticketId);
    await updateDoc(ticketRef, {
      assignedTo: staffId,
      assignedToName: staffName,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to assign ticket:", err);
    throw err;
  }
}

export async function addTicketReply(ticketId, reply) {
  try {
    const repliesRef = collection(db, "ticket_replies");
    await addDoc(repliesRef, {
      ticketId,
      message: reply.message,
      author: reply.author,
      isStaff: reply.isStaff || false,
      createdAt: serverTimestamp(),
    });

    // Update ticket status if staff replied
    if (reply.isStaff) {
      const ticketRef = doc(db, "support_tickets", ticketId);
      await updateDoc(ticketRef, {
        status: "in_progress",
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.error("Failed to add ticket reply:", err);
    throw err;
  }
}

export async function getTicketReplies(ticketId) {
  try {
    const repliesRef = collection(db, "ticket_replies");
    const q = query(
      repliesRef,
      where("ticketId", "==", ticketId),
      orderBy("createdAt", "asc"),
      limit(100)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (err) {
    console.error("Failed to get ticket replies:", err);
    throw err;
  }
}

export async function getSupportMetrics(tickets) {
  try {
    const openTickets = tickets.filter((t) => t.status === "open");
    const inProgressTickets = tickets.filter((t) => t.status === "in_progress");
    const resolvedTickets = tickets.filter((t) => t.status === "resolved");
    const closedTickets = tickets.filter((t) => t.status === "closed");

    const avgResolutionTime =
      resolvedTickets.length > 0
        ? resolvedTickets.reduce((sum, t) => {
            const start = new Date(t.createdAt);
            const end = new Date(t.resolvedAt || new Date());
            return sum + (end - start) / (1000 * 60 * 60 * 24); // days
          }, 0) / resolvedTickets.length
        : 0;

    const priorityBreakdown = {
      low: tickets.filter((t) => t.priority === "low").length,
      medium: tickets.filter((t) => t.priority === "medium").length,
      high: tickets.filter((t) => t.priority === "high").length,
      urgent: tickets.filter((t) => t.priority === "urgent").length,
    };

    return {
      totalTickets: tickets.length,
      openTickets: openTickets.length,
      inProgressTickets: inProgressTickets.length,
      resolvedTickets: resolvedTickets.length,
      closedTickets: closedTickets.length,
      avgResolutionDays: avgResolutionTime.toFixed(2),
      resolutionRate:
        tickets.length > 0
          ? ((resolvedTickets.length + closedTickets.length) / tickets.length) * 100
          : 0,
      priorityBreakdown,
    };
  } catch (err) {
    console.error("Failed to get support metrics:", err);
    throw err;
  }
}
