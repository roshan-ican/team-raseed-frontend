import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Eye, Edit, Trash2, Calendar, DollarSign } from 'lucide-react';
import { mockRecentReceipts } from '@/lib/mockData';
import { useQuery } from '@tanstack/react-query';
import { fetchReceipts } from '@/hooks/receipts/getAllReceipts';
import { useRouter } from 'next/router';
import { useUserStore } from '@/store/useUserStore';

interface ReceiptData {
  receiptId: string;
  vendor: string;
  date: string;
  amount: number;
  category: string;
  items: {
    name: string;
    price: number;
    quantity: number;
  }[];
  notes?: string;
}

export default function ReceiptsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedReceipts, setSelectedReceipts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  const router = useRouter();
  const user = useUserStore(state => state.user);
  const userId = user?.email;

  const {
    data: receipts = [],
    isFetching,
    error,
  } = useQuery({
    queryKey: ['receipts', categoryFilter, searchTerm, sortBy, sortOrder, limit, offset, userId],

    queryFn: () =>
      fetchReceipts({
        // category: categoryFilter === 'all' ? undefined : categoryFilter,
        search: searchTerm,
        sortBy,
        sortOrder,
        limit,
        offset,
        userId,
      }),
  });

  console.log('receipts', receipts);
  const goToReceipt = (receiptId: string) => {
    router.push(`/user_receipt/${receiptId}`);
  };

  const filteredReceipts: ReceiptData[] = receipts
    .filter(
      (receipt: any) =>
        (categoryFilter === 'all' || receipt.category === categoryFilter) &&
        (searchTerm === '' ||
          receipt.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          receipt.category?.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a: ReceiptData, b: ReceiptData) => {
      const aVal =
        sortBy === 'date' ? new Date(a.date).getTime() : sortBy === 'amount' ? a.amount : a.vendor;
      const bVal =
        sortBy === 'date' ? new Date(b.date).getTime() : sortBy === 'amount' ? b.amount : b.vendor;

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  const handleSelectReceipt = (receiptId: string) => {
    setSelectedReceipts(prev =>
      prev.includes(receiptId) ? prev.filter(id => id !== receiptId) : [...prev, receiptId]
    );
  };

  const handleSelectAll = () => {
    setSelectedReceipts(
      selectedReceipts.length === filteredReceipts.length
        ? []
        : filteredReceipts.map((r: any) => r.id)
    );
  };

  const handleBulkDownload = () => {
    alert(`Downloading ${selectedReceipts.length} recipts...`);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      Groceries: 'bg-green-100 text-green-800',
      Transport: 'bg-blue-100 text-blue-800',
      Utilities: 'bg-purple-100 text-purple-800',
      Entertainment: 'bg-pink-100 text-pink-800',
      Food: 'bg-orange-100 text-orange-800',
      Shopping: 'bg-yellow-100 text-yellow-800',
      Healthcare: 'bg-red-100 text-red-800',
      Other: 'bg-gray-100 text-gray-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  {
    isFetching ? (
      <div className="flex justify-center items-center p-8">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
      </div>
    ) : (
      <div>
        {receipts.map((receipt: any) => (
          <div key={receipt.receiptId}>{receipt.category}</div>
        ))}
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background safe-area-inset">
      <main className="fade-in-slide-up">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">All Receipts</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage and organize your receipt collection
            </p>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6 bg-card text-foreground">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search receipts by vendor, category, or amount..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedReceipts.length > 0 && (
            <Card className="mb-6 bg-card text-foreground">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {selectedReceipts.length} receipt(s) selected
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkDownload}
                      className="h-9"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Download Selected</span>
                      <span className="sm:hidden">Download</span>
                    </Button>
                    <Button variant="outline" size="sm" className="h-9">
                      <Trash2 className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Delete Selected</span>
                      <span className="sm:hidden">Delete</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-muted-foreground">
              <span className="hidden sm:inline">Showing </span>
              {filteredReceipts.length} of {mockRecentReceipts.length}
              <span className="hidden sm:inline"> receipts</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                className="h-9"
                onClick={() => setViewMode('table')}
              >
                Table
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                className="h-9"
                onClick={() => setViewMode('cards')}
              >
                Cards
              </Button>
            </div>
          </div>

          {/* Table View */}
          {viewMode === 'table' && (
            <Card className="bg-card text-foreground">
              <CardContent className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">
                          <Checkbox
                            checked={selectedReceipts.length === filteredReceipts.length}
                            onCheckedChange={handleSelectAll}
                          />
                        </th>
                        <th className="text-left p-3 sm:p-4 font-medium text-sm text-foreground">
                          Vendor
                        </th>
                        <th className="text-left p-3 sm:p-4 font-medium text-sm hidden sm:table-cell text-foreground">
                          Date
                        </th>
                        <th className="text-left p-3 sm:p-4 font-medium text-sm text-foreground">
                          Amount
                        </th>
                        {/* <th className="text-left p-3 sm:p-4 font-medium text-sm hidden md:table-cell text-foreground">
                          Category
                        </th> */}
                        <th className="text-left p-3 sm:p-4 font-medium text-sm text-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReceipts.map((receipt: any) => (
                        <tr key={receipt.receiptId} className="border-b hover:bg-muted">
                          <td className="p-3 sm:p-4">
                            <Checkbox
                              checked={selectedReceipts.includes(receipt.id)}
                              onCheckedChange={() => handleSelectReceipt(receipt.id)}
                            />
                          </td>
                          <td className="p-3 sm:p-4">
                            <div className="min-w-0">
                              <p className="font-medium text-sm sm:text-base truncate text-foreground">
                                {receipt.vendor ? receipt.vendor : 'N/A'}
                              </p>
                              <p className="text-xs text-muted-foreground sm:hidden">
                                {receipt.date ? new Date(receipt.date).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          </td>
                          <td className="p-3 sm:p-4 text-muted-foreground hidden sm:table-cell text-sm">
                            {receipt.date ? new Date(receipt.date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="p-3 sm:p-4 font-semibold text-sm sm:text-base text-foreground">
                            ${receipt?.amount?.toFixed(2)}
                          </td>
                          {/* <td className="p-3 sm:p-4 hidden md:table-cell">
                            <Badge className={getCategoryColor(receipt.category)}>
                              {receipt.category}
                            </Badge>
                          </td> */}

                          <td className="p-3 sm:p-4">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => goToReceipt(receipt.receiptId)}
                              >
                                <Eye
                                  className="h-4 w-4"
                                  onClick={() => goToReceipt(receipt.receiptId)}
                                />
                              </Button>
                              {/* <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hidden sm:inline-flex"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hidden sm:inline-flex"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hidden sm:inline-flex"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button> */}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cards View */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredReceipts.map(receipt => (
                <Card
                  key={receipt.receiptId}
                  className="hover:shadow-lg transition-shadow duration-200 bg-card text-foreground"
                >
                  <CardHeader className="pb-3 px-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <Checkbox
                        checked={selectedReceipts.includes(receipt.receiptId)}
                        onCheckedChange={() => handleSelectReceipt(receipt.receiptId)}
                      />
                      <Badge className={getCategoryColor(receipt.category)}>
                        {receipt.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-base sm:text-lg text-foreground truncate">
                          {receipt.vendor}
                        </h3>
                        <p className="text-xl sm:text-2xl font-bold text-primary">
                          ${receipt?.amount?.toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {receipt.date ? new Date(receipt.date).toLocaleDateString() : 'N/A'}
                      </div>

                      <div className="flex gap-2 pt-3 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-9 "
                          onClick={() => goToReceipt(receipt.receiptId)}
                        >
                          <Eye
                            className="h-4 w-4 mr-2"
                            onClick={() => goToReceipt(receipt.receiptId)}
                          />
                          View
                        </Button>
                        {/* <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                          <Edit className="h-4 w-4" />
                        </Button> */}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="mt-8 flex items-center justify-between">
            <div className="text-xs sm:text-sm text-muted-foreground">
              Page {Math.floor(offset / limit) + 1}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setOffset(prev => Math.max(prev - limit, 0))}
                disabled={offset === 0}
              >
                Previous
              </Button>

              <Button
                onClick={() => setOffset(prev => prev + limit)}
                disabled={receipts.length < limit}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
