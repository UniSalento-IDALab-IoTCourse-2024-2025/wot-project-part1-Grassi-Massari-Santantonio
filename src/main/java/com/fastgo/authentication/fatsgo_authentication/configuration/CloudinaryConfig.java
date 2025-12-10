package com.fastgo.authentication.fatsgo_authentication.configuration;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


@Configuration
public class CloudinaryConfig {

    @Bean
    public Cloudinary cloudinary() {
        return new Cloudinary(ObjectUtils.asMap(
            "cloud_name", "dctwvbtdg",
            "api_key", "726949995247885",
            "api_secret", "WhcLQ3UUM4fiYqQ_EYUR9s0D3cQ"
        ));
    }
}
