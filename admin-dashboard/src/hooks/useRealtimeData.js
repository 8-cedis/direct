import { useEffect, useState, useRef } from "react";
import { collection, query, where, orderBy, limit, onSnapshot, getDbClient } from "../lib/supabaseData";

const db = getDbClient();

const toReadableDataError = (err, fallbackMessage) => {
  const code = err?.code || "";
  if (code === "permission-denied") {
    return "Database access denied. Check your Supabase policies and environment variables.";
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  return fallbackMessage;
};

/**
 * Hook for real-time orders listener with auto-cleanup
 */
export function useOrdersRealtime(filters) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      const conditions = [];
      if (filters?.status) {
        conditions.push(where("status", "==", filters.status));
      }

      const q = query(
        collection(db, "orders"),
        ...conditions,
        orderBy("created_at", "desc"),
        limit(filters?.limit || 100)
      );

      unsubscribeRef.current = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setOrders(data);
          setLoading(false);
        },
        (err) => {
          setOrders([]);
          setError(toReadableDataError(err, "Failed to load orders"));
          setLoading(false);
        }
      );
    } catch (err) {
      setError(toReadableDataError(err, "Failed to load orders"));
      setLoading(false);
    }

    return () => {
      unsubscribeRef.current?.();
    };
  }, [filters?.status, filters?.limit]);

  return { orders, loading, error };
}

/**
 * Hook for real-time customers listener
 */
export function useCustomersRealtime() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      const q = query(collection(db, "customers"), orderBy("created_at", "desc"), limit(500));

      unsubscribeRef.current = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setCustomers(data);
          setLoading(false);
        },
        (err) => {
          setCustomers([]);
          setError(toReadableDataError(err, "Failed to load customers"));
          setLoading(false);
        }
      );
    } catch (err) {
      setError(toReadableDataError(err, "Failed to load customers"));
      setLoading(false);
    }

    return () => {
      unsubscribeRef.current?.();
    };
  }, []);

  return { customers, loading, error };
}

/**
 * Hook for real-time products listener
 */
export function useProductsRealtime() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, "products"),
        orderBy("created_at", "desc"),
        limit(1000)
      );

      unsubscribeRef.current = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setProducts(data);
          setLoading(false);
        },
        (err) => {
          setProducts([]);
          setError(toReadableDataError(err, "Failed to load products"));
          setLoading(false);
        }
      );
    } catch (err) {
      setError(toReadableDataError(err, "Failed to load products"));
      setLoading(false);
    }

    return () => {
      unsubscribeRef.current?.();
    };
  }, []);

  return { products, loading, error };
}
