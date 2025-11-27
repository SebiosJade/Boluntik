import { useCallback, useState } from 'react';
import ViewShot from 'react-native-view-shot';
import PDFService, { CertificateData, PDFGenerationResult, UploadResult } from '../services/pdfService';
import { webAlert } from '../utils/webAlert';

interface UsePDFGenerationProps {
  certificate: CertificateData;
  token: string;
}

interface UsePDFGenerationReturn {
  isGenerating: boolean;
  isUploading: boolean;
  generatedPDFPath: string | null;
  uploadedPDFUrl: string | null;
  generatePDF: (certificateRef: React.RefObject<ViewShot>) => Promise<void>;
  uploadPDF: (filePath: string) => Promise<void>;
  sharePDF: (filePath: string) => Promise<void>;
  deletePDF: (filePath: string) => Promise<void>;
  reset: () => void;
}

export const usePDFGeneration = ({ certificate, token }: UsePDFGenerationProps): UsePDFGenerationReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [generatedPDFPath, setGeneratedPDFPath] = useState<string | null>(null);
  const [uploadedPDFUrl, setUploadedPDFUrl] = useState<string | null>(null);

  const pdfService = PDFService.getInstance();

  const generatePDF = useCallback(async (certificateRef: React.RefObject<ViewShot>) => {
    try {
      setIsGenerating(true);
      
      const result: PDFGenerationResult = await pdfService.generateCertificatePDF(
        certificateRef,
        certificate
      );

      if (result.success && result.filePath) {
        setGeneratedPDFPath(result.filePath);
        webAlert('Success', `PDF generated successfully: ${result.fileName}`);
      } else {
        const errorMessage = result.error || 'Failed to generate PDF';
        webAlert('Error', errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      webAlert('Error', errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [certificate, pdfService]);

  const uploadPDF = useCallback(async (filePath: string) => {
    try {
      setIsUploading(true);
      
      const result: UploadResult = await pdfService.uploadCertificatePDF(
        filePath,
        `certificate_${certificate.id}_${Date.now()}.pdf`,
        certificate,
        token
      );

      if (result.success && result.url) {
        setUploadedPDFUrl(result.url);
        webAlert('Success', 'PDF uploaded successfully!');
      } else {
        const errorMessage = result.error || 'Failed to upload PDF';
        webAlert('Error', errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      webAlert('Error', errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [certificate, token, pdfService]);

  const sharePDF = useCallback(async (filePath: string) => {
    try {
      await pdfService.shareCertificatePDF(filePath, `certificate_${certificate.id}.pdf`);
      webAlert('Success', 'PDF is ready for sharing!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Share failed';
      webAlert('Error', errorMessage);
    }
  }, [certificate, pdfService]);

  const deletePDF = useCallback(async (filePath: string) => {
    try {
      await pdfService.deletePDF(filePath);
      setGeneratedPDFPath(null);
      setUploadedPDFUrl(null);
      webAlert('Success', 'PDF deleted successfully');
    } catch (error) {
      webAlert('Error', 'Failed to delete PDF');
    }
  }, [pdfService]);

  const reset = useCallback(() => {
    setGeneratedPDFPath(null);
    setUploadedPDFUrl(null);
    setIsGenerating(false);
    setIsUploading(false);
  }, []);

  return {
    isGenerating,
    isUploading,
    generatedPDFPath,
    uploadedPDFUrl,
    generatePDF,
    uploadPDF,
    sharePDF,
    deletePDF,
    reset,
  };
};
