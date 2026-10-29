package com.isabilalli.rentora.shared.infrastructure;

import com.isabilalli.rentora.shared.api.BadRequestException;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

// The paged lists' shared limits: the page numbers start at 0, and a page holds 1 to MAX_PAGE_SIZE rows.
public final class Paging {

    public static final int MAX_PAGE_SIZE = 100;

    private Paging() {
    }

    // A request for one page in this order. A negative page, or a size outside the limits, is a 400.
    public static PageRequest pageRequest(int page, int size, Sort sort) {
        if (page < 0) {
            throw new BadRequestException("Page must be 0 or more");
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new BadRequestException("Page size must be between 1 and " + MAX_PAGE_SIZE);
        }
        return PageRequest.of(page, size, sort);
    }
}
