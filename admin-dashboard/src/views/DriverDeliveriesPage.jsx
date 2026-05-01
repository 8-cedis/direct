"use client";

import DataTable from "../components/DataTable";
import Badge from "../components/Badge";

const deliveries = [
  { id: 'FD-4201', customer: 'Ama Mensah', address: 'East Legon, Accra', status: 'Out for Delivery' },
  { id: 'FD-4198', customer: 'Kojo Boateng', address: 'Tema, Accra', status: 'Delivered' },
  { id: 'FD-4188', customer: 'Efua Agyeman', address: 'Osu, Accra', status: 'Confirmed' },
];

export default function DriverDeliveriesPage() {
  return <DataTable columns={[{ key: 'id', label: 'Order' }, { key: 'customer', label: 'Customer' }, { key: 'address', label: 'Address' }, { key: 'status', label: 'Status', render: (row) => <Badge tone={row.status === 'Delivered' ? 'success' : row.status === 'Out for Delivery' ? 'warning' : 'info'}>{row.status}</Badge> }]} rows={deliveries} />;
}
