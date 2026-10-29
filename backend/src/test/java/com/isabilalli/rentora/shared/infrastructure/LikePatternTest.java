package com.isabilalli.rentora.shared.infrastructure;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class LikePatternTest {

    @Test
    void wrapsTheTrimmedLowercaseSearch() {
        assertEquals("%o'brien%", LikePattern.contains("  O'Brien "));
    }

    @Test
    void takesTypedWildcardsAndTheEscapeCharacterLiterally() {
        assertEquals("%50!% off!_now!!%", LikePattern.contains("50% off_now!"));
    }

    @Test
    void aBlankSearchIsNoSearch() {
        assertNull(LikePattern.contains(null));
        assertNull(LikePattern.contains("   "));
    }
}
