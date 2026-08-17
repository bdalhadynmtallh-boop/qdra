import React, { useState } from "react";

interface TimeSelectionModalProps {
  isOpen: boolean;
  sectionTitle: string;
  onClose: () => void;
  onStart: (timeLimit: number | null) => void;
}

export const TimeSelectionModal: React.FC<TimeSelectionModalProps> = ({
  isOpen,
  sectionTitle,
  onClose,
  onStart,
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(5);
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState<string>("");

  if (!isOpen) return null;

  const handleStart = () => {
    if (isCustom) {
      const parsed = parseInt(customValue, 10);
      onStart(isNaN(parsed) || parsed <= 0 ? null : parsed);
    } else {
      onStart(selectedMinutes);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-right dir-rtl animate-fade-in">
        <h3 className="text-xl font-extrabold text-gray-800 mb-1">تخصيص الوقت - {sectionTitle}</h3>
        <p className="text-xs text-gray-500 mb-5">اختر طريقة حساب الوقت المناسبة لتدريبك قبل البدء:</p>

        {/* خيارات الوقت */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => { setSelectedMinutes(5); setIsCustom(false); }}
            className={`p-3 rounded-xl border text-sm font-bold transition-all ${
              !isCustom && selectedMinutes === 5
                ? 'border-amber-500 bg-amber-50 text-amber-600'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            5 دقائق
          </button>

          <button
            onClick={() => { setSelectedMinutes(10); setIsCustom(false); }}
            className={`p-3 rounded-xl border text-sm font-bold transition-all ${
              !isCustom && selectedMinutes === 10
                ? 'border-amber-500 bg-amber-50 text-amber-600'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            10 دقائق
          </button>

          <button
            onClick={() => { setSelectedMinutes(null); setIsCustom(false); }}
            className={`p-3 rounded-xl border text-sm font-bold transition-all ${
              !isCustom && selectedMinutes === null
                ? 'border-amber-500 bg-amber-50 text-amber-600'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            بدون وقت محدّد
          </button>

          <button
            onClick={() => setIsCustom(true)}
            className={`p-3 rounded-xl border text-sm font-bold transition-all ${
              isCustom
                ? 'border-amber-500 bg-amber-50 text-amber-600'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            مخصص
          </button>
        </div>

        {/* حقل الدخل في حال اختيار وقت مخصص */}
        {isCustom && (
          <div className="mb-5 animate-fade-in">
            <label className="block text-xs font-bold text-gray-600 mb-1.5">أدخل الوقت بالدقائق:</label>
            <input
              type="number"
              min="1"
              max="180"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder="مثال: 20"
              className="w-full rounded-xl border border-gray-300 p-2.5 text-sm text-gray-800 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>
        )}

        {/* أزرار التشغيل والبدء */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleStart}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95"
          >
            بدء الاختبار
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};