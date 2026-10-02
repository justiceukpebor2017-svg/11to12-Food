import React, { useState } from 'react';
import { AdminAnnouncement } from '../../types';
import { Megaphone, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface AnnouncementsManagerProps {
  announcements: AdminAnnouncement[];
  onAddAnnouncement: (ann: AdminAnnouncement) => void;
  onDeleteAnnouncement: (id: string) => void;
}

export const AnnouncementsManager: React.FC<AnnouncementsManagerProps> = ({
  announcements,
  onAddAnnouncement,
  onDeleteAnnouncement,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<AdminAnnouncement['type']>('warning');

  const handlePostBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    const newAnn: AdminAnnouncement = {
      id: `ann-${Date.now()}`,
      title: title.trim(),
      message: message.trim(),
      type,
      active: true,
      postedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today',
    };

    onAddAnnouncement(newAnn);
    setTitle('');
    setMessage('');
    setIsModalOpen(false);
  };

  return (
    <div className="bg-white border-4 border-black text-black p-6 shadow-[8px_8px_0px_#000] space-y-4">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-3 border-black">
        <div>
          <h4 className="text-xl font-black uppercase font-heading text-black flex items-center space-x-2">
            <Megaphone className="w-6 h-6 text-[#FF4C00] stroke-[3]" />
            <span>ADMIN MEGAPHONE BROADCAST MANAGER</span>
          </h4>
          <p className="text-xs font-bold text-zinc-700 mt-1 uppercase tracking-wider">
            Post priority updates (traffic alerts, holiday notices) live to all subscriber desks.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-3 bg-[#FF4C00] hover:bg-[#e04300] text-white font-black text-xs uppercase border-3 border-black shadow-[3px_3px_0px_#000] cursor-pointer transition-all flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>NEW BROADCAST</span>
        </button>
      </div>

      <div className="space-y-3">
        {announcements.map((ann) => (
          <div
            key={ann.id}
            className="bg-[#F8F8F8] p-4 border-3 border-black flex items-center justify-between gap-4 shadow-[4px_4px_0px_#000]"
          >
            <div>
              <div className="flex items-center space-x-2">
                <span className={`px-2.5 py-1 text-[10px] font-black uppercase border-2 border-black font-mono-custom shadow-[1px_1px_0px_#000] ${
                  ann.type === 'warning' ? 'bg-[#FF4C00] text-white' : 'bg-[#FACC15] text-black'
                }`}>
                  {ann.type}
                </span>
                <span className="text-xs font-black uppercase text-black">{ann.title}</span>
                <span className="text-[10px] text-zinc-600 font-mono-custom font-bold">• {ann.postedAt}</span>
              </div>
              <p className="text-xs font-bold text-zinc-800 mt-1 uppercase">{ann.message}</p>
            </div>

            <button
              onClick={() => onDeleteAnnouncement(ann.id)}
              className="p-2.5 bg-[#FF4C00] hover:bg-[#e04300] text-white border-2 border-black cursor-pointer shadow-[2px_2px_0px_#000] transition-all"
              title="Delete Broadcast"
            >
              <Trash2 className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        ))}
      </div>

      {/* New Broadcast Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <form onSubmit={handlePostBroadcast} className="bg-white border-4 border-black p-6 max-w-lg w-full text-black space-y-4 shadow-[12px_12px_0px_#000]">
            <h4 className="text-xl font-black uppercase font-heading text-black">PUBLISH GLOBAL MEGAPHONE BROADCAST</h4>

            <div>
              <label className="block text-xs font-black uppercase font-mono-custom text-black mb-1">Broadcast Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Rain Traffic Alert: 15-Minute Delivery Window Shift"
                className="w-full bg-[#F8F8F8] border-3 border-black p-3 text-xs font-bold text-black focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase font-mono-custom text-black mb-1">Alert Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-[#F8F8F8] border-3 border-black p-3 text-xs font-black text-black focus:outline-none uppercase"
              >
                <option value="warning">WARNING / DISPATCH DELAY</option>
                <option value="info">GENERAL INFO / HOLIDAY NOTICE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase font-mono-custom text-black mb-1">Broadcast Content</label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Write message to display at the top of all user dashboards..."
                className="w-full bg-[#F8F8F8] border-3 border-black p-3 text-xs font-bold text-black focus:outline-none focus:bg-white"
              />
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
                BROADCAST NOW
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

