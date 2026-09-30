package com.isabilalli.rentora.reporting.application;

import com.isabilalli.rentora.reporting.domain.ReportRange;
import com.isabilalli.rentora.reporting.domain.ReportingPeriod;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class ReportRangeResolver {

    public ReportRange resolve(ReportingPeriod period, LocalDate referenceDate, LocalDate customStartDate, LocalDate customEndDate) {
        if (period == ReportingPeriod.CUSTOM) {
            return new ReportRange(customStartDate, customEndDate);
        }
        LocalDate date = referenceDate != null ? referenceDate : LocalDate.now();

        return switch (period) {
            case MONTH -> new ReportRange(
                    date.withDayOfMonth(1),
                    date.withDayOfMonth(date.lengthOfMonth())
            );

            case QUARTER -> {
                int firstMonth = ((date.getMonthValue() - 1) / 3) * 3 + 1;
                LocalDate start =LocalDate.of(date.getYear(), firstMonth,1);
                LocalDate end = start.plusMonths(2).withDayOfMonth(start.plusMonths(2).lengthOfMonth());
                yield new ReportRange(start, end);
            }

            case YEAR -> new ReportRange(
                    LocalDate.of(date.getYear(), 1, 1),
                    LocalDate.of(date.getYear(), 12, 31)
            );

            case CUSTOM -> throw new IllegalStateException("CUSTOM must be handled separately");
        };
    }
}