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
  console.log('=== FRONTEND AVATAR UPLOAD DEBUG ===');
  console.log('Image URI:', imageUri);
  console.log('Has token:', !!token);
  console.log('API URL:', `${API.BASE_URL}/api/auth/profile/avatar`);
  
  const formData = new FormData();
  
  // Create file object from URI for React Native
  const fileObject = {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'avatar.jpg',
  } as any;
  
  formData.append('avatar', fileObject);
  console.log('FormData created with file:', fileObject);

  try {
    const uploadResponse = await fetch(`${API.BASE_URL}/api/auth/profile/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type, let fetch set it automatically for FormData
      },
      body: formData,
    });

    console.log('Avatar upload response status:', uploadResponse.status);
    console.log('Avatar upload response headers:', uploadResponse.headers);

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      console.log('Avatar upload failed:', errorData);
      throw new Error(errorData.message || 'Failed to upload avatar');
    }

    const responseData = await uploadResponse.json();
    console.log('Avatar upload successful:', responseData);
    return responseData;
  } catch (error) {
    console.error('Avatar upload error:', error);
    throw error;
  }
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
