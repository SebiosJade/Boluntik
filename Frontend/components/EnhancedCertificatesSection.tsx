import { Ionicons } from '@expo/vector-icons';
import { memo, useEffect, useRef, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { API } from '../constants/Api';
import PDFService from '../services/pdfService';
import { webAlert } from '../utils/webAlert';

interface Certificate {
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

interface EnhancedCertificatesSectionProps {
  userId: string;
  token: string;
}

// Cross-platform alert function
const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    webAlert(title, message);
  } else {
    Alert.alert(title, message);
  }
};

// Certificate Preview Content Component
const CertificatePreviewContent = ({ certificate, token }: { certificate: Certificate; token: string }) => {
  const certificateRef = useRef<ViewShot>(null);
  const pdfService = PDFService.getInstance();
  const [generatedFilePath, setGeneratedFilePath] = useState<string | null>(null);

  const handleGeneratePDF = async () => {
    try {
      
      let result;

      if (Platform.OS === 'web') {
        // Web image generation using html2canvas
        const elementId = `certificate-${certificate.id}`;
        result = await pdfService.generateCertificatePDFWeb(elementId, certificate);
      } else {
        // Mobile PDF generation using ViewShot
        if (!certificateRef.current) {
          showAlert('Error', 'Certificate reference not found');
          return;
        }

        // Add a small delay to ensure the component is fully rendered
        setTimeout(async () => {
          try {
            if (!certificateRef.current) {
              showAlert('Error', 'Certificate reference not available');
              return;
            }
            const result = await pdfService.generateCertificatePDF(certificateRef as React.RefObject<ViewShot>, certificate);
            
            if (result.success && result.filePath) {
              setGeneratedFilePath(result.filePath);
              showAlert('Success', `Certificate generated successfully: ${result.fileName}`);
            } else {
              showAlert('Error', result.error || 'Failed to generate certificate');
            }
          } catch (error) {
            showAlert('Error', `Failed to generate certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }, 1000);
        return;
      }
      
      // Handle web result
      
      if (result.success && result.filePath) {
        setGeneratedFilePath(result.filePath);
        showAlert('Success', `Certificate generated successfully: ${result.fileName}`);
      } else {
        showAlert('Error', result.error || 'Failed to generate certificate');
      }
    } catch (error) {
      showAlert('Error', 'Failed to generate certificate');
    }
  };




  const handleShare = async () => {
    if (!generatedFilePath) {
      showAlert('Error', 'Please generate certificate first');
      return;
    }

    if (Platform.OS === 'web') {
      // Web download functionality - handle data URL
      try {
        // For web, generatedFilePath is a data URL
        if (generatedFilePath.startsWith('data:')) {
          // Create download link with data URL
          const link = document.createElement('a');
          link.href = generatedFilePath;
          link.download = `certificate_${certificate.id}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showAlert('Success', 'Certificate downloaded successfully!');
        } else {
          showAlert('Error', 'Invalid certificate data');
        }
      } catch (error) {
        showAlert('Error', 'Failed to download certificate');
      }
    } else {
      // Mobile sharing
      try {
        await pdfService.shareCertificatePDF(generatedFilePath, `certificate_${certificate.id}.png`);
        showAlert('Success', 'Certificate is ready for sharing!');
      } catch (error) {
        showAlert('Error', 'Failed to share certificate');
      }
    }
  };

  return (
    <ScrollView style={styles.previewScrollView} contentContainerStyle={styles.previewContent}>
      {/* Certificate Content for PDF Generation */}
      <ViewShot ref={certificateRef} options={{ format: "png", quality: 1.0, result: "tmpfile" }}>
        <View 
          id={`certificate-${certificate.id}`}
          style={[
            styles.certificatePreviewCard,
            { borderColor: certificate.certificateColor || "#1E40AF" }
          ]}
        >
        {/* Decorative Border Elements */}
        <View style={styles.certificateBorderDecorations}>
          <View style={[styles.cornerDecoration, styles.topLeft]} />
          <View style={[styles.cornerDecoration, styles.topRight]} />
          <View style={[styles.cornerDecoration, styles.bottomLeft]} />
          <View style={[styles.cornerDecoration, styles.bottomRight]} />
        </View>

        {/* Certificate Header */}
        <View style={styles.certificatePreviewHeader}>
          <View style={[
            styles.certificatePreviewIcon,
            { backgroundColor: certificate.certificateColor || "#1E40AF" }
          ]}>
            <Ionicons 
              name={certificate.certificateIcon as any || "ribbon"} 
              size={32} 
              color="#FFFFFF" 
            />
          </View>
          <View style={styles.certificatePreviewInfo}>
            <Text style={[
              styles.certificatePreviewCertificateTitle,
              { color: certificate.certificateColor || "#1E40AF" }
            ]}>
              {certificate.certificateTitle || "CERTIFICATE OF VOLUNTEER SERVICE"}
            </Text>
            <Text style={styles.certificatePreviewSubtitle}>
              {certificate.certificateSubtitle || "This certifies outstanding volunteer contribution"}
            </Text>
          </View>
        </View>

        {/* Decorative Line */}
        <View style={[styles.decorativeLine, { backgroundColor: certificate.certificateColor || "#1E40AF" }]} />
        
        {/* Certificate Body */}
        <View style={styles.certificatePreviewBody}>
          <View style={styles.recipientSection}>
            <Text style={styles.certificatePreviewVolunteerName}>
              {certificate.volunteerName || 'Volunteer Name'}
            </Text>
            <View style={styles.nameUnderline} />
          </View>
          
          <Text style={styles.certificatePreviewText}>
            has successfully completed and demonstrated outstanding participation in
          </Text>
          
          <View style={styles.eventHighlight}>
            <Text style={styles.certificatePreviewEventName}>
              "{certificate.eventTitle}"
            </Text>
          </View>

          <Text style={styles.certificatePreviewEventDetails}>
            {(() => {
              const formatDate = (dateString: any) => {
                if (!dateString) return 'Date not specified';
                
                try {
                  let date: Date;
                  
                  // Handle different date formats
                  if (dateString instanceof Date) {
                    date = dateString;
                  } else if (typeof dateString === 'string' && dateString.includes('/')) {
                    // MM/DD/YYYY format from database
                    const [month, day, year] = dateString.split('/');
                    date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                  } else if (typeof dateString === 'string' && dateString.includes('-')) {
                    // YYYY-MM-DD format
                    date = new Date(dateString);
                  } else {
                    date = new Date(dateString);
                  }
                  
                  if (isNaN(date.getTime())) {
                    return 'Date not specified';
                  }
                  
                  return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });
                } catch {
                  return 'Date not specified';
                }
              };

              const eventDate = formatDate(certificate.eventDate);
              const eventTime = certificate.eventTime && certificate.eventTime !== 'TBD' ? certificate.eventTime : null;
              const eventLocation = certificate.eventLocation && certificate.eventLocation !== 'TBD' ? certificate.eventLocation : null;
              const awardedDate = new Date(certificate.awardedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });

              let detailsText = `The event took place on ${eventDate}`;
              
              if (eventTime) {
                detailsText += ` at ${eventTime}`;
              }
              
              if (eventLocation) {
                detailsText += ` in ${eventLocation}`;
              }
              
              detailsText += `. Certificate awarded on ${awardedDate}.`;
              
              return detailsText;
            })()}
          </Text>

          {/* Optional Message Section */}
          {(certificate as any).message && (certificate as any).message.trim() !== '' && (
            <View style={{ 
              marginTop: 16, 
              marginBottom: 16,
              padding: 16, 
              backgroundColor: '#F9FAFB', 
              borderRadius: 8,
              borderLeftWidth: 4,
              borderLeftColor: certificate.certificateColor || '#8B5CF6'
            }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                Special Recognition:
              </Text>
              <Text style={{ fontSize: 14, color: '#1F2937', lineHeight: 22, fontStyle: 'italic' }}>
                "{(certificate as any).message}"
              </Text>
            </View>
          )}
        </View>
        
        {/* Certificate Footer */}
        <View style={styles.certificatePreviewFooter}>
          <View style={styles.footerDivider} />
          <View style={styles.organizationSection}>
            <Text style={styles.certificatePreviewOrganization}>
              {certificate.organizationName || 'Organization Name'}
            </Text>
            <Text style={styles.organizationLabel}>Organization</Text>
          </View>
          
          <View style={styles.dateSection}>
            <Text style={styles.certificatePreviewDate}>
              {new Date(certificate.awardedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
            <Text style={styles.dateLabel}>Date Awarded</Text>
          </View>

          {certificate.uniqueIdentifier && (
            <View style={styles.certificateIdSection}>
              <Text style={styles.certificateIdLabel}>Certificate ID</Text>
              <Text style={styles.certificateId}>
                {certificate.uniqueIdentifier}
              </Text>
            </View>
          )}
        </View>
        </View>
      </ViewShot>

      {/* Action Buttons */}
      <View style={styles.generateButtonContainer}>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleGeneratePDF}
        >
          <Ionicons name="image" size={20} color="#FFFFFF" style={styles.generateButtonIcon} />
          <Text style={styles.generateButtonText}>
            Generate Certificate
          </Text>
        </TouchableOpacity>


        {/* Action buttons - show after generation */}
        {generatedFilePath && (
          <View style={styles.actionButtonsContainer}>
            {Platform.OS === 'web' ? (
              <TouchableOpacity
                style={[styles.certificateActionButton, styles.downloadButton]}
                onPress={handleShare}
              >
                <Ionicons name="download" size={16} color="#FFFFFF" />
                <Text style={styles.certificateActionButtonText}>Download</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.certificateActionButton, styles.shareButton]}
                onPress={handleShare}
              >
                <Ionicons name="share" size={16} color="#FFFFFF" />
                <Text style={styles.certificateActionButtonText}>Share</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

    </ScrollView>
  );
};

const EnhancedCertificatesSection = memo<EnhancedCertificatesSectionProps>(({ userId, token }) => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);

  useEffect(() => {
    loadCertificates();
  }, [userId]);

  const loadCertificates = async () => {
    try {
      const apiUrl = API.BASE_URL;
      const response = await fetch(`${apiUrl}/api/certificates/volunteer/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success) {
        // Sort certificates by awardedAt date (newest first)
        const sortedCertificates = (data.certificates || []).sort((a: any, b: any) => {
          const dateA = new Date(a.awardedAt).getTime();
          const dateB = new Date(b.awardedAt).getTime();
          return dateB - dateA; // Newest first
        });
        setCertificates(sortedCertificates);
      }
    } catch (error) {
      console.error('Error loading certificates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = async (certificate: Certificate) => {
    try {
      const apiUrl = API.BASE_URL;
      
      const response = await fetch(`${apiUrl}/api/certificates/generate/${userId}/${certificate.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setPreviewCert(data.certificate);
        setShowPreview(true);
      } else {
        webAlert('Error', data.message || 'Failed to load certificate');
      }
    } catch (error) {
      webAlert('Error', 'Failed to load certificate');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading certificates...</Text>
      </View>
    );
  }

  if (certificates.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="ribbon-outline" size={48} color="#D1D5DB" />
        </View>
        <Text style={styles.emptyTitle}>No Certificates Yet</Text>
        <Text style={styles.emptySubtitle}>Complete volunteer events to earn certificates!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Certificates</Text>
        <View style={styles.countContainer}>
          <Ionicons name="ribbon" size={16} color="#8B5CF6" />
          <Text style={styles.count}>{certificates.length}</Text>
        </View>
      </View>

      {/* Certificates Grid */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.certificatesContainer}>
          {certificates.map((certificate, index) => (
            <TouchableOpacity
              key={certificate.id}
              style={styles.certificateCard}
              onPress={() => handlePreview(certificate)}
              activeOpacity={0.8}
            >
              <View style={[styles.certificateIcon, { backgroundColor: `${certificate.certificateColor || '#8B5CF6'}20` }]}>
                <Ionicons 
                  name={certificate.certificateIcon as any || "ribbon"} 
                  size={28} 
                  color={certificate.certificateColor || '#8B5CF6'} 
                />
              </View>
              
              <View style={styles.certificateContent}>
                <Text style={styles.certificateTitle} numberOfLines={2}>
                  {certificate.certificateTitle || 'Certificate'}
                </Text>
                <Text style={styles.eventTitle} numberOfLines={1}>
                  {certificate.eventTitle}
                </Text>
                <Text style={styles.awardDate}>
                  {new Date(certificate.awardedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
              </View>

              <View style={styles.actionButton}>
                <Ionicons name="eye" size={16} color="#8B5CF6" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Preview Modal */}
      <Modal visible={showPreview} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPreview(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Certificate Preview</Text>
            <View style={styles.placeholder} />
          </View>
          {previewCert && (
            <CertificatePreviewContent certificate={previewCert} token={token} />
          )}
        </View>
      </Modal>
    </View>
  );
});

EnhancedCertificatesSection.displayName = 'EnhancedCertificatesSection';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F0FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  count: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  scrollView: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  certificatesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  certificateCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  certificateIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  certificateContent: {
    alignItems: 'center',
    marginBottom: 12,
  },
  certificateTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 18,
  },
  eventTitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  awardDate: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#F3F0FF',
    borderRadius: 8,
    marginBottom: 8,
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 16,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 24,
  },
  previewText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Enhanced Certificate Preview Styles
  previewScrollView: {
    flex: 1,
  },
  previewContent: {
    padding: 20,
  },
  certificatePreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 3,
    borderColor: '#1E40AF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  certificateBorderDecorations: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  cornerDecoration: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  topLeft: {
    top: 16,
    left: 16,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 16,
    right: 16,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 16,
    left: 16,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 16,
    right: 16,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  certificatePreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  certificatePreviewIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  certificatePreviewInfo: {
    flex: 1,
  },
  certificatePreviewCertificateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 4,
  },
  certificatePreviewSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  decorativeLine: {
    height: 2,
    width: '100%',
    marginVertical: 20,
    borderRadius: 1,
  },
  certificatePreviewBody: {
    marginBottom: 20,
  },
  recipientSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  certificatePreviewVolunteerName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  nameUnderline: {
    width: 120,
    height: 2,
    backgroundColor: '#D1D5DB',
    marginTop: 8,
    borderRadius: 1,
  },
  certificatePreviewText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  eventHighlight: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  certificatePreviewEventName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    textAlign: 'center',
  },
  certificatePreviewEventDetails: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  eventDetailsSection: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  eventDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  eventDetailsGrid: {
    gap: 8,
  },
  eventDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  eventDetailText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
    flex: 1,
  },
  certificatePreviewFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    alignItems: 'center',
  },
  footerDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 20,
  },
  organizationSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  certificatePreviewOrganization: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  organizationLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  certificatePreviewDate: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  certificateIdSection: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  certificateIdLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  certificateId: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  generateButtonContainer: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  generateButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 48,
  },
  generateButtonIcon: {
    marginRight: 8,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
    actionButtonsContainer: {
      marginTop: 12,
    },
  certificateActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  downloadButton: {
    backgroundColor: '#10B981',
  },
  shareButton: {
    backgroundColor: '#8B5CF6',
  },
  certificateActionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default EnhancedCertificatesSection;
