export async function fetchReceipts({
    userId, // ✅ added this line
    category,
    receiptId,
    search,
    sortBy = 'date',
    sortOrder = 'desc',
    startDate,
    endDate,
    limit,
    offset,
}: {
    userId?: string; // ✅ added this line
    category?: string;
    receiptId?: string[];
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}) {
    const params = new URLSearchParams();

    if (userId) params.append('userId', userId); // ✅ added this line
    if (category) params.append('category', category);
    if (receiptId) receiptId.forEach((id) => params.append('receiptId', id));
    if (search) params.append('search', search);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/receipts?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch receipts');

    const data = await res.json();

    return Array.isArray(data)
        ? data.map(normalizeReceipt)
        : data?.receipts
            ? data.receipts.map(normalizeReceipt)
            : [];
}

function normalizeReceipt(receipt: any) {
    return {
        ...receipt,
        date: new Date(receipt.date),
        amount: parseFloat(receipt.amount),
    };
}
