package com.edutech.service;

import java.util.Collections;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.edutech.entity.User;
import com.edutech.repository.UserRepository;

@Service
public class UserService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Called by Spring Security during authentication to load the user
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new UsernameNotFoundException("User not found: " + username);
        }

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority(user.getRole().name())));
    }

    // Register a new user with BCrypt-encoded password
    public User registerUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }
    public User findByEmail(String email) {
    return userRepository.findByEmail(email);
}

    // Find a user by username
    public User findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    // Find all users by role
    public java.util.List<User> findByRole(com.edutech.entity.Role role) {
        return userRepository.findByRole(role);
    }

    // ✅ NEW METHODS ADDED BELOW

    // CHECK USERNAME EXISTS
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    // CHECK EMAIL EXISTS
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
}
