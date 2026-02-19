import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Asset paths
const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const TEMPLATE_PATH = path.join(ASSETS_DIR, 'finalcert.png');

/**
 * Generate a certificate PDF dynamically
 * 
 * @param {Object} options
 * @param {string} options.participantName - Name to display on certificate
 * @param {string} options.division - Division (optional)
 * @param {string} options.eventName - Event title
 * @param {string} options.eventDate - Formatted date string
 * @param {string} options.certificateNumber - Unique cert number
 * @param {string} options.templateType - participation/winner/runner_up/excellence
 * @param {string} options.issueDate - Certificate issue date
 * @returns {Promise<PDFDocument>}
 */
export async function generateCertificatePDF({
  participantName,
  division,
  eventName,
  eventDate,
  certificateNumber,
  templateType = 'participation',
  issueDate
}) {
  const doc = new PDFDocument({
    layout: 'landscape',
    size: 'A4',
    margins: { top: 0, bottom: 0, left: 0, right: 0 }
  });

  const pageWidth = 842;
  const pageHeight = 595;
  const hasTemplate = fs.existsSync(TEMPLATE_PATH);

  console.log('📄 Certificate Generator:');
  console.log('   Template path:', TEMPLATE_PATH);
  console.log('   Template exists:', hasTemplate);

  if (hasTemplate) {
    try {
      // Load template PNG and convert to JPEG for PDFKit compatibility
      const templatePng = fs.readFileSync(TEMPLATE_PATH);
      console.log('   Template PNG loaded, size:', templatePng.length, 'bytes');
      
      // Convert PNG to JPEG with sharp (PDFKit handles JPEG better)
      // Explicitly specify input format and flatten transparency
      const templateBuffer = await sharp(templatePng, { failOnError: false })
        .flatten({ background: { r: 255, g: 255, b: 255 } }) // Replace transparency with white
        .jpeg({ quality: 95 })
        .toBuffer();
      console.log('   Template converted to JPEG, size:', templateBuffer.length, 'bytes');
      
      // Use converted template as background
      doc.image(templateBuffer, 0, 0, {
        width: pageWidth,
        height: pageHeight
      });

      // Overlay text on template - ADJUST THESE VALUES based on your template layout
      overlayTextOnTemplate(doc, {
        participantName,
        issueDate,
        pageWidth,
        pageHeight
      });
    } catch (imageError) {
      console.error('   ❌ Failed to load template image:', imageError.message);
      console.log('   Falling back to default design');
      // Fallback to default design if template fails
      drawFallbackCertificate(doc, {
        participantName,
        division,
        eventName,
        eventDate,
        certificateNumber,
        templateType,
        pageWidth,
        pageHeight
      });
    }
  } else {
    // No template - draw certificate from scratch
    drawFallbackCertificate(doc, {
      participantName,
      division,
      eventName,
      eventDate,
      certificateNumber,
      templateType,
      pageWidth,
      pageHeight
    });
  }

  doc.end();
  return doc;
}

/**
 * Overlay text on PNG template
 * ADJUST Y-POSITIONS based on your actual template layout
 */
function overlayTextOnTemplate(doc, options) {
  const {
    participantName,
    issueDate,
    pageWidth,
    pageHeight
  } = options;

  // Text color for name (visible on template)
  const nameColor = '#FFD700';      // Gold for participant name
  const issueDateColor = '#FFFFFF'; // White for issue date

  // ==================== PARTICIPANT NAME ====================
  // Position: Center, adjust Y value based on your template's blank space
  // Font size 28 works well for names up to ~30 characters
  // For longer names, PDFKit will automatically wrap or you can reduce fontSize further
  
  doc.fontSize(21)                    // ← ADJUST: Font size (24-32 range recommended)
    .fillColor(nameColor)             // ← ADJUST: Color (#FFD700 = gold)
    .font('Helvetica-Bold')
    .text(participantName || 'Participant Name', 0, 328, {  // ← ADJUST: Y position (305-335)
      align: 'center',
      width: pageWidth
    });

  // ==================== ISSUE DATE (Bottom Right Corner) ====================
  if (issueDate) {
    doc.fontSize(9)                    // Small font for issue date
      .fillColor(issueDateColor)       // White color
      .font('Helvetica')
      .text(`Issued: ${issueDate}`, pageWidth - 170, pageHeight - 30, {  // Bottom right corner
        align: 'right',
        width: 150
      });
  }

  // Note: All other elements (signatures, event details) are already on the template
}

/**
 * Fallback certificate design when no PNG template exists
 */
function drawFallbackCertificate(doc, options) {
  const {
    participantName,
    division,
    eventName,
    eventDate,
    certificateNumber,
    templateType,
    pageWidth,
    pageHeight
  } = options;

  const w = pageWidth;
  const h = pageHeight;

  // Background
  doc.rect(0, 0, w, h).fill('#0d1b2a');

  // Border decorations
  doc.rect(12, 12, w - 24, h - 24).lineWidth(2).stroke('#7c3aed');
  doc.rect(18, 18, w - 36, h - 36).lineWidth(1).strokeOpacity(0.5).stroke('#7c3aed');

  // Corner decorations
  const corners = [
    { x: 25, y: 25, dx: 50, dy: 0, dx2: 0, dy2: 50 },
    { x: w - 25, y: 25, dx: -50, dy: 0, dx2: 0, dy2: 50 },
    { x: 25, y: h - 25, dx: 50, dy: 0, dx2: 0, dy2: -50 },
    { x: w - 25, y: h - 25, dx: -50, dy: 0, dx2: 0, dy2: -50 }
  ];

  corners.forEach(c => {
    doc.save()
      .moveTo(c.x, c.y).lineTo(c.x + c.dx, c.y + c.dy).lineWidth(3).stroke('#a855f7');
    doc.moveTo(c.x, c.y).lineTo(c.x + c.dx2, c.y + c.dy2).lineWidth(3).stroke('#a855f7');
    doc.restore();
  });

  // Header
  doc.fontSize(12).fillColor('#a78bfa')
    .text('CODING NEXUS', 0, 80, { align: 'center', width: w, characterSpacing: 6 });

  doc.fontSize(44).fillColor('#ffffff')
    .text('CERTIFICATE', 0, 105, { align: 'center', width: w, characterSpacing: 2 });

  const typeLabel = templateType === 'winner' ? 'of Winner' :
    templateType === 'runner_up' ? 'of Runner-Up' :
    templateType === 'excellence' ? 'of Excellence' : 'of Participation';

  doc.fontSize(16).fillColor('#8b5cf6')
    .text(typeLabel.toUpperCase(), 0, 160, { align: 'center', width: w, characterSpacing: 4 });

  // "This is to certify that"
  doc.fontSize(13).fillColor('#9ca3af')
    .text('This is to certify that', 0, 210, { align: 'center', width: w });

  // Participant Name
  doc.fontSize(38).fillColor('#d8b4fe')
    .text(participantName || 'Participant Name', 0, 240, { align: 'center', width: w });

  // Division
  if (division) {
    doc.fontSize(16).fillColor('#d1d5db')
      .text(`Division: ${division}`, 0, 295, { align: 'center', width: w });
  }

  // Event info
  const eventY = division ? 330 : 310;
  doc.fontSize(13).fillColor('#d1d5db')
    .text('has successfully participated in', 0, eventY, { align: 'center', width: w });

  doc.fontSize(20).fillColor('#ffffff')
    .text(eventName, 0, eventY + 25, { align: 'center', width: w });

  if (eventDate) {
    doc.fontSize(12).fillColor('#d1d5db')
      .text(`held on ${eventDate}`, 0, eventY + 55, { align: 'center', width: w });
  }

  // Footer
  const footerY = h - 100;
  const sigWidth = 140;
  const centerX = w / 2;

  // Signature lines
  doc.moveTo(centerX - 250, footerY).lineTo(centerX - 110, footerY)
    .lineWidth(0.5).strokeOpacity(0.5).stroke('#7c3aed');
  doc.moveTo(centerX - 70, footerY).lineTo(centerX + 70, footerY)
    .lineWidth(0.5).strokeOpacity(0.5).stroke('#7c3aed');
  doc.moveTo(centerX + 110, footerY).lineTo(centerX + 250, footerY)
    .lineWidth(0.5).strokeOpacity(0.5).stroke('#7c3aed');

  // Footer labels
  doc.fontSize(10).fillColor('#9ca3af')
    .text('Date of Issue', centerX - 250, footerY + 5, { width: sigWidth, align: 'center' });
  doc.fontSize(11).fillColor('#d1d5db')
    .text(eventDate || new Date().toLocaleDateString(), centerX - 250, footerY + 18, { width: sigWidth, align: 'center' });

  doc.fontSize(10).fillColor('#9ca3af')
    .text('Certificate No.', centerX - 70, footerY + 5, { width: sigWidth, align: 'center' });
  doc.fontSize(9).fillColor('#d1d5db')
    .text(certificateNumber || '', centerX - 70, footerY + 18, { width: sigWidth, align: 'center' });

  doc.fontSize(10).fillColor('#9ca3af')
    .text('HOD CSE AIML', centerX + 110, footerY + 5, { width: sigWidth, align: 'center' });
  doc.fontSize(11).fillColor('#d1d5db')
    .text('Coding Nexus', centerX + 110, footerY + 18, { width: sigWidth, align: 'center' });
}

export default generateCertificatePDF;
