package MedVision.Backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("dev")
class DevProfileIntegrationTest {

	@LocalServerPort
	private int port;

	@Test
	void h2ConsoleIsAccessibleInDevProfile() throws Exception {
		HttpResponse<Void> response = sendGet("/h2-console/");

		assertThat(response.statusCode()).isIn(200, 301, 302, 303);
	}

	@Test
	void actuatorInfoIncludesApplicationMetadata() throws Exception {
		HttpResponse<String> response = HttpClient.newHttpClient()
				.send(
						HttpRequest.newBuilder()
								.uri(URI.create("http://localhost:" + port + "/actuator/info"))
								.GET()
								.build(),
						HttpResponse.BodyHandlers.ofString());

		assertThat(response.statusCode()).isEqualTo(200);
		assertThat(response.body()).contains("MedVision-Backend");
	}

	private HttpResponse<Void> sendGet(String path) throws Exception {
		return HttpClient.newHttpClient()
				.send(
						HttpRequest.newBuilder()
								.uri(URI.create("http://localhost:" + port + path))
								.GET()
								.build(),
						HttpResponse.BodyHandlers.discarding());
	}

}
