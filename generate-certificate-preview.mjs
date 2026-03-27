import 'dotenv/config';
import { generateCareerBlueprintCertificate } from './server/utils/careerBlueprintCertificateGenerator.js';
import { fileURLToPath } from 'url';
import path from 'path';
import { createWriteStream, mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateCertificatePreview(name, filename) {
  try {
    console.log(`\n📄 Generating certificate for: ${name}`);
    
    const certDir = path.join(__dirname, 'certificates');
    if (!existsSync(certDir)) {
      mkdirSync(certDir, { recursive: true });
    }

    const issueDateFormatted = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const pdfDoc = await generateCareerBlueprintCertificate({
      participantName: name,
      issueDate: issueDateFormatted
    });

    const outputPath = path.join(certDir, filename);
    const fileStream = createWriteStream(outputPath);

    return new Promise((resolve, reject) => {
      pdfDoc.on('finish', () => {
        console.log(`   ✅ Certificate saved: ${outputPath}`);
        resolve(true);
      });

      pdfDoc.on('error', (err) => {
        console.error(`   ❌ PDF generation error: ${err.message}`);
        reject(err);
      });

      pdfDoc.pipe(fileStream);
    });

  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  try {
    console.log('🎫 Career Blueprint Certificates - Preview Generation');
    console.log('='.repeat(60));

    await generateCertificatePreview('Sarah Mathew', 'Sarah-Mathew-certificate.pdf');
    await generateCertificatePreview('Shravani Pande', 'Shravani-Pande-certificate.pdf');

    console.log('\n' + '='.repeat(60));
    console.log('✅ CERTIFICATES GENERATED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('\n📋 Generated Files:');
    console.log('   ✅ certificates/Sarah-Mathew-certificate.pdf');
    console.log('   ✅ certificates/Shravani-Pande-certificate.pdf');
    console.log('\n✨ Certificates with GOLDEN text overlay created!\n');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

main();
