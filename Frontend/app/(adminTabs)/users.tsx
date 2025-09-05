import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Animated, Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ProfileDropdown from '@/components/ProfileDropdown';

const { width } = Dimensions.get('window');

type UserItem = {
	id: string;
	name: string;
	email: string;
	reports?: number;
	reason: string;
	reportedDate: string;
	suspended?: boolean;
};

export default function UserVerificationModeration() {
	const router = useRouter();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [slideAnim] = useState(new Animated.Value(-width));
	const [activeTab, setActiveTab] = useState<'flagged' | 'verification'>('flagged');
	const [search, setSearch] = useState('');
	const [onlyWithReports, setOnlyWithReports] = useState(false);

	const [flaggedUsers, setFlaggedUsers] = useState<UserItem[]>([
		{ id: '1', name: 'Alex Johnson', email: 'alex@example.com', reports: 3, reason: 'Inappropriate content', reportedDate: 'Sep 15, 2023' },
		{ id: '2', name: 'Sarah Miller', email: 'sarah@example.com', reports: 2, reason: 'Suspicious activity', reportedDate: 'Sep 14, 2023' },
		{ id: '3', name: 'James Wilson', email: 'james@example.com', reports: 5, reason: 'Spam campaigns', reportedDate: 'Sep 13, 2023' },
	]);

	const [verificationRequests, setVerificationRequests] = useState<UserItem[]>([
		{ id: 'v1', name: 'Emily Davis', email: 'emily@example.com', reason: 'Identity verification', reportedDate: 'Sep 16, 2023' },
		{ id: 'v2', name: 'Michael Brown', email: 'michael@example.com', reason: 'Document check', reportedDate: 'Sep 16, 2023' },
	]);

	const toggleMenu = () => {
		if (isMenuOpen) {
			Animated.timing(slideAnim, { toValue: -width, duration: 300, useNativeDriver: true }).start(() => setIsMenuOpen(false));
		} else {
			setIsMenuOpen(true);
			Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
		}
	};

	const closeMenu = () => {
		Animated.timing(slideAnim, { toValue: -width, duration: 300, useNativeDriver: true }).start(() => setIsMenuOpen(false));
	};

	const menuItems = [
		{ id: 'dashboard', title: 'Dashboard', icon: 'grid-outline' },
		{ id: 'fees', title: 'Fees', icon: 'card-outline' },
		{ id: 'ads', title: 'Ads', icon: 'checkmark-circle-outline' },
		{ id: 'subscriptions', title: 'Subscriptions', icon: 'card-outline' },
		{ id: 'users', title: 'Users', icon: 'people-outline' },
		{ id: 'analytics', title: 'Analytics', icon: 'pie-chart-outline' },
		{ id: 'categories', title: 'Categories', icon: 'pricetag-outline' },
		{ id: 'emergency', title: 'Emergency', icon: 'warning-outline' },
		{ id: 'technical', title: 'Technical', icon: 'construct-outline' },
		{ id: 'virtual', title: 'Virtual', icon: 'videocam-outline' },
		{ id: 'revenue', title: 'Revenue', icon: 'bar-chart-outline' },
	];

	const handleMenuPress = (itemId: string) => {
		closeMenu();
		if (itemId === 'dashboard') router.push('/(adminTabs)/home');
		else if (itemId === 'fees') router.push('/(adminTabs)/fees');
		else if (itemId === 'ads') router.push('/(adminTabs)/ads');
		else if (itemId === 'subscriptions') router.push('/(adminTabs)/subscriptions');
		else if (itemId === 'users') {/* already here */}
		else if (itemId === 'analytics') router.push('/(adminTabs)/analytics');
		else if (itemId === 'categories') router.push('/(adminTabs)/categories');
		else if (itemId === 'emergency') router.push('/(adminTabs)/emergency');
		else if (itemId === 'technical') router.push('/(adminTabs)/technical');
		else if (itemId === 'virtual') router.push('/(adminTabs)/virtual');
		else if (itemId === 'revenue') router.push('/(adminTabs)/revenue');
	};

	const filteredFlagged = useMemo(() => {
		return flaggedUsers.filter(u => {
			const matchesSearch = `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase());
			const matchesReports = onlyWithReports ? (u.reports ?? 0) > 0 : true;
			return matchesSearch && matchesReports;
		});
	}, [flaggedUsers, search, onlyWithReports]);

	const filteredVerification = useMemo(() => {
		return verificationRequests.filter(u => `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase()));
	}, [verificationRequests, search]);

	const handleReviewProfile = (user: UserItem) => {
		console.log('Review profile', user.id);
	};
	const handleSuspend = (user: UserItem) => {
		setFlaggedUsers(prev => prev.map(u => u.id === user.id ? { ...u, suspended: true } : u));
	};
	const handleDismiss = (user: UserItem) => {
		setFlaggedUsers(prev => prev.filter(u => u.id !== user.id));
	};
	const handleApproveVerification = (user: UserItem) => {
		setVerificationRequests(prev => prev.filter(u => u.id !== user.id));
	};
	const handleRejectVerification = (user: UserItem) => {
		setVerificationRequests(prev => prev.filter(u => u.id !== user.id));
	};

	  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
			{/* Overlay */}
			{isMenuOpen && <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeMenu} />}

			{/* Sidebar */}
			<Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
				<View style={styles.sidebarHeader}>
					<Text style={styles.sidebarTitle}>Admin Panel</Text>
				</View>
				<View style={styles.menuContainer}>
					{menuItems.map((item) => (
						<TouchableOpacity key={item.id} style={[styles.menuItem, item.id === 'users' && styles.activeMenuItem]} onPress={() => handleMenuPress(item.id)}>
							<Ionicons name={item.icon as any} size={20} color={item.id === 'users' ? '#8B5CF6' : '#374151'} />
							<Text style={[styles.menuItemText, item.id === 'users' && styles.activeMenuItemText]}>{item.title}</Text>
						</TouchableOpacity>
					))}
				</View>
			</Animated.View>

			{/* Header */}
			<View style={styles.header}>
				<View style={styles.headerContent}>
					<TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
						<Ionicons name="menu" size={24} color="#FFFFFF" />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Admin Panel</Text>
					<View style={styles.headerRight}>
						<TouchableOpacity style={styles.iconButton}>
							<Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
						</TouchableOpacity>
						<ProfileDropdown iconSize={24} iconColor="#FFFFFF" />
					</View>
				</View>
			</View>

			<ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
				<View style={styles.content}>
					<Text style={styles.pageTitle}>User Verification & Moderation</Text>

					{/* Tabs */}
					<View style={styles.tabs}>
						<TouchableOpacity style={[styles.tab, activeTab === 'flagged' && styles.activeTab]} onPress={() => setActiveTab('flagged')}>
							<Ionicons name="flag-outline" size={16} color={activeTab === 'flagged' ? '#8B5CF6' : '#6B7280'} />
							<Text style={[styles.tabText, activeTab === 'flagged' && styles.activeTabText]}>Flagged Users</Text>
						</TouchableOpacity>
						<TouchableOpacity style={[styles.tab, activeTab === 'verification' && styles.activeTab]} onPress={() => setActiveTab('verification')}>
							<Ionicons name="shield-checkmark-outline" size={16} color={activeTab === 'verification' ? '#8B5CF6' : '#6B7280'} />
							<Text style={[styles.tabText, activeTab === 'verification' && styles.activeTabText]}>Verification Requests</Text>
						</TouchableOpacity>
					</View>

					{/* Search + Filter */}
					<View style={styles.searchBar}>
						<Ionicons name="search-outline" size={18} color="#6B7280" />
						<TextInput style={styles.searchInput} placeholder="Search users..." placeholderTextColor="#9CA3AF" value={search} onChangeText={setSearch} />
						<TouchableOpacity style={styles.filterButton} onPress={() => setOnlyWithReports(prev => !prev)}>
							<Ionicons name="filter-outline" size={18} color={onlyWithReports ? '#8B5CF6' : '#6B7280'} />
						</TouchableOpacity>
					</View>

					{/* Lists */}
					{activeTab === 'flagged' ? (
						<View style={{ gap: 12 }}>
							{filteredFlagged.map(user => (
								<View key={user.id} style={styles.card}>
									<View style={styles.cardHeader}>
										<View style={{ flex: 1 }}>
											<Text style={styles.userName}>{user.name}</Text>
											<Text style={styles.userEmail}>{user.email}</Text>
										</View>
										<View style={styles.reportsBadge}>
											<Text style={styles.reportsText}>{user.reports ?? 0} reports</Text>
										</View>
									</View>
									<View style={styles.reasonRow}>
										<View style={{ flex: 1 }}>
											<Text style={styles.reasonLabel}>Reason:</Text>
											<Text style={styles.reasonText}>{user.reason}</Text>
										</View>
										<View>
											<Text style={styles.reasonLabel}>Reported:</Text>
											<Text style={styles.reportedDate}>{user.reportedDate}</Text>
										</View>
									</View>
									<View style={styles.actionsRow}>
										<TouchableOpacity style={[styles.actionBtn, styles.reviewBtn]} onPress={() => handleReviewProfile(user)}>
											<Text style={styles.reviewText}>Review Profile</Text>
										</TouchableOpacity>
										<TouchableOpacity style={[styles.actionBtn, styles.suspendBtn]} onPress={() => handleSuspend(user)}>
											<Text style={styles.suspendText}>{user.suspended ? 'Suspended' : 'Suspend Account'}</Text>
										</TouchableOpacity>
										<TouchableOpacity style={[styles.actionBtn, styles.dismissBtn]} onPress={() => handleDismiss(user)}>
											<Text style={styles.dismissText}>Dismiss</Text>
										</TouchableOpacity>
									</View>
								</View>
							))}
							{filteredFlagged.length === 0 && (
								<Text style={{ color: '#6B7280', textAlign: 'center' }}>No flagged users.</Text>
							)}
						</View>
					) : (
						<View style={{ gap: 12 }}>
							{filteredVerification.map(user => (
								<View key={user.id} style={styles.card}>
									<View style={styles.cardHeader}>
										<View style={{ flex: 1 }}>
											<Text style={styles.userName}>{user.name}</Text>
											<Text style={styles.userEmail}>{user.email}</Text>
										</View>
									</View>
									<View style={styles.reasonRow}>
										<View style={{ flex: 1 }}>
											<Text style={styles.reasonLabel}>Request:</Text>
											<Text style={styles.reasonText}>{user.reason}</Text>
										</View>
										<View>
											<Text style={styles.reasonLabel}>Submitted:</Text>
											<Text style={styles.reportedDate}>{user.reportedDate}</Text>
										</View>
									</View>
									<View style={styles.actionsRow}>
										<TouchableOpacity style={[styles.actionBtn, styles.reviewBtn]} onPress={() => handleApproveVerification(user)}>
											<Text style={styles.reviewText}>Approve</Text>
										</TouchableOpacity>
										<TouchableOpacity style={[styles.actionBtn, styles.dismissBtn]} onPress={() => handleRejectVerification(user)}>
											<Text style={styles.dismissText}>Reject</Text>
										</TouchableOpacity>
									</View>
								</View>
							))}
							{filteredVerification.length === 0 && (
								<Text style={{ color: '#6B7280', textAlign: 'center' }}>No verification requests.</Text>
							)}
						</View>
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: '#8B5CF6' },
	overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 },
	sidebar: { position: 'absolute', top: 0, left: 0, width: width * 0.8, height: '100%', backgroundColor: '#FFFFFF', zIndex: 1001, shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
	sidebarHeader: { backgroundColor: '#8B5CF6', paddingHorizontal: 20, paddingVertical: 20, paddingTop: 60 },
	sidebarTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
	menuContainer: { flex: 1, paddingTop: 20 },
	menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
	activeMenuItem: { backgroundColor: '#F3F4F6', borderLeftWidth: 4, borderLeftColor: '#8B5CF6' },
	menuItemText: { fontSize: 16, fontWeight: '500', color: '#374151', marginLeft: 16 },
	activeMenuItemText: { color: '#8B5CF6', fontWeight: '600' },
	header: { paddingHorizontal: 16, paddingVertical: 16, paddingTop: 20 },
	headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
	headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', flex: 1, textAlign: 'center' },
	menuButton: { padding: 4 },
	headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
	iconButton: { padding: 4 },
	container: { flex: 1, backgroundColor: '#F9FAFB' },
	content: { padding: 16 },
	pageTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
	tabs: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 6, gap: 8, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
	tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
	activeTab: { backgroundColor: '#EEF2FF' },
	tabText: { fontSize: 14, color: '#6B7280' },
	activeTabText: { color: '#8B5CF6', fontWeight: '600' },
	searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
	searchInput: { flex: 1, fontSize: 14, color: '#111827' },
	filterButton: { padding: 6, borderRadius: 8, backgroundColor: '#F3F4F6' },
	card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
	cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
	userName: { fontSize: 16, fontWeight: '600', color: '#111827' },
	userEmail: { fontSize: 12, color: '#6B7280' },
	reportsBadge: { backgroundColor: '#FEE2E2', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
	reportsText: { fontSize: 12, fontWeight: '600', color: '#EF4444' },
	reasonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
	reasonLabel: { fontSize: 12, color: '#6B7280' },
	reasonText: { fontSize: 13, color: '#111827' },
	reportedDate: { fontSize: 12, color: '#6B7280', textAlign: 'right' },
	actionsRow: { flexDirection: 'row', gap: 8 },
	actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
	reviewBtn: { backgroundColor: '#EEF2FF' },
	reviewText: { color: '#6366F1', fontWeight: '600' },
	suspendBtn: { backgroundColor: '#EF4444' },
	suspendText: { color: '#FFFFFF', fontWeight: '600' },
	dismissBtn: { backgroundColor: '#F3F4F6' },
	dismissText: { color: '#374151', fontWeight: '600' },
});
