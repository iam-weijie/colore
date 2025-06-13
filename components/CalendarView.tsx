import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isBefore, 
  isAfter, 
  isToday,
  addDays,
  addWeeks
} from 'date-fns';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarViewProps {
  onDateSelect: (date: Date) => void;
  color?: string;
  selectedDate?: Date | null;
  startDate?: Date;
}

const CalendarView = ({ onDateSelect, color = "#C2BFFF", selectedDate: propSelectedDate, startDate = new Date() }: CalendarViewProps) => {
  const today = startDate;
  const [currentMonth, setCurrentMonth] = useState(startDate);
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date | null>(null);
  const [showQuickSelect, setShowQuickSelect] = useState(false);

  // Sync with prop selectedDate
  useEffect(() => {
    if (propSelectedDate) {
      setInternalSelectedDate(propSelectedDate);
      setCurrentMonth(propSelectedDate);
    }
  }, [propSelectedDate]);

  const oneYearFromToday = new Date(today);
  oneYearFromToday.setFullYear(today.getFullYear() + 1);

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const handleDateSelect = (date: Date) => {
    setInternalSelectedDate(date);
    onDateSelect(date);
    setShowQuickSelect(false);
  };

  const handleQuickSelect = (daysToAdd: number) => {
    const newDate = addDays(today, daysToAdd);
    handleDateSelect(newDate);
    setCurrentMonth(newDate);
  };

  const handleMonthChange = (newMonth: Date) => {
    setCurrentMonth(newMonth);
    // Reset selection if the selected date is not in the new month
    if (internalSelectedDate && !isSameMonth(internalSelectedDate, newMonth)) {
      setInternalSelectedDate(null);
    }
  };

  const isSameMonth = (date1: Date, date2: Date) => {
    return date1.getMonth() === date2.getMonth() && 
           date1.getFullYear() === date2.getFullYear();
  };

  // Handle swipe gestures
  const onSwipeGesture = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      const swipeThreshold = 50; // Minimum distance for swipe
      
      if (translationX > swipeThreshold) {
        // Swipe right - go to previous month
        handleMonthChange(subMonths(currentMonth, 1));
      } else if (translationX < -swipeThreshold) {
        // Swipe left - go to next month
        handleMonthChange(addMonths(currentMonth, 1));
      }
    }
  };

  const renderHeader = () => (
    <View className="flex-row justify-between items-center px-4 py-2">
      <View className="flex-row">
        <TouchableOpacity onPress={() => handleMonthChange(subMonths(currentMonth, 1))}>
          <Text className="text-lg">{'<'}</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold mx-4">{format(currentMonth, 'MMMM yyyy')}</Text>
        <TouchableOpacity onPress={() => handleMonthChange(addMonths(currentMonth, 1))}>
          <Text className="text-lg">{'>'}</Text>
        </TouchableOpacity>
      </View>
      
      <View className="relative">
        <TouchableOpacity onPress={() => setShowQuickSelect(!showQuickSelect)}>
          <Text 
            className="font-semibold"
            style={{ color: color }}
          >
            Quick Select
          </Text>
        </TouchableOpacity>
        
        {showQuickSelect && (
          <View className="absolute right-0 top-6 bg-white rounded-[16px] p-2 z-10 w-24" style={{
             shadowColor: '#C1C1C1',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 7,
        elevation: 5,
          }}>
            <TouchableOpacity 
              className="py-1 px-2" 
              onPress={() => handleQuickSelect(1)}
            >
              <Text>1 Day</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="py-1 px-2" 
              onPress={() => handleQuickSelect(3)}
            >
              <Text>3 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="py-1 px-2" 
              onPress={() => handleQuickSelect(7)}
            >
              <Text>1 Week</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderDaysOfWeek = () => (
    <View className="flex-row justify-between px-2">
      {daysOfWeek.map((day) => (
        <Text key={day} className="text-center w-10 text-xs text-gray-500">{day}</Text>
      ))}
    </View>
  );

  const renderDates = () => {
    const offset = startOfMonth(currentMonth).getDay();
    const days = Array(offset).fill(null).concat(monthDays);

    return (
      <FlatList
        data={days}
        numColumns={7}
        keyExtractor={(_, index) => index.toString()}
        scrollEnabled={false}
        renderItem={({ item }) => {
          if (!item) return <View className="w-10 h-10 m-1" />;
          
          // Updated: Disable dates BEFORE today (not including today)
          const disabled = isBefore(item, today) || isAfter(item, oneYearFromToday);
          const isSelected = internalSelectedDate && isSameDay(item, internalSelectedDate);
          const isCurrentDay = isToday(item);
          
          return (
            <TouchableOpacity
              className={`w-10 h-10 m-1 rounded-full items-center justify-center ${
                isSelected ? 'bg-transparent' :
                isCurrentDay ? 'border bg-white' : 'bg-white'
              } ${disabled ? 'opacity-20' : ''}`}
              style={{
                backgroundColor: isSelected ? color : undefined,
                borderColor: isCurrentDay && !isSelected ? color : 'transparent',
                borderWidth: isCurrentDay && !isSelected ? 1 : 0,
              }}
              disabled={disabled}
              onPress={() => handleDateSelect(item)}
            >
              <Text 
                className={`text-sm ${
                  isSelected ? 'text-white font-bold' :
                  isCurrentDay ? 'font-medium' : 'text-black'
                }`}
                style={{
                  color: isSelected ? 'white' : isCurrentDay ? color : 'black'
                }}
              >
                {item.getDate()}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    );
  };

  return (
    <View className="bg-white p-4 rounded-[32px] my-4"
      style={{
        shadowColor: '#C1C1C1',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 7,
        elevation: 5,
      }}>
      {renderHeader()}
      {renderDaysOfWeek()}
      <PanGestureHandler onHandlerStateChange={onSwipeGesture}>
        <View className="mt-2">
          {renderDates()}
        </View>
      </PanGestureHandler>
    </View>
  );
};

export default CalendarView;