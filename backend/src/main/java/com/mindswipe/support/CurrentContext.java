package com.mindswipe.support;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

/**
 * Build-1 stand-in for auth. There is no login yet, so "who is acting" comes
 * from an optional {@code X-User-Id} header and falls back to the seeded demo
 * user. Everything is scoped to the single seeded {@code public} tenant.
 *
 * When Supabase Auth lands, this is the one place that changes: resolve the
 * user from the verified JWT instead of a header.
 */
@Component
public class CurrentContext {

    public static final long DEFAULT_USER_ID = 1L;
    public static final long DEFAULT_TENANT_ID = 1L;

    public long userId(HttpServletRequest request) {
        String header = request.getHeader("X-User-Id");
        if (header != null && !header.isBlank()) {
            try {
                return Long.parseLong(header.trim());
            } catch (NumberFormatException ignored) {
                // fall through to the demo user
            }
        }
        return DEFAULT_USER_ID;
    }

    public long tenantId(HttpServletRequest request) {
        return DEFAULT_TENANT_ID;
    }
}
