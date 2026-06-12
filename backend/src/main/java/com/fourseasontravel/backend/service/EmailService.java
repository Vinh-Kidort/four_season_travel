package com.fourseasontravel.backend.service;

import com.fourseasontravel.backend.model.Booking;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${bank.account.number}")
    private String bankAccountNumber;

    @Value("${bank.account.name}")
    private String bankAccountName;

    @Value("${bank.name}")
    private String bankName;

    public void sendBookingConfirmation(Booking booking, String tourName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(booking.getCustomerEmail());
            helper.setSubject("✅ Xác nhận đặt tour - " + booking.getBookingCode());
            helper.setText(buildEmailHtml(booking, tourName), true);

            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Lỗi gửi email: " + e.getMessage());
        }
    }

    public void sendOtpEmail(String email, String name, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(email);
            helper.setSubject("🔐 Mã xác thực OTP — Four Season Travel");
            helper.setText(buildOtpEmailHtml(name, otp), true);

            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Lỗi gửi OTP email: " + e.getMessage());
        }
    }

    private String buildEmailHtml(Booking booking, String tourName) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #0ea5e9, #0284c7); padding: 30px; text-align: center; color: white; }
                .header h1 { margin: 0; font-size: 24px; }
                .header p { margin: 8px 0 0; opacity: 0.9; }
                .body { padding: 30px; }
                .booking-code { background: #f0f9ff; border: 2px dashed #0ea5e9; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px; }
                .booking-code span { font-size: 28px; font-weight: bold; color: #0284c7; letter-spacing: 3px; }
                .info-table { width: 100%%; border-collapse: collapse; margin-bottom: 24px; }
                .info-table tr { border-bottom: 1px solid #f0f0f0; }
                .info-table td { padding: 10px 0; }
                .info-table td:first-child { color: #666; width: 40%%; }
                .info-table td:last-child { font-weight: bold; color: #333; }
                .deposit-box { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
                .deposit-box h3 { margin: 0 0 8px; color: #92400e; }
                .bank-info { background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 16px; }
                .bank-info p { margin: 4px 0; }
                .bank-info strong { color: #15803d; }
                .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #999; font-size: 13px; border-top: 1px solid #eee; }
                .highlight { color: #0284c7; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1> Four Season Travel</h1>
                  <p>Xác nhận đặt tour thành công!</p>
                </div>
                <div class="body">
                  <p>Xin chào <strong>%s</strong>,</p>
                  <p>Cảm ơn bạn đã đặt tour tại <strong>Four Season Travel</strong>. Dưới đây là thông tin chi tiết:</p>

                  <div class="booking-code">
                    <p style="margin:0 0 4px; color:#666; font-size:13px;">Mã đặt tour của bạn</p>
                    <span>%s</span>
                  </div>

                  <table class="info-table">
                    <tr><td>🧳 Tour</td><td>%s</td></tr>
                    <tr><td>📅 Ngày khởi hành</td><td>%s</td></tr>
                    <tr><td>👤 Khách hàng</td><td>%s</td></tr>
                    <tr><td>📧 Email</td><td>%s</td></tr>
                    <tr><td>📞 Điện thoại</td><td>%s</td></tr>
                    <tr><td>👥 Số người</td><td>%d người</td></tr>
                    <tr><td>💰 Tổng tiền</td><td class="highlight">%s VNĐ</td></tr>
                    <tr><td>💵 Tiền cọc (20%%)</td><td class="highlight">%s VNĐ</td></tr>
                    <tr><td>📅 Ngày đặt</td><td>%s</td></tr>
                  </table>

                  <div class="deposit-box">
                    <h3>⚠️ Lưu ý về tiền cọc</h3>
                    <p>Vui lòng chuyển khoản tiền cọc <strong>%s VNĐ</strong> trong vòng <strong>24 giờ</strong> để giữ chỗ.</p>
                    <p>Nội dung chuyển khoản: <strong>%s</strong></p>
                  </div>

                  <div class="bank-info">
                    <p>🏦 <strong>Thông tin tài khoản nhận tiền:</strong></p>
                    <p>Ngân hàng: <strong>%s</strong></p>
                    <p>Số tài khoản: <strong>%s</strong></p>
                    <p>Tên tài khoản: <strong>%s</strong></p>
                  </div>
                </div>
                <div class="footer">
                  <p>© 2024 Four Season Travel — Mọi thắc mắc liên hệ: %s</p>
                  <p>Email này được gửi tự động, vui lòng không reply.</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(
                booking.getCustomerName(), // %s thứ 1 (Tên lời chào)
                booking.getBookingCode(),  // %s thứ 2 (Mã đặt tour)
                tourName,                  // %s thứ 3 (Tên Tour)

                // ĐÃ THÊM LOGIC LẤY NGÀY KHỞI HÀNH VÀO ĐÂY (%s thứ 4)
                booking.getDepartureInfo() != null ? booking.getDepartureInfo() : "Xem thông tin tour",

                booking.getCustomerName(), // %s thứ 5 (Tên khách hàng)
                booking.getCustomerEmail(),// %s thứ 6
                booking.getCustomerPhone(),// %s thứ 7
                booking.getNumberOfPeople(),// %d (Số người)
                String.format("%,.0f", booking.getTotalPrice()),   // %s
                String.format("%,.0f", booking.getDepositAmount()),// %s
                booking.getCreatedAt().toString().replace("T", " ").substring(0, 16), // %s
                String.format("%,.0f", booking.getDepositAmount()),// %s
                booking.getBookingCode(),  // %s
                bankName,                  // %s
                bankAccountNumber,         // %s
                bankAccountName,           // %s
                fromEmail                  // %s
        );
    }



    private String buildOtpEmailHtml(String name, String otp) {
        return """
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px">
          <div style="max-width:480px;margin:0 auto;background:white;
            border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
            <div style="background:linear-gradient(135deg,#0ea5e9,#0284c7);
              padding:30px;text-align:center;color:white">
              <h1 style="margin:0;font-size:22px">🌏 Four Season Travel</h1>
              <p style="margin:8px 0 0;opacity:0.9">Xác thực tài khoản</p>
            </div>
            <div style="padding:30px;text-align:center">
              <p style="color:#333;font-size:15px">Xin chào <strong>%s</strong>,</p>
              <p style="color:#666;font-size:14px">
                Mã OTP của bạn là:
              </p>
              <div style="background:#f0f9ff;border:2px dashed #0ea5e9;
                border-radius:12px;padding:20px;margin:20px 0">
                <span style="font-size:40px;font-weight:bold;
                  color:#0284c7;letter-spacing:8px">%s</span>
              </div>
              <p style="color:#f59e0b;font-size:13px;font-weight:bold">
                ⏱ Mã có hiệu lực trong 1 phút
              </p>
              <p style="color:#999;font-size:12px">
                Nếu bạn không yêu cầu đăng ký, hãy bỏ qua email này.
              </p>
            </div>
            <div style="background:#f9f9f9;padding:15px;text-align:center;
              color:#999;font-size:12px;border-top:1px solid #eee">
              © 2024 Four Season Travel
            </div>
          </div>
        </body>
        </html>
    """.formatted(name != null ? name : "bạn", otp);
    }


    public void sendTempPasswordEmail(String email, String name, String tempPassword) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(email);
            helper.setSubject("🔑 Mật khẩu tạm thời — Four Season Travel");
            helper.setText(buildTempPasswordHtml(name, tempPassword), true);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Lỗi gửi email mật khẩu tạm: " + e.getMessage());
        }
    }

    private String buildTempPasswordHtml(String name, String tempPassword) {
        return """
        <!DOCTYPE html><html><head><meta charset="UTF-8"></head>
        <body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px">
          <div style="max-width:480px;margin:0 auto;background:white;
            border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
            <div style="background:linear-gradient(135deg,#f59e0b,#d97706);
              padding:30px;text-align:center;color:white">
              <h1 style="margin:0;font-size:22px">🌏 Four Season Travel</h1>
              <p style="margin:8px 0 0;opacity:0.9">Khôi phục mật khẩu</p>
            </div>
            <div style="padding:30px;text-align:center">
              <p style="color:#333;font-size:15px">
                Xin chào <strong>%s</strong>,
              </p>
              <p style="color:#666;font-size:14px">
                Mật khẩu tạm thời của bạn là:
              </p>
              <div style="background:#fffbeb;border:2px dashed #f59e0b;
                border-radius:12px;padding:20px;margin:20px 0">
                <span style="font-size:28px;font-weight:bold;
                  color:#d97706;letter-spacing:4px;font-family:monospace">
                  %s
                </span>
              </div>
              <div style="background:#fef3c7;border-radius:8px;
                padding:12px;margin:16px 0;text-align:left">
                <p style="margin:0;color:#92400e;font-size:13px;font-weight:bold">
                  ⚠️ Lưu ý quan trọng:
                </p>
                <ul style="margin:8px 0 0;color:#92400e;font-size:13px;
                  padding-left:20px">
                  <li>Đây là mật khẩu tạm thời, chỉ dùng để đăng nhập 1 lần</li>
                  <li>Bạn sẽ được yêu cầu đặt mật khẩu mới ngay sau khi đăng nhập</li>
                  <li>Không chia sẻ mật khẩu này với bất kỳ ai</li>
                </ul>
              </div>
              <p style="color:#999;font-size:12px">
                Nếu bạn không yêu cầu đặt lại mật khẩu, hãy liên hệ với chúng tôi ngay.
              </p>
            </div>
          </div>
        </body></html>
    """.formatted(name != null ? name : "bạn", tempPassword);
    }
}