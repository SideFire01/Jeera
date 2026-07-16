
import React from 'react';

interface CalendarPickerProps {
  selectedDate?: string;
  onSelect: (date: string) => void;
  onClose: () => void;
  darkMode: boolean;
}

const CalendarPicker: React.FC<CalendarPickerProps> = ({ selectedDate, onSelect, onClose, darkMode }) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = React.useState(today.getMonth());
  const [currentYear, setCurrentYear] = React.useState(today.getFullYear());

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDate = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    onSelect(date.toISOString());
  };

  return (
    <div className={`p-4 rounded-xl shadow-2xl border w-64 ${darkMode ? 'bg-[#1D2125] border-[#38414a] text-[#B6C2CF]' : 'bg-white border-slate-200 text-slate-800'}`}>
      <div className="flex justify-between items-center mb-4">
        <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-bold">
          {new Date(currentYear, currentMonth).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </span>
        <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
          <span key={day} className="text-[10px] font-bold opacity-50">{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const date = new Date(currentYear, currentMonth, day);
          const isSelected = selectedDate && new Date(selectedDate).toDateString() === date.toDateString();
          const isToday = date.toDateString() === today.toDateString();

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleSelectDate(day)}
              className={`h-8 w-8 rounded-full text-xs font-medium transition-all ${
                isSelected 
                  ? (darkMode ? 'bg-[#0C66E4] text-white' : 'bg-blue-600 text-white')
                  : isToday
                    ? (darkMode ? 'bg-[#0C66E4]/20 text-[#579DFF]' : 'bg-blue-50 text-blue-600')
                    : (darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-100')
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarPicker;
