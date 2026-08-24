package MedVision.Backend.config;

import org.springframework.boot.security.autoconfigure.web.servlet.PathRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

	private final Environment environment;

	public SecurityConfig(Environment environment) {
		this.environment = environment;
	}

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
				.csrf(csrf -> csrf.disable())
				.headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin))
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(auth -> {
					auth.requestMatchers("/actuator/health", "/actuator/info").permitAll();
					if (isDevProfileActive()) {
						auth.requestMatchers(PathRequest.toH2Console()).permitAll();
					}
					auth.anyRequest().authenticated();
				});

		return http.build();
	}

	private boolean isDevProfileActive() {
		for (String profile : environment.getActiveProfiles()) {
			if ("dev".equals(profile)) {
				return true;
			}
		}
		return false;
	}

}
