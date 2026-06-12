import api from './axios'; // Dòng này import biến api từ file axios.js vừa tạo ở trên

export const uploadImageToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    // Gửi ảnh xuống Spring Boot
    const res = await api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return res.data.url; 
    
  } catch (error) {
    console.error("Lỗi khi gửi ảnh xuống Java:", error);
    throw error;
  }
};