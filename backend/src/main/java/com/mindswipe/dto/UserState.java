package com.mindswipe.dto;

import java.util.List;

/**
 * Per-user state for hydrating the client on load — replaces the old
 * localStorage maps with server-backed truth (likes / dislikes / answered).
 */
public record UserState(
        List<Long> likedPostIds,
        List<Long> dislikedPostIds,
        List<Long> answeredPostIds
) {}
