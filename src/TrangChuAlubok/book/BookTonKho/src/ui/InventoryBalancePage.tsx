'use client';
// ============================================================
// InventoryBalancePage — Bảng tồn kho (read-only, computed)
// Computed from confirmed receipts - confirmed issues ± transfers
// ============================================================

import React, { useState, useMemo } from 'react';
import { FiSearch } from 'react-icons/fi';
import { useTonKhoStore } from '../store/tonKhoStore';
import type { InventoryBalance } from '../types';

function formatCurrency(n: number): string { return n.toLocaleString('vi-VN') + ' ₫'; }

export default function InventoryBalancePage(): React.ReactElement {
  const { receipts, issues, transfers } = useTonKhoStore();
  const [search, setSearch] = useState('');

  // Compute balance from confirmed vouchers
  const balances = useMemo(() => {
    const map = new Map<string, InventoryBalance>();

    const getOrCreate = (warehouseId: string, warehouseName: string, sku: string, description: string, unit: string, unitPrice: number): InventoryBalance => {
      const key = `${warehouseId}:${sku}`;
      if (!map.has(key)) {
        map.set(key, { itemKey: key, sku, description, unit, warehouseId, warehouseName, quantityOnHand: 0, unitCost: unitPrice, totalValue: 0 });
      }
      return map.get(key)!;
    };

    // Add confirmed receipts
    for (const r of receipts.filter(r => r.status === 'confirmed')) {
      for (const item of r.items) {
        const b = getOrCreate(r.warehouseId, r.warehouseName, item.sku ?? item.description, item.description, item.unit, item.unitPrice);
        b.quantityOnHand += item.quantity;
        b.unitCost = item.unitPrice;
      }
    }

    // Subtract confirmed issues
    for (const i of issues.filter(i => i.status === 'confirmed')) {
      for (const item of i.items) {
        const b = getOrCreate(i.warehouseId, i.warehouseName, item.sku ?? item.description, item.description, item.unit, item.unitPrice);
        b.quantityOnHand -= item.quantity;
      }
    }

    // Handle confirmed transfers (subtract from source, add to destination)
    for (const t of transfers.filter(t => t.status === 'confirmed')) {
      for (const item of t.items) {
        const from = getOrCreate(t.fromWarehouseId, t.fromWarehouseName, item.sku ?? item.description, item.description, item.unit, item.unitPrice);
        from.quantityOnHand -= item.quantity;
        const to = getOrCreate(t.toWarehouseId, t.toWarehouseName, item.sku ?? item.description, item.description, item.unit, item.unitPrice);
        to.quantityOnHand += item.quantity;
      }
    }

    // Recalc total values
    for (const b of map.values()) {
      b.totalValue = b.quantityOnHand * b.unitCost;
    }

    return Array.from(map.values()).sort((a, b) => a.warehouseName.localeCompare(b.warehouseName) || a.description.localeCompare(b.description));
  }, [receipts, issues, transfers]);

  const filtered = useMemo(() => {
    if (!search.trim()) return balances;
    const term = search.toLowerCase();
    return balances.filter(b =>
      b.description.toLowerCase().includes(term) ||
      b.sku.toLowerCase().includes(term) ||
      b.warehouseName.toLowerCase().includes(term)
    );
  }, [balances, search]);

  const totalValue = filtered.reduce((s, b) => s + b.totalValue, 0);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: '#cdd6f4', fontSize: 20, fontWeight: 700, margin: 0 }}>Tồn kho</h2>
          <p style={{ color: '#6c7086', fontSize: 13, margin: '4px 0 0' }}>{filtered.length} mặt hàng · Tổng giá trị: {formatCurrency(totalValue)}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <FiSearch size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#6c7086' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên, SKU, kho..."
            style={{ width: '100%', padding: '8px 8px 8px 30', borderRadius: 6, fontSize: 13, backgroundColor: '#313244', border: '1px solid #45475a', color: '#cdd6f4', outline: 'none' }} />
        </div>
      </div>

      <div style={{ borderRadius: 8, border: '1px solid #313244', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#181825' }}>
              {['Kho', 'Mặt hàng', 'SKU', 'ĐVT', 'Tồn kho', 'Đơn giá', 'Giá trị'].map((h, i, arr) => (
                <th key={i} style={{ padding: '10px 12px', textAlign: i >= 4 ? 'right' : 'left', fontSize: 12, fontWeight: 600, color: '#6c7086', borderBottom: '1px solid #313244', borderRight: i < arr.length - 1 ? '1px solid #313244' : undefined }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#6c7086' }}>Không có dữ liệu tồn kho</td></tr>
            ) : filtered.map(b => (
              <tr key={b.itemKey} style={{ borderBottom: '1px solid #313244' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(137,180,250,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <td style={{ padding: '10px 12px', color: '#cdd6f4', fontSize: 13, borderRight: '1px solid #313244' }}>{b.warehouseName}</td>
                <td style={{ padding: '10px 12px', color: '#cdd6f4', fontSize: 13, borderRight: '1px solid #313244' }}>{b.description}</td>
                <td style={{ padding: '10px 12px', color: '#a6adc8', fontSize: 13, borderRight: '1px solid #313244' }}>{b.sku}</td>
                <td style={{ padding: '10px 12px', color: '#a6adc8', fontSize: 13, borderRight: '1px solid #313244' }}>{b.unit}</td>
                <td style={{ padding: '10px 12px', color: b.quantityOnHand <= 0 ? '#f38ba8' : '#a6e3a1', fontSize: 13, fontWeight: 600, textAlign: 'right', borderRight: '1px solid #313244' }}>{b.quantityOnHand}</td>
                <td style={{ padding: '10px 12px', color: '#cdd6f4', fontSize: 13, textAlign: 'right', borderRight: '1px solid #313244' }}>{formatCurrency(b.unitCost)}</td>
                <td style={{ padding: '10px 12px', color: '#cdd6f4', fontSize: 13, fontWeight: 500, textAlign: 'right' }}>{formatCurrency(b.totalValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
