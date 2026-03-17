const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// We pass 'res' as an optional argument to stream directly to browser
const generateMonthlyPDF = (studentData, courseTitle, reportData, overallScore, res = null) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // If 'res' is provided, pipe the PDF directly to the browser download
    if (res) {
        doc.pipe(res);
    }

    // Header: Logo
    const logoPath = path.join(__dirname, '../public/images/OUR_LOGO.png');
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
    doc.fillColor('#333333').fontSize(14).font('Helvetica-Bold').text(`STUDENT: ${studentData.name.toUpperCase()}`);
    doc.text(`COURSE: ${courseTitle.toUpperCase()}`);
    doc.fontSize(10).font('Helvetica').text(`Generated on: ${new Date().toLocaleDateString()}`);

    // Table Header
    const tableTop = 260;
    doc.rect(50, tableTop, 500, 20).fill('#7c4dff');
    doc.fillColor('#ffffff').text('LECTURE TITLE', 60, tableTop + 6);
    doc.text('STATUS', 350, tableTop + 6);
    doc.text('SCORE', 480, tableTop + 6);

    // Table Rows
    let y = tableTop + 25;
    reportData.forEach((item, index) => {
        doc.fillColor('#333333');
        if (index % 2 === 0) doc.rect(50, y - 5, 500, 20).fill('#f9f9f9');
        doc.fillColor('#333333').text(item.title, 60, y);
        doc.text(item.isVideoCompleted ? 'COMPLETED' : 'PENDING', 350, y);
        doc.text(item.highestQuizScore >= 0 ? `${item.highestQuizScore}/10` : 'N/A', 480, y);
        y += 20;
    });

    // Final Aggregate
    doc.moveDown(2);
    doc.fontSize(16).fillColor('#7c4dff').font('Helvetica-Bold').text(`Overall Aggregate: ${overallScore}%`, { align: 'right' });

    // Signature Area
    const footerTop = 700;
    const signPath = path.join(__dirname, '../public/images/hodsign.jpg');
    if (fs.existsSync(signPath)) {
        doc.image(signPath, 420, footerTop - 40, { width: 80 });
    }
    doc.moveTo(400, footerTop).lineTo(530, footerTop).strokeColor('#333').stroke();
    doc.fontSize(10).fillColor('#000').text('Harsh Vardhan Vishwakarma', 380, footerTop + 10, { align: 'right', width: 150 });
    doc.fontSize(8).text('Founder / HOD Mathematical Sciences', 380, footerTop + 25, { align: 'right', width: 150 });

    doc.end();
};

module.exports = { generateMonthlyPDF };