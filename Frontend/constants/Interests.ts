// Shared interests configuration for both interest.tsx and profile edit
export const INTERESTS = [
  { id: 'community', title: 'Community Services', icon: 'heart', color: '#EF4444', iconType: 'ionicons' },
  { id: 'health', title: 'Health', icon: 'medical', color: '#10B981', iconType: 'ionicons' },
  { id: 'human-rights', title: 'Human Rights', icon: 'fist-raised', color: '#F97316', iconType: 'fontawesome5' },
  { id: 'animals', title: 'Animals', icon: 'paw', color: '#8B5CF6', iconType: 'fontawesome5' },
  { id: 'disaster', title: 'Disaster Relief', icon: 'ambulance', color: '#EF4444', iconType: 'fontawesome5' },
  { id: 'tech', title: 'Tech', icon: 'code', color: '#3B82F6', iconType: 'ionicons' },
  { id: 'arts', title: 'Arts & Culture', icon: 'palette', color: '#EC4899', iconType: 'ionicons' },
  { id: 'religious', title: 'Religious', icon: 'pray', color: '#F97316', iconType: 'fontawesome5' },
  { id: 'education', title: 'Education', icon: 'book-open', color: '#3B82F6', iconType: 'ionicons' },
  { id: 'environment', title: 'Environment', icon: 'leaf', color: '#10B981', iconType: 'ionicons' },
];

// Convert to the format expected by profile edit
export const PROFILE_INTERESTS = INTERESTS.map(interest => ({
  id: interest.id,
  name: interest.title
}));

// Get interest by ID
export const getInterestById = (id: string) => {
  return INTERESTS.find(interest => interest.id === id);
};

// Get interest title by ID
export const getInterestTitle = (id: string) => {
  const interest = getInterestById(id);
  return interest ? interest.title : id;
};
