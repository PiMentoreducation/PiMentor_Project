const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const generateMonthlyPDF = (studentData, courseTitle, reportData, overallScore, res = null) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    if (res) doc.pipe(res);

    // --- Header Section ---
    const logoPath = path.join(__dirname, '../public/images/OUR_LOGO.jpeg');
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 50 });
    }
    
    doc.fillColor('#7c4dff').fontSize(25).font('Helvetica-Bold').text('PiMentor', 110, 57);
    doc.fontSize(10).fillColor('#666666').font('Helvetica').text('The Galaxy of Mathematical Excellence', 110, 85);
    doc.moveTo(50, 110).lineTo(550, 110).strokeColor('#eeeeee').stroke();

    // Watermark
    doc.save().opacity(0.05).fontSize(60).fillColor('black').text('PIMENTOR ORIGINAL', 100, 350, { rotation: 45 });
    doc.restore();

    // Student/Course Detail
    doc.moveDown(4);
    doc.fillColor('#333333').fontSize(12).font('Helvetica-Bold').text(`STUDENT: ${studentData.name.toUpperCase()}`);
    doc.text(`COURSE: ${courseTitle.toUpperCase()}`);
    doc.fontSize(10).font('Helvetica').text(`Generated on: ${new Date().toLocaleDateString()}`);

    // --- Table Alignment Logic ---
    const col1 = 60;  // Lecture Title
    const col2 = 350; // Status
    const col3 = 470; // Score
    let tableTop = 240;

    // Table Header Background
    doc.rect(50, tableTop, 500, 25).fill('#7c4dff');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);
    doc.text('LECTURE TITLE', col1, tableTop + 8);
    doc.text('STATUS', col2, tableTop + 8);
    doc.text('SCORE', col3, tableTop + 8);

    // Table Rows
    let y = tableTop + 25;
    doc.font('Helvetica').fontSize(10);

    reportData.forEach((item, index) => {
        // Stripe background for even rows
        if (index % 2 === 0) {
            doc.fillColor('#f9f9f9').rect(50, y, 500, 25).fill();
        }

        doc.fillColor('#333333');
        // We use { width } to ensure text wraps instead of overlapping columns
        doc.text(item.title, col1, y + 8, { width: 280, lineBreak: false });
        doc.text(item.isVideoCompleted ? 'WATCHED' : 'PENDING', col2, y + 8);
        
        const scoreText = (item.highestQuizScore === -1) ? 'N/A' : `${item.highestQuizScore}/10`;
        doc.text(scoreText, col3, y + 8);
        
        y += 25;

        // Page break logic
        if (y > 700) {
            doc.addPage();
            y = 50; 
        }
    });

    // --- Footer & Aggregate Section ---
    // Ensure aggregate starts after the last row
    let aggregateY = y + 20;
    if (aggregateY > 750) {
        doc.addPage();
        aggregateY = 50;
    }

    doc.moveTo(50, aggregateY).lineTo(550, aggregateY).strokeColor('#eeeeee').stroke();
    doc.moveDown();
    doc.fontSize(16).fillColor('#7c4dff').font('Helvetica-Bold').text(`Overall Aggregate: ${overallScore}%`, { align: 'right' });

    // Signature Area
    const footerTop = 730;
    const signPath = path.join(__dirname, '../public/images/hodsign.jpg');
    if (fs.existsSync(signPath)) {
        doc.image(signPath, 420, footerTop - 45, { width: 80 });
    }
    doc.moveTo(400, footerTop).lineTo(530, footerTop).strokeColor('#333').stroke();
    doc.fontSize(10).fillColor('#000').font('Helvetica-Bold').text('Harsh Vardhan Vishwakarma', 380, footerTop + 8, { align: 'right', width: 150 });
    doc.fontSize(8).font('Helvetica').text('Founder / HOD Mathematical Sciences', 380, footerTop + 22, { align: 'right', width: 150 });

    doc.end();
};

module.exports = { generateMonthlyPDF };