package com.fourseasontravel.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponseDTO {
    private String  accessToken;
    private String  name;
    private String  email;
    private String  role;
    private Boolean mustChangePassword;
}