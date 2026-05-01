"use client";

import { motion } from "motion/react";
import { FormEvent, useState } from "react";

type AnimalForm = {
  species: string;
  breed: string;
  age: string;
  weight: string;
  healthStatus: string;
  price: string;
  negotiable: boolean;
};

const initialForm: AnimalForm = {
  species: "",
  breed: "",
  age: "",
  weight: "",
  healthStatus: "Healthy",
  price: "",
  negotiable: false,
};

export default function AnimalListingPage() {
  const [form, setForm] = useState<AnimalForm>(initialForm);
  const [message, setMessage] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setMessage("Animal listing draft saved successfully.");
  };

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="display-title text-4xl text-[#4F633D]">Special Animal Listing</h1>
        <p className="text-slate-700">Create a detailed listing for animal buyers with transparent health and pricing details.</p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        onSubmit={onSubmit}
        className="glass rounded-2xl p-6 md:p-8"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#4F633D]">Species</label>
            <input
              value={form.species}
              onChange={(e) => setForm((prev) => ({ ...prev, species: e.target.value }))}
              placeholder="Goat, Cow, Sheep"
              className="w-full rounded-xl border border-[rgba(79,99,61,0.25)] bg-white/75 px-4 py-2"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#4F633D]">Breed</label>
            <input
              value={form.breed}
              onChange={(e) => setForm((prev) => ({ ...prev, breed: e.target.value }))}
              placeholder="Boer, Friesian"
              className="w-full rounded-xl border border-[rgba(79,99,61,0.25)] bg-white/75 px-4 py-2"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#4F633D]">Age</label>
            <input
              value={form.age}
              onChange={(e) => setForm((prev) => ({ ...prev, age: e.target.value }))}
              placeholder="2 years"
              className="w-full rounded-xl border border-[rgba(79,99,61,0.25)] bg-white/75 px-4 py-2"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#4F633D]">Weight</label>
            <input
              value={form.weight}
              onChange={(e) => setForm((prev) => ({ ...prev, weight: e.target.value }))}
              placeholder="75 kg"
              className="w-full rounded-xl border border-[rgba(79,99,61,0.25)] bg-white/75 px-4 py-2"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#4F633D]">Health Status</label>
            <select
              value={form.healthStatus}
              onChange={(e) => setForm((prev) => ({ ...prev, healthStatus: e.target.value }))}
              className="w-full rounded-xl border border-[rgba(79,99,61,0.25)] bg-white/75 px-4 py-2"
              required
            >
              <option>Healthy</option>
              <option>Vaccinated</option>
              <option>Under treatment</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#4F633D]">Price</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
              placeholder="500"
              className="w-full rounded-xl border border-[rgba(79,99,61,0.25)] bg-white/75 px-4 py-2"
              required
            />
          </div>
        </div>

        <label className="mt-5 flex items-center gap-3 rounded-xl border border-[rgba(79,99,61,0.2)] bg-white/60 p-3 text-sm font-semibold text-[#4F633D]">
          <input
            type="checkbox"
            checked={form.negotiable}
            onChange={(e) => setForm((prev) => ({ ...prev, negotiable: e.target.checked }))}
          />
          Negotiable Price
        </label>

        {message && <p className="mt-4 text-sm font-semibold text-emerald-700">{message}</p>}

        <button type="submit" className="btn-primary mt-6 px-6 py-3">
          Save Animal Listing
        </button>
      </motion.form>
    </section>
  );
}
