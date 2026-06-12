import { useState, useEffect } from 'react';
import { toggleFavorite, checkFavorite } from '../api/favoriteApi';

export function useFavorite(itemId, itemType) {
  const [favorited, setFavorited] = useState(false);
  const token = localStorage.getItem('token');

  // Lấy trạng thái Yêu thích ban đầu
  useEffect(() => {
    if (!token || !itemId) return;
    
    checkFavorite(itemId, itemType)
      .then(res => {
        // Kiểm tra xem backend trả về đúng cấu trúc { favorited: true/false } không
        if (res.data && res.data.favorited !== undefined) {
          setFavorited(res.data.favorited);
        }
      })
      .catch((err) => {
        console.error("Lỗi khi load trạng thái favorite:", err);
      });
  }, [itemId, itemType, token]);

  // Hàm xử lý toggle (Không nhận 'e' vào đây nữa)
  const toggle = async () => {
    if (!token) {
      alert('Vui lòng đăng nhập để lưu yêu thích!');
      return;
    }

    // 1. Lưu lại trạng thái cũ và Đổi màu tim ngay lập tức cho mượt
    const previousState = favorited;
    setFavorited(!previousState);

    try {
      // 2. Gọi API ngầm dưới background
      const res = await toggleFavorite(itemId, itemType);
      
      // 3. (Tùy chọn) Cập nhật lại chắc chắn theo kết quả backend trả về
      if (res.data && res.data.favorited !== undefined) {
        setFavorited(res.data.favorited);
      }
    } catch (err) {
      // Nếu Backend báo lỗi (VD: mất mạng), thì trả trái tim về màu cũ
      setFavorited(previousState);
      console.error("Lỗi khi lưu yêu thích:", err);
      alert('Có lỗi xảy ra, không thể lưu yêu thích!');
    }
  };

  return { favorited, toggle };
}