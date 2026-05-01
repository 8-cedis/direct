import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "wzttxlhuecvyeldhmcqc";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6dHR4bGh1ZWN2eWVsZGhtY3FjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMDYwMDcsImV4cCI6MjA5Mjc4MjAwN30.CWA3s5gbwhWL8NMyLLqu_JZSlKeF1SdCLI_jIaQLIr4";

const SUPABASE_NOT_CONFIGURED_MESSAGE =
  "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in admin-dashboard/.env.local.";

const createNoopQueryBuilder = (message) => {
  const error = new Error(message);

  const builder = {
    eq() {
      return builder;
    },
    gte() {
      return builder;
    },
    lte() {
      return builder;
    },
    gt() {
      return builder;
    },
    lt() {
      return builder;
    },
    ilike() {
      return builder;
    },
    like() {
      return builder;
    },
    order() {
      return builder;
    },
    range() {
      return builder;
    },
    select() {
      return builder;
    },
    insert() {
      return builder;
    },
    update() {
      return builder;
    },
    delete() {
      return builder;
    },
    single() {
      return Promise.resolve({ data: null, error });
    },
    then(resolve) {
      return Promise.resolve({ data: null, error }).then(resolve);
    },
  };

  return builder;
};

const createNoopStorageBucket = (message) => ({
  async upload() {
    return { data: null, error: new Error(message) };
  },
  async remove() {
    return { data: null, error: new Error(message) };
  },
  getPublicUrl() {
    return { data: { publicUrl: "" } };
  },
});

const createNoopSupabaseClient = (message) => ({
  from() {
    return createNoopQueryBuilder(message);
  },
  storage: {
    from() {
      return createNoopStorageBucket(message);
    },
  },
  auth: {
    async getUser() {
      return { data: { user: null }, error: new Error(message) };
    },
  },
});

let supabaseClient;

try {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
} catch (error) {
  console.warn(error?.message || SUPABASE_NOT_CONFIGURED_MESSAGE);
  supabaseClient = createNoopSupabaseClient(error?.message || SUPABASE_NOT_CONFIGURED_MESSAGE);
}

export const supabase = supabaseClient;

const PAGE_SIZE_GUARD = 5000;

const toIsoString = (value) => {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return new Date(value).toISOString();
  if (typeof value === "object" && typeof value.toISOString === "function") {
    return value.toISOString();
  }

  return new Date(value).toISOString();
};

const normalizeRecord = (record) => ({
  ...record,
  createdAt: toIsoString(record?.createdAt || record?.created_at),
  updatedAt: toIsoString(record?.updatedAt || record?.updated_at || record?.createdAt || record?.created_at),
});

const normalizeOrderRecord = (record) => {
  const normalized = normalizeRecord(record || {});

  return {
    ...normalized,
    orderId: normalized.orderId || normalized.order_number || normalized.id,
    customerName: normalized.customerName || normalized.customer_name || "",
    phone: normalized.phone || normalized.customer_phone || "",
    totalPrice: Number(normalized.totalPrice ?? normalized.total_price ?? 0),
    paymentStatus: normalized.paymentStatus || normalized.payment_status || "",
    refundTotal: Number(normalized.refundTotal ?? normalized.refund_total ?? 0),
    notes: normalized.notes || normalized.dispute_note || "",
  };
};

const toOrderDbPayload = (updates = {}) => {
  const payload = { ...updates };

  if (Object.prototype.hasOwnProperty.call(payload, "paymentStatus")) {
    payload.payment_status = payload.paymentStatus;
    delete payload.paymentStatus;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "refundTotal")) {
    payload.refund_total = payload.refundTotal;
    delete payload.refundTotal;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "totalPrice")) {
    payload.total_price = payload.totalPrice;
    delete payload.totalPrice;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "customerName")) {
    payload.customer_name = payload.customerName;
    delete payload.customerName;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "phone")) {
    payload.customer_phone = payload.phone;
    delete payload.phone;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "notes")) {
    payload.dispute_note = payload.notes;
    delete payload.notes;
  }

  return payload;
};

const prepareRecord = (record = {}) => {
  const nextRecord = { ...record };

  delete nextRecord.createdAt;
  delete nextRecord.updatedAt;

  nextRecord.created_at = nextRecord.created_at ? toIsoString(nextRecord.created_at) : new Date().toISOString();
  nextRecord.updated_at = nextRecord.updated_at ? toIsoString(nextRecord.updated_at) : nextRecord.created_at;

  return nextRecord;
};

const unwrapTable = (tableOrQuery) => tableOrQuery?.table || tableOrQuery?.source || tableOrQuery;

const resolveQuery = (queryObject) => ({
  table: unwrapTable(queryObject),
  clauses: queryObject?.clauses || [],
});

const applyClauses = (builder, clauses = []) => {
  let orderField = null;
  let orderAscending = false;
  let rowLimit = null;
  let offset = 0;

  clauses.forEach((clause) => {
    if (!clause) return;

    if (clause.type === "where") {
      const { field, operator, value } = clause;

      if (operator === "==") builder = builder.eq(field, value);
      else if (operator === ">=") builder = builder.gte(field, value);
      else if (operator === "<=") builder = builder.lte(field, value);
      else if (operator === ">") builder = builder.gt(field, value);
      else if (operator === "<") builder = builder.lt(field, value);
      else if (operator === "ilike") builder = builder.ilike(field, value);
      else if (operator === "like") builder = builder.like(field, value);
      else throw new Error(`Unsupported filter operator: ${operator}`);
    }

    if (clause.type === "orderBy") {
      orderField = clause.field;
      orderAscending = clause.direction !== "desc";
    }

    if (clause.type === "limit") {
      rowLimit = clause.count;
    }

    if (clause.type === "startAfter") {
      offset = clause.cursor?.__index != null ? clause.cursor.__index + 1 : clause.cursor?.offset || 0;
    }
  });

  if (orderField) {
    builder = builder.order(orderField, { ascending: orderAscending });
  }

  if (rowLimit !== null) {
    const end = offset + rowLimit - 1;
    builder = builder.range(offset, Math.max(offset, end));
  } else if (offset > 0) {
    builder = builder.range(offset, offset + PAGE_SIZE_GUARD - 1);
  }

  return builder;
};

const createSnapshot = (rows, offset = 0) => ({
  docs: rows.map((row, index) => ({
    id: row.id,
    __index: offset + index,
    data: () => normalizeRecord(row),
  })),
});

export const getDbClient = () => supabase;

export const collection = (_db, table) => ({ table });
export const doc = (_db, table, id) => ({ table, id });
export const where = (field, operator, value) => ({ type: "where", field, operator, value });
export const orderBy = (field, direction = "asc") => ({ type: "orderBy", field, direction });
export const limit = (count) => ({ type: "limit", count });
export const startAfter = (cursor) => ({ type: "startAfter", cursor });
export const query = (source, ...clauses) => ({ table: unwrapTable(source), clauses });
export const serverTimestamp = () => new Date().toISOString();

export class Timestamp {
  constructor(value) {
    this.value = value;
  }

  toDate() {
    return new Date(this.value);
  }

  static fromDate(date) {
    return new Timestamp(date.toISOString());
  }
}

export async function getDoc(docRef) {
  const { data, error } = await supabase.from(docRef.table).select("*").eq("id", docRef.id).single();

  if (error) {
    if (error.code === "PGRST116") {
      return { exists: () => false, id: docRef.id, data: () => null };
    }

    throw error;
  }

  return {
    exists: () => Boolean(data),
    id: data.id,
    data: () => normalizeRecord(data),
  };
}

export async function getDocs(queryObject) {
  const { table, clauses } = resolveQuery(queryObject);
  let builder = supabase.from(table).select("*");

  builder = applyClauses(builder, clauses);

  const { data, error } = await builder;
  if (error) throw error;

  const offsetClause = clauses.find((clause) => clause?.type === "startAfter");
  const offset = offsetClause?.cursor?.__index != null ? offsetClause.cursor.__index + 1 : offsetClause?.cursor?.offset || 0;

  return createSnapshot(data || [], offset);
}

export async function addDoc(collectionRef, record) {
  const { data, error } = await supabase.from(collectionRef.table).insert(prepareRecord(record)).select("*").single();
  if (error) throw error;
  return { id: data.id };
}

export async function updateDoc(docRef, updates) {
  const payload = { ...updates };
  delete payload.id;
  delete payload.createdAt;
  delete payload.created_at;

  payload.updated_at = toIsoString(payload.updated_at || payload.updatedAt || serverTimestamp());
  delete payload.updatedAt;

  const { error } = await supabase.from(docRef.table).update(payload).eq("id", docRef.id);
  if (error) throw error;
}

export async function deleteDoc(docRef) {
  const { error } = await supabase.from(docRef.table).delete().eq("id", docRef.id);
  if (error) throw error;
}

export function writeBatch() {
  const operations = [];

  return {
    update(docRef, updates) {
      operations.push(() => updateDoc(docRef, updates));
    },
    delete(docRef) {
      operations.push(() => deleteDoc(docRef));
    },
    async commit() {
      for (const operation of operations) {
        await operation();
      }
    },
  };
}

export async function runTransaction(_db, callback) {
  const pending = [];

  const transaction = {
    async get(docRef) {
      return getDoc(docRef);
    },
    update(docRef, updates) {
      pending.push(() => updateDoc(docRef, updates));
    },
    delete(docRef) {
      pending.push(() => deleteDoc(docRef));
    },
  };

  await callback(transaction);

  for (const operation of pending) {
    await operation();
  }
}

export function onSnapshot(queryObject, next, error) {
  let active = true;

  const refresh = async () => {
    if (!active) return;

    try {
      const snapshot = await getDocs(queryObject);
      if (active) next(snapshot);
    } catch (err) {
      if (error) error(err);
    }
  };

  refresh();
  const intervalId = setInterval(refresh, 15000);

  return () => {
    active = false;
    clearInterval(intervalId);
  };
}

export function getTableClient(table) {
  return {
    async list(filters = {}, pageSize = 1000, lastDoc = null) {
      const clauses = [];
      Object.entries(filters || {}).forEach(([field, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          clauses.push(where(field, "==", value));
        }
      });

      clauses.push(orderBy("created_at", "desc"));
      clauses.push(limit(pageSize + 1));
      if (lastDoc) clauses.push(startAfter(lastDoc));

      const snapshot = await getDocs(query(collection(null, table), ...clauses));
      const rows = snapshot.docs.slice(0, pageSize).map((entry) => entry.data());

      return {
        rows,
        lastDoc: snapshot.docs[pageSize] || null,
      };
    },
    async getById(id) {
      const snapshot = await getDoc(doc(null, table, id));
      return snapshot.exists() ? snapshot.data() : null;
    },
    async create(record) {
      const now = new Date().toISOString();
      const data = {
        ...record,
        createdAt: record?.createdAt ? toIsoString(record.createdAt) : now,
        updatedAt: record?.updatedAt ? toIsoString(record.updatedAt) : now,
      };

      const inserted = await addDoc(collection(null, table), data);
      return {
        id: inserted.id,
        ...data,
      };
    },
    async update(id, updates) {
      await updateDoc(doc(null, table, id), updates);
    },
    async delete(id) {
      await deleteDoc(doc(null, table, id));
    },
  };
}

export const ordersRepository = {
  async getById(orderId) {
    const entry = await getTableClient("orders").getById(orderId);
    return entry ? normalizeOrderRecord(entry) : null;
  },

  async getList(filters = {}, pageSize = 20, lastDoc = null) {
    const clauses = [];
    if (filters.status) clauses.push(where("status", "==", filters.status));
    if (filters.paymentStatus) clauses.push(where("payment_status", "==", filters.paymentStatus));

    clauses.push(orderBy("created_at", "desc"));
    clauses.push(limit(pageSize + 1));
    if (lastDoc) clauses.push(startAfter(lastDoc));

    const snapshot = await getDocs(query(collection(null, "orders"), ...clauses));
    return {
      orders: snapshot.docs.slice(0, pageSize).map((entry) => normalizeOrderRecord(entry.data())),
      lastDoc: snapshot.docs[pageSize] || null,
    };
  },

  async create(order) {
    return getTableClient("orders").create(order);
  },

  async update(orderId, updates) {
    await updateDoc(doc(null, "orders", orderId), toOrderDbPayload(updates));
  },

  async delete(orderId) {
    await deleteDoc(doc(null, "orders", orderId));
  },

  async updateStatus(orderId, status, note) {
    const order = await this.getById(orderId);
    if (!order) throw new Error("Order not found");

    await updateDoc(doc(null, "orders", orderId), {
      status,
      ...(note ? { dispute_note: note } : {}),
    });
  },
};

export const customersRepository = {
  async getById(customerId) {
    return getTableClient("customers").getById(customerId);
  },

  async getList(pageSize = 50, lastDoc = null) {
    const client = getTableClient("customers");
    const result = await client.list({}, pageSize, lastDoc);
    return {
      customers: result.rows,
      lastDoc: result.lastDoc,
    };
  },

  async search(searchTerm) {
    const term = `%${String(searchTerm || "").trim()}%`;
    const nameSnapshot = await getDocs(query(collection(null, "customers"), where("name", "ilike", term), orderBy("created_at", "desc"), limit(50)));
    const emailSnapshot = await getDocs(query(collection(null, "customers"), where("email", "ilike", term), orderBy("created_at", "desc"), limit(50)));

    const deduped = new Map();
    [...nameSnapshot.docs, ...emailSnapshot.docs].forEach((entry) => {
      deduped.set(entry.id, entry.data());
    });

    return [...deduped.values()];
  },

  async create(customer) {
    return getTableClient("customers").create(customer);
  },

  async update(customerId, updates) {
    await updateDoc(doc(null, "customers", customerId), updates);
  },
};

export const productsRepository = {
  async getList(filters = {}) {
    const clauses = [];
    if (filters.status) clauses.push(where("status", "==", filters.status));
    if (filters.category) clauses.push(where("category", "==", filters.category));
    clauses.push(orderBy("created_at", "desc"));
    clauses.push(limit(1000));

    const snapshot = await getDocs(query(collection(null, "products"), ...clauses));
    return snapshot.docs.map((entry) => entry.data());
  },

  async create(product) {
    return getTableClient("products").create(product);
  },

  async getById(productId) {
    return getTableClient("products").getById(productId);
  },

  async updateStock(productId, newStock) {
    await updateDoc(doc(null, "products", productId), { stock: newStock });
  },

  async update(productId, updates) {
    await updateDoc(doc(null, "products", productId), updates);
  },
};

export const farmersRepository = {
  async getById(farmerId) {
    return getTableClient("farmers").getById(farmerId);
  },

  async getList(pageSize = 50, lastDoc = null) {
    const client = getTableClient("farmers");
    const result = await client.list({}, pageSize, lastDoc);
    return {
      farmers: result.rows,
      lastDoc: result.lastDoc,
    };
  },

  async update(farmerId, updates) {
    await updateDoc(doc(null, "farmers", farmerId), updates);
  },
};

export async function batchUpdateOrders(orderIds, updates) {
  await Promise.all(orderIds.map((orderId) => updateDoc(doc(null, "orders", orderId), updates)));
}

export async function batchDeleteOrders(orderIds) {
  await Promise.all(orderIds.map((orderId) => deleteDoc(doc(null, "orders", orderId))));
}
