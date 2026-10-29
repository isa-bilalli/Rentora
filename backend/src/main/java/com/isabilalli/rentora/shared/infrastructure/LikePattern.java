package com.isabilalli.rentora.shared.infrastructure;

import java.util.Locale;

// Search text as a lowercase LIKE pattern for "contains", for queries that compare with
// LOWER(column) LIKE :pattern ESCAPE '!'. Any %, _ or ! typed in the search is taken literally.
public final class LikePattern {

    private LikePattern() {
    }

    // Null for a blank search, which the queries read as "no search".
    public static String contains(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }
        String escaped = search.trim().toLowerCase(Locale.ROOT).replace("!", "!!").replace("%", "!%").replace("_", "!_");
        return "%" + escaped + "%";
    }
}
