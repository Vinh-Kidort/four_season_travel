package com.fourseasontravel.backend.controller;

import com.fourseasontravel.backend.model.User;
import com.fourseasontravel.backend.service.ArticleService;
import com.fourseasontravel.backend.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private ArticleService articleService;

    @Test
    @WithMockUser(username = "test@example.com")
    void whenGetCurrentUser_thenReturnUserDto() throws Exception {
        // Given
        String userEmail = "test@example.com";
        User user = new User();
        user.setId("1");
        user.setEmail(userEmail);
        user.setName("Test User");
        user.setPassword("password"); // This should not be exposed

        given(userService.getUserByEmail(userEmail)).willReturn(Optional.of(user));

        // When & Then
        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("1"))
                .andExpect(jsonPath("$.email").value(userEmail))
                .andExpect(jsonPath("$.name").value("Test User"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }
}
