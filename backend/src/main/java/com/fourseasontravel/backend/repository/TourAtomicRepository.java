package com.fourseasontravel.backend.repository;

import com.fourseasontravel.backend.model.Tour;
import com.mongodb.client.result.UpdateResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;

@Repository
public class TourAtomicRepository {

    @Autowired
    private MongoTemplate mongoTemplate;

    /**
     * Atomic: trừ availableSlots của departure CHỈ KHI còn đủ chỗ.
     * Trả về Tour đã update, hoặc null nếu không đủ chỗ.
     */
    public Tour decrementDepartureSlots(String tourId, String departureId, int quantity) {
        Query query = new Query(Criteria.where("_id").is(tourId)
                .and("departures").elemMatch(
                        Criteria.where("id").is(departureId)
                                .and("availableSlots").gte(quantity)  // ← CHỈ update nếu còn đủ chỗ
                                .and("status").is("active")
                )
        );

        Update update = new Update()
                .inc("departures.$.availableSlots", -quantity);  // ← Atomic decrement

        FindAndModifyOptions options = FindAndModifyOptions.options().returnNew(true);

        return mongoTemplate.findAndModify(query, update, options, Tour.class);
    }

    /**
     * Atomic: hoàn trả slots khi booking bị hủy.
     */
    public Tour incrementDepartureSlots(String tourId, String departureId, int quantity) {
        Query query = new Query(Criteria.where("_id").is(tourId)
                .and("departures").elemMatch(
                        Criteria.where("id").is(departureId)
                )
        );

        Update update = new Update()
                .inc("departures.$.availableSlots", quantity);

        FindAndModifyOptions options = FindAndModifyOptions.options().returnNew(true);

        return mongoTemplate.findAndModify(query, update, options, Tour.class);
    }

    /**
     * Atomic: trừ availableSlots tour (fallback khi không có departure).
     */
    public Tour decrementTourSlots(String tourId, int quantity) {
        Query query = new Query(Criteria.where("_id").is(tourId)
                .and("availableSlots").gte(quantity)
        );

        Update update = new Update().inc("availableSlots", -quantity);

        FindAndModifyOptions options = FindAndModifyOptions.options().returnNew(true);

        return mongoTemplate.findAndModify(query, update, options, Tour.class);
    }

    /**
     * Hoàn trả slots tour.
     */
    public void incrementTourSlots(String tourId, int quantity) {
        Query query = new Query(Criteria.where("_id").is(tourId));
        Update update = new Update().inc("availableSlots", quantity);
        mongoTemplate.updateFirst(query, update, Tour.class);
    }
}