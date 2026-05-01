"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type AuthUser = {
  id?: number;
  customerId?: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  memberSince: string;
  loyaltyPoints: number;
  totalOrders: number;
  totalSpent: number;
};

type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type StoredRegistration = RegisterInput;

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  register: (input: RegisterInput) => Promise<void>;
  login: (input: LoginInput) => void;
  logout: () => void;
};

const REGISTER_STORAGE_KEY = "farmdirect_registered_user";
const AUTH_STORAGE_KEY = "farmdirect_auth_user";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const buildMockProfile = (name: string, email: string, phone?: string, address?: string): AuthUser => ({
  name,
  email,
  phone: phone || "+233 24 000 0000",
  address: address || "East Legon, Accra",
  memberSince: "April 2026",
  loyaltyPoints: 240,
  totalOrders: 12,
  totalSpent: 1280,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  });

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      isAuthenticated: Boolean(user),
      register: async (input) => {
        const registration: StoredRegistration = { ...input };
        localStorage.setItem(REGISTER_STORAGE_KEY, JSON.stringify(registration));

        const profile = buildMockProfile(
          `${input.firstName} ${input.lastName}`,
          input.email,
          input.phone,
          input.address
        );

        if (supabase) {
          const { data: existingUser, error: lookupError } = await supabase
            .from("users")
            .select("id")
            .eq("email", input.email)
            .maybeSingle();

          if (lookupError) {
            throw new Error(lookupError.message);
          }

          let userId = existingUser?.id;
          if (!userId) {
            const { data: createdUser, error: userError } = await supabase
              .from("users")
              .insert({
                name: profile.name,
                email: input.email,
                phone: input.phone,
                address: input.address,
                role: "buyer",
                status: "active",
                password_hash: "",
              })
              .select("id")
              .single();

            if (userError) {
              throw new Error(userError.message);
            }
            userId = createdUser.id;
          }

          const { data: existingCustomer, error: customerLookupError } = await supabase
            .from("customers")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();

          if (customerLookupError) {
            throw new Error(customerLookupError.message);
          }

          if (!existingCustomer) {
            const { data: createdCustomer, error: customerError } = await supabase
              .from("customers")
              .insert({
                user_id: userId,
                loyalty_tier: "Regular",
                loyalty_points: 0,
                total_orders: 0,
                total_spent: 0,
              })
              .select("id")
              .single();

            if (customerError) {
              throw new Error(customerError.message);
            }
            profile.customerId = createdCustomer.id;
          } else {
            profile.customerId = existingCustomer.id;
          }

          profile.id = userId;
        }

        setUser(profile);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
      },
      login: (input) => {
        const rawRegistered = localStorage.getItem(REGISTER_STORAGE_KEY);
        let profile: AuthUser;

        if (rawRegistered) {
          try {
            const parsed = JSON.parse(rawRegistered) as StoredRegistration;
            profile = buildMockProfile(
              `${parsed.firstName} ${parsed.lastName}`,
              parsed.email || input.email,
              parsed.phone,
              parsed.address
            );
          } catch {
            profile = buildMockProfile("FarmDirect Member", input.email);
          }
        } else {
          profile = buildMockProfile("FarmDirect Member", input.email);
        }

        setUser(profile);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
      },
      logout: () => {
        setUser(null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      },
    };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
