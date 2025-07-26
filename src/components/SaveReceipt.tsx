import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useUserStore } from '@/store/useUserStore';
import { useSaveReceipt } from '@/hooks/receipts/useSaveReceipts';
import { Edit, X } from 'lucide-react';

interface Item {
  name: string;
  price: number;
  quantity?: number;
  category_name: string;
}

interface ExtractedData {
  vendor: string;
  date: string;
  amount: number | string;
  items: Item[];
  notes?: string;
  confidence?: number;
}

interface Props {
  extractedData: ExtractedData;
  setExtractedData: React.Dispatch<React.SetStateAction<ExtractedData | null>>;
}

const SaveReceipt: React.FC<Props> = ({ extractedData, setExtractedData }) => {
  const { mutate: saveReceipt, isPending } = useSaveReceipt();
  const user = useUserStore(state => state.user);
  const userId = user?.email as string;

  const [editingItem, setEditingItem] = useState<(Item & { index: number }) | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState<'upload' | 'processing' | 'review'>('upload');

  // Simulate upload progress once component mounts
  useEffect(() => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleCancel = () => {
    setUploadStep('upload');
    setUploadProgress(0);
    setExtractedData(null);
  };

  const handleDeleteItem = (index: number) => {
    setExtractedData(prev => {
      if (!prev) return prev;
      const newItems = prev.items.filter((_, i) => i !== index);
      const newTotal = newItems.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
      return { ...prev, items: newItems, amount: newTotal.toFixed(2) };
    });
  };

  const handleEditItem = (index: number) => {
    const item = extractedData.items[index];
    setEditingItem({ ...item, index });
    setIsEditModalOpen(true);
  };

  const handleSaveEditedItem = () => {
    if (editingItem) {
      setExtractedData(prev => {
        if (!prev) return prev;
        const newItems = [...prev.items];
        newItems[editingItem.index] = {
          name: editingItem.name,
          price: editingItem.price,
          quantity: editingItem.quantity,
          category_name: editingItem.category_name,
        };
        const newTotal = newItems.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
        return { ...prev, items: newItems, amount: newTotal.toFixed(2) };
      });
      setEditingItem(null);
      setIsEditModalOpen(false);
    }
  };

  const handleSubmit = () => {
    if (!userId || extractedData.items.length === 0) {
      alert('No items to save');
      return;
    }

    const payload = {
      userId,
      editedCategorization: { ...extractedData },
    };

    saveReceipt(payload, {
      onSuccess: data => {
        const walletUrl = data?.passUrl || '';
        if (walletUrl) {
          const win = window.open(walletUrl, '_blank', 'popup,width=450,height=700,scrollbars=yes,resizable=yes');
          if (!win) {
            alert('Please allow popups for this site to add the pass to your Google Wallet.');
          } else {
            const timer = setInterval(() => {
              if (win.closed) {
                clearInterval(timer);
                window.location.href = '/';
              }
            }, 500);
          }
        }

        setUploadStep('upload');
        setUploadProgress(0);
        setExtractedData(null);
      },
      onError: error => {
        console.error('Save failed', error);
        alert('Failed to save receipt. Please try again.');
      },
    });
  };

  return (
    <div>
      {extractedData?.items?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-semibold text-foreground">
              Extracted Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-2">
              {extractedData.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <span className="text-sm sm:text-base text-foreground flex-1 mr-2">
                    {item.name} - ₹{item.price} - {item.category_name}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleEditItem(index)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleDeleteItem(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal (Simple inline version) */}
      {isEditModalOpen && editingItem && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <h3 className="font-semibold text-gray-700 mb-2">Edit Item</h3>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={editingItem.name}
              onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
              className="px-3 py-2 border rounded"
              placeholder="Item name"
            />
            <input
              type="number"
              value={editingItem.price}
              onChange={e => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
              className="px-3 py-2 border rounded"
              placeholder="Price"
            />
            <input
              type="text"
              value={editingItem.category_name}
              onChange={e => setEditingItem({ ...editingItem, category_name: e.target.value })}
              className="px-3 py-2 border rounded"
              placeholder="Category"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEditedItem}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 justify-end pt-6">
        <Button variant="outline" onClick={handleCancel} className="h-12">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isPending}
          className="bg-primary hover:bg-primary-foreground h-12"
        >
          {isPending ? 'Saving...' : 'Save Receipt'}
        </Button>
      </div>
    </div>
  );
};

export default React.memo(SaveReceipt);
