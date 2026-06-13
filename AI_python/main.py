from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import io
from PIL import Image

# DÙNG THƯ VIỆN LITERT CỦA GOOGLE (KHÔNG DÙNG TRY-EXCEPT NỮA)
import ai_edge_litert.interpreter as tflite

app = FastAPI(title="AI Travel API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("⏳ Đang nạp Model AI TFLite lên RAM... Vui lòng đợi...")
interpreter = tflite.Interpreter(model_path="model.tflite")
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()
print("✅ Nạp Model TFLite thành công! Server đã sẵn sàng.")
CLASS_NAMES = [
    'cau_vang_da_nang', 'cho_ben_thanh', 'cho_noi_cai_rang', 'chua_cau_hoi_an', 'cot_co_lung_cu','dai_noi_hue',
    'doi_cat_mui_ne', 'doi_che_cau_dat', 'ganh_da_dia', 'ha_long_bay', 'hang_mua', 'ho_guom', 'hoi_an', 'landmark_81',
    'lang_bac', 'ma_pi_leng', 'nha_tho_duc_ba', 'quang_truong_lam_vien', 'rung_tram_tra_su', 'ruong_bac_thang',
    'son_doong', 'thac_ban_gioc', 'thanh_dia_my_son', 'toa_thanh_tay_ninh', 'trang_an'
] 

# Hàm tiền xử lý ảnh ResNet50 viết bằng Numpy (Chuẩn xác 100% giống Keras nhưng siêu nhẹ)
def preprocess_resnet50_numpy(x):
    x = x.copy()
    # 1. Chuyển kênh màu từ RGB sang BGR
    x = x[..., ::-1]
    # 2. Trừ giá trị trung bình (Mean Subtraction) của tập dữ liệu ImageNet
    mean = [103.939, 116.779, 123.68]
    x[..., 0] -= mean[0]
    x[..., 1] -= mean[1]
    x[..., 2] -= mean[2]
    return x

@app.get("/")
def read_root():
    return {"message": "AI Server is running!", "status": "OK"}

@app.post("/predict")
async def predict_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        img = Image.open(io.BytesIO(contents)).convert('RGB')
        img = img.resize((224, 224))
        
        # Chuyển ảnh thành mảng Numpy dạng float32 (Thay thế img_to_array)
        img_array = np.array(img, dtype=np.float32)
        img_array = np.expand_dims(img_array, axis=0) # [1, 224, 224, 3]
        
        # Tiền xử lý ResNet50 bằng Numpy
        img_array = preprocess_resnet50_numpy(img_array)
        
        # Đưa ảnh vào mô hình TFLite
        interpreter.set_tensor(input_details[0]['index'], img_array)
        
        # Chạy dự đoán
        interpreter.invoke()
        
        # Lấy kết quả từ cổng đầu ra
        predictions = interpreter.get_tensor(output_details[0]['index'])
        
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