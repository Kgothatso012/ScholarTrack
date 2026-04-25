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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTheme } from '../ui-plugin/theme';
import {
  placesService,
  PlacePrediction,
  createPlacesAutocomplete,
} from '../services/PlacesService';

const { colors: C } = getTheme('dark');

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
      style={[styles(C).predictionItem, { borderBottomColor: C.border }]}
      onPress={() => handleSelect(item)}
      accessibilityLabel={item.description}
    >
      <Ionicons name="location" size={18} color={C.primary} style={styles(C).predictionIcon} />
      <View style={styles(C).predictionTextContainer}>
        <Text style={[styles(C).predictionMain]} numberOfLines={1}>
          {item.main_text}
        </Text>
        <Text style={[styles(C).predictionSecondary]} numberOfLines={1}>
          {item.secondary_text}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles(C).container}>
      {label && (
        <Text style={[styles(C).label, { color: C.text }]}>
          {label}
          {required && <Text style={{ color: C.error }}> *</Text>}
        </Text>
      )}

      <View style={styles(C).inputWrapper}>
        <TextInput
          style={[
            styles(C).input,
            {
              backgroundColor: C.card,
              color: C.text,
              borderColor: error ? C.error : C.border,
            },
          ]}
          value={value}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={C.textMuted}
          onFocus={() => value.length >= 2 && setShowDropdown(true)}
          onBlur={() => {
            // Delay hiding to allow tap on prediction
            setTimeout(() => setShowDropdown(false), 200);
          }}
          accessibilityLabel={label || 'Address input'}
        />

        <View style={styles(C).inputIcons}>
          {isSearching && <ActivityIndicator size="small" color={C.primary} />}
          {value.length > 0 && !isSearching && (
            <TouchableOpacity onPress={handleClear} accessibilityLabel="Clear address">
              <Ionicons name="close-circle" size={20} color={C.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {error && <Text style={[styles(C).errorText, { color: C.error }]}>{error}</Text>}

      {selectedCoords && (
        <View style={[styles(C).coordsBadge, { backgroundColor: C.card }]}>
          <Ionicons name="checkmark-circle" size={14} color={C.primary} />
          <Text style={[styles(C).coordsText, { color: C.textMuted }]}>
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
          style={styles(C).modalOverlay}
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            setShowDropdown(false);
          }}
        >
          <View style={[styles(C).dropdown, { backgroundColor: C.card }]}>
            <View style={[styles(C).dropdownHeader, { borderBottomColor: C.border }]}>
              <Text style={[styles(C).dropdownTitle, { color: C.text }]}>
                Select Address
              </Text>
              <TouchableOpacity onPress={() => setShowDropdown(false)}>
                <Ionicons name="close" size={20} color={C.textMuted} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={predictions}
              renderItem={renderPrediction}
              keyExtractor={(item) => item.place_id}
              keyboardShouldPersistTaps="handled"
              style={styles(C).predictionsList}
              ListEmptyComponent={
                <View style={styles(C).emptyContainer}>
                  <Text style={[styles(C).emptyText, { color: C.textMuted }]}>
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

type StyleColors = typeof C;

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
      backgroundColor: COLORS.overlay,
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
      color: COLORS.textMuted,
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