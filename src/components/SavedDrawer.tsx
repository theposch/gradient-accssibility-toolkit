import { FC, useEffect } from 'react';
import { SavedGradient } from '@/utils/storage';

interface Props {
  open: boolean;
  onClose: () => void;
  list: SavedGradient[];
  onLoad: (item: SavedGradient) => void;
  onDelete: (id: string) => void;
}

const SavedDrawer: FC<Props> = ({ open, onClose, list, onLoad, onDelete }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-y-0 right-0 w-80 max-w-sm bg-white shadow-lg transform transition-transform z-50 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
      role="dialog"
      aria-label="Saved Gradients"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="font-medium">Saved Gradients</h2>
        <button type="button" onClick={onClose} className="text-gray-600 hover:text-gray-900">
          ✕
        </button>
      </div>
      <div className="p-4 space-y-4 overflow-y-auto h-full">
        {list.length === 0 ? (
          <p className="text-xs text-gray-500 text-center">No gradients saved yet.</p>
        ) : (
          list.map((item) => (
            <div key={item.id} className="border rounded-md overflow-hidden">
              <div
                className="h-20 flex items-center justify-center text-xs font-semibold select-none"
                style={{ background: item.gradient, color: item.textColor }}
              >
                Preview
              </div>
              <div className="flex items-center justify-between p-2 text-xs">
                <span
                  className={`px-1 rounded ${item.passPct >= 80 ? 'bg-emerald-100 text-emerald-700' : item.passPct >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}
                >
                  {item.passPct}% AA
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onLoad(item);
                      onClose();
                    }}
                    className="px-2 py-1 rounded border text-emerald-700 hover:bg-emerald-50"
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="text-red-500"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SavedDrawer; 