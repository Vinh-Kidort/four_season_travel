package com.fourseasontravel.backend.dto;

import com.fourseasontravel.backend.model.User;
import lombok.Data;

@Data
public class UserDTO {
    private String  id;
    private String  name;
    private String  email;
    private String  role;
    private String  status;
    private Boolean mustChangePassword;

    public static UserDTO from(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setStatus(user.getStatus() != null ? user.getStatus() : "active");
        dto.setMustChangePassword(
                Boolean.TRUE.equals(user.getMustChangePassword()));
        return dto;
    }
}