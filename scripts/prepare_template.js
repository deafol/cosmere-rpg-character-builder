const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function prepareTemplate() {
    try {
        const inputPath = path.join(process.cwd(), 'public', 'character-sheet-template-expanded.pdf');
        const outputPath = path.join(process.cwd(), 'public', 'character-sheet-template.pdf');

        console.log(`Loading ${inputPath}...`);
        const pdfBytes = fs.readFileSync(inputPath);
        const pdfDoc = await PDFDocument.load(pdfBytes);

        const form = pdfDoc.getForm();
        // Check for fields
        // Check for fields using explicit PDFName
        // const PDFName = require('pdf-lib').PDFName; // Need this imports
        // But better: pdfDoc.catalog.lookup(PDFName.of('AcroForm'))

        // Let's rely on getForm(). If getForm works, form exists.
        // 1. Remove AcroForm from Catalog (Logical Form)
        try {
            // If we just want to NUKE it:
            pdfDoc.catalog.delete(require('pdf-lib').PDFName.of('AcroForm'));
            console.log("Deleted AcroForm dictionary.");
        } catch (e) {
            console.log("Error deleting AcroForm:", e);
        }

        // 2. Remove Widget Annotations from Pages (Visual Form)
        const pages = pdfDoc.getPages();
        pages.forEach((page, idx) => {
            const annots = page.node.Annots();
            if (annots) {
                console.log(`Page ${idx + 1}: Removing ${annots.size()} annotations (likely Widgets)...`);
                page.node.delete(require('pdf-lib').PDFName.of('Annots'));
            }
        });

        /*
        const fields = form.getFields();
        if (fields.length > 0) {
            console.log(`Found ${fields.length} form fields. Removing them...`);
            // Nuking fields via high level API seems flaky with rich text.
            // Nuking the AcroForm above is cleaner.
        }
        */

        const pdfBytesOut = await pdfDoc.save({ updateFieldAppearances: false });
        fs.writeFileSync(outputPath, pdfBytesOut);
        console.log(`Saved clean template to ${outputPath}`);

    } catch (e) {
        console.error("Error preparing template:", e);
    }
}

prepareTemplate();
