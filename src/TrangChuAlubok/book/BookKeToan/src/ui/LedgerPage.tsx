'use client';
import React, { useState, useMemo } from 'react';
import { useKeToanStore } from '../store/keToanStore';
import { VOUCHER_TYPE_LABELS } from '../types';
import type { LedgerEntry } from '../types';

type LedgerView = 'general' | 'journal';

export default function LedgerPage() {
  const vouchers = useKeToanStore((s) => s.vouchers);
  const [view, setView] = useState<LedgerView>('general');
  const [accountFilter, setAccountFilter] = useState('');

  // Build ledger entries from approved/closed vouchers
  const ledgerEntries: LedgerEntry[] = useMemo(() => {
    const approvedVouchers = vouchers.filter((v) => v.status === 'approved' || v.status === 'closed');
    const entries: LedgerEntry[] = [];
    let runningBalance = 0;

    for (const v of approvedVouchers.sort((a, b) => a.date.localeCompare(b.date))) {
      for (const e of v.entries) {
        runningBalance += e.debitAmount - e.creditAmount;
        entries.push({
          date: v.date,
          voucherCode: v.voucherCode,
          description: e.description || v.description,
          accountCode: e.accountCode,
          accountName: e.accountName,
          debitAmount: e.debitAmount,
          creditAmount: e.creditAmount,
          balance: runningBalance,
        });
      }
    }
    return entries;
  }, [vouchers]);

  // Journal entries: grouped by voucher
  const journalGroups = useMemo(() => {
    const approved = vouchers.filter((v) => v.status === 'approved' || v.status === 'closed');
    return approved.sort((a, b) => a.date.localeCompare(b.date));
  }, [vouchers]);

  // Unique account codes for filter
  const accountCodes = useMemo(() => {
    const codes = new Set(ledgerEntries.map((e) => e.accountCode));
    return Array.from(codes).sort();
  }, [ledgerEntries]);

  const filteredEntries = accountFilter
    ? ledgerEntries.filter((e) => e.accountCode === accountFilter)
    : ledgerEntries;

  const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 20px', background: active ? '#89b4fa' : '#313244',
    color: active ? '#1e1e2e' : '#cdd6f4', border: 'none', borderRadius: 6,
    fontWeight: 600, cursor: 'pointer', fontSize: 13,
  });

  return (
    <div style={{ padding: 24 }}>
      {/* Header with sub-tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: '#cdd6f4', fontSize: 20 }}>Sổ kế toán</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={tabStyle(view === 'general')} onClick={() => setView('general')}>Sổ cái</button>
          <button style={tabStyle(view === 'journal')} onClick={() => setView('journal')}>Sổ nhật ký</button>
        </div>
      </div>

      {view === 'general' && (
        <>
          {/* Account filter */}
          <div style={{ marginBottom: 16 }}>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              style={{
                padding: '8px 12px', background: '#313244', color: '#cdd6f4',
                border: '1px solid #45475a', borderRadius: 6, outline: 'none',
              }}
            >
              <option value="">Tất cả tài khoản</option>
              {accountCodes.map((code) => {
                const name = ledgerEntries.find((e) => e.accountCode === code)?.accountName ?? '';
                return <option key={code} value={code}>{code} — {name}</option>;
              })}
            </select>
          </div>

          {/* General Ledger table */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#181825' }}>
                {['Ngày', 'Chứng từ', 'TK', 'Tên TK', 'Diễn giải', 'Nợ', 'Có', 'Số dư'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 12px', textAlign: 'left', color: '#a6adc8',
                      fontSize: 13, fontWeight: 600, borderBottom: '1px solid #313244',
                      borderRight: '1px solid #313244', whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #313244' }}>
                  <td style={{ padding: '10px 12px', color: '#cdd6f4', borderRight: '1px solid #313244', whiteSpace: 'nowrap' }}>{entry.date}</td>
                  <td style={{ padding: '10px 12px', color: '#89b4fa', fontWeight: 600, borderRight: '1px solid #313244' }}>{entry.voucherCode}</td>
                  <td style={{ padding: '10px 12px', color: '#89b4fa', borderRight: '1px solid #313244' }}>{entry.accountCode}</td>
                  <td style={{ padding: '10px 12px', color: '#cdd6f4', borderRight: '1px solid #313244' }}>{entry.accountName}</td>
                  <td style={{ padding: '10px 12px', color: '#9399b2', borderRight: '1px solid #313244', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.description}
                  </td>
                  <td style={{ padding: '10px 12px', color: entry.debitAmount > 0 ? '#a6e3a1' : '#6c7086', textAlign: 'right', fontWeight: 600, borderRight: '1px solid #313244' }}>
                    {entry.debitAmount > 0 ? fmt(entry.debitAmount) : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', color: entry.creditAmount > 0 ? '#f38ba8' : '#6c7086', textAlign: 'right', fontWeight: 600, borderRight: '1px solid #313244' }}>
                    {entry.creditAmount > 0 ? fmt(entry.creditAmount) : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', color: entry.balance >= 0 ? '#a6e3a1' : '#f38ba8', textAlign: 'right', fontWeight: 600 }}>
                    {fmt(entry.balance)}
                  </td>
                </tr>
              ))}
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#6c7086' }}>
                    Chưa có dữ liệu sổ cái
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}

      {view === 'journal' && (
        <>
          {/* Journal view — grouped by voucher */}
          {journalGroups.map((v) => (
            <div key={v.voucherId} style={{ marginBottom: 20, background: '#181825', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <span style={{ color: '#89b4fa', fontWeight: 600, marginRight: 12 }}>{v.voucherCode}</span>
                  <span style={{ color: '#a6adc8', fontSize: 13 }}>{v.date} — {VOUCHER_TYPE_LABELS[v.voucherType]}</span>
                </div>
                <span style={{ color: '#9399b2', fontSize: 12 }}>
                  {v.status === 'closed' ? '🔒 Đã khóa' : '✓ Đã duyệt'}
                </span>
              </div>
              <div style={{ color: '#cdd6f4', marginBottom: 8, fontSize: 14 }}>{v.description}</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['TK', 'Tên TK', 'Nợ', 'Có'].map((h) => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: '#a6adc8', fontSize: 12, borderBottom: '1px solid #313244', borderRight: '1px solid #313244' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {v.entries.map((e) => (
                    <tr key={e.entryId} style={{ borderBottom: '1px solid #313244' }}>
                      <td style={{ padding: '6px 10px', color: '#89b4fa', borderRight: '1px solid #313244' }}>{e.accountCode}</td>
                      <td style={{ padding: '6px 10px', color: '#cdd6f4', borderRight: '1px solid #313244' }}>{e.accountName}</td>
                      <td style={{ padding: '6px 10px', color: e.debitAmount > 0 ? '#a6e3a1' : '#6c7086', textAlign: 'right', fontWeight: 600, borderRight: '1px solid #313244' }}>
                        {e.debitAmount > 0 ? fmt(e.debitAmount) : '—'}
                      </td>
                      <td style={{ padding: '6px 10px', color: e.creditAmount > 0 ? '#f38ba8' : '#6c7086', textAlign: 'right', fontWeight: 600 }}>
                        {e.creditAmount > 0 ? fmt(e.creditAmount) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {journalGroups.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: '#6c7086' }}>Chưa có chứng từ đã duyệt</div>
          )}
        </>
      )}
    </div>
  );
}
