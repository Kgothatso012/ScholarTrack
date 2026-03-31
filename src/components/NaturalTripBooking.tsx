// Natural Language Trip Booking
// Let parents book trips by typing naturally

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { aiService } from '../services/ai';
import { supabase } from '../lib/api';
import { colors } from '../lib/theme';

interface TripDetails {
  pickup?: string;
  dropoff?: string;
  time?: string;
  childName?: string;
}

interface NaturalTripBookingProps {
  parentId: string;
  onBookingComplete?: () => void;
  darkMode?: boolean;
}

export default function NaturalTripBooking({
  parentId,
  onBookingComplete,
  darkMode = false,
}: NaturalTripBookingProps) {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractedDetails, setExtractedDetails] = useState<TripDetails | null>(null);

  const COLORS = darkMode
    ? { bg: '#0a0a0a', card: '#1a1a1a', text: '#fff', textSec: '#888', primary: '#FFB81C', success: '#4CAF50' }
    : { bg: '#f5f5f5', card: '#fff', text: '#333', textSec: '#666', primary: '#000000', success: '#007749' };

  const processBooking = async () => {
    if (!inputText.trim() || loading) return;

    setLoading(true);

    try {
      // Extract trip details using AI
      const details = await aiService.extractTripDetails(inputText);
      setExtractedDetails(details);

      // If we have enough info, confirm booking
      if (details.pickup && details.dropoff && details.childName) {
        Alert.alert(
          'Confirm Booking',
          `Pickup: ${details.pickup}\nDropoff: ${details.dropoff}\nTime: ${details.time || 'TBD'}\nChild: ${details.childName}`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Book Trip',
              onPress: async () => await confirmBooking(details),
            },
          ]
        );
      } else {
        // Ask for missing info
        const missing = [];
        if (!details.pickup) missing.push('pickup location');
        if (!details.dropoff) missing.push('drop-off location');
        if (!details.childName) missing.push('child name');

        Alert.alert(
          'More Info Needed',
          `Please provide: ${missing.join(', ')}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'Failed to process booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmBooking = async (details: TripDetails) => {
    try {
      // Get child ID from name
      const { data: children } = await supabase
        .from('children')
        .select('id, full_name')
        .eq('parent_id', parentId)
        .ilike('full_name', `%${details.childName}%`);

      if (!children?.length) {
        Alert.alert('Error', `Child "${details.childName}" not found. Please add them first.`);
        return;
      }

      // Create trip request
      await supabase.from('trip_requests').insert({
        parent_id: parentId,
        child_id: children[0].id,
        pickup_location: details.pickup,
        dropoff_location: details.dropoff,
        pickup_time: details.time,
        status: 'pending',
      });

      Alert.alert('Success!', 'Trip request submitted. Drivers will respond shortly.');
      setInputText('');
      setExtractedDetails(null);
      onBookingComplete?.();
    } catch (error) {
      console.error('Confirm booking error:', error);
      Alert.alert('Error', 'Failed to create trip request.');
    }
  };

  const examples = [
    'Pick up Thabo from Mamelodi High at 2pm',
    'Take Lesogo from school to 45 Oxford Road at 3:30pm',
    'Book driver for morning pickup at 6am',
  ];

  return (
    <View style={[styles(colors).container, { backgroundColor: COLORS.bg }]}>
      <View style={[styles(colors).header, { backgroundColor: COLORS.primary }]}>
        <Ionicons name="calendar" size={24} color="#fff" />
        <Text style={styles(colors).headerText}>Book a Trip</Text>
      </View>

      <View style={[styles(colors).inputCard, { backgroundColor: COLORS.card }]}>
        <Text style={[styles(colors).label, { color: COLORS.text }]}>
          Describe your trip in plain English:
        </Text>
        
        <TextInput
          style={[styles(colors).input, { backgroundColor: COLORS.bg, color: COLORS.text, borderColor: COLORS.textSec }]}
          placeholder="e.g., Pick up my child from school at 2pm"
          placeholderTextColor={COLORS.textSec}
          value={inputText}
          onChangeText={setInputText}
          multiline
          numberOfLines={3}
          accessibilityLabel="Trip description"
          accessibilityHint="Describe your trip request naturally"
        />

        <TouchableOpacity
          style={[styles(colors).button, { backgroundColor: COLORS.primary }]}
          onPress={processBooking}
          disabled={loading || !inputText.trim()}
          accessibilityLabel="Book trip"
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles(colors).buttonText}>Book Trip</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {extractedDetails && (
        <View style={[styles(colors).preview, { backgroundColor: COLORS.card }]}>
          <Text style={[styles(colors).previewTitle, { color: COLORS.text }]}>Detected:</Text>
          {extractedDetails.pickup && (
            <Text style={{ color: COLORS.textSec }}><Ionicons name="location" size={14} color={COLORS.textSec} /> Pickup: {extractedDetails.pickup}</Text>
          )}
          {extractedDetails.dropoff && (
            <Text style={{ color: COLORS.textSec }}><Ionicons name="flag" size={14} color={COLORS.textSec} /> Dropoff: {extractedDetails.dropoff}</Text>
          )}
          {extractedDetails.time && (
            <Text style={{ color: COLORS.textSec }}><Ionicons name="time" size={14} color={COLORS.textSec} /> Time: {extractedDetails.time}</Text>
          )}
          {extractedDetails.childName && (
            <Text style={{ color: COLORS.textSec }}><Ionicons name="person" size={14} color={COLORS.textSec} /> Child: {extractedDetails.childName}</Text>
          )}
        </View>
      )}

      <View style={styles(colors).examples}>
        <Text style={[styles(colors).examplesTitle, { color: COLORS.textSec }]}>Try saying:</Text>
        {examples.map((example, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setInputText(example)}
            style={[styles(colors).exampleChip, { backgroundColor: COLORS.card }]}
          >
            <Text style={{ color: COLORS.primary, fontSize: 12 }}>{example}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  inputCard: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  preview: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  examples: {
    padding: 16,
  },
  examplesTitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  exampleChip: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
});
