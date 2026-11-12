import React, { useEffect, useMemo, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  ImagePlus,
  Link2,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  MainMealSubGroup,
  MenuShowcaseCategory,
  MenuShowcaseItem,
} from '../../../types';
import {
  MAIN_MEAL_SUBGROUPS,
  MENU_SHOWCASE_CATEGORIES,
  compressMenuShowcaseImageFile,
  mergeMenuShowcaseItems,
} from '../../../data/menuShowcaseData';
import {
  deleteMenuShowcaseItemFromFirestore,
  getLocalMenuShowcaseMap,
  saveMenuShowcaseItemToFirestore,
  subscribeToMenuShowcase,
} from '../../../services/firebase';

export const AdminMenuShowcaseTab: React.FC = () => {
  const [overridesMap, setOverridesMap] = useState<Record<string, MenuShowcaseItem>>(() =>
    getLocalMenuShowcaseMap()
  );
  const [selectedCategory, setSelectedCategory] = useState<MenuShowcaseCategory>('main-meals');
  const [selectedSubGroup, setSelectedSubGroup] = useState<MainMealSubGroup | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [urlDrafts, setUrlDrafts] = useState<Record<string, string>>({});
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editNameDraft, setEditNameDraft] = useState('');
  const [editDescDraft, setEditDescDraft] = useState('');

  // Add custom item state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSubGroup, setNewSubGroup] = useState<MainMealSubGroup>('Rice');
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    const unsub = subscribeToMenuShowcase((remoteMap) => {
      setOverridesMap(remoteMap);
    });
    return () => unsub();
  }, []);

  const allItems = useMemo(() => mergeMenuShowcaseItems(overridesMap), [overridesMap]);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const categoryItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allItems.filter((item) => {
      if (item.category !== selectedCategory) return false;
      if (selectedCategory === 'main-meals' && selectedSubGroup !== 'all' && item.subGroup !== selectedSubGroup) {
        return false;
      }
      if (q) {
        return (
          item.name.toLowerCase().includes(q) ||
          (item.description || '').toLowerCase().includes(q) ||
          (item.subGroup || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allItems, selectedCategory, selectedSubGroup, searchQuery]);

  const stats = useMemo(() => {
    const total = allItems.length;
    const withPhoto = allItems.filter((i) => Boolean(i.imageUrl && i.imageUrl.trim())).length;
    return {
      total,
      withPhoto,
      missingPhoto: total - withPhoto,
    };
  }, [allItems]);

  const handleUploadImageFile = async (item: MenuShowcaseItem, file: File) => {
    setBusyItemId(item.id);
    try {
      const compressed = await compressMenuShowcaseImageFile(file, 640, 0.78);
      await saveMenuShowcaseItemToFirestore({
        ...item,
        imageUrl: compressed,
      });
      showToast(`Saved photo for "${item.name}" and synced live to the homepage.`);
    } catch (err: any) {
      showToast(err?.message || 'Could not process image file.');
    } finally {
      setBusyItemId(null);
    }
  };

  const handleSaveUrl = async (item: MenuShowcaseItem) => {
    const rawUrl = (urlDrafts[item.id] ?? item.imageUrl ?? '').trim();
    if (!rawUrl) {
      showToast('Paste an image URL or upload a photo first.');
      return;
    }
    setBusyItemId(item.id);
    try {
      await saveMenuShowcaseItemToFirestore({
        ...item,
        imageUrl: rawUrl,
      });
      setUrlDrafts((prev) => ({ ...prev, [item.id]: '' }));
      showToast(`Updated image URL for "${item.name}".`);
    } finally {
      setBusyItemId(null);
    }
  };

  const handleClearImage = async (item: MenuShowcaseItem) => {
    setBusyItemId(item.id);
    try {
      await saveMenuShowcaseItemToFirestore({
        ...item,
        imageUrl: '',
      });
      showToast(`Removed photo from "${item.name}".`);
    } finally {
      setBusyItemId(null);
    }
  };

  const handleStartEditDetails = (item: MenuShowcaseItem) => {
    setEditingItemId(item.id);
    setEditNameDraft(item.name);
    setEditDescDraft(item.description || '');
  };

  const handleSaveDetails = async (item: MenuShowcaseItem) => {
    const cleanName = editNameDraft.trim();
    if (!cleanName) return;
    setBusyItemId(item.id);
    try {
      await saveMenuShowcaseItemToFirestore({
        ...item,
        name: cleanName,
        description: editDescDraft.trim(),
      });
      setEditingItemId(null);
      showToast(`Updated "${cleanName}" on the homepage menu.`);
    } finally {
      setBusyItemId(null);
    }
  };

  const handleCreateCustomItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newName.trim();
    if (!cleanName) return;
    const newId = `custom-${selectedCategory}-${Date.now()}`;
    const newItem: MenuShowcaseItem = {
      id: newId,
      category: selectedCategory,
      subGroup: selectedCategory === 'main-meals' ? newSubGroup : undefined,
      name: cleanName,
      description: newDesc.trim() || undefined,
      imageUrl: newImageUrl.trim() || undefined,
      sortOrder: 900 + allItems.length,
      isCustom: true,
    };
    await saveMenuShowcaseItemToFirestore(newItem);
    setNewName('');
    setNewDesc('');
    setNewImageUrl('');
    setIsAddOpen(false);
    showToast(`Added "${cleanName}" to homepage menu.`);
  };

  const handleNewItemFileUpload = async (file: File) => {
    try {
      const compressed = await compressMenuShowcaseImageFile(file, 640, 0.78);
      setNewImageUrl(compressed);
    } catch (err: any) {
      showToast(err?.message || 'Could not process image file.');
    }
  };

  const handleDeleteCustomItem = async (item: MenuShowcaseItem) => {
    await deleteMenuShowcaseItemFromFirestore(item.id);
    showToast(`Removed custom item "${item.name}".`);
  };

  return (
    <div className="space-y-6 font-['Poppins']">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#FF4C00]">
            Homepage Menu Showcase
          </p>
          <h3 className="text-xl font-extrabold text-zinc-900">
            See What Is On The Menu — Image Manager
          </h3>
          <p className="text-xs text-zinc-500 max-w-2xl">
            Upload photos or paste image URLs for every dish in Main Meals (Rice, Yam, Beans, Plantain, Pasta), Soups, Protein, Swallow, and Drinks. Changes publish live to the homepage immediately.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="px-4 py-2.5 rounded-2xl bg-[#FAF7F2] border border-zinc-200/80 text-center">
            <p className="text-[10px] font-bold uppercase text-zinc-400">With Photos</p>
            <p className="text-lg font-extrabold text-zinc-900 tabular-nums">
              {stats.withPhoto} / {stats.total}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddOpen((v) => !v)}
            className="px-4 py-3 rounded-2xl bg-[#FF4C00] hover:bg-[#e04300] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Live Feedback Notice */}
      {statusMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Optional Add Custom Item Form */}
      {isAddOpen && (
        <form
          onSubmit={handleCreateCustomItem}
          className="bg-white rounded-3xl border border-orange-200 p-5 sm:p-6 space-y-4 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-zinc-900">
              Add Item to {MENU_SHOWCASE_CATEGORIES.find((c) => c.id === selectedCategory)?.title}
            </h4>
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 mb-1">Item Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Peppered Turkey"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs outline-none focus:border-[#FF4C00]"
              />
            </div>

            {selectedCategory === 'main-meals' && (
              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">Main Meal Type</label>
                <select
                  value={newSubGroup}
                  onChange={(e) => setNewSubGroup(e.target.value as MainMealSubGroup)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs outline-none focus:border-[#FF4C00] bg-white"
                >
                  {MAIN_MEAL_SUBGROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-zinc-600 mb-1">Short Description</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Optional short appetizing description"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs outline-none focus:border-[#FF4C00]"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold cursor-pointer whitespace-nowrap shrink-0">
              <Upload className="w-3.5 h-3.5" />
              <span>{newImageUrl ? 'Photo Attached (Change)' : 'Upload Photo'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleNewItemFileUpload(file);
                }}
              />
            </label>
            <input
              type="url"
              value={newImageUrl.startsWith('data:') ? '' : newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Or paste image URL (https://...)"
              className="flex-1 px-3.5 py-2 rounded-xl border border-zinc-200 text-xs outline-none focus:border-[#FF4C00]"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-black text-white text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
            >
              Save New Item
            </button>
          </div>
        </form>
      )}

      {/* Category Tabs + Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {MENU_SHOWCASE_CATEGORIES.map((cat) => {
            const count = allItems.filter((i) => i.category === cat.id).length;
            const photoCount = allItems.filter((i) => i.category === cat.id && i.imageUrl).length;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedSubGroup('all');
                }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer border flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <span>{cat.title}</span>
                <span
                  className={`text-[10px] font-bold tabular-nums ${
                    isActive ? 'text-orange-300' : 'text-zinc-400'
                  }`}
                >
                  {photoCount}/{count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dish, soup, protein, drink..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-zinc-200 text-xs outline-none focus:border-[#FF4C00]"
          />
        </div>
      </div>

      {/* Sub-filter for Main Meals */}
      {selectedCategory === 'main-meals' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedSubGroup('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer border ${
              selectedSubGroup === 'all'
                ? 'bg-[#FF4C00] text-white border-[#FF4C00]'
                : 'bg-white text-zinc-600 border-zinc-200'
            }`}
          >
            All Main Meals
          </button>
          {MAIN_MEAL_SUBGROUPS.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSelectedSubGroup(sub)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer border ${
                selectedSubGroup === sub
                  ? 'bg-[#FF4C00] text-white border-[#FF4C00]'
                  : 'bg-white text-zinc-600 border-zinc-200'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {categoryItems.map((item) => {
          const isBusy = busyItemId === item.id;
          const isEditing = editingItemId === item.id;
          const hasPhoto = Boolean(item.imageUrl && item.imageUrl.trim());

          return (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-zinc-200/80 overflow-hidden flex flex-col shadow-2xs"
            >
              {/* Photo Preview */}
              <div className="aspect-[16/10] w-full bg-[#FAF7F2] border-b border-zinc-100 relative overflow-hidden flex items-center justify-center">
                {hasPhoto ? (
                  <>
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleClearImage(item)}
                      disabled={isBusy}
                      title="Remove photo"
                      className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-black/70 hover:bg-red-600 text-white transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-4 space-y-1.5">
                    <div className="w-11 h-11 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-400">
                      <Camera className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-zinc-500">No photo uploaded yet</p>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                {isEditing ? (
                  <div className="space-y-2.5">
                    <input
                      type="text"
                      value={editNameDraft}
                      onChange={(e) => setEditNameDraft(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs font-bold outline-none focus:border-[#FF4C00]"
                    />
                    <textarea
                      rows={2}
                      value={editDescDraft}
                      onChange={(e) => setEditDescDraft(e.target.value)}
                      placeholder="Short description..."
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs outline-none focus:border-[#FF4C00]"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveDetails(item)}
                        disabled={isBusy}
                        className="px-3 py-1.5 rounded-lg bg-[#1A1A1A] text-white text-xs font-bold cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingItemId(null)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-600 text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {item.subGroup && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF4C00]">
                            {item.subGroup}
                          </span>
                        )}
                        <h4 className="text-sm font-extrabold text-zinc-900 leading-snug">
                          {item.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditDetails(item)}
                          className="text-[11px] font-bold text-zinc-500 hover:text-black px-2 py-1 rounded-lg hover:bg-zinc-100 cursor-pointer"
                        >
                          Edit
                        </button>
                        {item.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomItem(item)}
                            className="text-[11px] font-bold text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    {item.description && (
                      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                )}

                {/* Upload & Paste URL Controls */}
                <div className="space-y-2 pt-2 border-t border-zinc-100">
                  <label
                    className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isBusy
                        ? 'bg-zinc-200 text-zinc-500 cursor-wait'
                        : 'bg-[#1A1A1A] hover:bg-[#FF4C00] text-white'
                    }`}
                  >
                    <ImagePlus className="w-4 h-4" />
                    <span>{isBusy ? 'Saving Photo...' : hasPhoto ? 'Replace Photo' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isBusy}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadImageFile(item, file);
                        e.target.value = '';
                      }}
                    />
                  </label>

                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Link2 className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={urlDrafts[item.id] ?? ''}
                        onChange={(e) =>
                          setUrlDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        placeholder="Paste image URL..."
                        className="w-full pl-8 pr-2.5 py-2 rounded-xl border border-zinc-200 text-[11px] outline-none focus:border-[#FF4C00]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSaveUrl(item)}
                      disabled={isBusy || !(urlDrafts[item.id] || '').trim()}
                      className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 text-zinc-800 text-[11px] font-bold cursor-pointer shrink-0"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
