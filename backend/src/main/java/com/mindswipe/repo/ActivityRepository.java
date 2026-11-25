package com.mindswipe.repo;

import com.mindswipe.dto.UserState;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

/** Write side: every user input (attempt / reaction / view) plus state read-back. */
@Repository
public class ActivityRepository {

    private final JdbcTemplate jdbc;

    public ActivityRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** The outcome of recording an attempt. */
    public record AttemptResult(long id, int sessionSeq) {}

    /**
     * Record one attempt (one encounter). session_seq auto-increments per
     * (user, post): a repeat is a new row. We store only the choice, never a
     * correctness verdict.
     */
    public AttemptResult recordAttempt(long userId, long postId, long tenantId,
                                       String selectedJson, Integer durationMs,
                                       String detailJson, Integer contentVersion) {
        String sql = """
                insert into attempt
                    (user_id, post_id, tenant_id, session_seq, selected, duration_ms, detail, content_version)
                select ?, ?, ?, coalesce(max(session_seq), 0) + 1, ?::jsonb, ?, ?::jsonb, ?
                from attempt where user_id = ? and post_id = ?
                returning id, session_seq
                """;
        Map<String, Object> row = jdbc.queryForMap(sql,
                userId, postId, tenantId,
                selectedJson, durationMs, detailJson, contentVersion,
                userId, postId);
        return new AttemptResult(
                ((Number) row.get("id")).longValue(),
                ((Number) row.get("session_seq")).intValue());
    }

    /** Turn a reaction on. like/dislike are mutually exclusive, so clear the opposite. */
    public void setReaction(long userId, long postId, long tenantId, String kind) {
        jdbc.update("""
                insert into reaction (user_id, post_id, tenant_id, kind)
                values (?, ?, ?, ?)
                on conflict (user_id, post_id, kind) do nothing
                """, userId, postId, tenantId, kind);

        String opposite = switch (kind) {
            case "like" -> "dislike";
            case "dislike" -> "like";
            default -> null;
        };
        if (opposite != null) {
            jdbc.update("delete from reaction where user_id = ? and post_id = ? and kind = ?",
                    userId, postId, opposite);
        }
    }

    /** Turn a reaction off. */
    public void clearReaction(long userId, long postId, String kind) {
        jdbc.update("delete from reaction where user_id = ? and post_id = ? and kind = ?",
                userId, postId, kind);
    }

    public void recordView(long userId, long postId, long tenantId) {
        jdbc.update("insert into view_event (user_id, post_id, tenant_id) values (?, ?, ?)",
                userId, postId, tenantId);
    }

    public UserState userState(long userId, long tenantId) {
        List<Long> liked = jdbc.queryForList(
                "select post_id from reaction where user_id = ? and tenant_id = ? and kind = 'like'",
                Long.class, userId, tenantId);
        List<Long> disliked = jdbc.queryForList(
                "select post_id from reaction where user_id = ? and tenant_id = ? and kind = 'dislike'",
                Long.class, userId, tenantId);
        List<Long> answered = jdbc.queryForList(
                "select distinct post_id from attempt where user_id = ? and tenant_id = ?",
                Long.class, userId, tenantId);
        return new UserState(liked, disliked, answered);
    }
}
