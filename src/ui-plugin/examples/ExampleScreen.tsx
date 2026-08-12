// MalumeScholarTrack UI Plugin - Example Usage
// Demonstrates how to use the Soft & Friendly UI components

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  theme,
  colors,
  spacing,
  Button,
  Card,
  Input,
  Avatar,
  Badge,
  IconButton,
  Spacer,
  Divider,
  Header,
  Spinner,
  EmptyState,
} from '../index';

const ExampleScreen = () => {
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleButtonPress = (variant: string) => {
    Alert.alert('Button Pressed', `You pressed the ${variant} button!`);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles(colors).container} edges={['top']}>
        <Header
          title="MalumeMalumeScholarTrack"
          subtitle="UI Plugin Demo"
          leftIcon="menu-outline"
          rightIcon="notifications-outline"
          onLeftPress={() => Alert.alert('Menu')}
          onRightPress={() => Alert.alert('Notifications')}
        />

        <ScrollView
          style={styles(colors).scrollView}
          contentContainerStyle={styles(colors).content}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section */}
          <Text style={styles(colors).sectionTitle}>Avatars</Text>
          <View style={styles(colors).row}>
            <Avatar name="John Doe" size="small" />
            <Avatar name="Sarah Smith" size="medium" />
            <Avatar name="Mike Johnson" size="large" />
            <Avatar name="Emma Wilson" size="xlarge" badge badgeColor={colors.success} />
          </View>

          <Divider spacing={spacing.lg} />

          {/* Buttons Section */}
          <Text style={styles(colors).sectionTitle}>Buttons</Text>
          <View style={styles(colors).section}>
            <Button
              title="Primary"
              onPress={() => handleButtonPress('primary')}
              variant="primary"
            />
            <Spacer size="sm" />
            <Button
              title="Secondary"
              onPress={() => handleButtonPress('secondary')}
              variant="secondary"
            />
            <Spacer size="sm" />
            <Button
              title="Outline"
              onPress={() => handleButtonPress('outline')}
              variant="outline"
            />
            <Spacer size="sm" />
            <Button
              title="Danger"
              onPress={() => handleButtonPress('danger')}
              variant="danger"
            />
            <Spacer size="sm" />
            <Button
              title="Loading..."
              onPress={() => setLoading(!loading)}
              variant="primary"
              loading={loading}
            />
          </View>

          <Divider spacing={spacing.lg} />

          {/* Badges Section */}
          <Text style={styles(colors).sectionTitle}>Badges</Text>
          <View style={styles(colors).row}>
            <Badge label="Active" variant="success" />
            <Badge label="Pending" variant="warning" />
            <Badge label="Cancelled" variant="neutral" />
            <Badge label="New" variant="primary" shape="pill" />
          </View>

          <Divider spacing={spacing.lg} />

          {/* Card Section */}
          <Text style={styles(colors).sectionTitle}>Cards</Text>
          <Card variant="elevated" padding="medium">
            <Text style={styles(colors).cardTitle}>Trip Information</Text>
            <Text style={styles(colors).cardBody}>
              Your child is currently on the bus. Estimated arrival: 3:45 PM
            </Text>
            <Spacer size="sm" />
            <Button
              title="Track Live"
              onPress={() => Alert.alert('Tracking')}
              variant="primary"
              size="small"
            />
          </Card>

          <Spacer size="lg" />

          <Card variant="outlined" padding="medium">
            <Text style={styles(colors).cardTitle}>Payment Status</Text>
            <Text style={styles(colors).cardBody}>March 2026 - R450.00 - Paid</Text>
          </Card>

          <Spacer size="lg" />

          <Card variant="soft" padding="medium">
            <Text style={styles(colors).cardTitle}>Driver Update</Text>
            <Text style={styles(colors).cardBody}>Driver John is running 5 minutes late</Text>
          </Card>

          <Divider spacing={spacing.lg} />

          {/* Input Section */}
          <Text style={styles(colors).sectionTitle}>Inputs</Text>
          <Input
            label="Email Address"
            placeholder="parent@example.com"
            leftIcon="mail-outline"
            value={inputValue}
            onChangeText={setInputValue}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Password"
            placeholder="Enter your password"
            leftIcon="lock-closed-outline"
            rightIcon="eye-outline"
            onRightIconPress={() => Alert.alert('Toggle password')}
            secureTextEntry
          />
          <Input
            label="Phone Number"
            placeholder="+27 82 123 4567"
            leftIcon="call-outline"
            keyboardType="phone-pad"
            error="Please enter a valid phone number"
          />

          <Divider spacing={spacing.lg} />

          {/* Icon Buttons */}
          <Text style={styles(colors).sectionTitle}>Icon Buttons</Text>
          <View style={styles(colors).row}>
            <IconButton
              icon="add-circle"
              onPress={() => Alert.alert('Add')}
              variant="primary"
              accessibilityLabel="Add item"
            />
            <IconButton
              icon="remove-circle"
              onPress={() => Alert.alert('Remove')}
              variant="danger"
              accessibilityLabel="Remove item"
            />
            <IconButton
              icon="settings"
              onPress={() => Alert.alert('Settings')}
              variant="default"
              outlined
              accessibilityLabel="Settings"
            />
            <IconButton
              icon="heart"
              onPress={() => Alert.alert('Favorite')}
              variant="ghost"
              accessibilityLabel="Add to favorites"
            />
          </View>

          <Divider spacing={spacing.lg} />

          {/* Empty State */}
          <Text style={styles(colors).sectionTitle}>Empty State</Text>
          <EmptyState
            icon="bus-outline"
            title="No Trips Found"
            description="You haven't booked any trips yet. Start by booking your first trip."
            actionLabel="Book a Trip"
            onAction={() => Alert.alert('Book Trip')}
          />

          <Spacer size="huge" />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  section: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardBody: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default ExampleScreen;
