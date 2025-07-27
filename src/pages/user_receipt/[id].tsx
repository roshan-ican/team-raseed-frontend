'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PrinterIcon, DownloadIcon, ShareIcon } from 'lucide-react';
import { useReceipts } from '@/hooks/receipts';
import { useParams } from 'next/navigation';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function ReceiptPage() {
  const params = useParams();
  const receiptId = params?.id as string;
  const { data: receipts, isLoading, isError } = useReceipts({ receiptId });

  const receiptRef = useRef<HTMLDivElement>(null);

  if (isLoading) return <div className="text-center mt-10">Loading...</div>;
  if (isError || !receipts || receipts.length === 0)
    return <div className="text-center mt-10">No receipt found</div>;

  const receipt = receipts[0];

  const handlePrint = () => {
    if (receiptRef.current) {
      const printContents = receiptRef.current.innerHTML;
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt</title>
              <style>
                body { font-family: sans-serif; padding: 20px; }
              </style>
            </head>
            <body>${printContents}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  const downloadPDF = async () => {
    if (!receiptRef.current) return;

    const canvas = await html2canvas(receiptRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Receipt-${receipt.receiptId}.pdf`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Receipt',
        text: `Receipt ${receipt.receiptId}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Receipt link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Action Buttons */}
        <div className="flex justify-center gap-3 mb-8 print:hidden">
          <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
            <PrinterIcon className="w-4 h-4" />
            Print
          </Button>
          <Button onClick={downloadPDF} variant="outline" className="flex items-center gap-2">
            <DownloadIcon className="w-4 h-4" />
            PDF
          </Button>
          <Button onClick={handleShare} variant="outline" className="flex items-center gap-2">
            <ShareIcon className="w-4 h-4" />
            Share
          </Button>
        </div>

        {/* Receipt Content */}
        <div ref={receiptRef} className="bg-white p-6 rounded-xl shadow-lg">
          <Card className="print:shadow-none print:border-none">
            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">{receipt.vendor}</h1>
                <div className="text-gray-600 mt-2 space-y-1 text-sm">
                  <p>User: {receipt.userId}</p>
                  <p>Date: {new Date(receipt.date._seconds * 1000).toLocaleDateString()}</p>
                  <p>Receipt ID: {receipt.receiptId}</p>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Items */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-4 text-lg">Items Purchased</h3>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-12 gap-2 font-medium text-gray-700 border-b pb-2">
                    <div className="col-span-6">Item</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-2 text-right">Price</div>
                    <div className="col-span-2 text-right">Total</div>
                  </div>

                  {receipt.items.map((item: any, index: number) => {
                    const quantity = item.quantity ?? 1;
                    const price =
                      typeof item.price === 'string' ? parseFloat(item.price) : item.price;
                    const total = price * quantity;

                    return (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-2 text-sm py-2 hover:bg-gray-50 px-2 -mx-2 rounded"
                      >
                        <div className="col-span-6 font-medium text-gray-900">{item.name}</div>
                        <div className="col-span-2 text-center font-mono">{quantity}</div>
                        <div className="col-span-2 text-right font-mono">₹{price.toFixed(2)}</div>
                        <div className="col-span-2 text-right font-mono font-semibold">
                          ₹{total.toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Totals */}
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-mono font-semibold text-lg">
                    ₹
                    {typeof receipt.amount === 'string'
                      ? parseFloat(receipt.amount).toFixed(2)
                      : receipt.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span>{receipt.category}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-6 border-t border-gray-200 text-sm">
                <p className="text-gray-600 mb-1">Thank you for your purchase!</p>
                <p className="text-xs text-gray-400 mt-3">
                  Receipt generated on{' '}
                  {new Date(receipt?.created_at?._seconds * 1000).toLocaleString()} by Raseed AI.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
