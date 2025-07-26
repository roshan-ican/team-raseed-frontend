'use client'

import React, { useState } from 'react';
import { Plus, Trash2, Receipt } from 'lucide-react';
import { useAddManualReceipt } from '@/hooks/receipts/useSaveReceipts';
import { useUserStore } from '@/store/useUserStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SaveReceipt from '@/components/SaveReceipt';

export default function ReceiptForm() {
  const { mutate: addReceipt, isPending } = useAddManualReceipt();
  const [extractedData, setExtractedData] = useState<any>(null);
  const user = useUserStore(state => state.user);
  const userId = user?.email as string;

  const [items, setItems] = useState([{ id: 1, name: 'onion', price: '20' }]);
  const [receiptInfo, setReceiptInfo] = useState({
    vendor: 'd mart',
    date: new Date().toISOString().split('T')[0],
    receiptName: 'text'
  });

  const addItem = () => {
    const newItem = {
      id: Date.now(),
      name: '',
      price: ''
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: number, field: string, value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const updateReceiptInfo = (field: string, value: string) => {
    setReceiptInfo(prev => ({ ...prev, [field]: value }));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      return sum + price;
    }, 0);
  };

  const calculateTax = (subtotal: number) => subtotal * 0.08;
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    return subtotal + tax;
  };

  const handleSubmit = () => {
    const data = {
      ...receiptInfo,
      items: items.filter(item => item.name && item.price),
      subtotal: calculateSubtotal(),
      tax: calculateTax(calculateSubtotal()),
      total: calculateTotal()
    };

    console.log('Calling addReceipt mutation...');
    addReceipt({ data, userId }, {
      onSuccess: response => {
        console.log('Mutation success');
        const { categorization, confidence = 0.9 } = response;

        const newItems = categorization.items.map((item: any) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          category_name: item.category_name || 'miscellaneous',
        }));

        const newExtractedData = {
          vendor: categorization.receipt.name || '',
          date: new Date().toISOString().split('T')[0],
          amount: categorization.receipt.total_price,
          items: newItems,
          notes: '',
          confidence,
        };

        // Only update if different
        setExtractedData((prev:any) => {
          if (JSON.stringify(prev) !== JSON.stringify(newExtractedData)) {
            return newExtractedData;
          }
          return prev;
        });
      },
      onError: (error) => {
        alert('Failed to save receipt. Please try again.');
        console.error('Error saving receipt:', error);
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Receipt className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">Receipt Generator</h1>
        </div>

        <div className="space-y-6">
          {/* Receipt Info */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Receipt Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                value={receiptInfo.vendor}
                onChange={(e) => updateReceiptInfo('vendor', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter business name"
              />
              <input
                type="date"
                value={receiptInfo.date}
                onChange={(e) => updateReceiptInfo('date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                value={receiptInfo.receiptName}
                onChange={(e) => updateReceiptInfo('receiptName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., RCP-001"
              />
            </div>
          </div>

          {/* Items */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-700">Items</h2>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
            <div className="p-4">
              {items.map((item, index) => (
                <div key={item.id} className="flex items-center gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full text-blue-600">
                    {index + 1}
                  </div>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Item name"
                  />
                  <div className="w-32 relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.price}
                      onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                      className="w-full pl-6 pr-3 py-2 border border-gray-300 rounded-md"
                      placeholder="0.00"
                    />
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="p-2 text-red-500 hover:bg-red-100 rounded disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (8%):</span>
                <span>${calculateTax(calculateSubtotal()).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t">
                <span>Total:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 font-semibold text-lg disabled:opacity-50"
          >
            {isPending ? 'Saving Receipt...' : 'Generate Receipt'}
          </button>

          {/* SaveReceipt */}
          {extractedData && (
            <div className="mt-10">
              <SaveReceipt
                extractedData={extractedData}
                setExtractedData={setExtractedData}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
