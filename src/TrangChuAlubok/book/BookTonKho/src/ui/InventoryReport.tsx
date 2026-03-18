'use client';
// ============================================================
// InventoryReport — Báo cáo tồn kho
// Summary cards + movement stats
// ============================================================

import React, { useMemo } from 'react';
import { useTonKhoStore } from '../store/tonKhoStore';

function formatCurrency(n: number): string { return n.toLocaleString('vi-VN') + ' ₫'; }

function StatCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div style={{ backgroundColor: '#181825', borderRadius: 8, border: '1px solid #313244', padding: 20, flex: 1, minWidth: 180 }}>
      <p style={{ color: '#6c7086', fontSize: 12, fontWeight: 600, margin: 0, textTransform: 'uppercase' }}>{label}</p>
      <p style={{ color, fontSize: 24, fontWeight: 700, margin: '8px 0 0' }}>{value}</p>
      {sub && <p style={{ color: '#585b70', fontSize: 12, margin: '4px 0 0' }}>{sub}</p>}
    </div>
  );
}

export default function InventoryReport(): React.ReactElement {
  const { receipts, issues, transfers } = useTonKhoStore();

  const stats = useMemo(() => {
    const confirmedReceipts = receipts.filter(r => r.status === 'confirmed');
    const confirmedIssues = issues.filter(i => i.status === 'confirmed');
    const draftReceipts = receipts.filter(r => r.status === 'draft');
    const draftIssues = issues.filter(i => i.status === 'draft');
    const draftTransfers = transfers.filter(t => t.status === 'draft');

    const totalReceiptValue = confirmedReceipts.reduce((s, r) => s + r.totalAmount, 0);
    const totalIssueValue = confirmedIssues.reduce((s, i) => s + i.totalAmount, 0);
    const totalTransferValue = transfers.filter(t => t.status === 'confirmed').reduce((s, t) => s + t.totalAmount, 0);

    // Compute unique SKUs in stock
    const skuSet = new Set<string>();
    for (const r of confirmedReceipts) {
      for (const item of r.items) skuSet.add(item.sku ?? item.description);
    }

    return {
      receiptCount: confirmedReceipts.length,
      issueCount: confirmedIssues.length,
      transferCount: transfers.filter(t => t.status === 'confirmed').length,
      totalReceiptValue,
      totalIssueValue,
      totalTransferValue,
      pendingReceipts: draftReceipts.length,
      pendingIssues: draftIssues.length,
      pendingTransfers: draftTransfers.length,
      uniqueSKUs: skuSet.size,
      netValue: totalReceiptValue - totalIssueValue,
    };
  }, [receipts, issues, transfers]);

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: '#cdd6f4', fontSize: 20, fontWeight: 700, margin: '0 0 20px' }}>Báo cáo tồn kho</h2>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard label="Tổng nhập kho" value={formatCurrency(stats.totalReceiptValue)} color="#a6e3a1" sub={`${stats.receiptCount} phiếu đã xác nhận`} />
        <StatCard label="Tổng xuất kho" value={formatCurrency(stats.totalIssueValue)} color="#f38ba8" sub={`${stats.issueCount} phiếu đã xác nhận`} />
        <StatCard label="Giá trị tồn ròng" value={formatCurrency(stats.netValue)} color="#89b4fa" sub={`${stats.uniqueSKUs} mặt hàng`} />
      </div>

      {/* Movement details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ backgroundColor: '#181825', borderRadius: 8, border: '1px solid #313244', padding: 20 }}>
          <h3 style={{ color: '#cdd6f4', fontSize: 14, fontWeight: 600, margin: '0 0 16px' }}>Biến động kho</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['Phiếu nhập đã xác nhận', stats.receiptCount, '#a6e3a1'],
                ['Phiếu xuất đã xác nhận', stats.issueCount, '#f38ba8'],
                ['Phiếu chuyển đã xác nhận', stats.transferCount, '#89b4fa'],
              ].map(([label, val, color]) => (
                <tr key={label as string} style={{ borderBottom: '1px solid #313244' }}>
                  <td style={{ padding: '10px 0', color: '#a6adc8', fontSize: 13 }}>{label as string}</td>
                  <td style={{ padding: '10px 0', color: color as string, fontSize: 14, fontWeight: 600, textAlign: 'right' }}>{val as number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ backgroundColor: '#181825', borderRadius: 8, border: '1px solid #313244', padding: 20 }}>
          <h3 style={{ color: '#cdd6f4', fontSize: 14, fontWeight: 600, margin: '0 0 16px' }}>Chờ xử lý</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['Phiếu nhập nháp', stats.pendingReceipts, '#f9e2af'],
                ['Phiếu xuất nháp', stats.pendingIssues, '#f9e2af'],
                ['Phiếu chuyển nháp', stats.pendingTransfers, '#f9e2af'],
              ].map(([label, val, color]) => (
                <tr key={label as string} style={{ borderBottom: '1px solid #313244' }}>
                  <td style={{ padding: '10px 0', color: '#a6adc8', fontSize: 13 }}>{label as string}</td>
                  <td style={{ padding: '10px 0', color: color as string, fontSize: 14, fontWeight: 600, textAlign: 'right' }}>{val as number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Value breakdown */}
      <div style={{ backgroundColor: '#181825', borderRadius: 8, border: '1px solid #313244', padding: 20 }}>
        <h3 style={{ color: '#cdd6f4', fontSize: 14, fontWeight: 600, margin: '0 0 16px' }}>Giá trị tổng hợp</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #313244' }}>
              {['Loại', 'Giá trị'].map((h, i) => (
                <th key={i} style={{ padding: '8px 0', textAlign: i === 0 ? 'left' : 'right', fontSize: 12, fontWeight: 600, color: '#6c7086' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['Tổng giá trị nhập kho', stats.totalReceiptValue, '#a6e3a1'],
              ['Tổng giá trị xuất kho', stats.totalIssueValue, '#f38ba8'],
              ['Tổng giá trị chuyển kho', stats.totalTransferValue, '#89b4fa'],
            ].map(([label, val, color]) => (
              <tr key={label as string} style={{ borderBottom: '1px solid #313244' }}>
                <td style={{ padding: '10px 0', color: '#a6adc8', fontSize: 13 }}>{label as string}</td>
                <td style={{ padding: '10px 0', color: color as string, fontSize: 14, fontWeight: 600, textAlign: 'right' }}>{formatCurrency(val as number)}</td>
              </tr>
            ))}
            <tr>
              <td style={{ padding: '12px 0', color: '#cdd6f4', fontSize: 15, fontWeight: 700 }}>Giá trị tồn ròng</td>
              <td style={{ padding: '12px 0', color: '#a6e3a1', fontSize: 15, fontWeight: 700, textAlign: 'right' }}>{formatCurrency(stats.netValue)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
