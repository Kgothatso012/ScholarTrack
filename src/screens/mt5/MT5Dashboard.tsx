import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = { primary: '#000000', accent: '#FFB81C', white: '#FFFFFF', darkBg: '#0A0A0A', cardBg: '#1A1A1A', green: '#00C853', red: '#FF1744' };

export default function MT5Dashboard({ navigation }: any) {
  const [account, setAccount] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(false);
    setAccount({
      login: 298478742,
      server: 'Exness-MT5Trial9',
      balance: 10000.00,
      equity: 10050.00,
      profit: 50.00,
      margin: 100.00,
      freeMargin: 9950.00,
    });
    setPositions([
      { id: 1, symbol: 'EURUSD', type: 'BUY', lots: 0.1, profit: 30.00, price: 1.0850 },
      { id: 2, symbol: 'XAUUSD', type: 'SELL', lots: 0.05, profit: 20.00, price: 2015.50 },
    ]);
  };

  const closePosition = (id: number) => {
    Alert.alert('Close Trade', 'Are you sure you want to close this trade?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Close', onPress: () => setPositions(positions.filter(p => p.id !== id)) },
    ]);
  };

  const quickTrade = (symbol: string, type: 'BUY' | 'SELL') => {
    Alert.alert('Trade', `${type} ${symbol}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => Alert.alert('Success', 'Trade placed!') },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.darkBg, padding: 15 }}>
      <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>MT5 Trading</Text>
      
      {/* Account Info */}
      <View style={[styles.card, { backgroundColor: COLORS.cardBg }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: '#888', fontSize: 12 }}>Account</Text>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{account?.login}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: '#888', fontSize: 12 }}>Server</Text>
            <Text style={{ color: COLORS.accent, fontSize: 14 }}>{account?.server}</Text>
          </View>
        </View>
        
        <View style={{ marginTop: 20 }}>
          <Text style={{ color: '#888', fontSize: 12 }}>Balance</Text>
          <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}>${account?.balance?.toFixed(2)}</Text>
        </View>
        
        <View style={{ flexDirection: 'row', marginTop: 15 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#888', fontSize: 12 }}>Equity</Text>
            <Text style={{ color: COLORS.green, fontSize: 16 }}>${account?.equity?.toFixed(2)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#888', fontSize: 12 }}>Profit</Text>
            <Text style={{ color: COLORS.green, fontSize: 16 }}>+${account?.profit?.toFixed(2)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#888', fontSize: 12 }}>Free Margin</Text>
            <Text style={{ color: '#fff', fontSize: 16 }}>${account?.freeMargin?.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Quick Trade Buttons */}
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 25, marginBottom: 15 }}>Quick Trade</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity style={[styles.tradeBtn, { backgroundColor: COLORS.green }]} onPress={() => quickTrade('EURUSD', 'BUY')}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>BUY EURUSD</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tradeBtn, { backgroundColor: COLORS.red }]} onPress={() => quickTrade('EURUSD', 'SELL')}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>SELL EURUSD</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <TouchableOpacity style={[styles.tradeBtn, { backgroundColor: COLORS.green }]} onPress={() => quickTrade('XAUUSD', 'BUY')}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>BUY XAUUSD</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tradeBtn, { backgroundColor: COLORS.red }]} onPress={() => quickTrade('XAUUSD', 'SELL')}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>SELL XAUUSD</Text>
        </TouchableOpacity>
      </View>

      {/* Open Positions */}
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 25, marginBottom: 15 }}>Open Positions ({positions.length})</Text>
      {positions.map((pos) => (
        <View key={pos.id} style={[styles.card, { backgroundColor: COLORS.cardBg, marginBottom: 10 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{pos.symbol}</Text>
              <Text style={{ color: pos.type === 'BUY' ? COLORS.green : COLORS.red }}>{pos.type} · {pos.lots} lots</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: pos.profit >= 0 ? COLORS.green : COLORS.red, fontSize: 16, fontWeight: 'bold' }}>
                {pos.profit >= 0 ? '+' : ''}${pos.profit.toFixed(2)}
              </Text>
              <Text style={{ color: '#888', fontSize: 12 }}>@{pos.price}</Text>
            </View>
          </View>
          <TouchableOpacity style={{ marginTop: 10, backgroundColor: COLORS.red, padding: 8, borderRadius: 6, alignItems: 'center' }} onPress={() => closePosition(pos.id)}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Close Position</Text>
          </TouchableOpacity>
        </View>
      ))}

      {positions.length === 0 && (
        <Text style={{ color: '#888', textAlign: 'center', marginTop: 20 }}>No open positions</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { padding: 15, borderRadius: 12 },
  tradeBtn: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center' },
});
