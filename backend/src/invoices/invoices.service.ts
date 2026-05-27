import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async generateInvoice(orderId: string, userId: string): Promise<Buffer> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: { select: { name: true, unit: true, category: true } } } },
        buyer:  { select: { name: true, email: true, phone: true, country: true, region: true } },
        seller: { select: { name: true, email: true, phone: true, country: true, region: true, accountType: true } },
        escrow: true,
        payment: true,
      },
    });

    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new NotFoundException('Commande introuvable');
    }

    const defaultRate = order.seller?.accountType === 'COMPANY' ? 0.05 : 0.10;
    const commission   = order.escrow?.commission   ?? Math.round(order.totalPrice * defaultRate * 100) / 100;
    const sellerAmount = order.escrow?.sellerAmount ?? Math.round((order.totalPrice - commission) * 100) / 100;
    const invoiceNum   = `AGM-${order.id.slice(0, 8).toUpperCase()}-${new Date(order.createdAt).getFullYear()}`;
    const dateStr      = new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

    // ── Génération PDF avec pdfmake ──────────────────────────────────────────
    const PdfPrinter = require('pdfmake');
    const fonts = {
      Roboto: {
        normal:      Buffer.from(''),
        bold:        Buffer.from(''),
        italics:     Buffer.from(''),
        bolditalics: Buffer.from(''),
      },
    };

    // Utilise les polices système via pdfmake/build/vfs_fonts
    const pdfMake = require('pdfmake/build/pdfmake');
    const pdfFonts = require('pdfmake/build/vfs_fonts');
    pdfMake.vfs = pdfFonts.pdfMake.vfs;

    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      styles: {
        header:    { fontSize: 20, bold: true, color: '#166534' },
        subheader: { fontSize: 12, bold: true, color: '#374151' },
        label:     { fontSize: 9,  color: '#6b7280' },
        value:     { fontSize: 10, color: '#111827' },
        tableHeader: { fontSize: 9, bold: true, color: '#ffffff', fillColor: '#16a34a' },
        total:     { fontSize: 12, bold: true },
      },
      content: [
        // ── En-tête ──
        {
          columns: [
            {
              stack: [
                { text: '🌾 AgroMarket Enterprise', style: 'header' },
                { text: 'Plateforme Agricole B2B', style: 'label', margin: [0, 2, 0, 0] },
                { text: 'contact@agromarket.com', style: 'label' },
              ],
            },
            {
              stack: [
                { text: 'FACTURE', fontSize: 24, bold: true, color: '#16a34a', alignment: 'right' },
                { text: invoiceNum, fontSize: 11, color: '#374151', alignment: 'right', margin: [0, 4, 0, 0] },
                { text: `Date : ${dateStr}`, style: 'label', alignment: 'right' },
              ],
            },
          ],
          margin: [0, 0, 0, 20],
        },

        // ── Ligne séparatrice ──
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: '#16a34a' }], margin: [0, 0, 0, 20] },

        // ── Acheteur / Vendeur ──
        {
          columns: [
            {
              stack: [
                { text: 'ACHETEUR', style: 'label', margin: [0, 0, 0, 4] },
                { text: order.buyer?.name,   style: 'subheader' },
                { text: order.buyer?.email,  style: 'value' },
                { text: order.buyer?.phone || '',  style: 'value' },
                { text: [order.buyer?.region, order.buyer?.country].filter(Boolean).join(', '), style: 'value' },
              ],
              width: '50%',
            },
            {
              stack: [
                { text: 'VENDEUR', style: 'label', margin: [0, 0, 0, 4] },
                { text: order.seller?.name,   style: 'subheader' },
                { text: order.seller?.email,  style: 'value' },
                { text: order.seller?.phone || '', style: 'value' },
                { text: [order.seller?.region, order.seller?.country].filter(Boolean).join(', '), style: 'value' },
              ],
              width: '50%',
            },
          ],
          margin: [0, 0, 0, 24],
        },

        // ── Statut commande ──
        {
          table: {
            widths: ['*', '*', '*'],
            body: [
              [
                { text: 'N° Commande', style: 'label' },
                { text: 'Statut', style: 'label' },
                { text: 'Paiement', style: 'label' },
              ],
              [
                { text: `#${order.id.slice(0, 8).toUpperCase()}`, style: 'value', bold: true },
                { text: order.status, style: 'value' },
                { text: order.payment ? `${order.payment.provider} — ${order.payment.status}` : 'Non renseigné', style: 'value' },
              ],
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 20],
        },

        // ── Tableau des articles ──
        { text: 'DÉTAIL DE LA COMMANDE', style: 'subheader', margin: [0, 0, 0, 8] },
        {
          table: {
            headerRows: 1,
            widths: ['*', 60, 80, 80],
            body: [
              [
                { text: 'Produit',       style: 'tableHeader', alignment: 'left',   margin: [6, 6, 6, 6] },
                { text: 'Qté',           style: 'tableHeader', alignment: 'center', margin: [6, 6, 6, 6] },
                { text: 'Prix unitaire', style: 'tableHeader', alignment: 'right',  margin: [6, 6, 6, 6] },
                { text: 'Total',         style: 'tableHeader', alignment: 'right',  margin: [6, 6, 6, 6] },
              ],
              ...order.items.map(item => [
                { text: `${item.product?.name}\n${item.product?.category || ''}`, fontSize: 9, margin: [6, 4, 6, 4] },
                { text: `${item.quantity} ${item.product?.unit}`, alignment: 'center', fontSize: 9, margin: [6, 4, 6, 4] },
                { text: `${item.unitPrice.toLocaleString('fr-FR')} FCFA`, alignment: 'right', fontSize: 9, margin: [6, 4, 6, 4] },
                { text: `${(item.quantity * item.unitPrice).toLocaleString('fr-FR')} FCFA`, alignment: 'right', fontSize: 9, bold: true, margin: [6, 4, 6, 4] },
              ]),
            ],
          },
          layout: {
            fillColor: (rowIndex: number) => rowIndex === 0 ? null : rowIndex % 2 === 0 ? '#f9fafb' : null,
          },
          margin: [0, 0, 0, 16],
        },

        // ── Récapitulatif financier ──
        {
          alignment: 'right',
          stack: [
            {
              columns: [
                { text: 'Sous-total :', width: '*', alignment: 'right', style: 'value' },
                { text: `${order.totalPrice.toLocaleString('fr-FR')} FCFA`, width: 140, alignment: 'right', style: 'value' },
              ],
              margin: [0, 2, 0, 2],
            },
                {
                  columns: [
                    { text: `Commission plateforme (${Math.round(defaultRate * 100)}%) :`, width: '*', alignment: 'right', color: '#d97706', fontSize: 9 },
                    { text: `− ${commission.toLocaleString('fr-FR')} FCFA`, width: 140, alignment: 'right', color: '#d97706', fontSize: 9 },
                  ],
                  margin: [0, 2, 0, 2],
                },
            {
              columns: [
                { text: 'Montant reversé au vendeur :', width: '*', alignment: 'right', color: '#6b7280', fontSize: 9 },
                { text: `${sellerAmount.toLocaleString('fr-FR')} FCFA`, width: 140, alignment: 'right', color: '#6b7280', fontSize: 9 },
              ],
              margin: [0, 2, 0, 8],
            },
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 300, y2: 0, lineWidth: 1, lineColor: '#d1d5db' }], margin: [215, 0, 0, 8] },
            {
              columns: [
                { text: 'TOTAL TTC :', width: '*', alignment: 'right', style: 'total', color: '#166534' },
                { text: `${order.totalPrice.toLocaleString('fr-FR')} FCFA`, width: 140, alignment: 'right', style: 'total', color: '#166534' },
              ],
            },
          ],
        },

        // ── Pied de page ──
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e5e7eb' }], margin: [0, 30, 0, 10] },
        {
          text: `AgroMarket Enterprise — Plateforme Agricole B2B — contact@agromarket.com\nDocument généré automatiquement — Commission plateforme ${Math.round(defaultRate * 100)}% prélevée sur cette transaction`,
          fontSize: 8,
          color: '#9ca3af',
          alignment: 'center',
        },
      ],
    };

    return new Promise((resolve, reject) => {
      const pdfDoc = pdfMake.createPdf(docDefinition);
      pdfDoc.getBuffer((buffer: Buffer) => resolve(buffer));
    });
  }
}
