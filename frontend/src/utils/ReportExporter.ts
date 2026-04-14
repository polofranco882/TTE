import * as XLSX from 'xlsx';

/**
 * Utility for exporting data to Excel format.
 */
export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Report') => {
    try {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        
        // Generate buffer and download
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
        return true;
    } catch (error) {
        console.error('Excel Export Error:', error);
        return false;
    }
};

/**
 * Utility for exporting multiple datasets to a single Excel workbook with multiple sheets.
 */
export const exportMultiSheetExcel = (sheets: { data: any[], name: string }[], fileName: string) => {
    try {
        const workbook = XLSX.utils.book_new();
        
        sheets.forEach(sheet => {
            const worksheet = XLSX.utils.json_to_sheet(sheet.data);
            XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
        });
        
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
        return true;
    } catch (error) {
        console.error('Multi-sheet Excel Export Error:', error);
        return false;
    }
};

/**
 * Simple PDF Export trigger (using browser's print to PDF)
 * Optimized via @media print CSS in the dashboard components.
 */
export const exportToPDF = (title: string) => {
    const originalTitle = document.title;
    document.title = title;
    window.print();
    document.title = originalTitle;
};
