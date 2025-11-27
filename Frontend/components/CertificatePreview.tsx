import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CertificateData {
  id: string;
  volunteerName: string;
  eventTitle: string;
  eventDate: string;
  eventTime?: string;
  eventLocation?: string;
  eventDescription?: string;
  organizationName: string;
  message: string;
  awardedAt: string;
  status: string;
  certificateType: string;
  certificateStyle: string;
  certificateColor: string;
  certificateIcon: string;
  certificateTitle: string;
  certificateSubtitle: string;
  certificateFooter: string;
  uniqueIdentifier: string;
}

interface CertificatePreviewProps {
  certificate: CertificateData;
  onClose: () => void;
}

const CertificatePreview = memo<CertificatePreviewProps>(({ certificate, onClose }) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatAwardDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Certificate Preview</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Certificate */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.certificateContainer}>
        <View style={[styles.certificate, { borderColor: certificate.certificateColor }]}>
          {/* Certificate Header */}
          <View style={styles.certificateHeader}>
            <View style={[styles.headerIcon, { backgroundColor: `${certificate.certificateColor}20` }]}>
              <Ionicons 
                name={certificate.certificateIcon as any || "ribbon"} 
                size={40} 
                color={certificate.certificateColor} 
              />
            </View>
            <Text style={[styles.certificateMainTitle, { color: certificate.certificateColor }]}>
              {certificate.certificateTitle}
            </Text>
            <Text style={styles.certificateSubtitle}>
              {certificate.certificateSubtitle}
            </Text>
          </View>

          {/* Certificate Body */}
          <View style={styles.certificateBody}>
            <Text style={styles.volunteerName}>
              {certificate.volunteerName}
            </Text>
            
            <Text style={styles.achievementText}>
              has successfully completed and demonstrated outstanding commitment to
            </Text>
            
            <Text style={[styles.eventTitle, { color: certificate.certificateColor }]}>
              "{certificate.eventTitle}"
            </Text>

            {/* Event Details */}
            <View style={styles.eventDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="calendar" size={16} color="#6B7280" />
                <Text style={styles.detailText}>{formatDate(certificate.eventDate)}</Text>
              </View>
              
              {certificate.eventTime && (
                <View style={styles.detailRow}>
                  <Ionicons name="time" size={16} color="#6B7280" />
                  <Text style={styles.detailText}>{certificate.eventTime}</Text>
                </View>
              )}
              
              {certificate.eventLocation && (
                <View style={styles.detailRow}>
                  <Ionicons name="location" size={16} color="#6B7280" />
                  <Text style={styles.detailText}>{certificate.eventLocation}</Text>
                </View>
              )}
            </View>

            {certificate.eventDescription && (
              <Text style={styles.eventDescription}>
                {certificate.eventDescription}
              </Text>
            )}

            <Text style={styles.organizationText}>
              Organized by <Text style={[styles.organizationName, { color: certificate.certificateColor }]}>
                {certificate.organizationName}
              </Text>
            </Text>

            {/* Debug Panel - ALWAYS VISIBLE */}
            <View style={{ 
              padding: 16, 
              backgroundColor: '#FEF3C7', 
              marginTop: 16, 
              marginBottom: 16, 
              borderRadius: 8, 
              borderWidth: 2, 
              borderColor: '#F59E0B' 
            }}>
              <Text style={{ fontSize: 14, color: '#92400E', fontWeight: 'bold', marginBottom: 8 }}>
                🔍 DEBUG PANEL - CertificatePreview.tsx
              </Text>
              <Text style={{ fontSize: 12, color: '#78350F', marginBottom: 4 }}>
                Message exists: {certificate.message ? 'YES ✅' : 'NO ❌'}
              </Text>
              <Text style={{ fontSize: 12, color: '#78350F', marginBottom: 4 }}>
                Message value: "{certificate.message || 'EMPTY/NULL'}"
              </Text>
              <Text style={{ fontSize: 12, color: '#78350F', marginBottom: 4 }}>
                Message length: {certificate.message?.length || 0} characters
              </Text>
              <Text style={{ fontSize: 12, color: '#78350F', marginBottom: 4 }}>
                Message type: {typeof certificate.message}
              </Text>
            </View>

            {certificate.message && certificate.message.trim() !== '' && (
              <Text style={styles.messageText}>
                {certificate.message}
              </Text>
            )}
          </View>

          {/* Certificate Footer */}
          <View style={styles.certificateFooter}>
            <View style={styles.awardDateContainer}>
              <Text style={styles.awardDateLabel}>Awarded on</Text>
              <Text style={[styles.awardDate, { color: certificate.certificateColor }]}>
                {formatAwardDate(certificate.awardedAt)}
              </Text>
            </View>
            
            <View style={styles.identifierContainer}>
              <Text style={styles.identifierLabel}>Certificate ID</Text>
              <Text style={styles.identifier}>{certificate.uniqueIdentifier}</Text>
            </View>
          </View>

          {/* Decorative Elements */}
          <View style={styles.decorativeBorder}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        {/* Certificate Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionButton, styles.primaryButton, { backgroundColor: certificate.certificateColor }]}>
            <Ionicons name="download" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Download PDF</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.secondaryButton, { borderColor: certificate.certificateColor }]}>
            <Ionicons name="share" size={20} color={certificate.certificateColor} />
            <Text style={[styles.actionButtonText, { color: certificate.certificateColor }]}>Share</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
});

CertificatePreview.displayName = 'CertificatePreview';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  certificateContainer: {
    padding: 20,
    alignItems: 'center',
  },
  certificate: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    position: 'relative',
  },
  certificateHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  certificateMainTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  certificateSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  certificateBody: {
    alignItems: 'center',
    marginBottom: 32,
  },
  volunteerName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  achievementText: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  eventDetails: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  eventDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  organizationText: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 12,
  },
  organizationName: {
    fontWeight: '600',
  },
  messageText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  certificateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  awardDateContainer: {
    alignItems: 'flex-start',
  },
  awardDateLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 4,
  },
  awardDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  identifierContainer: {
    alignItems: 'flex-end',
  },
  identifierLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 4,
  },
  identifier: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  decorativeBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderWidth: 2,
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
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
    maxWidth: 600,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButton: {
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CertificatePreview;
