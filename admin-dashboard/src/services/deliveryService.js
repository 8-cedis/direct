/**
 * Delivery Service - Delivery slots and driver management
 */
import { getDbClient, collection, addDoc, getDocs, query, where, limit, serverTimestamp, updateDoc, doc } from "../lib/supabaseData";

const db = getDbClient();

export async function getDeliverySlots(filters = {}) {
  try {
    const slotsRef = collection(db, "delivery_slots");
    const conditions = [];

    if (filters.date) {
      conditions.push(where("date", "==", filters.date));
    }
    if (filters.status) {
      conditions.push(where("status", "==", filters.status));
    }

    const q = query(slotsRef, ...conditions, limit(100));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (err) {
    console.error("Failed to get delivery slots:", err);
    throw err;
  }
}

export async function createDeliverySlot(slotData) {
  try {
    const slotsRef = collection(db, "delivery_slots");
    const docRef = await addDoc(slotsRef, {
      ...slotData,
      createdAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      ...slotData,
    };
  } catch (err) {
    console.error("Failed to create delivery slot:", err);
    throw err;
  }
}

export async function updateDeliverySlot(slotId, updates) {
  try {
    const slotRef = doc(db, "delivery_slots", slotId);
    await updateDoc(slotRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to update delivery slot:", err);
    throw err;
  }
}

export async function assignDriverToSlot(slotId, driverId, estimatedArrival) {
  try {
    const slotRef = doc(db, "delivery_slots", slotId);
    await updateDoc(slotRef, {
      driverId,
      estimatedArrival,
      status: "assigned",
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to assign driver:", err);
    throw err;
  }
}

export async function getDriverDeliveries(driverId) {
  try {
    const deliveriesRef = collection(db, "driver_deliveries");
    const q = query(deliveriesRef, where("driverId", "==", driverId), limit(50));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (err) {
    console.error("Failed to get driver deliveries:", err);
    throw err;
  }
}

export async function updateDeliveryStatus(deliveryId, status, location = null) {
  try {
    const deliveryRef = doc(db, "driver_deliveries", deliveryId);
    await updateDoc(deliveryRef, {
      status,
      location: location || null,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to update delivery status:", err);
    throw err;
  }
}

export async function getDriverPerformance(drivers) {
  try {
    const performance = [];

    for (const driver of drivers) {
      const deliveries = await getDriverDeliveries(driver.id);
      const completedDeliveries = deliveries.filter((d) => d.status === "delivered");
      const avgDeliveryTime =
        completedDeliveries.length > 0
          ? completedDeliveries.reduce((sum, d) => {
              const start = new Date(d.createdAt);
              const end = new Date(d.deliveredAt || new Date());
              return sum + (end - start) / (1000 * 60); // minutes
            }, 0) / completedDeliveries.length
          : 0;

      performance.push({
        driverId: driver.id,
        driverName: driver.name,
        totalDeliveries: deliveries.length,
        completedDeliveries: completedDeliveries.length,
        pendingDeliveries: deliveries.filter((d) => d.status !== "delivered").length,
        completionRate:
          deliveries.length > 0
            ? (completedDeliveries.length / deliveries.length) * 100
            : 0,
        avgDeliveryTimeMinutes: Math.round(avgDeliveryTime),
        rating: driver.rating || 5,
      });
    }

    return performance.sort((a, b) => b.completionRate - a.completionRate);
  } catch (err) {
    console.error("Failed to get driver performance:", err);
    throw err;
  }
}

export async function getDeliveryAnalytics() {
  try {
    const slots = await getDeliverySlots({ status: "completed" });

    const onTimeDeliveries = slots.filter((s) => {
      const deliveredAt = new Date(s.deliveredAt || new Date());
      const slotEnd = new Date(s.timeSlotEnd);
      return deliveredAt <= slotEnd;
    });

    const totalSlots = slots.length;
    const onTimeRate = totalSlots > 0 ? (onTimeDeliveries.length / totalSlots) * 100 : 0;

    const avgDeliveryTime =
      onTimeDeliveries.length > 0
        ? onTimeDeliveries.reduce((sum, s) => {
            const start = new Date(s.createdAt);
            const end = new Date(s.deliveredAt || new Date());
            return sum + (end - start) / (1000 * 60 * 60); // hours
          }, 0) / onTimeDeliveries.length
        : 0;

    return {
      totalDeliveries: totalSlots,
      completedDeliveries: onTimeDeliveries.length,
      onTimeRate,
      avgDeliveryHours: avgDeliveryTime.toFixed(2),
      todayDeliveries: slots.filter((s) => {
        const slotDate = new Date(s.date).toDateString();
        return slotDate === new Date().toDateString();
      }).length,
    };
  } catch (err) {
    console.error("Failed to get delivery analytics:", err);
    throw err;
  }
}
