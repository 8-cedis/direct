import StepProgress from "../../components/StepProgress";
import { formatGhs, products } from "../../lib/products";

const orderItems = [
  { product: products[0], quantity: 2 },
  { product: products[6], quantity: 6 },
  { product: products[9], quantity: 1 },
];

export default function OrderTrackingPage() {
  const steps = ["Order Placed", "Confirmed", "Out for Delivery", "Delivered"];

  return (
    <section className="space-y-5">
      <article className="card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--color-muted)]">Order ID: FD-4201</p>
            <p className="text-sm text-[var(--color-muted)]">Date: April 5, 2026</p>
            <h1 className="display-title mt-2 text-3xl">Weekly Produce Box</h1>
          </div>
        </div>

        <div className="mt-6">
          <StepProgress steps={steps} currentStep={2} />
        </div>

        <div className="mt-6 rounded-[var(--radius-card)] bg-[var(--color-light-green)] p-4 text-[var(--color-primary-green)]">
          <p className="font-semibold">Estimated arrival: 4:45 PM today 🚚</p>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t-[0.5px] border-black/15 pt-4">
          <div className="text-sm text-[var(--color-muted)]">
            <p>Driver: Kojo Mensah</p>
            <p>Vehicle: GR-5621-24</p>
          </div>
          <button type="button" className="btn-primary px-4 py-2 text-sm font-semibold">
            Call
          </button>
        </div>
      </article>

      <article className="card p-5 md:p-6">
        <h2 className="display-title text-2xl">Items in this order</h2>
        <div className="mt-4 space-y-3">
          {orderItems.map((item) => (
            <div key={item.product.id} className="card flex items-center justify-between gap-3 p-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-light-green)]">
                  {item.product.image ? (
                    <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[8px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                      No image
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-[var(--color-dark-green)]">{item.product.name}</p>
                  <p className="text-sm text-[var(--color-muted)]">Qty: {item.quantity}</p>
                </div>
              </div>
              <p className="font-semibold text-[var(--color-primary-green)]">
                {formatGhs(item.product.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
