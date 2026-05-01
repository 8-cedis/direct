/**
 * Campaigns Service - Marketing campaigns and promotions
 */
import { collection, addDoc, getDocs, query, where, orderBy, limit, updateDoc, doc, deleteDoc, serverTimestamp, getDbClient, getDoc } from "../lib/supabaseData";

const db = getDbClient();

export async function getCampaigns(filters = {}) {
  try {
    const campaignsRef = collection(db, "campaigns");
    const conditions = [];

    if (filters.status) {
      conditions.push(where("status", "==", filters.status));
    }
    if (filters.type) {
      conditions.push(where("type", "==", filters.type));
    }

    const q = query(
      campaignsRef,
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
    console.error("Failed to get campaigns:", err);
    throw err;
  }
}

export async function getCampaignById(campaignId) {
  try {
    const campaignRef = doc(db, "campaigns", campaignId);
    const docRef = await getDoc(campaignRef);

    if (!docRef.exists()) throw new Error("Campaign not found");

    return {
      id: docRef.id,
      ...docRef.data(),
    };
  } catch (err) {
    console.error("Failed to get campaign:", err);
    throw err;
  }
}

export async function createCampaign(campaignData) {
  try {
    const campaignsRef = collection(db, "campaigns");
    const docRef = await addDoc(campaignsRef, {
      ...campaignData,
      status: "draft",
      impressions: 0,
      clicks: 0,
      conversions: 0,
      createdAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      ...campaignData,
    };
  } catch (err) {
    console.error("Failed to create campaign:", err);
    throw err;
  }
}

export async function updateCampaign(campaignId, updates) {
  try {
    const campaignRef = doc(db, "campaigns", campaignId);
    await updateDoc(campaignRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to update campaign:", err);
    throw err;
  }
}

export async function launchCampaign(campaignId, startDate, endDate) {
  try {
    const campaignRef = doc(db, "campaigns", campaignId);
    await updateDoc(campaignRef, {
      status: "active",
      startDate,
      endDate,
      launchedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to launch campaign:", err);
    throw err;
  }
}

export async function pauseCampaign(campaignId) {
  try {
    const campaignRef = doc(db, "campaigns", campaignId);
    await updateDoc(campaignRef, {
      status: "paused",
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to pause campaign:", err);
    throw err;
  }
}

export async function endCampaign(campaignId) {
  try {
    const campaignRef = doc(db, "campaigns", campaignId);
    await updateDoc(campaignRef, {
      status: "ended",
      endedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to end campaign:", err);
    throw err;
  }
}

export async function deleteCampaign(campaignId) {
  try {
    const campaignRef = doc(db, "campaigns", campaignId);
    await deleteDoc(campaignRef);
  } catch (err) {
    console.error("Failed to delete campaign:", err);
    throw err;
  }
}

export async function getCampaignPerformance(campaigns) {
  try {
    const performance = [];

    campaigns.forEach((campaign) => {
      const clickThroughRate =
        campaign.impressions > 0
          ? ((campaign.clicks || 0) / campaign.impressions) * 100
          : 0;
      const conversionRate =
        campaign.clicks > 0
          ? ((campaign.conversions || 0) / campaign.clicks) * 100
          : 0;
      const revenue = (campaign.conversions || 0) * (campaign.avgOrderValue || 0);

      performance.push({
        ...campaign,
        clickThroughRate: clickThroughRate.toFixed(2),
        conversionRate: conversionRate.toFixed(2),
        revenue: revenue.toFixed(2),
        roi:
          campaign.budget > 0
            ? (((revenue - campaign.budget) / campaign.budget) * 100).toFixed(2)
            : "N/A",
      });
    });

    return performance;
  } catch (err) {
    console.error("Failed to get campaign performance:", err);
    throw err;
  }
}

export async function recordCampaignInteraction(campaignId, type, userId = null) {
  try {
    const analyticsRef = collection(db, "campaign_analytics");
    await addDoc(analyticsRef, {
      campaignId,
      type, // "impression", "click", "conversion"
      userId,
      timestamp: serverTimestamp(),
    });

    // Update campaign metrics
    const campaignRef = doc(db, "campaigns", campaignId);
    const campaign = await getDoc(campaignRef);

    if (campaign.exists()) {
      const updates = { ...campaign.data() };
      if (type === "impression") updates.impressions = (updates.impressions || 0) + 1;
      if (type === "click") updates.clicks = (updates.clicks || 0) + 1;
      if (type === "conversion")
        updates.conversions = (updates.conversions || 0) + 1;

      await updateDoc(campaignRef, updates);
    }
  } catch (err) {
    console.error("Failed to record campaign interaction:", err);
    throw err;
  }
}

export const CAMPAIGN_TYPES = {
  EMAIL: "email",
  SMS: "sms",
  PUSH: "push",
  SOCIAL: "social",
  DISPLAY: "display",
  REFERRAL: "referral",
};

export const CAMPAIGN_STATUSES = {
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  ACTIVE: "active",
  PAUSED: "paused",
  ENDED: "ended",
  CANCELLED: "cancelled",
};
