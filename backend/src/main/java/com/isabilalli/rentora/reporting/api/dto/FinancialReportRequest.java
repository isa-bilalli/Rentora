package com.isabilalli.rentora.reporting.api.dto;

import com.isabilalli.rentora.reporting.domain.ReportingPeriod;

import java.time.LocalDate;

public record FinancialReportRequest(ReportingPeriod period, LocalDate referenceDate, LocalDate from, LocalDate to, Long propertyId) {}