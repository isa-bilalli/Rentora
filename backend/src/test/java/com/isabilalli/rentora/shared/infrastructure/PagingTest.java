package com.isabilalli.rentora.shared.infrastructure;

import com.isabilalli.rentora.shared.api.BadRequestException;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PagingTest {

    private static final Sort NEWEST_FIRST = Sort.by(Sort.Direction.DESC, "createdAt");

    @Test
    void buildsTheRequestForAPageWithinTheLimits() {
        PageRequest request = Paging.pageRequest(2, Paging.MAX_PAGE_SIZE, NEWEST_FIRST);

        assertEquals(2, request.getPageNumber());
        assertEquals(Paging.MAX_PAGE_SIZE, request.getPageSize());
        assertEquals(NEWEST_FIRST, request.getSort());
    }

    @Test
    void refusesANegativePage() {
        assertThrows(BadRequestException.class, () -> Paging.pageRequest(-1, 25, NEWEST_FIRST));
    }

    @Test
    void refusesASizeOutsideTheLimits() {
        assertThrows(BadRequestException.class, () -> Paging.pageRequest(0, 0, NEWEST_FIRST));
        assertThrows(BadRequestException.class, () -> Paging.pageRequest(0, Paging.MAX_PAGE_SIZE + 1, NEWEST_FIRST));
    }
}
