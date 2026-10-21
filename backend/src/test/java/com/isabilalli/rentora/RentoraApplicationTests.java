package com.isabilalli.rentora;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

// The whole application starts, against the throwaway database from TestcontainersConfiguration.
@SpringBootTest
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
class RentoraApplicationTests {

	@Test
	void contextLoads() {
	}

}
