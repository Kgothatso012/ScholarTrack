// Google Places Address Input Component
// Autocomplete addresses with Google Places API

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Modal,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors as themeColors } from '../lib/theme';
import type { ThemeColors } from '../context/ThemeContext';
import {
  placesService,
  PlacePrediction,
  createPlacesAutocomplete,
} from '../services/PlacesService';

interface AddressInputProps {
  value: string;
  onChangeText?: (text: string) => void;
  onSelect: (address: string, placeId: string, coords?: { lat: number; lng: number }) => void;
  placeholder?: string;
  label?: string;
  darkMode?: boolean;
  required?: boolean;
  error?: string;
}

export default function AddressInput({
  value,
  onChangeText,
  onSelect,
  placeholder = 'Start typing address...',
  label,
  darkMode = false,
  required = false,
  error,
}: AddressInputProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  const autocomplete = useRef(createPlacesAutocomplete()).current;
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const COLORS = darkMode
    ? { bg: '#0a0a0a', card: '#1a1a1a', text: '#fff', textSec: '#888', primary: '#FFB81C', border: '#333', error: '#ff6b6b' }
    : { bg: '#f5f5f5', card: '#fff', text: '#333', textSec: '#666', primary: '#007749', border: '#ddd', error: '#dc3545' };

  const handleTextChange = useCallback(
    async (text: string) => {
      onChangeText?.(text);
      setSelectedCoords(null);

      if (text.length < 2) {
        setPredictions([]);
        setShowDropdown(false);
        return;
      }

      // Debounce search
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      debounceTimeout.current = setTimeout(async () => {
        setIsSearching(true);
        setShowDropdown(true);

        try {
          const results = await autocomplete.search(text);
          setPredictions(results);
        } catch (error) {
          console.error('Address search error:', error);
          setPredictions([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    },
    [autocomplete, onChangeText]
  );

  const handleSelect = useCallback(
    async (prediction: PlacePrediction) => {
      Keyboard.dismiss();
      setIsSearching(true);
      setShowDropdown(false);

      try {
        // Get coordinates from place details
        const details = await autocomplete.getDetails(prediction.place_id);

        const coords = details
          ? { lat: details.latitude, lng: details.longitude }
          : undefined;

        setSelectedCoords(coords || null);
        onSelect(prediction.description, prediction.place_id, coords);
      } catch (error) {
        console.error('Error getting place details:', error);
        // Fallback: just pass the description
        onSelect(prediction.description, prediction.place_id);
      } finally {
        setIsSearching(false);
        setPredictions([]);
      }
    },
    [autocomplete, onSelect]
  );

  const handleClear = useCallback(() => {
    onChangeText?.('');
    setPredictions([]);
    setShowDropdown(false);
    setSelectedCoords(null);
  }, [onChangeText]);

  const renderPrediction = ({ item }: { item: PlacePrediction }) => (
    <TouchableOpacity
      style={[styles(COLORS).predictionItem, { borderBottomColor: COLORS.border }]}
      onPress={() => handleSelect(item)}
      accessibilityLabel={item.description}
    >
      <Ionicons name="location" size={18} color={COLORS.primary} style={styles(COLORS).predictionIcon} />
      <View style={styles(COLORS).predictionTextContainer}>
        <Text style={[styles(COLORS).predictionMain]} numberOfLines={1}>
          {item.main_text}
        </Text>
        <Text style={[styles(COLORS).predictionSecondary]} numberOfLines={1}>
          {item.secondary_text}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles(COLORS).container}>
      {label && (
        <Text style={[styles(COLORS).label, { color: COLORS.text }]}>
          {label}
          {required && <Text style={{ color: COLORS.error }}> *</Text>}
        </Text>
      )}

      <View style={styles(COLORS).inputWrapper}>
        <TextInput
          style={[
            styles(COLORS).input,
            {
              backgroundColor: COLORS.card,
              color: COLORS.text,
              borderColor: error ? COLORS.error : COLORS.border,
            },
          ]}
          value={value}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSec}
          onFocus={() => value.length >= 2 && setShowDropdown(true)}
          onBlur={() => {
            // Delay hiding to allow tap on prediction
            setTimeout(() => setShowDropdown(false), 200);
          }}
          accessibilityLabel={label || 'Address input'}
        />

        <View style={styles(COLORS).inputIcons}>
          {isSearching && <ActivityIndicator size="small" color={COLORS.primary} />}
          {value.length > 0 && !isSearching && (
            <TouchableOpacity onPress={handleClear} accessibilityLabel="Clear address">
              <Ionicons name="close-circle" size={20} color={COLORS.textSec} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {error && <Text style={[styles(COLORS).errorText, { color: COLORS.error }]}>{error}</Text>}

      {selectedCoords && (
        <View style={[styles(COLORS).coordsBadge, { backgroundColor: COLORS.card }]}>
          <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
          <Text style={[styles(COLORS).coordsText, { color: COLORS.textSec }]}>
            Location verified
          </Text>
        </View>
      )}

      <Modal
        visible={showDropdown && predictions.length > 0}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableOpacity
          style={styles(COLORS).modalOverlay}
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            setShowDropdown(false);
          }}
        >
          <View style={[styles(COLORS).dropdown, { backgroundColor: COLORS.card }]}>
            <View style={[styles(COLORS).dropdownHeader, { borderBottomColor: COLORS.border }]}>
              <Text style={[styles(COLORS).dropdownTitle, { color: COLORS.text }]}>
                Select Address
              </Text>
              <TouchableOpacity onPress={() => setShowDropdown(false)}>
                <Ionicons name="close" size={20} color={COLORS.textSec} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={predictions}
              renderItem={renderPrediction}
              keyExtractor={(item) => item.place_id}
              keyboardShouldPersistTaps="handled"
              style={styles(COLORS).predictionsList}
              ListEmptyComponent={
                <View style={styles(COLORS).emptyContainer}>
                  <Text style={[styles(COLORS).emptyText, { color: COLORS.textSec }]}>
                    No addresses found
                  </Text>
                </View>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

type StyleColors = {
  bg: string;
  card: string;
  text: string;
  textSec: string;
  primary: string;
  border: string;
  error: string;
};

const styles = (COLORS: StyleColors) =>
  StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 12,
      padding: 14,
      paddingRight: 40,
      fontSize: 15,
    },
    inputIcons: {
      position: 'absolute',
      right: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    errorText: {
      fontSize: 12,
      marginTop: 4,
    },
    coordsBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      alignSelf: 'flex-start',
      gap: 4,
    },
    coordsText: {
      fontSize: 11,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-start',
      backgroundColor: 'rgba(0,0,0,0.4)',
      paddingTop: 120,
    },
    dropdown: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '60%',
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
    },
    dropdownHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
    },
    dropdownTitle: {
      fontSize: 16,
      fontWeight: '600',
    },
    predictionsList: {
      maxHeight: 400,
    },
    predictionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderBottomWidth: 1,
    },
    predictionIcon: {
      marginRight: 12,
    },
    predictionTextContainer: {
      flex: 1,
    },
    predictionMain: {
      fontSize: 14,
      fontWeight: '500',
      color: COLORS.text,
    },
    predictionSecondary: {
      fontSize: 12,
      color: COLORS.textSec,
      marginTop: 2,
    },
    emptyContainer: {
      padding: 24,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
    },
  });
