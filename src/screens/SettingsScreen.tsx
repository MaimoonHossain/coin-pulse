import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { Download, Upload, ShieldCheck, Database, HardDrive, Info, Tag, FileSpreadsheet } from 'lucide-react-native';
import { CategoryManagerModal } from '../components/CategoryManagerModal';

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : insets.top;
  const { exportData, exportExcel, importData, currency } = useApp();
  const [loading, setLoading] = useState(false);
  const [catManagerVisible, setCatManagerVisible] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    await exportData();
    setLoading(false);
  };

  const handleExportExcel = async () => {
    setLoading(true);
    await exportExcel();
    setLoading(false);
  };

  const handleImport = async () => {
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      if (window.confirm('Restoring backup will replace existing data. Proceed?')) {
        setLoading(true);
        await importData();
        setLoading(false);
      }
    } else {
      Alert.alert(
        'Restore Backup',
        'Restoring backup will update existing records with the data from your backup file. Proceed?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            onPress: async () => {
              setLoading(true);
              await importData();
              setLoading(false);
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 10 }]}>
        <Text style={styles.title}>Settings & Data Safety</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Backup & Restore Section */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Database size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Data Backup & Restore</Text>
          </View>
          <Text style={styles.cardDescription}>
            Your data is stored locally in an embedded SQLite database on your device. Export an Excel (.csv) spreadsheet or backup JSON file anytime to save it to your phone storage, Google Drive, or WhatsApp.
          </Text>

          <TouchableOpacity style={[styles.actionBtn, styles.excelBtn]} onPress={handleExportExcel} disabled={loading}>
            <FileSpreadsheet size={18} color="#FFF" style={{ marginRight: 10 }} />
            <Text style={styles.actionBtnText}>Export Excel (.csv) Spreadsheet</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleExport} disabled={loading}>
            <Download size={18} color="#FFF" style={{ marginRight: 10 }} />
            <Text style={styles.actionBtnText}>Export JSON Backup File</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.importBtn]} onPress={handleImport} disabled={loading}>
            <Upload size={18} color={Colors.primary} style={{ marginRight: 10 }} />
            <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Import Backup File</Text>
          </TouchableOpacity>
        </View>

        {/* Master Category Management Section */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Tag size={20} color={Colors.primary} />
            <Text style={styles.cardTitle}>Category Master Data</Text>
          </View>
          <Text style={styles.cardDescription}>
            Customize your expense and income categories, set custom colors, and organize master data according to your spending habits.
          </Text>

          <TouchableOpacity
            style={[styles.actionBtn, styles.manageCatBtn]}
            onPress={() => setCatManagerVisible(true)}
          >
            <Tag size={18} color={Colors.primary} style={{ marginRight: 10 }} />
            <Text style={[styles.actionBtnText, { color: Colors.primary }]}>
              + Add & Manage Custom Categories
            </Text>
          </TouchableOpacity>
        </View>

        {/* Security & Privacy Banner */}
        <View style={styles.privacyCard}>
          <ShieldCheck size={24} color={Colors.income} style={{ marginBottom: 8 }} />
          <Text style={styles.privacyTitle}>100% Offline & Free</Text>
          <Text style={styles.privacyDesc}>
            CoinPulse requires no internet connection, no servers, and zero subscription costs. Your financial records stay 100% private on your own device.
          </Text>
        </View>

        {/* App Info Card */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Info size={18} color={Colors.textSecondary} />
            <Text style={styles.cardTitle}>App Information</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Name</Text>
            <Text style={styles.infoValue}>CoinPulse</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Currency</Text>
            <Text style={styles.infoValue}>Bangladeshi Taka ({currency})</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Storage Mode</Text>
            <Text style={styles.infoValue}>Embedded SQLite DB</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0 (Offline Release)</Text>
          </View>
        </View>
      </ScrollView>

      <CategoryManagerModal
        visible={catManagerVisible}
        onClose={() => setCatManagerVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  cardDescription: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  excelBtn: {
    backgroundColor: '#107C41',
  },
  importBtn: {
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  manageCatBtn: {
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  privacyCard: {
    backgroundColor: Colors.incomeBg,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.income + '40',
    alignItems: 'center',
    marginBottom: 16,
  },
  privacyTitle: {
    color: Colors.income,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  privacyDesc: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoLabel: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  infoValue: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
});
