// Calendar Component - Trip schedule view for ScholarTrack

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

interface TripEvent {
  id: string;
  date: Date;
  time: string;
  type: 'pickup' | 'dropoff' | 'trip';
  childName: string;
  status: 'scheduled' | 'completed' | 'in-progress';
}

interface CalendarProps {
  onDateSelect?: (date: Date) => void;
  trips?: TripEvent[];
}

export const Calendar: React.FC<CalendarProps> = ({ onDateSelect, trips = [] }) => {
  const { colors } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days: (number | null)[] = [];

    // Empty days before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const hasTripOnDay = (day: number): boolean => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return trips.some(trip => {
      const tripDate = new Date(trip.date);
      return tripDate.toDateString() === date.toDateString();
    });
  };

  const isToday = (day: number): boolean => {
    const today = new Date();
    return day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (day: number): boolean => {
    return day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayPress = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
    onDateSelect?.(newDate);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevMonth}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.monthTitle, { color: colors.text }]}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>
        <TouchableOpacity onPress={handleNextMonth}>
          <Ionicons name="chevron-forward" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Day names */}
      <View style={styles.dayNames}>
        {dayNames.map((name, index) => (
          <Text key={index} style={[styles.dayName, { color: colors.textSecondary }]}>
            {name}
          </Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {generateCalendarDays().map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayCell,
              day !== null && isSelected(day) ? { backgroundColor: colors.primary } : null,
              day !== null && !isSelected(day) && isToday(day) ? { borderColor: colors.primary, borderWidth: 2 } : null,
            ]}
            onPress={() => day && handleDayPress(day)}
            disabled={!day}
          >
            {day && (
              <>
                <Text
                  style={[
                    styles.dayText,
                    { color: isSelected(day) ? colors.textInverse : colors.text },
                    isToday(day) && { fontWeight: 'bold' },
                  ]}
                >
                  {day}
                </Text>
                {hasTripOnDay(day) && (
                  <View
                    style={[
                      styles.tripDot,
                      { backgroundColor: isSelected(day) ? colors.textInverse : colors.accent },
                    ]}
                  />
                )}
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  monthTitle: {
    ...typography.h4,
    fontWeight: '600',
  },
  dayNames: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  dayName: {
    ...typography.caption,
    width: '14%',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.full,
  },
  dayText: {
    ...typography.body,
  },
  tripDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 4,
  },
});

export default Calendar;