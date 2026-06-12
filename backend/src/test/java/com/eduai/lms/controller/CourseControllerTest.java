package com.eduai.lms.controller;

import com.eduai.lms.dto.response.CourseResponse;
import com.eduai.lms.dto.response.PageResponse;
import com.eduai.lms.model.User;
import com.eduai.lms.model.enums.CourseStatus;
import com.eduai.lms.model.enums.UserRole;
import com.eduai.lms.security.JwtService;
import com.eduai.lms.service.CourseService;
import com.eduai.lms.service.FileStorageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CourseController.class)
class CourseControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean CourseService courseService;
    @MockBean FileStorageService fileStorageService;
    @MockBean JwtService jwtService;
    @MockBean com.eduai.lms.repository.UserRepository userRepository;

    private CourseResponse sampleResponse;

    @BeforeEach
    void setUp() {
        sampleResponse = new CourseResponse();
        sampleResponse.setId(UUID.randomUUID());
        sampleResponse.setTitle("Angular Avancé");
        sampleResponse.setCategory("Informatique");
        sampleResponse.setStatus(CourseStatus.APPROVED);
        sampleResponse.setPublished(true);
    }

    @Test
    @WithMockUser
    void getPublishedCourses_returns200() throws Exception {
        PageResponse<CourseResponse> page = new PageResponse<>();
        page.setContent(List.of(sampleResponse));
        page.setPage(0);
        page.setSize(12);
        page.setTotalElements(1);
        page.setTotalPages(1);
        page.setLast(true);
        when(courseService.getPublishedCourses(anyInt(), anyInt(), any(), any(), any()))
                .thenReturn(page);

        mockMvc.perform(get("/api/courses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].title").value("Angular Avancé"));
    }

    @Test
    @WithMockUser
    void getCourseById_existingId_returns200() throws Exception {
        UUID id = sampleResponse.getId();
        when(courseService.getCourseById(id)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/courses/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Angular Avancé"));
    }

    @Test
    void getCourseById_unauthenticated_returns401or403() throws Exception {
        mockMvc.perform(get("/api/courses/{id}", UUID.randomUUID()))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @WithMockUser(roles = "TRAINER")
    void createCourse_withTrainerRole_returns200() throws Exception {
        when(courseService.createCourse(any(), any())).thenReturn(sampleResponse);

        String body = """
            {
              "title": "Angular Avancé",
              "description": "Cours sur Angular",
              "category": "Informatique",
              "level": "Intermédiaire",
              "published": false
            }
            """;

        mockMvc.perform(post("/api/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());
    }
}
