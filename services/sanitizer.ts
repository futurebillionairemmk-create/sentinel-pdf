
import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

/**
 * PDF Sanitizer: The "Neutralizer"
 * Rasterizes every page into a clean image and rebuilds a new, script-free PDF.
 */
export const sanitizeAndFlatten = async (
    file: File,
    onProgress: (progress: number) => void
): Promise<Blob> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    const doc = new jsPDF();

    for (let i = 1; i <= numPages; i++) {
        onProgress(Math.round((i / numPages) * 100));

        const page = await pdf.getPage(i);
        const scale = 2; // High DPI for quality
        const viewport = page.getViewport({ scale });

        // Create an offscreen canvas for rasterization
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error("Could not create canvas context");

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render page to canvas
        await page.render({ canvasContext: context, viewport, canvas: canvas }).promise;

        // Convert to JPEG (strips all interactive elements, layers, and scripts)
        const imgData = canvas.toDataURL('image/jpeg', 0.85);

        // Add to new PDF
        const imgWidth = doc.internal.pageSize.getWidth();
        const imgHeight = (viewport.height * imgWidth) / viewport.width;

        if (i > 1) doc.addPage();
        doc.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
    }

    return doc.output('blob');
};
