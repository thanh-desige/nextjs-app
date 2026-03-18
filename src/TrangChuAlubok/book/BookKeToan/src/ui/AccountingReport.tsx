'use client';
import React, { useMemo } from 'react';
import { useKeToanStore } from '../store/keToanStore';
import {
  VOUCHER_STATUS_LABELS,
  VOUCHER_STATUS_COLORS,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
  VOUCHER_TYPE_LABELS,
} from '../types';

export default function AccountingReport() {
  const { vouchers, invoices } = useKeToanStore();

  const stats = useMemo(() => {
    const approvedVouchers = vouchers.filter((v) => v.status === 'approved' || v.status === 'closed');
    const draftVouchers = vouchers.filter((v) => v.status === 'draft');
    const approvedInvoices = invoices.filter((inv) => inv.status === 'approved');
    const draftInvoices = invoices.filter((inv) => inv.status === 'draft');

    const totalDebit = approvedVouchers.reduce((s, v) => s + v.totalDebit, 0);
    const totalCredit = approvedVouchers.reduce((s, v) => s + v.totalCredit, 0);
    const totalInvoiceRevenue = approvedInvoices.reduce((s, inv) => s + inv.total, 0);
    const totalVAT = approvedInvoices.reduce((s, inv) => s + inv.vatAmount, 0);

    // Count by voucher type
    const byType: Record<string, { count: number; amount: number }> = {};
    for (const v of approvedVouchers) {
      if (!byType[v.voucherType]) byType[v.voucherType] = { count: 0, amount: 0 };
      byType[v.voucherType].count++;
      byType[v.voucherType].amount += v.totalDebit;
    }

    return {
      totalVouchers: vouchers.length,
      approvedVouchers: approvedVouchers.length,
      draftVouchers: draftVouchers.length,
      closedVouchers: vouchers.filter((v) => v.status === 'closed').length,
      totalDebit,
      totalCredit,
      totalInvoices: invoices.length,
      approvedInvoices: approvedInvoices.length,
      draftInvoices: draftInvoices.length,
      totalInvoiceRevenue,
      totalVAT,
      byType,
    };
  }, [vouchers, invoices]);

  const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

  const cardStyle: React.CSSProperties = {
    padding: 16, background: '#181825', borderRadius: 8, flex: 1, minWidth: 180,
  };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ margin: '0 0 20px', color: '#cdd6f4', fontSize: 20 }}>Báo cáo kế toán</h2>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={cardStyle}>
          <div style={{ color: '#a6adc8', fontSize: 12, marginBottom: 4 }}>Tổng Nợ (đã duyệt)</div>
          <div style={{ color: '#a6e3a1', fontSize: 20, fontWeight: 700 }}>{fmt(stats.totalDebit)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#a6adc8', fontSize: 12, marginBottom: 4 }}>Tổng Có (đã duyệt)</div>
          <div style={{ color: '#f38ba8', fontSize: 20, fontWeight: 700 }}>{fmt(stats.totalCredit)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#a6adc8', fontSize: 12, marginBottom: 4 }}>Doanh thu hóa đơn</div>
          <div style={{ color: '#89b4fa', fontSize: 20, fontWeight: 700 }}>{fmt(stats.totalInvoiceRevenue)}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#a6adc8', fontSize: 12, marginBottom: 4 }}>Tổng VAT</div>
          <div style={{ color: '#fab387', fontSize: 20, fontWeight: 700 }}>{fmt(stats.totalVAT)}</div>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={cardStyle}>
          <div style={{ color: '#a6adc8', fontSize: 12, marginBottom: 4 }}>Chứng từ</div>
          <div style={{ color: '#cdd6f4', fontSize: 16 }}>
            {stats.totalVouchers} tổng • {stats.approvedVouchers} duyệt • {stats.draftVouchers} nháp • {stats.closedVouchers} khóa
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ color: '#a6adc8', fontSize: 12, marginBottom: 4 }}>Hóa đơn</div>
          <div style={{ color: '#cdd6f4', fontSize: 16 }}>
            {stats.totalInvoices} tổng • {stats.approvedInvoices} duyệt • {stats.draftInvoices} nháp
          </div>
        </div>
      </div>

      {/* Voucher by type breakdown */}
      <h3 style={{ color: '#cdd6f4', fontSize: 16, marginBottom: 12 }}>Phân loại chứng từ đã duyệt</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr style={{ background: '#181825' }}>
            {['Loại', 'Số lượng', 'Tổng số tiền'].map((h) => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#a6adc8', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #313244', borderRight: '1px solid #313244' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(stats.byType).map(([type, data]) => (
            <tr key={type} style={{ borderBottom: '1px solid #313244' }}>
              <td style={{ padding: '10px 12px', color: '#cdd6f4', borderRight: '1px solid #313244' }}>
                {VOUCHER_TYPE_LABELS[type as keyof typeof VOUCHER_TYPE_LABELS] ?? type}
              </td>
              <td style={{ padding: '10px 12px', color: '#cdd6f4', borderRight: '1px solid #313244' }}>{data.count}</td>
              <td style={{ padding: '10px 12px', color: '#a6e3a1', fontWeight: 600 }}>{fmt(data.amount)}</td>
            </tr>
          ))}
          {Object.keys(stats.byType).length === 0 && (
            <tr><td colSpan={3} style={{ padding: 24, textAlign: 'center', color: '#6c7086' }}>Chưa có dữ liệu</td></tr>
          )}
        </tbody>
      </table>

      {/* Voucher list */}
      <h3 style={{ color: '#cdd6f4', fontSize: 16, marginBottom: 12 }}>Danh sách chứng từ</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr style={{ background: '#181825' }}>
            {['Mã', 'Loại', 'Ngày', 'Mô tả', 'Nợ', 'Có', 'Trạng thái'].map((h) => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#a6adc8', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #313244', borderRight: '1px solid #313244', whiteSpace: 'nowrap' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {vouchers.map((v) => (
            <tr key={v.voucherId} style={{ borderBottom: '1px solid #313244' }}>
              <td style={{ padding: '10px 12px', color: '#89b4fa', fontWeight: 600, borderRight: '1px solid #313244' }}>{v.voucherCode}</td>
              <td style={{ padding: '10px 12px', color: '#cdd6f4', borderRight: '1px solid #313244' }}>{VOUCHER_TYPE_LABELS[v.voucherType]}</td>
              <td style={{ padding: '10px 12px', color: '#cdd6f4', borderRight: '1px solid #313244', whiteSpace: 'nowrap' }}>{v.date}</td>
              <td style={{ padding: '10px 12px', color: '#9399b2', borderRight: '1px solid #313244', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.description}</td>
              <td style={{ padding: '10px 12px', color: '#a6e3a1', fontWeight: 600, textAlign: 'right', borderRight: '1px solid #313244' }}>{fmt(v.totalDebit)}</td>
              <td style={{ padding: '10px 12px', color: '#f38ba8', fontWeight: 600, textAlign: 'right', borderRight: '1px solid #313244' }}>{fmt(v.totalCredit)}</td>
              <td style={{ padding: '10px 12px' }}>
                <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: '#1e1e2e', background: VOUCHER_STATUS_COLORS[v.status] }}>
                  {VOUCHER_STATUS_LABELS[v.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Invoice list */}
      <h3 style={{ color: '#cdd6f4', fontSize: 16, marginBottom: 12 }}>Danh sách hóa đơn</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#181825' }}>
            {['Mã HD', 'Khách hàng', 'Ngày', 'Tiền hàng', 'VAT', 'Tổng cộng', 'Trạng thái'].map((h) => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#a6adc8', fontSize: 13, fontWeight: 600, borderBottom: '1px solid #313244', borderRight: '1px solid #313244', whiteSpace: 'nowrap' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.invoiceId} style={{ borderBottom: '1px solid #313244' }}>
              <td style={{ padding: '10px 12px', color: '#89b4fa', fontWeight: 600, borderRight: '1px solid #313244' }}>{inv.invoiceCode}</td>
              <td style={{ padding: '10px 12px', color: '#cdd6f4', borderRight: '1px solid #313244' }}>{inv.customerName}</td>
              <td style={{ padding: '10px 12px', color: '#cdd6f4', borderRight: '1px solid #313244', whiteSpace: 'nowrap' }}>{inv.date}</td>
              <td style={{ padding: '10px 12px', color: '#cdd6f4', textAlign: 'right', borderRight: '1px solid #313244' }}>{fmt(inv.subtotal)}</td>
              <td style={{ padding: '10px 12px', color: '#fab387', textAlign: 'right', borderRight: '1px solid #313244' }}>{fmt(inv.vatAmount)}</td>
              <td style={{ padding: '10px 12px', color: '#a6e3a1', fontWeight: 600, textAlign: 'right', borderRight: '1px solid #313244' }}>{fmt(inv.total)}</td>
              <td style={{ padding: '10px 12px' }}>
                <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: '#1e1e2e', background: INVOICE_STATUS_COLORS[inv.status] }}>
                  {INVOICE_STATUS_LABELS[inv.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
