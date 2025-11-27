import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import PDFService, { CertificateData, PDFGenerationResult, UploadResult } from '../services/pdfService';
import { webAlert } from '../utils/webAlert';

// Cross-platform alert function
const showAlert = (title: string, message: string) => {
  webAlert(title, message);
};

interface CertificatePDFGeneratorProps {
  certificate: CertificateData;
  token: string;
  onPDFGenerated?: (result: PDFGenerationResult) => void;
  onPDFUploaded?: (result: UploadResult) => void;
  onError?: (error: string) => void;
}

export interface CertificatePDFGeneratorRef {
  generatePDF: (certificateRef: React.RefObject<ViewShot>) => Promise<void>;
  uploadPDF: (filePath: string) => Promise<void>;
  sharePDF: (filePath: string) => Promise<void>;
}

const CertificatePDFGenerator = forwardRef<CertificatePDFGeneratorRef, CertificatePDFGeneratorProps>(
  ({ certificate, token, onPDFGenerated, onPDFUploaded, onError }, ref) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [generatedPDFPath, setGeneratedPDFPath] = useState<string | null>(null);
    const [uploadedPDFUrl, setUploadedPDFUrl] = useState<string | null>(null);

    const pdfService = PDFService.getInstance();

    const generatePDF = async (certificateRef: React.RefObject<ViewShot>) => {
      try {
        setIsGenerating(true);
        
        if (!certificateRef.current) {
          throw new Error('Certificate reference not found');
        }

        const result: PDFGenerationResult = await pdfService.generateCertificatePDF(
          certificateRef,
          certificate
        );

        if (result.success && result.filePath) {
          setGeneratedPDFPath(result.filePath);
          onPDFGenerated?.(result);
          showAlert('Success', `Certificate image generated successfully: ${result.fileName}`);
        } else {
          const errorMessage = result.error || 'Failed to generate certificate image';
          onError?.(errorMessage);
          showAlert('Error', errorMessage);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        onError?.(errorMessage);
        showAlert('Error', errorMessage);
      } finally {
        setIsGenerating(false);
      }
    };

    const uploadPDF = async (filePath: string) => {
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
          onPDFUploaded?.(result);
          showAlert('Success', 'Certificate uploaded successfully!');
        } else {
          const errorMessage = result.error || 'Failed to upload PDF';
          onError?.(errorMessage);
          showAlert('Error', errorMessage);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        onError?.(errorMessage);
        showAlert('Error', errorMessage);
      } finally {
        setIsUploading(false);
      }
    };

    const sharePDF = async (filePath: string) => {
      try {
        setIsSharing(true);
        await pdfService.shareCertificatePDF(filePath, `certificate_${certificate.id}.pdf`);
        showAlert('Success', 'Certificate is ready for sharing!');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Share failed';
        onError?.(errorMessage);
        showAlert('Error', errorMessage);
      } finally {
        setIsSharing(false);
      }
    };

    const handleGenerateAndUpload = async () => {
      if (generatedPDFPath) {
        await uploadPDF(generatedPDFPath);
      } else {
        showAlert('Error', 'Please generate certificate image first');
      }
    };

    const handleDeletePDF = async () => {
      if (generatedPDFPath) {
        try {
          await pdfService.deletePDF(generatedPDFPath);
          setGeneratedPDFPath(null);
          setUploadedPDFUrl(null);
          showAlert('Success', 'Certificate file deleted successfully');
        } catch (error) {
          showAlert('Error', 'Failed to delete PDF');
        }
      }
    };

    useImperativeHandle(ref, () => ({
      generatePDF,
      uploadPDF,
      sharePDF,
    }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Certificate Export Options</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.generateButton]}
            onPress={() => {
              // This will be handled by the parent component
              showAlert('Info', 'Please use the generate button in the certificate preview');
            }}
            disabled={isGenerating}
          >
            <Ionicons 
              name="image" 
              size={20} 
              color="#FFFFFF" 
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>
              {isGenerating ? 'Generating...' : 'Generate Certificate Image'}
            </Text>
            {isGenerating && <ActivityIndicator size="small" color="#FFFFFF" style={styles.loader} />}
          </TouchableOpacity>

          {generatedPDFPath && (
            <>
              <TouchableOpacity
                style={[styles.button, styles.uploadButton]}
                onPress={handleGenerateAndUpload}
                disabled={isUploading}
              >
                <Ionicons 
                  name="cloud-upload" 
                  size={20} 
                  color="#FFFFFF" 
                  style={styles.buttonIcon}
                />
                <Text style={styles.buttonText}>
                  {isUploading ? 'Uploading...' : 'Upload to Server'}
                </Text>
                {isUploading && <ActivityIndicator size="small" color="#FFFFFF" style={styles.loader} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.shareButton]}
                onPress={() => sharePDF(generatedPDFPath)}
                disabled={isSharing}
              >
                <Ionicons 
                  name="share" 
                  size={20} 
                  color="#FFFFFF" 
                  style={styles.buttonIcon}
                />
                <Text style={styles.buttonText}>
                  {isSharing ? 'Preparing...' : 'Share Certificate'}
                </Text>
                {isSharing && <ActivityIndicator size="small" color="#FFFFFF" style={styles.loader} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={handleDeletePDF}
              >
                <Ionicons 
                  name="trash" 
                  size={20} 
                  color="#FFFFFF" 
                  style={styles.buttonIcon}
                />
                <Text style={styles.buttonText}>Delete File</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {generatedPDFPath && (
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.statusText}>Certificate Image Generated</Text>
            </View>
            {uploadedPDFUrl && (
              <View style={styles.statusItem}>
                <Ionicons name="cloud-done" size={16} color="#3B82F6" />
                <Text style={styles.statusText}>Uploaded to Server</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  }
);

CertificatePDFGenerator.displayName = 'CertificatePDFGenerator';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 48,
  },
  generateButton: {
    backgroundColor: '#3B82F6',
  },
  uploadButton: {
    backgroundColor: '#10B981',
  },
  shareButton: {
    backgroundColor: '#8B5CF6',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loader: {
    marginLeft: 8,
  },
  statusContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default CertificatePDFGenerator;
