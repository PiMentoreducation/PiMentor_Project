const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const generateMonthlyPDF = (studentData, courseTitle, reportData, overallScore, res = null) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    if (res) doc.pipe(res);

    // --- Header ---
    const logoPath = path.join(__dirname, '../public/images/OUR_LOGO.jpeg');
    if (fs.existsSync(logoPath)) doc.image(logoPath, 50, 45, { width: 50 });
    
    doc.fillColor('#7c4dff').fontSize(25).font('Helvetica-Bold').text('PiMentor', 110, 57);
    doc.fontSize(10).fillColor('#666666').font('Helvetica').text('The Galaxy of Mathematical Excellence', 110, 85);
    doc.moveTo(50, 110).lineTo(550, 110).strokeColor('#eeeeee').stroke();

    // Watermark
    doc.save().opacity(0.05).fontSize(60).fillColor('black').text('PIMENTOR ORIGINAL', 100, 350, { rotation: 45 });
    doc.restore();

    // Details
    doc.moveDown(4);
    doc.fillColor('#333333').fontSize(12).font('Helvetica-Bold').text(`STUDENT: ${studentData.name.toUpperCase()}`);
    doc.text(`COURSE: ${courseTitle.toUpperCase()}`);
    doc.fontSize(10).font('Helvetica').text(`Generated on: ${new Date().toLocaleDateString()}`);

    // --- The Table Grid ---
    const startX = 50;
    const col1 = 60;  // Title
    const col2 = 380; // Status
    const col3 = 490; // Score
    let rowY = 240;

    // Header Background
    doc.rect(startX, rowY, 500, 25).fill('#7c4dff');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);
    
    // Explicitly place header text
    doc.text('LECTURE TITLE', col1, rowY + 7, { baseline: 'top' });
    doc.text('STATUS', col2, rowY + 7, { baseline: 'top' });
    doc.text('SCORE', col3, rowY + 7, { baseline: 'top' });

    rowY += 25;
    doc.font('Helvetica').fontSize(10);

    reportData.forEach((item, index) => {
        // Stripe
        if (index % 2 === 0) {
            doc.save().fillColor('#f9f9f9').rect(startX, rowY, 500, 25).fill().restore();
        }

        doc.fillColor('#333333');
        // Force every column to start at the exact same rowY + 7
        doc.text(item.title, col1, rowY + 7, { width: 300, height: 15, lineBreak: false, baseline: 'top' });
        doc.text(item.isVideoCompleted ? 'WATCHED' : 'PENDING', col2, rowY + 7, { baseline: 'top' });
        
        const score = (item.highestQuizScore === -1) ? 'N/A' : `${item.highestQuizScore}/10`;
        doc.text(score, col3, rowY + 7, { baseline: 'top' });
        
        rowY += 25;
        if (rowY > 700) { doc.addPage(); rowY = 50; }
    });

    // --- Summary & Signature ---
    let finalY = rowY + 30;
    doc.moveTo(startX, finalY).lineTo(550, finalY).strokeColor('#eeeeee').stroke();
    doc.fontSize(16).fillColor('#7c4dff').font('Helvetica-Bold').text(`Overall Aggregate: ${overallScore}%`, 50, finalY + 15, { align: 'right', width: 500 });

    const sigY = 740;
    const signPath = path.join(__dirname, '../public/images/hodsign.jpg');
    if (fs.existsSync(signPath)) doc.image(signPath, 435, sigY - 45, { width: 70 });
    
    doc.moveTo(410, sigY).lineTo(540, sigY).strokeColor('#333').stroke();
    doc.fontSize(9).fillColor('#000').font('Helvetica-Bold').text('Harsh Vardhan Vishwakarma', 390, sigY + 8, { align: 'right', width: 150 });
    doc.fontSize(7).font('Helvetica').text('Founder / HOD Mathematical Sciences', 390, sigY + 20, { align: 'right', width: 150 });

    doc.end();
};

module.exports = { generateMonthlyPDF };