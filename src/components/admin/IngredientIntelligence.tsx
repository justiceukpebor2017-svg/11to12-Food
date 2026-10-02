import React, { useState } from 'react';
import { InventoryItem } from '../../types';
import { Box, AlertTriangle, CheckCircle2, Plus, Edit2, ShieldAlert, X } from 'lucide-react';

interface IngredientIntelligenceProps {
  inventoryItems: InventoryItem[];
  onUpdateStock: (itemId: string, newStock: number) => void;
  onAddItem: (newItem: InventoryItem) => void;
}

export const IngredientIntelligence: React.FC<IngredientIntelligenceProps> = ({
  inventoryItems,
  onUpdateStock,
  onAddItem,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<InventoryItem | null>(null);
  const [editQty, setEditQty] = useState<number>(0);

  // New Item State
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<InventoryItem['category']>('Ingredient');
  const [newUnit, setNewUnit] = useState<InventoryItem['unit']>('kg');
  const [newStock, setNewStock] = useState(10);
  const [newRequired, setNewRequired] = useState(15);
  const [newCost, setNewCost] = useState(3000);

  const handleOpenEdit = (item: InventoryItem) => {
    setSelectedItemForEdit(item);
    setEditQty(item.currentStock);
  };

  const handleSaveStockUpdate = () => {
    if (selectedItemForEdit) {
      onUpdateStock(selectedItemForEdit.id, editQty);
      setSelectedItemForEdit(null);
    }
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const item: InventoryItem = {
      id: `inv-${Date.now()}`,
      name: newName.trim(),
      category: newCategory,
      unit: newUnit,
      currentStock: newStock,
      requiredStock: newRequired,
      reorderPoint: Math.round(newRequired * 0.4),
      costPerUnitNGN: newCost,
    };

    onAddItem(item);
    setIsModalOpen(false);
    setNewName('');
  };

  return (
    <div className="bg-white border-4 border-black text-black p-6 sm:p-8 shadow-[8px_8px_0px_#000] space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-3 border-black">
        <div>
          <span className="text-xs font-black uppercase text-black bg-[#FACC15] px-3 py-1 border-2 border-black font-mono-custom shadow-[2px_2px_0px_#000]">
            PANTRY & PACKAGING INTELLIGENCE
          </span>
          <h3 className="text-2xl font-black uppercase font-heading text-black mt-2">INGREDIENT INTELLIGENCE & INVENTORY TRACKER</h3>
          <p className="text-xs font-bold text-zinc-700 mt-1 uppercase tracking-wider">
            Automatically calculates raw ingredient shortages and packaging reorder thresholds.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-3 bg-[#FF4C00] hover:bg-[#e04300] text-white font-black text-xs uppercase border-3 border-black shadow-[3px_3px_0px_#000] cursor-pointer transition-all flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>ADD INVENTORY ITEM</span>
        </button>
      </div>

      {/* Inventory Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b-3 border-black text-black font-mono-custom font-black uppercase">
              <th className="py-3 px-4">ITEM NAME</th>
              <th className="py-3 px-4">CATEGORY</th>
              <th className="py-3 px-4">CURRENT STOCK</th>
              <th className="py-3 px-4">REQUIRED TODAY</th>
              <th className="py-3 px-4">STOCK STATUS</th>
              <th className="py-3 px-4 text-right">QUICK UPDATE</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black font-bold">
            {inventoryItems.map((item) => {
              const isShortage = item.currentStock < item.requiredStock;
              const isLow = !isShortage && item.currentStock <= item.reorderPoint;

              return (
                <tr key={item.id} className="hover:bg-[#FACC15]/20 transition">
                  <td className="py-3 px-4 font-black uppercase text-black">{item.name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 border-2 border-black bg-zinc-200 text-black font-mono-custom font-black text-[10px] uppercase shadow-[1px_1px_0px_#000]">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono-custom font-black text-black">
                    {item.currentStock} {item.unit}
                  </td>
                  <td className="py-3 px-4 font-mono-custom text-zinc-700 font-bold">
                    {item.requiredStock} {item.unit}
                  </td>
                  <td className="py-3 px-4">
                    {isShortage ? (
                      <span className="px-2.5 py-1 text-[10px] font-black uppercase bg-[#FF4C00] text-white border-2 border-black flex items-center w-fit space-x-1 shadow-[1px_1px_0px_#000]">
                        <AlertTriangle className="w-3.5 h-3.5 stroke-[3]" />
                        <span>SHORTAGE ALERT</span>
                      </span>
                    ) : isLow ? (
                      <span className="px-2.5 py-1 text-[10px] font-black uppercase bg-[#FACC15] text-black border-2 border-black flex items-center w-fit space-x-1 shadow-[1px_1px_0px_#000]">
                        <ShieldAlert className="w-3.5 h-3.5 stroke-[3]" />
                        <span>LOW REORDER</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-[10px] font-black uppercase bg-[#22C55E] text-black border-2 border-black flex items-center w-fit space-x-1 shadow-[1px_1px_0px_#000]">
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                        <span>OPTIMAL</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 bg-[#FF4C00] hover:bg-[#e04300] text-white border-2 border-black shadow-[2px_2px_0px_#000] cursor-pointer transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Quantity Modal */}
      {selectedItemForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-white border-4 border-black p-6 max-w-sm w-full text-black space-y-4 shadow-[12px_12px_0px_#000]">
            <h4 className="text-lg font-black uppercase font-heading text-black">UPDATE {selectedItemForEdit.name} STOCK</h4>
            
            <div>
              <label className="block text-xs font-black uppercase font-mono-custom text-black mb-1">NEW AVAILABLE QTY ({selectedItemForEdit.unit})</label>
              <input
                type="number"
                value={editQty}
                onChange={(e) => setEditQty(Number(e.target.value))}
                className="w-full bg-[#F8F8F8] border-3 border-black p-3 text-sm font-black text-black focus:outline-none font-mono-custom"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedItemForEdit(null)}
                className="flex-1 py-3 bg-zinc-200 hover:bg-zinc-300 text-black font-black uppercase text-xs border-2 border-black cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleSaveStockUpdate}
                className="flex-1 py-3 bg-[#22C55E] hover:bg-[#1eb052] text-black font-black uppercase text-xs border-2 border-black shadow-[3px_3px_0px_#000] cursor-pointer"
              >
                SAVE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <form onSubmit={handleCreateItem} className="bg-white border-4 border-black p-6 max-w-lg w-full text-black space-y-4 shadow-[12px_12px_0px_#000]">
            <div className="flex items-center justify-between pb-3 border-b-3 border-black">
              <h4 className="text-xl font-black uppercase font-heading">ADD PANTRY OR PACKAGING ITEM</h4>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 bg-black text-white border-2 border-black hover:bg-[#FF4C00]">
                <X className="w-5 h-5 stroke-[3]" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-black uppercase font-mono-custom text-black mb-1">Item Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Scent Leaf Jugs"
                className="w-full bg-[#F8F8F8] border-3 border-black p-3 text-xs font-bold text-black focus:outline-none focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase font-mono-custom text-black mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-[#F8F8F8] border-3 border-black p-3 text-xs font-black text-black focus:outline-none uppercase"
                >
                  <option value="Ingredient">Ingredient</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Cutlery & Extras">Cutlery & Extras</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase font-mono-custom text-black mb-1">Unit</label>
                <select
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value as any)}
                  className="w-full bg-[#F8F8F8] border-3 border-black p-3 text-xs font-black text-black focus:outline-none uppercase"
                >
                  <option value="kg">kg</option>
                  <option value="liters">liters</option>
                  <option value="bags">bags</option>
                  <option value="packs">packs</option>
                  <option value="units">units</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-black uppercase font-mono-custom text-black mb-1">Current Stock</label>
                <input
                  type="number"
                  required
                  value={newStock}
                  onChange={(e) => setNewStock(Number(e.target.value))}
                  className="w-full bg-[#F8F8F8] border-3 border-black p-2.5 text-xs font-black text-black font-mono-custom"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase font-mono-custom text-black mb-1">Required Today</label>
                <input
                  type="number"
                  required
                  value={newRequired}
                  onChange={(e) => setNewRequired(Number(e.target.value))}
                  className="w-full bg-[#F8F8F8] border-3 border-black p-2.5 text-xs font-black text-black font-mono-custom"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase font-mono-custom text-black mb-1">Cost/Unit (NGN)</label>
                <input
                  type="number"
                  required
                  value={newCost}
                  onChange={(e) => setNewCost(Number(e.target.value))}
                  className="w-full bg-[#F8F8F8] border-3 border-black p-2.5 text-xs font-black text-black font-mono-custom"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 bg-zinc-200 hover:bg-zinc-300 text-black font-black uppercase text-xs border-2 border-black cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-[#FF4C00] hover:bg-[#e04300] text-white font-black uppercase text-xs border-2 border-black shadow-[3px_3px_0px_#000] cursor-pointer"
              >
                SAVE ITEM
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
