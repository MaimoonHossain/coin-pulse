import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { TransactionType, PaymentMethod, Transaction } from '../types';
import { X, Check, Plus } from 'lucide-react-native';
import { CategoryManagerModal } from './CategoryManagerModal';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  initialTransaction?: Transaction | null;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  visible,
  onClose,
  initialTransaction,
}) => {
  const { categories, addTx, editTx, currency } = useApp();

  const [catManagerVisible, setCatManagerVisible] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (visible) {
      if (initialTransaction) {
        setType(initialTransaction.type);
        setAmount(initialTransaction.amount.toString());
        setSelectedCatId(initialTransaction.category_id);
        setPaymentMethod(initialTransaction.payment_method);
        setDate(initialTransaction.date);
        setNote(initialTransaction.note || '');
      } else {
        setType('expense');
        setAmount('');
        setSelectedCatId('');
        setPaymentMethod('cash');
        setDate(new Date().toISOString().slice(0, 10));
        setNote('');
      }
      setErrorMsg('');
    }
  }, [visible, initialTransaction]);

  const filteredCategories = categories.filter(c => c.type === type);

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than 0');
      return;
    }
    const catId = selectedCatId || filteredCategories[0]?.id;
    if (!catId) {
      setErrorMsg('Please select a category');
      return;
    }

    try {
      if (initialTransaction) {
        await editTx({
          ...initialTransaction,
          amount: numAmount,
          type,
          category_id: catId,
          payment_method: paymentMethod,
          date,
          note: note.trim(),
        });
      } else {
        await addTx({
          amount: numAmount,
          type,
          category_id: catId,
          payment_method: paymentMethod,
          date,
          note: note.trim(),
        });
      }

      // Reset form
      setAmount('');
      setNote('');
      setErrorMsg('');
      onClose();
    } catch (err) {
      setErrorMsg('Failed to save transaction');
    }
  };

  const paymentMethodsList: { key: PaymentMethod; label: string }[] = [
    { key: 'cash', label: 'Cash' },
    { key: 'mobile_banking', label: 'Mobile Banking (bKash/Nagad)' },
    { key: 'card', label: 'Card' },
    { key: 'bank', label: 'Bank Transfer' },
    { key: 'other', label: 'Other' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{initialTransaction ? 'Edit Transaction' : 'Add Transaction'}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Expense / Income Toggle */}
            <View style={styles.typeToggleRow}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  type === 'expense' && { backgroundColor: Colors.expenseBg, borderColor: Colors.expense },
                ]}
                onPress={() => {
                  setType('expense');
                  setSelectedCatId('');
                }}
              >
                <Text style={[styles.typeBtnText, type === 'expense' && { color: Colors.expense }]}>
                  Expense
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  type === 'income' && { backgroundColor: Colors.incomeBg, borderColor: Colors.income },
                ]}
                onPress={() => {
                  setType('income');
                  setSelectedCatId('');
                }}
              >
                <Text style={[styles.typeBtnText, type === 'income' && { color: Colors.income }]}>
                  Income
                </Text>
              </TouchableOpacity>
            </View>

            {/* Amount Input */}
            <Text style={styles.label}>Amount ({currency}) *</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.currencyPrefix}>{currency}</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={amount}
                onChangeText={text => {
                  setAmount(text);
                  if (errorMsg) setErrorMsg('');
                }}
              />
            </View>

            {/* Category Selector */}
            <View style={styles.categoryLabelRow}>
              <Text style={styles.label}>Select Category *</Text>
              <TouchableOpacity onPress={() => setCatManagerVisible(true)}>
                <Text style={styles.manageCatLink}>+ Add / Manage Categories</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.categoryGrid}>
              {filteredCategories.map(cat => {
                const isSelected = (selectedCatId || filteredCategories[0]?.id) === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catChip,
                      isSelected && { backgroundColor: cat.color, borderColor: cat.color },
                    ]}
                    onPress={() => setSelectedCatId(cat.id)}
                  >
                    <View style={[styles.catDot, { backgroundColor: isSelected ? '#FFF' : cat.color }]} />
                    <Text style={[styles.catChipText, isSelected && { color: '#FFF', fontWeight: '700' }]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Payment Method Selector */}
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.methodsRow}>
              {paymentMethodsList.map(m => (
                <TouchableOpacity
                  key={m.key}
                  style={[
                    styles.methodChip,
                    paymentMethod === m.key && { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
                  ]}
                  onPress={() => setPaymentMethod(m.key)}
                >
                  <Text style={[styles.methodChipText, paymentMethod === m.key && { color: Colors.primary, fontWeight: '700' }]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Date Input */}
            <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textMuted}
            />

            {/* Note Input */}
            <Text style={styles.label}>Note / Memo (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Dinner with friends, Launch snack..."
              placeholderTextColor={Colors.textMuted}
              value={note}
              onChangeText={setNote}
            />

            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Check size={18} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.submitBtnText}>
                {initialTransaction ? 'Update Transaction' : 'Save Transaction'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <CategoryManagerModal
        visible={catManagerVisible}
        onClose={() => setCatManagerVisible(false)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  typeBtnText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  categoryLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  manageCatLink: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 12,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
  },
  currencyPrefix: {
    color: Colors.primary,
    fontSize: 22,
    fontWeight: '800',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    paddingVertical: 10,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 6,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  catChipText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  methodsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  methodChip: {
    backgroundColor: Colors.bg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  methodChipText: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  errorText: {
    color: Colors.expense,
    fontSize: 12,
    marginTop: 8,
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
