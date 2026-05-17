package com.edutech.service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import javax.persistence.EntityNotFoundException;
import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.edutech.entity.Bookings;
import com.edutech.entity.Flights;
import com.edutech.entity.Seat;
import com.edutech.entity.User;
import com.edutech.repository.BookingRepository;
import com.edutech.repository.FlightsRepository;
import com.edutech.repository.SeatRepository;
import com.edutech.repository.UserRepository;
import com.lowagie.text.Document;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private FlightsRepository flightsRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SeatRepository seatRepository;

    // ===== EXISTING METHODS (UNCHANGED) =====

    public Bookings bookFlight(Long userId, Long flightId, String seatNumbers) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        Flights flight = flightsRepository.findById(flightId)
                .orElseThrow(() -> new EntityNotFoundException("Flight not found"));

        Bookings booking = new Bookings();
        booking.setUser(user);
        booking.setFlight(flight);
        booking.setSeatNumbers(seatNumbers);
        booking.setBookingDate(LocalDateTime.now());
        booking.setStatus("CONFIRMED");
        booking.setPaymentStatus(Bookings.PaymentStatus.SUCCESS);
        booking.setPnr(UUID.randomUUID().toString());

        flight.setAvailable_seats(flight.getAvailable_seats() - 1);
        flightsRepository.save(flight);

        return bookingRepository.save(booking);
    }

    @Transactional
    public void bookSeats(Long flightId, List<String> seatNumbers, Long userId) {
        List<Seat> seats = seatRepository.findByFlightIdAndSeatNumberIn(flightId, seatNumbers);

        for (Seat seat : seats) {
            if (!seat.isAvailable()) {
                throw new RuntimeException("One or more selected seats are already booked.");
            }
        }

        for (Seat seat : seats) {
            seat.setAvailable(false);
        }
        seatRepository.saveAll(seats);

        Flights flight = flightsRepository.findById(flightId)
                .orElseThrow(() -> new EntityNotFoundException("Flight not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Bookings booking = new Bookings();
        booking.setFlight(flight);
        booking.setUser(user);
        booking.setSeatNumbers(String.join(",", seatNumbers));
        booking.setBookingDate(LocalDateTime.now());
        booking.setStatus("CONFIRMED");
        booking.setPaymentStatus(Bookings.PaymentStatus.SUCCESS);
        booking.setPnr(UUID.randomUUID().toString());

        bookingRepository.save(booking);
    }

    public List<Bookings> getBookingsByUser(Long userId) {
        return bookingRepository.findByUserId(userId);
    }

    public List<Bookings> getBookingListUser() {
        return bookingRepository.findAll();
    }

    @Transactional
    public void updateBookingStatus(Long id, String status) {
        Bookings booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setStatus(status);
        bookingRepository.save(booking);

        if ("CANCELLED".equals(status) && booking.getSeatNumbers() != null) {
            List<String> seatNums = java.util.Arrays.asList(booking.getSeatNumbers().split(","));
            List<Seat> seats = seatRepository.findByFlightIdAndSeatNumberIn(
                    booking.getFlight().getId(), seatNums);

            for (Seat seat : seats) {
                seat.setAvailable(true);
            }
            seatRepository.saveAll(seats);
        }
    }

    public void cancelBooking(Long id) {
        bookingRepository.deleteById(id);
    }

    // ✅ ✅ ✅ FIXED PDF METHOD ONLY
    public byte[] generateTicketPdf(Long bookingId) {

        Bookings booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found"));

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // ✅ Header
            document.add(new Paragraph("***************************************"));
            document.add(new Paragraph("AIRLINE BOARDING PASS"));
            document.add(new Paragraph("***************************************"));
            document.add(new Paragraph(" "));

            // ✅ PNR + Date
            document.add(new Paragraph("PNR: " + booking.getPnr()));
            document.add(new Paragraph("Booking Date: " + booking.getBookingDate()));
            document.add(new Paragraph(" "));

            document.add(new Paragraph("---------------------------------------"));
            // ✅ Flight info
            document.add(new Paragraph("Flight: " + booking.getFlight().getFlight_number()));
            document.add(new Paragraph("From: " + booking.getFlight().getSource()));
            document.add(new Paragraph("To: " + booking.getFlight().getDestination()));
            document.add(new Paragraph("Departure: " + booking.getFlight().getDepartureTime()));
            document.add(new Paragraph("Arrival: " + booking.getFlight().getArrivalTime()));
            document.add(new Paragraph("Date: " + booking.getFlight().getDepartureDate()));

            document.add(new Paragraph("---------------------------------------"));

            // ✅ Seats
            document.add(new Paragraph("Seats: " + booking.getSeatNumbers()));

            int seatCount = booking.getSeatNumbers() != null
                    ? booking.getSeatNumbers().split(",").length
                    : 1;

            double totalAmount = booking.getFlight().getPrice() * seatCount;

            document.add(new Paragraph("Price per Seat: ₹" + booking.getFlight().getPrice()));
            document.add(new Paragraph("Total Seats: " + seatCount));
            document.add(new Paragraph("Total Amount: ₹" + totalAmount));

            document.add(new Paragraph("---------------------------------------"));

            // ✅ Status
            document.add(new Paragraph("Booking Status: " + booking.getStatus()));
            document.add(new Paragraph("Payment Status: " + booking.getPaymentStatus()));

            document.add(new Paragraph(" "));
            document.add(new Paragraph("Thank you for booking with us!"));
            document.add(new Paragraph("Have a safe journey ✈"));

            document.close();

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF", e);
        }

        return out.toByteArray();
    }
}