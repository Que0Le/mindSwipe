package com.mindswipe.dto;

import java.util.List;

/** A keyset page of the feed. Mirrors the old Express contract. */
public record FeedPage(
        List<PostView> items,
        Long nextCursor,
        boolean hasMore
) {}
