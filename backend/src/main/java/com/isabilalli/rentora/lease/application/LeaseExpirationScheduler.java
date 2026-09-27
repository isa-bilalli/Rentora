package com.isabilalli.rentora.lease.application;

import com.isabilalli.rentora.lease.domain.Lease;
import com.isabilalli.rentora.lease.infrastructure.LeaseRepository;
import com.isabilalli.rentora.lease.domain.LeaseStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class LeaseExpirationScheduler {

    private final LeaseRepository leaseRepository;
    private final LeaseService leaseService;

    public LeaseExpirationScheduler(
            LeaseRepository leaseRepository,
            LeaseService leaseService
    ) {
        this.leaseRepository = leaseRepository;
        this.leaseService = leaseService;
    }

    @Scheduled(cron = "0 5 0 * * *", zone = "Europe/Belgrade")
    public void expireLeases() {
        List<Lease> expiredLeases = leaseRepository.findAllByStatusAndEndDateBefore(LeaseStatus.ACTIVE, LocalDate.now());
        for (Lease lease : expiredLeases) {
            leaseService.expireLease(lease.getId());
        }
    }
}