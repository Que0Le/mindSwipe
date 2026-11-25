package com.mindswipe.dto;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;

/**
 * A card as the client sees it. In build-1 everything is "exercise" mode, so the
 * answer key + explanation ship with the card for instant client-side feedback.
 * The jsonb columns ({@code choices}, {@code answer}, {@code detail}) are carried
 * as {@link JsonNode} so they serialize back out as real JSON, not quoted strings.
 */
public record PostView(
        long id,
        String subject,
        String topic,
        Integer difficulty,
        String questionType,
        String prompt,
        JsonNode choices,
        JsonNode answer,
        JsonNode detail,
        int contentVersion,
        Instant createdAt
) {}
