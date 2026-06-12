import { useFavorite } from '../hooks/useFavorite';

export default function FavoriteButton({ itemId, itemType, onUnfavorite }) {
  const { favorited, toggle } = useFavorite(itemId, itemType);
  const token = localStorage.getItem('token');
  
  if (!token) return null; // ẩn nếu chưa login

  const handleToggle = async (e) => {
    await toggle(e);
    // Nếu đang bỏ yêu thích (favorited = true → false) thì gọi callback
    if (favorited && onUnfavorite) {
      onUnfavorite();
    }
  };

  return (
    <button
      onClick={handleToggle}
      title={favorited ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
      className="flex items-center justify-center w-9 h-9 rounded-full bg-white
        border border-gray-200 shadow-sm hover:border-blue-300 hover:bg-blue-50
        transition-all duration-200 group"
    >
      {favorited ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
          fill="currentColor" className="w-5 h-5 text-red-500">
          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-3.891-2.697C4.195 15.245 2 12.281 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.781-2.195 6.745-5.726 9.699a15.247 15.247 0 01-3.891 2.698l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          strokeWidth={1.8} stroke="currentColor"
          className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors duration-200">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      )}
    </button>
  );
}