package com.mindswipe.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Dev CORS: the PWA runs on the Vite dev server (and LAN IPs) on a different
 * origin. Mirrors the permissive CORS of the old Express backend; tighten before
 * any public deployment.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String[] allowedOrigins;

    public WebConfig(@Value("${mindswipe.cors.allowed-origins:*}") String origins) {
        this.allowedOrigins = origins.split("\\s*,\\s*");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        CorsRegistration reg = registry.addMapping("/api/**")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
        // "*" origins cannot be combined with credentials; use patterns so LAN IPs work too.
        if (allowedOrigins.length == 1 && "*".equals(allowedOrigins[0])) {
            reg.allowedOriginPatterns("*");
        } else {
            reg.allowedOrigins(allowedOrigins);
        }
    }
}
