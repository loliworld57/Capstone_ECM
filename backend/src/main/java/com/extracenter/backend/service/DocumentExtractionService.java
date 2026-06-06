package com.extracenter.backend.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.net.URL;

@Service
public class DocumentExtractionService {

    public String extractTextFromUrl(String fileUrl) throws Exception {
        // 1. Open a connection to the Cloudinary URL
        URL url = new URL(fileUrl);

        // 2. Read the file stream directly into memory (using try-with-resources to
        // prevent memory leaks)
        try (InputStream inputStream = url.openStream()) {

            String lowerCaseUrl = fileUrl.toLowerCase();

            // 3. Check if it's a PDF
            if (lowerCaseUrl.endsWith(".pdf")) {
                try (PDDocument document = PDDocument.load(inputStream)) {
                    PDFTextStripper stripper = new PDFTextStripper();
                    return stripper.getText(document);
                }
            }
            // 4. Check if it's a Word Document
            else if (lowerCaseUrl.endsWith(".docx")) {
                try (XWPFDocument document = new XWPFDocument(inputStream)) {
                    XWPFWordExtractor extractor = new XWPFWordExtractor(document);
                    return extractor.getText();
                }
            }
            // 5. Fallback for unsupported types
            else {
                throw new IllegalArgumentException(
                        "AI extraction is currently only supported for .pdf and .docx files.");
            }
        }
    }
}