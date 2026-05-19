package com.edutech.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.edutech.entity.Flights;

public interface FlightsRepository extends JpaRepository<Flights, Long> {

    List<Flights> findBySourceAndDestinationAndDepartureDate(
            String source, String destination, LocalDate departureDate);

    @Query("SELECT CASE WHEN COUNT(f) > 0 THEN true ELSE false END " +
            "FROM Flights f WHERE LOWER(f.flight_number) = LOWER(:flightNumber)")
    boolean existsFlightNumber(@Param("flightNumber") String flightNumber);

}