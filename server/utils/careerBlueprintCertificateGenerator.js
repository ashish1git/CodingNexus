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
 * Generate a certificate PDF dynamically for Career Blueprint event
 * Uses golden text for the participant name
 * 
 * @param {Object} options
 * @param {string} options.participantName - Name to display on certificate
 * @param {string} options.issueDate - Certificate issue date
 * @returns {Promise<PDFDocument>}
 */
export async function generateCareerBlueprintCertificate({
  participantName,
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

  console.log('📄 Career Blueprint Certificate Generator:');
  console.log('   Template path:', TEMPLATE_PATH);
  console.log('   Template exists:', hasTemplate);

  if (hasTemplate) {
    try {
      // Load template PNG and convert to JPEG for PDFKit compatibility
      const templatePng = fs.readFileSync(TEMPLATE_PATH);
      console.log('   Template PNG loaded, size:', templatePng.length, 'bytes');
      
      // Convert PNG to JPEG with sharp (PDFKit handles JPEG better)
      const templateBuffer = await sharp(templatePng, { failOnError: false })
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .jpeg({ quality: 95 })
        .toBuffer();
      console.log('   Template converted to JPEG, size:', templateBuffer.length, 'bytes');
      
      // Use converted template as background
      doc.image(templateBuffer, 0, 0, {
        width: pageWidth,
        height: pageHeight
      });

      // Overlay GOLDEN text on template
      overlayGoldenText(doc, {
        participantName,
        issueDate,
        pageWidth,
        pageHeight
      });
    } catch (imageError) {
      console.error('   ❌ Failed to load template image:', imageError.message);
      console.log('   Falling back to basic design');
      drawBasicCertificate(doc, {
        participantName,
        issueDate,
        pageWidth,
        pageHeight
      });
    }
  } else {
    console.error('❌ Template not found:', TEMPLATE_PATH);
    drawBasicCertificate(doc, {
      participantName,
      issueDate,
      pageWidth,
      pageHeight
    });
  }

  doc.end();
  return doc;
}

/**
 * Overlay GOLDEN text on Career Blueprint template
 */
function overlayGoldenText(doc, options) {
  const {
    participantName,
    issueDate,
    pageWidth,
    pageHeight
  } = options;

  // GOLDEN color for participant name (#FFD700 or similar)
  const goldenColor = '#FFD700';  // Gold
  const whiteColor = '#FFFFFF';  // White

  // ==================== PARTICIPANT NAME ====================
  // Position: Center on the blank line for name (around Y=390-400)
  // Font size adjusted for the template
  
  doc.fontSize(30)                    // Larger font for prominence
    .fillColor(goldenColor)           // GOLDEN color
    .font('Times-Bold')
    .text(participantName || 'Participant Name', 0, 328, {
      align: 'center',
      width: pageWidth
    });

  // ==================== ISSUE DATE (Bottom Right Corner) ====================
  if (issueDate) {
    doc.fontSize(9)
      .fillColor(whiteColor)
      .font('Helvetica')
      .text(`Date: ${issueDate}`, pageWidth - 170, pageHeight - 30, {
        align: 'right',
        width: 150
      });
  }
}

/**
 * Fallback basic certificate design
 */
function drawBasicCertificate(doc, options) {
  const {
    participantName,
    issueDate,
    pageWidth,
    pageHeight
  } = options;

  const w = pageWidth;
  const h = pageHeight;

  // Dark blue background
  doc.rect(0, 0, w, h).fill('#0d1b2a');

  // Border
  doc.rect(20, 20, w - 40, h - 40).lineWidth(3).stroke('#00d1ff');

  // Title
  doc.fontSize(48).fillColor('#00d1ff')
    .text('CERTIFICATE', 0, 100, { align: 'center', width: w });

  // Subtitle
  doc.fontSize(24).fillColor('#ffffff')
    .text('OF PARTICIPATION', 0, 160, { align: 'center', width: w });

  // Description
  doc.fontSize(14).fillColor('#ffffff')
    .text('This is to certify that', 0, 260, { align: 'center', width: w });

  // Name in golden
  doc.fontSize(32).fillColor('#FFD700')
    .font('Times-Bold')
    .text(participantName, 0, 310, { align: 'center', width: w });

  // Event description
  doc.fontSize(12).fillColor('#ffffff')
    .text('has participated in "The Career Blueprint"', 0, 390, { align: 'center', width: w });

  // Date
  if (issueDate) {
    doc.fontSize(10).fillColor('#00d1ff')
      .text(`Issued on: ${issueDate}`, 0, 470, { align: 'center', width: w });
  }
}

export default generateCareerBlueprintCertificate;
