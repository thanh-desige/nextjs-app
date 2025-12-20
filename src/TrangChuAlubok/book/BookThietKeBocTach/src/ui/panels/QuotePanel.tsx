/**
 * QuotePanel - Panel for displaying pricing and quote
 */

"use client";

import React, { useMemo } from "react";

// ==================== Local Types ====================

export interface PriceBreakdown {
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
}

// ==================== Types ====================

export interface QuoteItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount?: number;
  total: number;
}

export interface QuotePanelProps {
  /** Quote items */
  items: QuoteItem[];
  /** Price breakdown */
  pricing: PriceBreakdown;
  /** Customer info */
  customer?: {
    name: string;
    phone?: string;
    address?: string;
  };
  /** Quote date */
  date?: Date;
  /** Quote number */
  quoteNumber?: string;
  /** Currency symbol */
  currency?: string;
  /** VAT rate */
  vatRate?: number;
  /** Edit item handler */
  onEditItem?: (itemId: string) => void;
  /** Delete item handler */
  onDeleteItem?: (itemId: string) => void;
  /** Export handler */
  onExport?: (format: "pdf" | "excel") => void;
  /** Print handler */
  onPrint?: () => void;
  /** Send to customer handler */
  onSend?: () => void;
  /** Additional class name */
  className?: string;
}

// ==================== Helper Functions ====================

const formatNumber = (num: number, decimals = 0): string => {
  return num.toLocaleString("vi-VN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const formatCurrency = (num: number, currency = "₫"): string => {
  return `${formatNumber(num)} ${currency}`;
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

// ==================== QuotePanel Component ====================

export const QuotePanel: React.FC<QuotePanelProps> = ({
  items,
  pricing,
  customer,
  date = new Date(),
  quoteNumber,
  currency = "₫",
  vatRate = 10,
  onEditItem,
  onDeleteItem,
  onExport,
  onPrint,
  onSend,
  className = "",
}) => {
  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discount = items.reduce((sum, item) => sum + (item.discount ?? 0), 0);
    const vat = ((subtotal - discount) * vatRate) / 100;
    const grandTotal = subtotal - discount + vat + (pricing.laborCost ?? 0);

    return { subtotal, discount, vat, grandTotal };
  }, [items, vatRate, pricing.laborCost]);

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
        <div>
          <h2 className="text-xl font-bold text-gray-800">BÁO GIÁ</h2>
          {quoteNumber && (
            <p className="text-sm text-gray-500">Số: {quoteNumber}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onExport && (
            <button
              type="button"
              onClick={() => onExport("pdf")}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-500"
            >
              Xuất PDF
            </button>
          )}
          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-500"
            >
              In
            </button>
          )}
          {onSend && (
            <button
              type="button"
              onClick={onSend}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-500"
            >
              Gửi KH
            </button>
          )}
        </div>
      </div>

      {/* Quote info */}
      <div className="grid grid-cols-2 gap-6 px-6 py-4 border-b bg-gray-50">
        {/* Customer info */}
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-2">
            Khách hàng
          </h3>
          {customer ? (
            <div className="text-sm">
              <p className="font-medium text-gray-800">{customer.name}</p>
              {customer.phone && (
                <p className="text-gray-600">{customer.phone}</p>
              )}
              {customer.address && (
                <p className="text-gray-600">{customer.address}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Chưa có thông tin</p>
          )}
        </div>

        {/* Quote details */}
        <div className="text-right">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">
            Thông tin báo giá
          </h3>
          <div className="text-sm">
            <p className="text-gray-600">Ngày: {formatDate(date)}</p>
            <p className="text-gray-600">Hiệu lực: 30 ngày</p>
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left text-gray-600 font-medium w-12">
                STT
              </th>
              <th className="px-4 py-2 text-left text-gray-600 font-medium">
                Hạng mục
              </th>
              <th className="px-4 py-2 text-center text-gray-600 font-medium w-16">
                ĐVT
              </th>
              <th className="px-4 py-2 text-right text-gray-600 font-medium w-20">
                SL
              </th>
              <th className="px-4 py-2 text-right text-gray-600 font-medium w-28">
                Đơn giá
              </th>
              <th className="px-4 py-2 text-right text-gray-600 font-medium w-28">
                Thành tiền
              </th>
              {(onEditItem || onDeleteItem) && (
                <th className="px-4 py-2 w-20"></th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Chưa có hạng mục nào
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{item.name}</div>
                    {item.description && (
                      <div className="text-xs text-gray-500">
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {item.unit}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-800">
                    {formatNumber(item.quantity, 2)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-600">
                    {formatCurrency(item.unitPrice, currency)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-gray-800">
                    {formatCurrency(item.total, currency)}
                  </td>
                  {(onEditItem || onDeleteItem) && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onEditItem && (
                          <button
                            type="button"
                            onClick={() => onEditItem(item.id)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              width="16"
                              height="16"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                        )}
                        {onDeleteItem && (
                          <button
                            type="button"
                            onClick={() => onDeleteItem(item.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              width="16"
                              height="16"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="border-t bg-gray-50">
        <div className="max-w-md ml-auto px-6 py-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Tổng tiền hàng:</span>
              <span className="font-mono">
                {formatCurrency(totals.subtotal, currency)}
              </span>
            </div>

            {totals.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Chiết khấu:</span>
                <span className="font-mono">
                  -{formatCurrency(totals.discount, currency)}
                </span>
              </div>
            )}

            {pricing.laborCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Chi phí nhân công:</span>
                <span className="font-mono">
                  {formatCurrency(pricing.laborCost, currency)}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-gray-600">VAT ({vatRate}%):</span>
              <span className="font-mono">
                {formatCurrency(totals.vat, currency)}
              </span>
            </div>

            <div className="flex justify-between pt-2 border-t text-lg font-bold">
              <span className="text-gray-800">Tổng cộng:</span>
              <span className="text-blue-600 font-mono">
                {formatCurrency(totals.grandTotal, currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="px-6 py-3 border-t bg-gray-50 text-xs text-gray-500">
        <p>* Giá trên chưa bao gồm chi phí vận chuyển và lắp đặt (nếu có)</p>
        <p>* Báo giá có hiệu lực 30 ngày kể từ ngày lập</p>
      </div>
    </div>
  );
};

export default QuotePanel;
