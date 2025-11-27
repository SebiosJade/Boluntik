import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { API } from '../constants/Api';

// Web-specific imports for canvas generation
let html2canvas: any = null;

if (Platform.OS === 'web') {
  try {
    html2canvas = require('html2canvas');
  } catch (error) {
    console.warn('Web canvas library not available:', error);
  }
}


export interface CertificateData {
  id: string;
  certificateTitle: string;
  certificateIcon?: string;
  certificateColor?: string;
  certificateSubtitle?: string;
  eventTitle: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  awardedAt: string;
  volunteerName?: string;
  organizationName?: string;
  uniqueIdentifier?: string;
}

export interface PDFGenerationResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  error?: string;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

class PDFService {
  private static instance: PDFService;
  private apiUrl: string;

  private constructor() {
    this.apiUrl = API.BASE_URL;
  }

  public static getInstance(): PDFService {
    if (!PDFService.instance) {
      PDFService.instance = new PDFService();
    }
    return PDFService.instance;
  }

  /**
   * Generate certificate image (Web version)
   */
  public async generateCertificatePDFWeb(
    elementId: string,
    certificateData: CertificateData
  ): Promise<PDFGenerationResult> {
    try {
      if (Platform.OS !== 'web') {
        return {
          success: false,
          error: 'Web generation only available on web platform'
        };
      }

      console.log('Starting web certificate generation...');
      
      // Find the certificate element
      const element = document.getElementById(elementId);
      if (!element) {
        return {
          success: false,
          error: 'Certificate element not found'
        };
      }

      // Generate high-quality PNG image using html2canvas
      if (html2canvas) {
        const canvas = await html2canvas(element, {
          scale: 3, // High resolution for print quality
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: element.offsetWidth,
          height: element.offsetHeight
        });

        const imgData = canvas.toDataURL('image/png', 1.0); // Maximum quality
        const fileName = `certificate_${certificateData.id}_${Date.now()}.png`;
        
        // For web, return the data URL directly for download
        if (Platform.OS === 'web') {
          console.log('Web certificate generated successfully (data URL)');
          console.log('Image dimensions:', canvas.width, 'x', canvas.height);

          return {
            success: true,
            filePath: imgData, // Return data URL for web
            fileName
          };
        }
        
        // For mobile, save to file system
        const filePath = `file:///tmp/${fileName}`;
        
        try {
          const base64Data = imgData.split(',')[1];
          await FileSystem.writeAsStringAsync(filePath, base64Data, {
            encoding: 'base64' as any
          });
        } catch (encodingError) {
          console.error('Failed to save mobile certificate:', encodingError);
          throw encodingError;
        }

        console.log('Mobile certificate generated successfully:', filePath);
        console.log('Image dimensions:', canvas.width, 'x', canvas.height);

        return {
          success: true,
          filePath,
          fileName
        };
      }

      return {
        success: false,
        error: 'Web canvas library not available'
      };

    } catch (error) {
      console.error('Web generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }


  /**
   * Generate PDF from certificate component (Mobile version)
   */
  public async generateCertificatePDF(
    certificateRef: React.RefObject<ViewShot>,
    certificateData: CertificateData
  ): Promise<PDFGenerationResult> {
    try {
      if (!certificateRef.current) {
        return {
          success: false,
          error: 'Certificate reference not available'
        };
      }

      console.log('Starting certificate capture...');
      
      // Capture the certificate component as image with better options
      if (!certificateRef.current?.capture) {
        return {
          success: false,
          error: 'Certificate capture method not available'
        };
      }
      
      const imageUri = await certificateRef.current.capture();
      
      console.log('Certificate captured:', imageUri);
      
      if (!imageUri) {
        return {
          success: false,
          error: 'Failed to capture certificate image - no image URI returned'
        };
      }

      // Generate unique filename for high-quality PNG
      const fileName = `certificate_${certificateData.id}_${Date.now()}.png`;
      
      console.log('Platform:', Platform.OS);
      console.log('Using captured image URI directly:', imageUri);
      
      // Return the captured image URI directly - ViewShot already creates high-quality images
      return {
        success: true,
        filePath: imageUri,
        fileName
      };

    } catch (error) {
      console.error('Certificate generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Upload PDF to server
   */
  public async uploadCertificatePDF(
    filePath: string,
    fileName: string,
    certificateData: CertificateData,
    token: string
  ): Promise<UploadResult> {
    try {
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        return {
          success: false,
          error: 'File not found'
        };
      }

      // Prepare file for upload
      const file = {
        uri: filePath,
        type: fileName.endsWith('.pdf') ? 'application/pdf' : 'image/png',
        name: fileName,
      };

      // Create form data
      const formData = new FormData();
      formData.append('file', file as any);
      formData.append('certificateId', certificateData.id);
      formData.append('volunteerId', certificateData.volunteerName || '');
      formData.append('organizationName', certificateData.organizationName || '');
      formData.append('eventTitle', certificateData.eventTitle);

      // Upload to server
      const response = await fetch(`${this.apiUrl}/api/certificates/upload-pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          url: result.fileUrl
        };
      } else {
        return {
          success: false,
          error: result.message || 'Upload failed'
        };
      }

    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Share PDF file
   */
  public async shareCertificatePDF(filePath: string, fileName: string): Promise<void> {
    try {
      // Use Expo Sharing API
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'image/png',
          dialogTitle: 'Share Certificate'
        });
      } else {
        console.log('Sharing not available on this device');
        // Fallback: copy to clipboard or show file path
        console.log('File ready for sharing:', filePath);
      }
    } catch (error) {
      console.error('Share error:', error);
      throw error;
    }
  }

  /**
   * Delete temporary PDF file
   */
  public async deletePDF(filePath: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
      }
    } catch (error) {
      console.error('Delete PDF error:', error);
    }
  }

  /**
   * Get PDF file info
   */
  public async getPDFInfo(filePath: string): Promise<{ size: number; exists: boolean }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        return {
          size: fileInfo.size || 0,
          exists: true
        };
      }
      return {
        size: 0,
        exists: false
      };
    } catch (error) {
      console.error('Get PDF info error:', error);
      return {
        size: 0,
        exists: false
      };
    }
  }
}

export default PDFService;
