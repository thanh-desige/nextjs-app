/**
 * ReportGenerator.ts
 * Generate various reports for BOM, cut lists, and quotes
 */

import {
  BomDocument,
  BomItem,
  BomItemType,
  CutList,
  GlassCutList,
} from "./BomItem";
import { Quote, QuoteLineItem } from "./QuoteCalculator";

// ============================================================================
// Report Types
// ============================================================================

export type ReportFormat = "html" | "csv" | "json" | "pdf";

export interface ReportOptions {
  format: ReportFormat;
  language: "vi" | "en";
  includeHeader: boolean;
  includeFooter: boolean;
  includeLogo: boolean;
  logoUrl?: string;
  companyInfo?: CompanyInfo;
  pageSize?: "A4" | "Letter";
  orientation?: "portrait" | "landscape";
}

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  taxId?: string;
  logo?: string;
}

const DEFAULT_OPTIONS: ReportOptions = {
  format: "html",
  language: "vi",
  includeHeader: true,
  includeFooter: true,
  includeLogo: false,
  pageSize: "A4",
  orientation: "portrait",
};

// ============================================================================
// Report Generator
// ============================================================================

export class ReportGenerator {
  private options: ReportOptions;
  private companyInfo: CompanyInfo;

  constructor(companyInfo?: CompanyInfo, options?: Partial<ReportOptions>) {
    this.companyInfo = companyInfo || {
      name: "CÔNG TY TNHH CỬA NHÔM KÍNH",
      address: "123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh",
      phone: "(028) 1234 5678",
      email: "info@cuanhomkinh.com",
    };
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  // --------------------------------------------------------------------------
  // BOM Report
  // --------------------------------------------------------------------------

  generateBomReport(
    bom: BomDocument,
    options?: Partial<ReportOptions>
  ): string {
    const opts = { ...this.options, ...options };

    switch (opts.format) {
      case "csv":
        return this.bomToCsv(bom, opts);
      case "json":
        return JSON.stringify(bom, null, 2);
      case "html":
      default:
        return this.bomToHtml(bom, opts);
    }
  }

  private bomToHtml(bom: BomDocument, opts: ReportOptions): string {
    const t = this.getTranslations(opts.language);

    let html = this.getHtmlHeader(t.bomTitle, opts);

    // BOM Info
    html += `
      <div class="info-section">
        <h2>${t.projectInfo}</h2>
        <table class="info-table">
          <tr><td><strong>${t.project}:</strong></td><td>${
      bom.projectName
    }</td></tr>
          <tr><td><strong>${t.door}:</strong></td><td>${bom.doorName}</td></tr>
          <tr><td><strong>${t.date}:</strong></td><td>${this.formatDate(
      bom.createdAt
    )}</td></tr>
          <tr><td><strong>${t.status}:</strong></td><td>${bom.status}</td></tr>
        </table>
      </div>
    `;

    // Profile Items
    const profiles = bom.items.filter((i) => i.type === BomItemType.PROFILE);
    if (profiles.length > 0) {
      html += this.renderItemTable(t.profiles, profiles, opts);
    }

    // Glass Items
    const glasses = bom.items.filter((i) => i.type === BomItemType.GLASS);
    if (glasses.length > 0) {
      html += this.renderItemTable(t.glass, glasses, opts);
    }

    // Accessory Items
    const accessories = bom.items.filter(
      (i) => i.type === BomItemType.ACCESSORY
    );
    if (accessories.length > 0) {
      html += this.renderItemTable(t.accessories, accessories, opts);
    }

    // Summary
    html += `
      <div class="summary-section">
        <h2>${t.summary}</h2>
        <table class="summary-table">
          <tr><td>${
            t.materialCost
          }:</td><td class="amount">${this.formatCurrency(
      bom.summary.materialCost
    )}</td></tr>
          <tr><td>${t.laborCost}:</td><td class="amount">${this.formatCurrency(
      bom.summary.laborCost
    )}</td></tr>
          <tr><td>${
            t.overheadCost
          }:</td><td class="amount">${this.formatCurrency(
      bom.summary.overheadCost
    )}</td></tr>
          <tr class="total"><td><strong>${
            t.totalCost
          }:</strong></td><td class="amount"><strong>${this.formatCurrency(
      bom.summary.totalCost
    )}</strong></td></tr>
        </table>
      </div>
    `;

    html += this.getHtmlFooter(opts);
    return html;
  }

  private renderItemTable(
    title: string,
    items: BomItem[],
    _opts: ReportOptions
  ): string {
    void _opts; // Reserved for future use
    const t = this.getTranslations(this.options.language);

    let html = `
      <div class="items-section">
        <h3>${title}</h3>
        <table class="items-table">
          <thead>
            <tr>
              <th>#</th>
              <th>${t.code}</th>
              <th>${t.name}</th>
              <th>${t.position}</th>
              <th>${t.quantity}</th>
              <th>${t.unit}</th>
              <th>${t.unitPrice}</th>
              <th>${t.totalPrice}</th>
            </tr>
          </thead>
          <tbody>
    `;

    items.forEach((item, index) => {
      html += `
        <tr>
          <td>${index + 1}</td>
          <td>${item.material.code}</td>
          <td>${item.material.name}</td>
          <td>${item.position}</td>
          <td>${item.quantity.toFixed(2)}</td>
          <td>${item.unit}</td>
          <td class="amount">${this.formatCurrency(item.unitPrice)}</td>
          <td class="amount">${this.formatCurrency(
            item.discountedPrice ?? item.totalPrice
          )}</td>
        </tr>
      `;
    });

    const total = items.reduce(
      (sum, i) => sum + (i.discountedPrice ?? i.totalPrice),
      0
    );
    html += `
          </tbody>
          <tfoot>
            <tr class="subtotal">
              <td colspan="7">${t.subtotal}</td>
              <td class="amount">${this.formatCurrency(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;

    return html;
  }

  private bomToCsv(bom: BomDocument, opts: ReportOptions): string {
    const t = this.getTranslations(opts.language);
    let csv = `${t.code},${t.name},${t.position},${t.quantity},${t.unit},${t.unitPrice},${t.totalPrice}\n`;

    for (const item of bom.items) {
      csv += `${item.material.code},"${item.material.name}","${
        item.position
      }",${item.quantity},${item.unit},${item.unitPrice},${
        item.discountedPrice ?? item.totalPrice
      }\n`;
    }

    return csv;
  }

  // --------------------------------------------------------------------------
  // Cut List Report
  // --------------------------------------------------------------------------

  generateCutListReport(
    cutList: CutList,
    options?: Partial<ReportOptions>
  ): string {
    const opts = { ...this.options, ...options };
    const t = this.getTranslations(opts.language);

    let html = this.getHtmlHeader(t.cutListTitle, opts);

    html += `
      <div class="info-section">
        <h2>${t.cutListInfo}</h2>
        <table class="info-table">
          <tr><td><strong>${t.totalStocks}:</strong></td><td>${
      cutList.totalStocksNeeded
    }</td></tr>
          <tr><td><strong>${
            t.totalWaste
          }:</strong></td><td>${cutList.totalWasteLength.toFixed(
      0
    )} mm</td></tr>
          <tr><td><strong>${
            t.wastePercent
          }:</strong></td><td>${cutList.averageWastePercent.toFixed(
      1
    )}%</td></tr>
          <tr><td><strong>${
            t.efficiency
          }:</strong></td><td>${cutList.optimizationScore.toFixed(1)}%</td></tr>
        </table>
      </div>
    `;

    for (const item of cutList.items) {
      html += `
        <div class="cut-item-section">
          <h3>${item.materialName} (${item.materialCode})</h3>
          <p>${t.stockLength}: ${item.stockLength} mm | ${t.stocksNeeded}: ${item.stocksNeeded}</p>
          <table class="cut-table">
            <thead>
              <tr>
                <th>${t.length}</th>
                <th>${t.quantity}</th>
                <th>${t.label}</th>
                <th>${t.angle1}</th>
                <th>${t.angle2}</th>
              </tr>
            </thead>
            <tbody>
      `;

      for (const piece of item.cutPieces) {
        html += `
          <tr>
            <td>${piece.length} mm</td>
            <td>${piece.quantity}</td>
            <td>${piece.label}</td>
            <td>${piece.angle1}°</td>
            <td>${piece.angle2}°</td>
          </tr>
        `;
      }

      html += `
            </tbody>
          </table>
          <p class="waste-info">${t.wastePercent}: ${item.wastePercent.toFixed(
        1
      )}%</p>
        </div>
      `;
    }

    html += this.getHtmlFooter(opts);
    return html;
  }

  // --------------------------------------------------------------------------
  // Glass Cut List Report
  // --------------------------------------------------------------------------

  generateGlassCutListReport(
    glassCutList: GlassCutList,
    options?: Partial<ReportOptions>
  ): string {
    const opts = { ...this.options, ...options };
    const t = this.getTranslations(opts.language);

    let html = this.getHtmlHeader(t.glassCutListTitle, opts);

    html += `
      <div class="info-section">
        <h2>${t.glassCutListInfo}</h2>
        <table class="info-table">
          <tr><td><strong>${t.totalSheets}:</strong></td><td>${
      glassCutList.totalSheetsNeeded
    }</td></tr>
          <tr><td><strong>${t.totalWaste}:</strong></td><td>${(
      glassCutList.totalWasteArea / 1000000
    ).toFixed(2)} m²</td></tr>
          <tr><td><strong>${
            t.wastePercent
          }:</strong></td><td>${glassCutList.averageWastePercent.toFixed(
      1
    )}%</td></tr>
          <tr><td><strong>${
            t.efficiency
          }:</strong></td><td>${glassCutList.optimizationScore.toFixed(
      1
    )}%</td></tr>
        </table>
      </div>
    `;

    for (const item of glassCutList.items) {
      html += `
        <div class="glass-item-section">
          <h3>${item.materialName} (${item.materialCode})</h3>
          <p>${t.sheetSize}: ${item.stockWidth} x ${item.stockHeight} mm | ${t.thickness}: ${item.thickness} mm</p>
          <table class="glass-table">
            <thead>
              <tr>
                <th>${t.width}</th>
                <th>${t.height}</th>
                <th>${t.quantity}</th>
                <th>${t.label}</th>
              </tr>
            </thead>
            <tbody>
      `;

      for (const piece of item.pieces) {
        html += `
          <tr>
            <td>${piece.width} mm</td>
            <td>${piece.height} mm</td>
            <td>${piece.quantity}</td>
            <td>${piece.label}</td>
          </tr>
        `;
      }

      html += `
            </tbody>
          </table>
        </div>
      `;
    }

    html += this.getHtmlFooter(opts);
    return html;
  }

  // --------------------------------------------------------------------------
  // Quote Report
  // --------------------------------------------------------------------------

  generateQuoteReport(quote: Quote, options?: Partial<ReportOptions>): string {
    const opts = { ...this.options, ...options };
    const t = this.getTranslations(opts.language);

    let html = this.getHtmlHeader(t.quoteTitle, opts);

    // Quote Header
    html += `
      <div class="quote-header">
        <div class="quote-number">
          <h2>${t.quote} #${quote.quoteNumber}</h2>
          <p>${t.version}: ${quote.version}</p>
        </div>
        <div class="quote-dates">
          <p>${t.date}: ${this.formatDate(quote.createdAt)}</p>
          <p>${t.validUntil}: ${this.formatDate(quote.validUntil)}</p>
        </div>
      </div>
    `;

    // Customer Info
    html += `
      <div class="customer-section">
        <h3>${t.customer}</h3>
        <table class="info-table">
          <tr><td><strong>${t.name}:</strong></td><td>${
      quote.customerName
    }</td></tr>
          ${
            quote.customerAddress
              ? `<tr><td><strong>${t.address}:</strong></td><td>${quote.customerAddress}</td></tr>`
              : ""
          }
          ${
            quote.customerPhone
              ? `<tr><td><strong>${t.phone}:</strong></td><td>${quote.customerPhone}</td></tr>`
              : ""
          }
          ${
            quote.customerEmail
              ? `<tr><td><strong>${t.email}:</strong></td><td>${quote.customerEmail}</td></tr>`
              : ""
          }
        </table>
      </div>
    `;

    // Project Info
    html += `
      <div class="project-section">
        <h3>${t.projectInfo}</h3>
        <table class="info-table">
          <tr><td><strong>${t.project}:</strong></td><td>${
      quote.projectName
    }</td></tr>
          ${
            quote.projectAddress
              ? `<tr><td><strong>${t.address}:</strong></td><td>${quote.projectAddress}</td></tr>`
              : ""
          }
        </table>
      </div>
    `;

    // Line Items
    html += this.renderQuoteLineItems(quote.lineItems, opts);

    // Summary
    html += `
      <div class="quote-summary">
        <h3>${t.summary}</h3>
        <table class="summary-table">
          <tr><td>${
            t.materialCost
          }:</td><td class="amount">${this.formatCurrency(
      quote.summary.materialSubtotal
    )}</td></tr>
          <tr><td>${t.laborCost}:</td><td class="amount">${this.formatCurrency(
      quote.summary.laborSubtotal
    )}</td></tr>
          <tr><td>${
            t.installationCost
          }:</td><td class="amount">${this.formatCurrency(
      quote.summary.installationSubtotal
    )}</td></tr>
          <tr><td>${t.overhead}:</td><td class="amount">${this.formatCurrency(
      quote.summary.overheadAmount
    )}</td></tr>
          <tr class="subtotal"><td>${
            t.subtotal
          }:</td><td class="amount">${this.formatCurrency(
      quote.summary.subtotal
    )}</td></tr>
          ${
            quote.summary.discountPercent > 0
              ? `<tr class="discount"><td>${t.discount} (${
                  quote.summary.discountPercent
                }%):</td><td class="amount">-${this.formatCurrency(
                  quote.summary.discountAmount
                )}</td></tr>`
              : ""
          }
          <tr><td>${t.vat} (10%):</td><td class="amount">${this.formatCurrency(
      quote.summary.vatAmount
    )}</td></tr>
          <tr class="grand-total"><td><strong>${
            t.grandTotal
          }:</strong></td><td class="amount"><strong>${this.formatCurrency(
      quote.summary.grandTotal
    )}</strong></td></tr>
        </table>
      </div>
    `;

    // Terms
    html += `
      <div class="terms-section">
        <h3>${t.terms}</h3>
        <ul>
          <li><strong>${t.payment}:</strong> ${quote.paymentTerms}</li>
          <li><strong>${t.delivery}:</strong> ${quote.deliveryTerms}</li>
          <li><strong>${t.warranty}:</strong> ${quote.warrantyTerms}</li>
        </ul>
      </div>
    `;

    if (quote.notes) {
      html += `
        <div class="notes-section">
          <h3>${t.notes}</h3>
          <p>${quote.notes}</p>
        </div>
      `;
    }

    // Signature
    html += `
      <div class="signature-section">
        <div class="signature-box">
          <p>${t.customerSignature}</p>
          <div class="signature-line"></div>
          <p>${quote.customerName}</p>
        </div>
        <div class="signature-box">
          <p>${t.companySignature}</p>
          <div class="signature-line"></div>
          <p>${this.companyInfo.name}</p>
        </div>
      </div>
    `;

    html += this.getHtmlFooter(opts);
    return html;
  }

  private renderQuoteLineItems(
    items: QuoteLineItem[],
    _opts: ReportOptions
  ): string {
    void _opts; // Reserved for future use
    const t = this.getTranslations(this.options.language);

    let html = `
      <div class="line-items-section">
        <h3>${t.items}</h3>
        <table class="line-items-table">
          <thead>
            <tr>
              <th>#</th>
              <th>${t.description}</th>
              <th>${t.quantity}</th>
              <th>${t.unit}</th>
              <th>${t.unitPrice}</th>
              <th>${t.totalPrice}</th>
            </tr>
          </thead>
          <tbody>
    `;

    let index = 1;
    for (const item of items) {
      const isSubItem = item.description.startsWith("  -");
      html += `
        <tr class="${isSubItem ? "sub-item" : ""}">
          <td>${isSubItem ? "" : index++}</td>
          <td>${item.description}</td>
          <td>${isSubItem ? "" : item.quantity.toFixed(2)}</td>
          <td>${isSubItem ? "" : item.unit}</td>
          <td class="amount">${
            isSubItem ? "" : this.formatCurrency(item.unitPrice)
          }</td>
          <td class="amount">${this.formatCurrency(
            item.discountedPrice ?? item.totalPrice
          )}</td>
        </tr>
      `;
    }

    html += `
          </tbody>
        </table>
      </div>
    `;

    return html;
  }

  // --------------------------------------------------------------------------
  // HTML Helpers
  // --------------------------------------------------------------------------

  private getHtmlHeader(title: string, opts: ReportOptions): string {
    return `
<!DOCTYPE html>
<html lang="${opts.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.5; padding: 20px; }
    h1 { font-size: 24px; margin-bottom: 20px; }
    h2 { font-size: 18px; margin: 20px 0 10px; border-bottom: 2px solid #333; padding-bottom: 5px; }
    h3 { font-size: 14px; margin: 15px 0 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f5f5f5; font-weight: bold; }
    .amount { text-align: right; }
    .info-table { width: auto; }
    .info-table td { border: none; padding: 4px 15px 4px 0; }
    .subtotal, .total, .grand-total { font-weight: bold; background-color: #f5f5f5; }
    .grand-total { font-size: 14px; }
    .discount { color: #28a745; }
    .sub-item { color: #666; font-size: 11px; }
    .sub-item td { padding-left: 30px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
    .company-info { text-align: right; }
    .quote-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .signature-section { display: flex; justify-content: space-between; margin-top: 50px; }
    .signature-box { width: 45%; text-align: center; }
    .signature-line { border-top: 1px solid #333; margin: 50px 0 10px; }
    .terms-section ul { margin-left: 20px; }
    .waste-info { color: #e65100; font-style: italic; }
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  ${opts.includeHeader ? this.getReportHeader() : ""}
  <h1>${title}</h1>
`;
  }

  private getReportHeader(): string {
    return `
      <div class="header">
        <div class="logo">
          ${
            this.options.includeLogo && this.options.logoUrl
              ? `<img src="${this.options.logoUrl}" alt="Logo" height="60">`
              : ""
          }
        </div>
        <div class="company-info">
          <strong>${this.companyInfo.name}</strong><br>
          ${this.companyInfo.address}<br>
          ${this.companyInfo.phone} | ${this.companyInfo.email}
          ${this.companyInfo.website ? `<br>${this.companyInfo.website}` : ""}
        </div>
      </div>
    `;
  }

  private getHtmlFooter(opts: ReportOptions): string {
    if (!opts.includeFooter) {
      return "</body></html>";
    }

    return `
      <div class="footer">
        <p>${this.companyInfo.name} | ${this.companyInfo.phone} | ${
      this.companyInfo.email
    }</p>
        <p>Ngày in: ${this.formatDate(new Date())}</p>
      </div>
    </body>
    </html>
    `;
  }

  // --------------------------------------------------------------------------
  // Utility Methods
  // --------------------------------------------------------------------------

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat(
      this.options.language === "vi" ? "vi-VN" : "en-US",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).format(date);
  }

  private getTranslations(lang: "vi" | "en"): Record<string, string> {
    const translations: Record<string, Record<string, string>> = {
      vi: {
        bomTitle: "BẢNG VẬT TƯ (BOM)",
        cutListTitle: "BẢNG CẮT NHÔM",
        glassCutListTitle: "BẢNG CẮT KÍNH",
        quoteTitle: "BÁO GIÁ",
        projectInfo: "Thông tin dự án",
        project: "Dự án",
        door: "Cửa",
        date: "Ngày",
        status: "Trạng thái",
        profiles: "Thanh nhôm",
        glass: "Kính",
        accessories: "Phụ kiện",
        summary: "Tổng hợp",
        materialCost: "Chi phí vật tư",
        laborCost: "Chi phí nhân công",
        overheadCost: "Chi phí chung",
        installationCost: "Chi phí lắp đặt",
        totalCost: "Tổng chi phí",
        code: "Mã",
        name: "Tên",
        position: "Vị trí",
        quantity: "Số lượng",
        unit: "Đơn vị",
        unitPrice: "Đơn giá",
        totalPrice: "Thành tiền",
        subtotal: "Tạm tính",
        cutListInfo: "Thông tin cắt nhôm",
        totalStocks: "Tổng số thanh",
        totalWaste: "Tổng phế liệu",
        wastePercent: "Tỷ lệ phế",
        efficiency: "Hiệu suất",
        stockLength: "Chiều dài thanh",
        stocksNeeded: "Số thanh cần",
        length: "Chiều dài",
        label: "Nhãn",
        angle1: "Góc 1",
        angle2: "Góc 2",
        glassCutListInfo: "Thông tin cắt kính",
        totalSheets: "Tổng số tấm",
        sheetSize: "Kích thước tấm",
        thickness: "Độ dày",
        width: "Chiều rộng",
        height: "Chiều cao",
        quote: "Báo giá",
        version: "Phiên bản",
        validUntil: "Có hiệu lực đến",
        customer: "Khách hàng",
        address: "Địa chỉ",
        phone: "Điện thoại",
        email: "Email",
        items: "Hạng mục",
        description: "Mô tả",
        overhead: "Chi phí chung",
        discount: "Chiết khấu",
        vat: "Thuế VAT",
        grandTotal: "TỔNG CỘNG",
        terms: "Điều khoản",
        payment: "Thanh toán",
        delivery: "Giao hàng",
        warranty: "Bảo hành",
        notes: "Ghi chú",
        customerSignature: "Xác nhận khách hàng",
        companySignature: "Đại diện công ty",
      },
      en: {
        bomTitle: "BILL OF MATERIALS (BOM)",
        cutListTitle: "PROFILE CUT LIST",
        glassCutListTitle: "GLASS CUT LIST",
        quoteTitle: "QUOTATION",
        projectInfo: "Project Information",
        project: "Project",
        door: "Door",
        date: "Date",
        status: "Status",
        profiles: "Profiles",
        glass: "Glass",
        accessories: "Accessories",
        summary: "Summary",
        materialCost: "Material Cost",
        laborCost: "Labor Cost",
        overheadCost: "Overhead Cost",
        installationCost: "Installation Cost",
        totalCost: "Total Cost",
        code: "Code",
        name: "Name",
        position: "Position",
        quantity: "Quantity",
        unit: "Unit",
        unitPrice: "Unit Price",
        totalPrice: "Total Price",
        subtotal: "Subtotal",
        cutListInfo: "Cut List Information",
        totalStocks: "Total Stocks",
        totalWaste: "Total Waste",
        wastePercent: "Waste %",
        efficiency: "Efficiency",
        stockLength: "Stock Length",
        stocksNeeded: "Stocks Needed",
        length: "Length",
        label: "Label",
        angle1: "Angle 1",
        angle2: "Angle 2",
        glassCutListInfo: "Glass Cut List Information",
        totalSheets: "Total Sheets",
        sheetSize: "Sheet Size",
        thickness: "Thickness",
        width: "Width",
        height: "Height",
        quote: "Quote",
        version: "Version",
        validUntil: "Valid Until",
        customer: "Customer",
        address: "Address",
        phone: "Phone",
        email: "Email",
        items: "Items",
        description: "Description",
        overhead: "Overhead",
        discount: "Discount",
        vat: "VAT",
        grandTotal: "GRAND TOTAL",
        terms: "Terms",
        payment: "Payment",
        delivery: "Delivery",
        warranty: "Warranty",
        notes: "Notes",
        customerSignature: "Customer Signature",
        companySignature: "Company Representative",
      },
    };

    return translations[lang];
  }

  // --------------------------------------------------------------------------
  // Configuration
  // --------------------------------------------------------------------------

  updateCompanyInfo(info: Partial<CompanyInfo>): void {
    this.companyInfo = { ...this.companyInfo, ...info };
  }

  updateOptions(options: Partial<ReportOptions>): void {
    this.options = { ...this.options, ...options };
  }
}
