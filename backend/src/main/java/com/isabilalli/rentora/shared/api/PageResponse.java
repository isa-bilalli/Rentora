package com.isabilalli.rentora.shared.api;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

// One page of a list, plus what a client needs to offer the previous and next pages. Pages count from 0.
public record PageResponse<T>(
        List<T> items,
        int page,
        int size,
        long totalItems,
        int totalPages
) {
    public static <S, T> PageResponse<T> from(Page<S> page, Function<S, T> toItem) {
        return new PageResponse<>(
                page.getContent().stream().map(toItem).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }
}
