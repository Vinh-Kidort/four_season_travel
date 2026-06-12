from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import tensorflow as tf
import io
from PIL import Image

app = FastAPI(title="AI Travel API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("⏳ Đang nạp Model AI lên RAM... Vui lòng đợi...")
# Dùng file đã được phẫu thuật
model = tf.keras.models.load_model('best_model_fixed.keras', compile=False)
print("✅ Nạp Model thành công! Server đã sẵn sàng.")

CLASS_NAMES = [
    'cau_vang_da_nang', 'cho_ben_thanh', 'cho_noi_cai_rang', 'chua_cau_hoi_an', 'cot_co_lung_cu','dai_noi_hue',
    'doi_cat_mui_ne', 'doi_che_cau_dat', 'ganh_da_dia', 'ha_long_bay', 'hang_mua', 'ho_guom', 'hoi_an', 'landmark_81',
    'lang_bac', 'ma_pi_leng', 'nha_tho_duc_ba', 'quang_truong_lam_vien', 'rung_tram_tra_su', 'ruong_bac_thang',
    'son_doong', 'thac_ban_gioc', 'thanh_dia_my_son', 'toa_thanh_tay_ninh', 'trang_an'
    # ... Bổ sung cho đủ 25 tên vào đây ...
] 

@app.get("/")
def read_root():
    return {"message": "AI Server is running!", "status": "OK"}

@app.post("/predict")
async def predict_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        img = Image.open(io.BytesIO(contents)).convert('RGB')
        img = img.resize((224, 224))
        
        img_array = tf.keras.utils.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0) 
        img_array = tf.keras.applications.resnet50.preprocess_input(img_array)
        
        predictions = model.predict(img_array)
        
        confidence = float(np.max(predictions[0])) * 100
        predicted_idx = int(np.argmax(predictions[0]))

        if predicted_idx >= len(CLASS_NAMES):
            return {
                "success": False, 
                "error": f"AI dự đoán ra index {predicted_idx}, nhưng CLASS_NAMES chỉ có {len(CLASS_NAMES)} phần tử. Hãy khai báo thêm cho đủ!"
            }
            
        predicted_class = CLASS_NAMES[predicted_idx]
        
        return {
            "success": True,
            "location": predicted_class,
            "confidence": confidence
        }
    except Exception as e:
        return {"success": False, "error": str(e)}