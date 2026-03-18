'use client';
/**
 * CutListView — Tab "Danh sách cắt" trong BookThietKeBocTach
 * Tối ưu cắt nhôm thanh + kính → giảm phế liệu
 * Tương ứng permission B5: bom.cut_list
 */

import React, { useState, useMemo } from 'react';
import { useProjectStore } from '../../store';

// ==================== Types ====================
type MaterialFilter = 'all' | 'aluminum' | 'glass';

interface CutPiece {
  id: string;
  bomItemId: string;
  materialName: string;
  materialCode: string;
  type: 'aluminum' | 'glass';
  length: number;        // mm (nhôm thanh) hoặc width (kính)
  height?: number;        // mm (chỉ kính)
  quantity: number;
  barIndex?: number;      // thanh nhôm thứ mấy
  position?: number;      // vị trí cắt trên thanh (mm)
  waste?: number;         // phế liệu (mm)
}

interface CutBar {
  barId: string;
  materialCode: string;
  materialName: string;
  standardLength: number; // mm — chiều dài thanh nguyên (thường 6500mm)
  pieces: CutPiece[];
  usedLength: number;
  wasteLength: number;
  wastePercent: number;
}

// ==================== Constants ====================
const STANDARD_BAR_LENGTH = 6500; // mm

// ==================== Component ====================
export default function CutListView(): React.ReactElement {
  const bomItems = useProjectStore((s) => s.bomItems);
  const currentProject = useProjectStore((s) => s.currentProject);

  const [filter, setFilter] = useState<MaterialFilter>('all');
  const [standardLength, setStandardLength] = useState(STANDARD_BAR_LENGTH);

  // Generate cut pieces from BOM items
  const cutPieces = useMemo<CutPiece[]>(() => {
    return bomItems
      .filter((item) => item.category === 'aluminum' || item.category === 'glass')
      .map((item) => ({
        id: `cut-${item.id}`,
        bomItemId: item.id,
        materialName: item.name,
        materialCode: item.code,
        type: item.category as 'aluminum' | 'glass',
        length: item.length ?? 0,
        height: item.height,
        quantity: item.quantity,
      }));
  }, [bomItems]);

  // Simple first-fit-decreasing bin packing for aluminum bars
  const cutBars = useMemo<CutBar[]>(() => {
    const aluminumPieces = cutPieces.filter((p) => p.type === 'aluminum' && p.length > 0);
    // Sort by length desc (FFD)
    const sorted = [...aluminumPieces].sort((a, b) => b.length - a.length);

    const bars: CutBar[] = [];
    for (const piece of sorted) {
      for (let q = 0; q < piece.quantity; q++) {
        let placed = false;
        for (const bar of bars) {
          if (bar.materialCode === piece.materialCode && bar.usedLength + piece.length <= standardLength) {
            bar.pieces.push({ ...piece, barIndex: bars.indexOf(bar), position: bar.usedLength });
            bar.usedLength += piece.length;
            bar.wasteLength = standardLength - bar.usedLength;
            bar.wastePercent = (bar.wasteLength / standardLength) * 100;
            placed = true;
            break;
          }
        }
        if (!placed) {
          const newBar: CutBar = {
            barId: `bar-${bars.length + 1}`,
            materialCode: piece.materialCode,
            materialName: piece.materialName,
            standardLength,
            pieces: [{ ...piece, barIndex: bars.length, position: 0 }],
            usedLength: piece.length,
            wasteLength: standardLength - piece.length,
            wastePercent: ((standardLength - piece.length) / standardLength) * 100,
          };
          bars.push(newBar);
        }
      }
    }
    return bars;
  }, [cutPieces, standardLength]);

  const filteredPieces = useMemo(() => {
    if (filter === 'all') return cutPieces;
    return cutPieces.filter((p) => p.type === filter);
  }, [cutPieces, filter]);

  const totalWaste = cutBars.reduce((s, b) => s + b.wasteLength, 0);
  const totalUsed = cutBars.reduce((s, b) => s + b.usedLength, 0);
  const totalBar = cutBars.reduce((s, b) => s + b.standardLength, 0);
  const overallWastePercent = totalBar > 0 ? ((totalWaste / totalBar) * 100).toFixed(1) : '0';

  return (
    <div style={{ height: '100%', backgroundColor: '#1e1e2e', color: '#ddd', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ padding: '12px 24px', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>
          Danh sách cắt — {currentProject?.name ?? 'Chưa chọn dự án'}
        </span>

        {/* Filter */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as MaterialFilter)}
          style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #444', backgroundColor: '#2a2a3e', color: '#ddd', fontSize: 12 }}
        >
          <option value="all">Tất cả</option>
          <option value="aluminum">Nhôm thanh</option>
          <option value="glass">Kính</option>
        </select>

        {/* Standard bar length input */}
        <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          Chiều dài thanh chuẩn:
          <input
            type="number"
            value={standardLength}
            onChange={(e) => setStandardLength(Number(e.target.value) || STANDARD_BAR_LENGTH)}
            style={{ width: 80, padding: '4px 6px', borderRadius: 4, border: '1px solid #444', backgroundColor: '#2a2a3e', color: '#ddd', fontSize: 12 }}
          />
          mm
        </label>

        {/* Stats */}
        {cutBars.length > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#999' }}>
            {cutBars.length} thanh | Sử dụng: {(totalUsed / 1000).toFixed(1)}m | Phế: {(totalWaste / 1000).toFixed(1)}m ({overallWastePercent}%)
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {!currentProject ? (
          <div style={{ textAlign: 'center', color: '#666', paddingTop: 40 }}>
            Vui lòng chọn dự án ở tab &ldquo;Dự án&rdquo; trước.
          </div>
        ) : filteredPieces.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', paddingTop: 40 }}>
            <p>Chưa có chi tiết cần cắt.</p>
            <p style={{ fontSize: 12, marginTop: 8 }}>
              Thiết kế bản vẽ và tính BOM trước để xem danh sách cắt.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Cut optimization bars visualization */}
            {cutBars.length > 0 && (
              <section>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Tối ưu cắt nhôm</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {cutBars.map((bar) => (
                    <div key={bar.barId} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: '#888', minWidth: 60 }}>{bar.barId}</span>
                      {/* Bar visualization */}
                      <div style={{
                        flex: 1, height: 28, backgroundColor: '#333', borderRadius: 4,
                        display: 'flex', overflow: 'hidden', position: 'relative',
                      }}>
                        {bar.pieces.map((p, i) => (
                          <div
                            key={`${p.id}-${i}`}
                            title={`${p.materialName}: ${p.length}mm`}
                            style={{
                              width: `${(p.length / bar.standardLength) * 100}%`,
                              height: '100%',
                              backgroundColor: `hsl(${(i * 60 + 200) % 360}, 60%, 50%)`,
                              borderRight: '1px solid #1e1e2e',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 9, color: '#fff', overflow: 'hidden', whiteSpace: 'nowrap',
                            }}
                          >
                            {p.length}
                          </div>
                        ))}
                      </div>
                      <span style={{ fontSize: 11, color: bar.wastePercent > 20 ? '#f87171' : '#4ade80', minWidth: 60, textAlign: 'right' }}>
                        {bar.wastePercent.toFixed(1)}% phế
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Cut list table */}
            <section>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Chi tiết cắt</h3>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #444', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px' }}>Mã</th>
                    <th style={{ padding: '8px 12px' }}>Tên vật liệu</th>
                    <th style={{ padding: '8px 12px' }}>Loại</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Chiều dài (mm)</th>
                    {filter !== 'aluminum' && <th style={{ padding: '8px 12px', textAlign: 'right' }}>Chiều cao (mm)</th>}
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>SL</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPieces.map((piece) => (
                    <tr key={piece.id} style={{ borderBottom: '1px solid #2a2a3e' }}>
                      <td style={{ padding: '8px 12px', color: '#888' }}>{piece.materialCode}</td>
                      <td style={{ padding: '8px 12px' }}>{piece.materialName}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 10, fontSize: 10,
                          backgroundColor: piece.type === 'aluminum' ? '#1e3a5f' : '#1e4a3f',
                          color: piece.type === 'aluminum' ? '#60a5fa' : '#34d399',
                        }}>
                          {piece.type === 'aluminum' ? 'Nhôm' : 'Kính'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>{piece.length || '—'}</td>
                      {filter !== 'aluminum' && <td style={{ padding: '8px 12px', textAlign: 'right' }}>{piece.height || '—'}</td>}
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>{piece.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
