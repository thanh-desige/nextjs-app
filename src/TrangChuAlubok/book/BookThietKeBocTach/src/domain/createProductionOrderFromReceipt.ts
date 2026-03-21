/**
 * createProductionOrderFromReceipt — Tạo lệnh sản xuất sau khi đã tạm ứng
 *
 * Phase 6: Liên kết TKBT → Sản xuất (Lệnh SX)
 *
 * Flow:
 * 1. Kiểm tra project có receiptId (đã tạm ứng)
 * 2. Tạo ProductionOrder từ BOM items
 * 3. Sinh mã LSX-xxxx tự động
 * 4. Thêm vào sanXuatThiCongStore
 * 5. Ghi productionOrderId/Code ngược vào ProjectInfo
 */

import { useProjectStore } from '../store/projectStore';
import type { ProjectInfo } from '../store/projectStore';
import { useSanXuatThiCongStore } from '../../../BookSanXuatThiCong/src/store/sanXuatThiCongStore';
import type { ProductionOrder, ProductionOrderItem } from '../../../BookSanXuatThiCong/src/types/sanXuatThiCong.types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/** Sinh mã LSX-xxxx tiếp theo dựa trên orders hiện có */
function nextProductionOrderCode(existingOrders: ProductionOrder[]): string {
  let maxNum = 0;
  for (const o of existingOrders) {
    const m = o.orderCode.match(/^LSX-(\d+)$/);
    if (m) maxNum = Math.max(maxNum, Number(m[1]));
  }
  return `LSX-${String(maxNum + 1).padStart(4, '0')}`;
}

export interface CreateProductionOrderResult {
  success: boolean;
  productionOrderId?: string;
  productionOrderCode?: string;
  error?: string;
}

/**
 * Tạo lệnh sản xuất từ dự án đã tạm ứng
 * Gọi từ ProjectListView khi click "Tạo lệnh SX"
 */
export function createProductionOrderFromReceipt(project: ProjectInfo): CreateProductionOrderResult {
  const projectStore = useProjectStore.getState();
  const sxStore = useSanXuatThiCongStore.getState();

  // Kiểm tra phiếu thu tồn tại
  if (!project.receiptId) {
    return { success: false, error: 'Dự án chưa có phiếu thu.' };
  }

  // Lấy BOM items để tạo production order items
  const bomItems = projectStore.bomItems;

  const orderCode = nextProductionOrderCode(sxStore.productionOrders);
  const orderId = generateId();
  const now = new Date().toISOString();
  const today = now.split('T')[0];

  // Convert BOM → ProductionOrderItem
  const items: ProductionOrderItem[] = bomItems.map((bom) => ({
    itemId: generateId(),
    description: bom.name,
    quantity: bom.quantity,
    unit: bom.unit,
    bomRef: bom.code,
    completedQty: 0,
    defectQty: 0,
  }));

  const order: ProductionOrder = {
    orderId,
    orderCode,
    projectId: project.id,
    projectCode: project.projectCode || '',
    items,
    priority: 'normal',
    status: 'new',
    assignedTo: project.employee || '',
    startDate: today,
    dueDate: today, // Will be updated by production manager
    notes: `Lệnh SX tự động từ dự án ${project.projectCode || project.name}`,
    createdBy: project.employee || '',
    createdAt: now,
    updatedAt: now,
  };

  // 1. Tạo production order trong SanXuat store
  sxStore.addProductionOrder(order);

  // 2. Liên kết ngược vào ProjectInfo
  projectStore.loadProject(project.id);
  projectStore.updateProject({
    productionOrderId: orderId,
    productionOrderCode: orderCode,
  });

  return { success: true, productionOrderId: orderId, productionOrderCode: orderCode };
}
