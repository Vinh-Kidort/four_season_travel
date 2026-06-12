package com.fourseasontravel.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 1. Lấy Header có tên là "Authorization" từ ReactJS gửi lên
        String authHeader = request.getHeader("Authorization");
        String token = null;
        String email = null;

        // 2. Kiểm tra xem Header có bắt đầu bằng chữ "Bearer " không
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7); // Cắt bỏ chữ "Bearer " để lấy đúng cái token
            try {
                if (jwtUtil.validateToken(token)) {
                    email = jwtUtil.extractUsername(token); // Giải mã lấy email
                }
            } catch (Exception e) {
                System.out.println("Token không hợp lệ hoặc đã hết hạn!");
            }
        }

        // 3. Nếu Token chuẩn, cấp quyền đi tiếp
        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            String role = jwtUtil.extractRole(token); // Giải mã lấy role
            System.out.println("EMAIL: " + email);
            System.out.println("ROLE: " + role);

            // Đóng gói Role lại theo chuẩn của Spring Security
            List<SimpleGrantedAuthority> authorities = new ArrayList<>();
            if (role != null) {
                authorities.add(new SimpleGrantedAuthority(role));
                System.out.println(authorities);
            }

            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(email, null, authorities); // Nhét authorities vào đây

            SecurityContextHolder.getContext().setAuthentication(authToken);
        }

        // Cho phép request đi tiếp đến Controller
        filterChain.doFilter(request, response);
    }
}