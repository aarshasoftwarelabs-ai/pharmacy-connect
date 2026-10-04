import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Map, Loader2, Navigation, CheckCircle2, ChevronRight, Package, Route } from 'lucide-react';
import { BillingService } from '../services/billingService';
import { DEV_PHARMACY_ID } from '../config/development';

interface DeliveryStop {
  id: string;
  clientName: string;
  address: string;
  area: string;
  pincode: string;
  invoiceAmount: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED';
}

export default function WholesaleDelivery() {
  const [loading, setLoading] = useState(false);
  const [isRoutePlanned, setIsRoutePlanned] = useState(false);
  const [stops, setStops] = useState<DeliveryStop[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('ALL');

  // Simulated orders to be delivered today
  const mockOrdersToDeliver: DeliveryStop[] = [
    { id: 'INV-1001', clientName: 'City Hospital', address: '14, Main Road, Satellite', area: 'Satellite', pincode: '380015', invoiceAmount: '₹14,500', status: 'PENDING' },
    { id: 'INV-1002', clientName: 'Apollo Pharmacy', address: 'Shop 5, Satellite Plaza', area: 'Satellite', pincode: '380015', invoiceAmount: '₹8,200', status: 'PENDING' },
    { id: 'INV-1003', clientName: 'Relief Medico', address: '22, C.G. Road', area: 'Navrangpura', pincode: '380009', invoiceAmount: '₹22,100', status: 'PENDING' },
    { id: 'INV-1004', clientName: 'Sanjeevani Clinic', address: '1st Floor, Navrangpura Char Rasta', area: 'Navrangpura', pincode: '380009', invoiceAmount: '₹4,300', status: 'PENDING' },
    { id: 'INV-1005', clientName: 'LifeCare Meds', address: 'Opposite Vastrapur Lake', area: 'Vastrapur', pincode: '380015', invoiceAmount: '₹11,800', status: 'PENDING' },
  ];

  useEffect(() => {
    // In a real app, we would fetch pending wholesale bills
    setStops(mockOrdersToDeliver);
  }, []);

  const handlePlanRoute = () => {
    setLoading(true);
    // Simulate AI computing the shortest path (TSP algorithm)
    setTimeout(() => {
      // Grouping and sorting by area/pincode to simulate "optimization"
      const optimized = [...stops].sort((a, b) => a.area.localeCompare(b.area));
      // Set the first one to IN_TRANSIT for demo
      if (optimized.length > 0) optimized[0].status = 'IN_TRANSIT';
      
      setStops(optimized);
      setIsRoutePlanned(true);
      setLoading(false);
    }, 2000);
  };

  const markDelivered = (id: string) => {
    const updated = stops.map(s => {
      if (s.id === id) return { ...s, status: 'DELIVERED' as const };
      return s;
    });
    
    // Auto start next delivery
    const pendingIndex = updated.findIndex(s => s.status === 'PENDING');
    if (pendingIndex !== -1) {
      updated[pendingIndex].status = 'IN_TRANSIT';
    }
    
    setStops(updated);
  };

  const filteredStops = selectedArea === 'ALL' ? stops : stops.filter(s => s.area === selectedArea);
  const areas = Array.from(new Set(stops.map(s => s.area)));

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight flex items-center">
            <Route className="w-8 h-8 mr-3 text-blue-600" />
            AI Delivery Route Planner
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">Optimize delivery routes for your delivery staff to save time and fuel.</p>
        </div>
        
        {!isRoutePlanned && (
          <button 
            onClick={handlePlanRoute}
            disabled={loading || stops.length === 0}
            className="flex items-center px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> AI Optimizing Route...</>
            ) : (
              <><Map className="w-5 h-5 mr-2" /> Generate Smart Route</>
            )}
          </button>
        )}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">
        
        {/* Left Col: Stops List */}
        <div className="col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h2 className="font-bold text-slate-800 flex items-center">
              <Package className="w-5 h-5 mr-2 text-blue-500" />
              Today's Deliveries ({stops.length})
            </h2>
          </div>
          
          <div className="p-3 border-b border-slate-100">
            <select 
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="ALL">All Areas</option>
              {areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {filteredStops.map((stop, index) => (
              <div 
                key={stop.id} 
                className={`p-4 rounded-xl border-2 transition-all ${
                  stop.status === 'DELIVERED' ? 'bg-slate-50 border-emerald-200 opacity-60' :
                  stop.status === 'IN_TRANSIT' ? 'bg-blue-50 border-blue-500 shadow-md shadow-blue-100' :
                  'bg-white border-slate-100 hover:border-blue-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-600">Stop #{index + 1}</span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                    stop.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' :
                    stop.status === 'IN_TRANSIT' ? 'bg-blue-600 text-white animate-pulse' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {stop.status.replace('_', ' ')}
                  </span>
                </div>
                
                <h4 className="font-bold text-slate-800 text-sm mb-1">{stop.clientName}</h4>
                <div className="flex items-start text-xs text-slate-500 mb-3">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0 mt-0.5" />
                  <span>{stop.address}</span>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <span className="font-bold text-slate-700 text-sm">{stop.invoiceAmount}</span>
                  {isRoutePlanned && stop.status === 'IN_TRANSIT' && (
                    <button 
                      onClick={() => markDelivered(stop.id)}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Delivered
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Map / Route Visualizer */}
        <div className="col-span-1 lg:col-span-2 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden relative flex flex-col">
          {!isRoutePlanned ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white h-full">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <Map className="w-12 h-12 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No Route Planned Yet</h3>
              <p className="text-slate-500 max-w-sm mx-auto mb-6">
                Click "Generate Smart Route" to let the AI calculate the shortest path for your delivery staff.
              </p>
            </div>
          ) : (
            <div className="flex-1 p-6 flex flex-col h-full bg-white relative">
              {/* Simulated Map Background pattern */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
              
              <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg mb-8 relative z-10 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg flex items-center">
                    <Navigation className="w-5 h-5 mr-2" /> Live Delivery Tracking
                  </h3>
                  <p className="text-blue-100 text-sm mt-0.5">Route optimized by AI. Total stops: {stops.length}</p>
                </div>
                <div className="bg-white/20 px-3 py-1.5 rounded-lg text-sm font-bold backdrop-blur-sm">
                  Est. Fuel Saved: 1.2L
                </div>
              </div>

              {/* Timeline Visualization */}
              <div className="flex-1 overflow-y-auto px-4 relative z-10">
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200"></div>
                
                <div className="space-y-8">
                  {/* Warehouse Start Point */}
                  <div className="relative flex items-center">
                    <div className="absolute left-1.5 w-4 h-4 rounded-full bg-slate-800 border-4 border-white shadow-sm z-10"></div>
                    <div className="ml-12 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md inline-block">
                      DavaSetu Wholesale (Start Point)
                    </div>
                  </div>

                  {stops.map((stop, idx) => (
                    <div key={stop.id} className="relative flex items-start group">
                      <div className={`absolute left-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-[3px] border-white shadow-md z-10 transition-colors ${
                        stop.status === 'DELIVERED' ? 'bg-emerald-500 text-white' :
                        stop.status === 'IN_TRANSIT' ? 'bg-blue-600 text-white animate-bounce' :
                        'bg-slate-200 text-slate-500'
                      }`}>
                        {idx + 1}
                      </div>
                      
                      {/* Active Connection Line for IN_TRANSIT */}
                      {stop.status === 'IN_TRANSIT' && idx > 0 && (
                        <div className="absolute left-3.5 -top-8 w-0.5 h-8 bg-blue-500 z-0"></div>
                      )}

                      <div className={`ml-12 p-4 rounded-xl border w-full max-w-md transition-all ${
                        stop.status === 'IN_TRANSIT' ? 'bg-blue-50 border-blue-200 shadow-md transform scale-[1.02]' :
                        'bg-white border-slate-200 group-hover:border-blue-200'
                      }`}>
                        <div className="flex justify-between">
                          <h4 className={`font-bold ${stop.status === 'DELIVERED' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                            {stop.clientName}
                          </h4>
                          {stop.status === 'IN_TRANSIT' && (
                            <span className="flex items-center text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                              <Truck className="w-3 h-3 mr-1" /> Next Stop
                            </span>
                          )}
                          {stop.status === 'DELIVERED' && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          )}
                        </div>
                        <p className={`text-sm mt-1 flex items-center ${stop.status === 'DELIVERED' ? 'text-slate-400' : 'text-slate-500'}`}>
                          <MapPin className="w-3.5 h-3.5 mr-1 opacity-70" /> {stop.area} - {stop.pincode}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {/* End Point */}
                  {stops.every(s => s.status === 'DELIVERED') && (
                    <div className="relative flex items-center animate-in fade-in slide-in-from-bottom-4">
                      <div className="absolute left-1.5 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm z-10"></div>
                      <div className="ml-12 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md inline-block">
                        All Deliveries Completed! Return to Base.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
