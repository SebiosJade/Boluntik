import { API } from '../constants/Api';

export interface AvatarUploadResponse {
  message: string;
  avatar: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar: string;
  };
}

export const uploadAvatar = async (imageUri: string, token: string): Promise<AvatarUploadResponse> => {
  const formData = new FormData();
  
  // Create file object from URI for React Native
  formData.append('avatar', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'avatar.jpg',
  } as any);

  const uploadResponse = await fetch(`${API.BASE_URL}/api/auth/profile/avatar`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // Don't set Content-Type, let fetch set it automatically for FormData
    },
    body: formData,
  });

  if (!uploadResponse.ok) {
    const errorData = await uploadResponse.json();
    throw new Error(errorData.message || 'Failed to upload avatar');
  }

  return uploadResponse.json();
};

export const deleteAvatar = async (token: string): Promise<AvatarUploadResponse> => {
  const deleteResponse = await fetch(`${API.BASE_URL}/api/auth/profile/avatar`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!deleteResponse.ok) {
    const errorData = await deleteResponse.json();
    throw new Error(errorData.message || 'Failed to delete avatar');
  }

  return deleteResponse.json();
};
