import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Star,
  Sparkles,
  Building,
  User,
  Quote,
  Search,
} from 'lucide-react';
import { TestimonialItem } from '../../types';

interface TestimonialsManagerProps {
  testimonials: TestimonialItem[];
  onAddTestimonial: (item: Omit<TestimonialItem, 'id'>) => Promise<TestimonialItem | void>;
  onUpdateTestimonial: (id: string, patch: Partial<TestimonialItem>) => Promise<TestimonialItem | null | void>;
  onDeleteTestimonial: (id: string) => Promise<boolean | void>;
}

export const TestimonialsManager: React.FC<TestimonialsManagerProps> = ({
  testimonials = [],
  onAddTestimonial,
  onUpdateTestimonial,
  onDeleteTestimonial,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TestimonialItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [officeLocation, setOfficeLocation] = useState('Victoria Island');
  const [text, setText] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<TestimonialItem | null>(null);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setName('');
    setRole('');
    setCompany('');
    setOfficeLocation('Victoria Island');
    setText('');
    setRating(5);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: TestimonialItem) => {
    setEditingItem(item);
    setName(item.name);
    setRole(item.role);
    setCompany(item.company || '');
    setOfficeLocation(item.officeLocation || 'Victoria Island');
    setText(item.text);
    setRating(item.rating || 5);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await onUpdateTestimonial(editingItem.id, {
          name: name.trim(),
          role: role.trim(),
          company: company.trim(),
          officeLocation: officeLocation.trim(),
          text: text.trim(),
          rating,
        });
      } else {
        await onAddTestimonial({
          name: name.trim(),
          role: role.trim(),
          company: company.trim(),
          officeLocation: officeLocation.trim(),
          text: text.trim(),
          rating,
          featured: true,
          date: new Date().toISOString().split('T')[0],
        });
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    await onDeleteTestimonial(itemToDelete.id);
    setItemToDelete(null);
  };

  const filtered = testimonials.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.company && t.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.officeLocation && t.officeLocation.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 text-left font-['Poppins']">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#FF4C00] bg-[#FF4C00]/10 border border-[#FF4C00]/20 px-3 py-1 rounded-full">
            Admin Feedback Management
          </span>
          <h2 className="text-2xl font-black text-zinc-900 mt-2">
            Website Testimonials
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Manage subscriber reviews displayed across the landing page. Per policy, images are omitted for verified privacy.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs transition cursor-pointer flex items-center space-x-2 shadow-xs shrink-0 self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Testimonial</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-3 shadow-xs flex items-center space-x-3">
        <Search className="w-4 h-4 text-zinc-400 ml-2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search testimonials by subscriber name, office location, or quote..."
          className="w-full text-xs font-medium text-zinc-900 bg-transparent focus:outline-none placeholder-zinc-400"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="text-xs text-zinc-400 hover:text-black mr-2 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Testimonials List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const initials = item.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          return (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-zinc-200 p-5 shadow-xs flex flex-col justify-between hover:border-[#FF4C00]/40 transition group"
            >
              <div>
                {/* Header row with star rating and actions */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-1 text-[#FF4C00]">
                    {[...Array(item.rating || 5)].map((_, idx) => (
                      <Star key={idx} className="w-3.5 h-3.5 fill-[#FF4C00]" />
                    ))}
                  </div>

                  <div className="flex items-center space-x-1.5 opacity-90 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-[#FF4C00] hover:bg-orange-50 transition cursor-pointer"
                      title="Edit Testimonial"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemToDelete(item)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Delete Testimonial"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Review Text */}
                <p className="text-zinc-700 text-xs leading-relaxed italic mb-4">
                  "{item.text}"
                </p>
              </div>

              {/* Author badge (No image - strictly initials + text) */}
              <div className="pt-3 border-t border-zinc-100 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                  {initials || '11'}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-zinc-900 truncate">{item.name}</h4>
                  <p className="text-[11px] text-zinc-500 truncate">
                    {item.role}{item.company ? ` • ${item.company}` : ''}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-dashed border-zinc-300">
            <Quote className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-zinc-600">No testimonials found</p>
            <p className="text-xs text-zinc-400 mt-1">Click "Add New Testimonial" above to add the first subscriber review.</p>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 text-left animate-in fade-in zoom-in duration-150">
            
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
              <div>
                <h3 className="text-base font-black text-black">
                  {editingItem ? 'Edit Testimonial' : 'Add New Testimonial'}
                </h3>
                <p className="text-xs text-zinc-500">Live preview on 11 to 12 homepage</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Subscriber Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tolu Adebayo"
                  className="w-full text-xs font-medium p-3 rounded-xl border border-zinc-300 focus:border-[#FF4C00] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Role / Designation</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Operations Manager"
                    className="w-full text-xs font-medium p-3 rounded-xl border border-zinc-300 focus:border-[#FF4C00] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Company / Building</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Paystack, VI"
                    className="w-full text-xs font-medium p-3 rounded-xl border border-zinc-300 focus:border-[#FF4C00] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Office Location</label>
                <select
                  value={officeLocation}
                  onChange={(e) => setOfficeLocation(e.target.value)}
                  className="w-full text-xs font-medium p-3 rounded-xl border border-zinc-300 focus:border-[#FF4C00] focus:outline-none bg-white"
                >
                  <option value="Victoria Island">Victoria Island</option>
                  <option value="Ikoyi">Ikoyi</option>
                  <option value="Marina">Marina</option>
                  <option value="Lekki Phase 1">Lekki Phase 1</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Testimonial Quote *</label>
                <textarea
                  required
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Write the subscriber's review of desk drop lunches, swallow choices, or delivery timing..."
                  className="w-full text-xs font-medium p-3 rounded-xl border border-zinc-300 focus:border-[#FF4C00] focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Star Rating</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          s <= rating ? 'text-[#FF4C00] fill-[#FF4C00]' : 'text-zinc-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-zinc-600 ml-2">{rating} Stars</span>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-full border border-zinc-300 text-zinc-700 hover:bg-zinc-100 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-full bg-[#FF4C00] hover:bg-[#E04300] text-white font-bold text-xs cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Publish Testimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white rounded-3xl border border-red-200 shadow-2xl p-6 text-left animate-in fade-in zoom-in duration-150">
            <div className="p-3 bg-red-100 text-red-600 rounded-2xl w-fit mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-black">Delete Testimonial?</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Are you sure you want to remove the testimonial from <strong>{itemToDelete.name}</strong>? It will immediately disappear from the homepage.
            </p>

            <div className="mt-5 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-full border border-zinc-300 text-zinc-700 text-xs font-bold cursor-pointer hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
