package com.fourseasontravel.backend.service;

import com.fourseasontravel.backend.model.User;
import com.fourseasontravel.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User updateUser(String email, User updateData) {
        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isPresent()) {
            User existingUser = userOptional.get();

            // Cập nhật các trường được phép thay đổi
            existingUser.setName(updateData.getName());
            existingUser.setPhone(updateData.getPhone());
            existingUser.setDob(updateData.getDob());
            existingUser.setGender(updateData.getGender());

            // Lưu lại vào MongoDB
            return userRepository.save(existingUser);
        }
        return null;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User upgradeToAuthor(String id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setRole("AUTHOR");
            return userRepository.save(user);
        }
        return null;
    }

    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }
}
