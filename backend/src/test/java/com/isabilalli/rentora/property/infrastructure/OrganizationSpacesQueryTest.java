package com.isabilalli.rentora.property.infrastructure;

import com.isabilalli.rentora.TestcontainersConfiguration;
import com.isabilalli.rentora.organization.domain.Organization;
import com.isabilalli.rentora.organization.infrastructure.OrganizationRepository;
import com.isabilalli.rentora.property.domain.Property;
import com.isabilalli.rentora.property.domain.Space;
import com.isabilalli.rentora.property.domain.SpaceStatus;
import com.isabilalli.rentora.property.domain.SpaceType;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

// The organization-wide spaces list, checked on the throwaway PostgreSQL from TestcontainersConfiguration.
// @DataJpaTest also rolls each test back.
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
class OrganizationSpacesQueryTest {

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private SpaceRepository spaceRepository;

    @Test
    void listsEverySpaceOfTheOrganizationAndNoOtherByPropertyThenId() {
        Long organizationId = organizationRepository.save(new Organization("Spaces test")).getId();
        Long otherOrganizationId = organizationRepository.save(new Organization("Other organization")).getId();

        Long harbourView = property(organizationId, "Harbour View");
        Long marketSquare = property(organizationId, "Market Square");
        Long elsewhere = property(otherOrganizationId, "Elsewhere");

        Long shop = space(marketSquare, "Shop");
        Long unitA = space(harbourView, "Unit A");
        Long unitB = space(harbourView, "Unit B");
        space(elsewhere, "Not ours");

        List<Long> spaceIds = spaceRepository.findAllByOrganizationId(organizationId).stream()
                .map(Space::getId)
                .toList();

        assertEquals(List.of(unitA, unitB, shop), spaceIds);
    }

    @Test
    void listsNothingForAnOrganizationWithoutProperties() {
        Long organizationId = organizationRepository.save(new Organization("Empty organization")).getId();

        assertEquals(List.of(), spaceRepository.findAllByOrganizationId(organizationId));
    }

    private Long property(Long organizationId, String name) {
        return propertyRepository.save(new Property(organizationId, name, "1 Test Street", "Dublin", null, "Ireland")).getId();
    }

    private Long space(Long propertyId, String name) {
        return spaceRepository.save(new Space(propertyId, name, SpaceType.RESIDENTIAL, 1, new BigDecimal("50.00"), SpaceStatus.VACANT)).getId();
    }
}
