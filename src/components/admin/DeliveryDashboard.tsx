import React, { useState } from 'react';
import {
  Truck,
  MapPin,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  User,
  RotateCcw,
  Check,
} from 'lucide-react';

interface RouteStop {
  id: string;
  company: string;
  mealsCount: number;
  address: string;
  contactName: string;
  contactPhone: string;
  status: 'Preparing' | 'Ready' | 'Out for delivery' | 'Delivered' | 'Failed';
  failureReason?: string;
  resolution?: string;
}

interface DeliveryZoneRoute {
  id: string;
  zone: string;
  totalMeals: number;
  driverName: string;
  driverPhone: string;
  driverVehicle: string;
  status: 'Preparing' | 'Out for delivery' | 'Delivered';
  stops: RouteStop[];
}

export const DeliveryDashboard: React.FC = () => {
  // Clean slate routes
  const [routes, setRoutes] = useState<DeliveryZoneRoute[]>([]);

  const [activeZoneId, setActiveZoneId] = useState<string>('route-vi');
  const [selectedFailedStop, setSelectedFailedStop] = useState<RouteStop | null>(null);
  const [failureReason, setFailureReason] = useState('Customer not available');
  const [resolutionChoice, setResolutionChoice] = useState<'Redelivery' | 'Credit customer'>('Redelivery');

  const activeRoute = routes.find((r) => r.id === activeZoneId) || routes[0];

  const handleMarkRouteDelivered = (routeId: string) => {
    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id === routeId) {
          return {
            ...r,
            status: 'Delivered',
            stops: r.stops.map((s) => ({ ...s, status: 'Delivered' as const })),
          };
        }
        return r;
      })
    );
  };

  const handleUpdateStopStatus = (
    stopId: string,
    newStatus: 'Preparing' | 'Ready' | 'Out for delivery' | 'Delivered' | 'Failed'
  ) => {
    if (newStatus === 'Failed') {
      const stop = activeRoute.stops.find((s) => s.id === stopId);
      if (stop) {
        setSelectedFailedStop(stop);
        return;
      }
    }

    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id === activeZoneId) {
          return {
            ...r,
            stops: r.stops.map((s) => (s.id === stopId ? { ...s, status: newStatus } : s)),
          };
        }
        return r;
      })
    );
  };

  const handleConfirmFailure = () => {
    if (!selectedFailedStop) return;
    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id === activeZoneId) {
          return {
            ...r,
            stops: r.stops.map((s) =>
              s.id === selectedFailedStop.id
                ? {
                    ...s,
                    status: 'Failed',
                    failureReason,
                    resolution: resolutionChoice,
                  }
                : s
            ),
          };
        }
        return r;
      })
    );
    setSelectedFailedStop(null);
  };

  return (
    <div className="space-y-6 font-['Poppins']">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <span className="text-xs font-bold text-[#FF4C00] uppercase tracking-wider">
            Last-Mile Operations
          </span>
          <h2 className="text-2xl font-black text-black mt-0.5">
            Deliveries & Dispatch Zones
          </h2>
          <p className="text-xs text-zinc-500">
            Corporate desk drops grouped by Island zones: driver dispatches, office floor drops, and real-time confirmations.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleMarkRouteDelivered(activeRoute.id)}
            className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark {activeRoute.zone} Delivered</span>
          </button>
        </div>
      </div>

      {/* 3 Zone Cards: Victoria Island (43), Ikoyi (28), Lekki (20) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {routes.map((r) => {
          const isSelected = r.id === activeZoneId;
          return (
            <div
              key={r.id}
              onClick={() => setActiveZoneId(r.id)}
              className={`p-5 rounded-3xl border transition cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-black text-white border-black shadow-md'
                  : 'bg-white text-zinc-900 border-zinc-200 hover:border-zinc-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200/20 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FF4C00]">
                    Zone Route
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      r.status === 'Delivered'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : r.status === 'Out for delivery'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>

                <h3 className="text-lg font-black">{r.zone}</h3>
                <div className="text-2xl font-black mt-1">
                  {r.totalMeals} <span className="text-xs font-normal text-zinc-400">desk drops</span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-zinc-200/20 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Driver</span>
                  <span className="font-semibold">{r.driverName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Vehicle</span>
                  <span className="font-semibold truncate max-w-[120px]">{r.driverVehicle}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Route Stops Table */}
      <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF7F2]">
          <div>
            <h3 className="text-base font-black text-black">
              {activeRoute.zone} Stops & Office Floor Drops
            </h3>
            <p className="text-xs text-zinc-500">
              Assigned to {activeRoute.driverName} ({activeRoute.driverPhone})
            </p>
          </div>
          <span className="text-xs font-bold text-zinc-600 bg-white border border-zinc-200 px-3 py-1 rounded-full">
            {activeRoute.stops.length} Building Drops
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-zinc-500 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-200">
              <tr>
                <th className="py-3 px-4">Company & Floor</th>
                <th className="py-3 px-4">Meals</th>
                <th className="py-3 px-4">Contact Person</th>
                <th className="py-3 px-4">Delivery Status</th>
                <th className="py-3 px-4 text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {activeRoute.stops.map((stop) => {
                return (
                  <tr key={stop.id} className="hover:bg-zinc-50/70 transition">
                    
                    <td className="py-3.5 px-4 font-bold text-black max-w-xs">
                      <span className="block text-xs font-black">{stop.company}</span>
                      <span className="text-[11px] text-zinc-500 font-normal block">{stop.address}</span>
                      {stop.failureReason && (
                        <div className="mt-1 text-[10px] text-rose-600 font-semibold bg-rose-50 p-1.5 rounded-lg border border-rose-200">
                          Failed: {stop.failureReason} → {stop.resolution}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-black text-black whitespace-nowrap">
                      {stop.mealsCount} packs
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-zinc-900 block">{stop.contactName}</span>
                      <span className="text-[10px] text-zinc-400 block">{stop.contactPhone}</span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          stop.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : stop.status === 'Out for delivery'
                            ? 'bg-blue-100 text-blue-800'
                            : stop.status === 'Failed'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {stop.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <select
                        value={stop.status}
                        onChange={(e) => handleUpdateStopStatus(stop.id, e.target.value as any)}
                        className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-zinc-800 focus:outline-none"
                      >
                        <option value="Preparing">Preparing</option>
                        <option value="Ready">Ready</option>
                        <option value="Out for delivery">Out for delivery</option>
                        <option value="Delivered">Delivered ✓</option>
                        <option value="Failed">Failed ✕</option>
                      </select>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Failed Delivery Resolution Modal (Section 8 Specification) */}
      {selectedFailedStop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-['Poppins']">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-zinc-200 shadow-2xl text-left space-y-4">
            <div className="flex items-center space-x-2 text-rose-600">
              <AlertCircle className="w-5 h-5" />
              <h4 className="text-base font-black text-black">Log Delivery Failure</h4>
            </div>

            <p className="text-xs text-zinc-600">
              Record failure reason for {selectedFailedStop.company} ({selectedFailedStop.mealsCount} meals):
            </p>

            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Reason for Failure</label>
              <select
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-zinc-200 rounded-xl px-3 py-2 text-xs font-medium text-black focus:outline-none"
              >
                <option value="Customer not available">Customer not available</option>
                <option value="Building access denied">Building access denied / Gate closed</option>
                <option value="Wrong address / Wrong floor">Wrong address / Wrong floor</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Resolution Action</label>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setResolutionChoice('Redelivery')}
                  className={`p-2.5 rounded-xl border text-center cursor-pointer ${
                    resolutionChoice === 'Redelivery'
                      ? 'bg-black text-white border-black font-bold'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                  }`}
                >
                  Schedule Redelivery
                </button>
                <button
                  type="button"
                  onClick={() => setResolutionChoice('Credit customer')}
                  className={`p-2.5 rounded-xl border text-center cursor-pointer ${
                    resolutionChoice === 'Credit customer'
                      ? 'bg-black text-white border-black font-bold'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                  }`}
                >
                  Credit Customer ₦
                </button>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3">
              <button
                type="button"
                onClick={() => setSelectedFailedStop(null)}
                className="px-4 py-2 rounded-full border border-zinc-200 text-xs font-semibold text-zinc-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmFailure}
                className="px-5 py-2 rounded-full bg-rose-600 text-white text-xs font-bold"
              >
                Confirm Failure & Log Action
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
