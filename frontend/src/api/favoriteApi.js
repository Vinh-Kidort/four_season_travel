import axios from './axios';
import { tokenManager } from './tokenManager';

export const toggleFavorite = async (itemId, itemType) => {
  const token = tokenManager.getToken(); // Lấy token từ bộ nhớ
  
  return await axios.post(
    '/favorites/toggle', // Đường dẫn API
    { itemId, itemType }, // Dữ liệu gửi đi (Body)
    {
      // BẮT BUỘC PHẢI CÓ ĐOẠN NÀY ĐỂ VƯỢT QUA LỖI 403
      headers: { 
        Authorization: `Bearer ${token}` 
      }
    }
  );
};

export const getMyFavorites = () =>
  axios.get('/favorites');

export const checkFavorite = async (itemId, itemType) => {
  const token = tokenManager.getToken();
  
  return await axios.get(
    `/favorites/check`, 
    {
      params: { itemId, itemType },
      // BẮT BUỘC PHẢI CÓ ĐOẠN NÀY
      headers: { 
        Authorization: `Bearer ${token}` 
      }
    }
  );
};