import zipfile
import json
import os
import shutil

input_file = 'best_model.keras'
output_file = 'best_model_fixed.keras'
temp_dir = 'temp_keras_extract'

print(f"🛠️ Đang mở file {input_file} ra để phẫu thuật...")

# 1. Giải nén file .keras
with zipfile.ZipFile(input_file, 'r') as zip_ref:
    zip_ref.extractall(temp_dir)

# 2. Tìm và đọc file config.json
config_path = os.path.join(temp_dir, 'config.json')
with open(config_path, 'r', encoding='utf-8') as f:
    config_data = json.load(f)

# 3. Hàm đệ quy: Lục tung toàn bộ file JSON để xóa chữ 'quantization_config'
def clean_dict(d):
    if isinstance(d, dict):
        d.pop('quantization_config', None) # Cắt bỏ gốc rễ lỗi
        for k, v in d.items():
            clean_dict(v)
    elif isinstance(d, list):
        for i in d:
            clean_dict(i)

clean_dict(config_data)

# 4. Lưu lại file JSON đã được làm sạch
with open(config_path, 'w', encoding='utf-8') as f:
    json.dump(config_data, f)

# 5. Nén lại thành file .keras mới
with zipfile.ZipFile(output_file, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(temp_dir):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, temp_dir)
            zipf.write(file_path, arcname)

# 6. Dọn dẹp rác
shutil.rmtree(temp_dir)

print(f"✅ HOÀN TẤT! Đã tạo ra file sạch sẽ: {output_file}")
print("Bây giờ bạn có thể dùng file này để chạy Server!")